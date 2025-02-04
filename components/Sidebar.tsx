import { useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"
import type { User } from "@supabase/supabase-js"
import { Settings, MessageCircle, Users, Phone } from "lucide-react"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

interface SidebarProps {
  currentUser: User | null
  setActiveChat: (chat: { id: string; type: "user" | "group" }) => void
  setShowSettings: (show: boolean) => void
  setShowCreateGroup: (show: boolean) => void
}

interface ChatItem {
  id: string
  type: "user" | "group"
  name: string
  avatar_url: string | null
  last_message?: string
  unread_count?: number
}

export default function Sidebar({ currentUser, setActiveChat, setShowSettings, setShowCreateGroup }: SidebarProps) {
  const [chatItems, setChatItems] = useState<ChatItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    if (currentUser) {
      fetchChatItems()
    }
  }, [currentUser])

  async function fetchChatItems() {
    if (!currentUser) return

    // Fetch user chats
    const { data: userChats, error: userChatsError } = await supabase
      .from("chats")
      .select(`
        id,
        type,
        user_id,
        profiles:profiles!chats_user_id_fkey (full_name, avatar_url)
      `)
      .eq("type", "user")
      .or(`user_id.eq.${currentUser.id},messages.sender_id.eq.${currentUser.id}`)

    if (userChatsError) {
      console.error("Error fetching user chats:", userChatsError)
      return
    }

    // Fetch group chats
    const { data: groupMemberships, error: groupMembershipsError } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("user_id", currentUser.id)

    if (groupMembershipsError) {
      console.error("Error fetching group memberships:", groupMembershipsError)
      return
    }

    const groupIds = groupMemberships.map((membership) => membership.group_id)

    const { data: groupChats, error: groupChatsError } = await supabase
      .from("chats")
      .select(`
        id,
        type,
        group_id,
        groups:groups!chats_group_id_fkey (name, avatar_url)
      `)
      .eq("type", "group")
      .in("group_id", groupIds)

    if (groupChatsError) {
      console.error("Error fetching group chats:", groupChatsError)
      return
    }

    // Combine and format chat items
    const formattedChats: ChatItem[] = [
      ...userChats.map((chat) => ({
        id: chat.id,
        type: chat.type as "user" | "group",
        name: chat.profiles?.[0]?.full_name || "Unknown User",
        avatar_url: chat.profiles?.[0]?.avatar_url || null,
      })),
      ...groupChats.map((chat) => ({
        id: chat.id,
        type: chat.type as "user" | "group",
        name: chat.groups?.[0]?.name || "Unknown Group",
        avatar_url: chat.groups?.[0]?.avatar_url || null,
      })),
    ]

    // Fetch last messages and unread counts
    for (const chat of formattedChats) {
      const { data: lastMessage } = await supabase
        .from("messages")
        .select("content")
        .eq("chat_id", chat.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      chat.last_message = lastMessage?.content || ""

      const { count } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("chat_id", chat.id)
        .not("message_read_status.user_id", "eq", currentUser.id)

      chat.unread_count = count || 0
    }

    setChatItems(formattedChats)
  }

  const filteredChatItems = chatItems.filter((item) => item.name.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <div className="w-1/4 bg-gray-800 text-white flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <input
          type="text"
          placeholder="Search"
          className="w-full bg-gray-700 text-white rounded-full px-4 py-2"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="flex-1 overflow-y-auto">
        <h2 className="text-xl font-bold p-4">Chats</h2>
        <ul>
          {filteredChatItems.map((item) => (
            <li
              key={item.id}
              className="cursor-pointer hover:bg-gray-700 p-4 flex items-center"
              onClick={() => setActiveChat({ id: item.id, type: item.type })}
            >
              <img
                src={item.avatar_url || "/placeholder.svg?height=40&width=40"}
                alt={item.name}
                className="w-10 h-10 rounded-full mr-3"
              />
              <div className="flex-1">
                <p className="font-semibold">{item.name}</p>
                <p className="text-sm text-gray-400">{item.last_message || "No messages yet"}</p>
              </div>
              {item.unread_count > 0 && (
                <span className="bg-blue-500 text-white rounded-full px-2 py-1 text-xs">{item.unread_count}</span>
              )}
            </li>
          ))}
        </ul>
      </div>
      <div className="p-4 border-t border-gray-700 flex justify-around">
        <button className="text-gray-400 hover:text-white">
          <MessageCircle size={24} />
        </button>
        <button className="text-gray-400 hover:text-white" onClick={() => setShowCreateGroup(true)}>
          <Users size={24} />
        </button>
        <button className="text-gray-400 hover:text-white">
          <Phone size={24} />
        </button>
        <button className="text-gray-400 hover:text-white" onClick={() => setShowSettings(true)}>
          <Settings size={24} />
        </button>
      </div>
    </div>
  )
}

