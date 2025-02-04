import { useState, useEffect, useRef } from "react"
import { createClient } from "@supabase/supabase-js"
import type { User } from "@supabase/supabase-js"
import { Paperclip, Smile, Send, Mic, MoreVertical } from "lucide-react"
import FileUpload from "./FileUpload"
import MessageOptions from "./MessageOptions"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

interface ChatAreaProps {
  currentUser: User | null
  activeChat: { id: string; type: "user" | "group" } | null
}

interface Message {
  id: string
  content: string
  sender_id: string
  chat_id: string
  created_at: string
  updated_at: string
  is_edited: boolean
  file_url?: string
}

interface ChatInfo {
  name: string
  avatar_url: string | null
}

export default function ChatArea({ currentUser, activeChat }: ChatAreaProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [showFileUpload, setShowFileUpload] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  const [chatInfo, setChatInfo] = useState<ChatInfo | null>(null)
  const messagesEndRef = useRef<null | HTMLDivElement>(null)

  useEffect(() => {
    if (activeChat) {
      fetchMessages()
      fetchChatInfo()
      subscribeToMessages()
      subscribeToTypingStatus()
    }
  }, [activeChat])

  useEffect(() => {
    scrollToBottom()
  }, [activeChat, messages]) //Fixed useEffect dependency

  async function fetchMessages() {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("chat_id", activeChat?.id)
      .order("created_at", { ascending: true })
    if (error) console.log("error", error)
    else setMessages(data || [])
  }

  async function fetchChatInfo() {
    if (!activeChat) return

    if (activeChat.type === "user") {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", activeChat.id)
        .single()
      if (error) console.log("error", error)
      else setChatInfo(data)
    } else {
      const { data, error } = await supabase.from("groups").select("name, avatar_url").eq("id", activeChat.id).single()
      if (error) console.log("error", error)
      else setChatInfo(data)
    }
  }

  function subscribeToMessages() {
    supabase
      .channel("public:messages")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const newMessage = payload.new as Message
        if (newMessage.chat_id === activeChat?.id) {
          setMessages((previous) => [...previous, newMessage])
        }
      })
      .subscribe()
  }

  function subscribeToTypingStatus() {
    supabase
      .channel("typing")
      .on("broadcast", { event: "typing" }, (payload) => {
        if (payload.chatId === activeChat?.id) {
          setIsTyping(true)
          setTimeout(() => setIsTyping(false), 3000)
        }
      })
      .subscribe()
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!newMessage.trim() || !activeChat || !currentUser) return

    const { data, error } = await supabase
      .from("messages")
      .insert({
        content: newMessage,
        sender_id: currentUser.id,
        chat_id: activeChat.id,
      })
      .select()

    if (error) console.log("error", error)
    else {
      setNewMessage("")
      // Mark the message as read by the sender
      if (data && data[0]) {
        await supabase.from("message_read_status").insert({ message_id: data[0].id, user_id: currentUser.id })
      }
    }
  }

  function handleTyping() {
    supabase.channel("typing").send({
      type: "broadcast",
      event: "typing",
      payload: { chatId: activeChat?.id, userId: currentUser?.id },
    })
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  if (!activeChat || !chatInfo) {
    return (
      <div className="w-3/4 bg-white p-4 flex items-center justify-center">
        <p className="text-gray-500">Select a chat to start messaging</p>
      </div>
    )
  }

  return (
    <div className="w-3/4 bg-white flex flex-col">
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center">
          <img
            src={chatInfo.avatar_url || "/placeholder.svg?height=40&width=40"}
            alt={chatInfo.name}
            className="w-10 h-10 rounded-full mr-3"
          />
          <div>
            <p className="font-semibold">{chatInfo.name}</p>
            <p className="text-sm text-gray-500">{isTyping ? "typing..." : "online"}</p>
          </div>
        </div>
        <button className="text-gray-500 hover:text-gray-700">
          <MoreVertical size={24} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender_id === currentUser?.id ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-xs px-4 py-2 rounded-lg ${
                message.sender_id === currentUser?.id ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-800"
              }`}
              onClick={() => setSelectedMessage(message)}
            >
              {message.file_url && (
                <a href={message.file_url} target="_blank" rel="noopener noreferrer" className="block mb-2">
                  <img src={message.file_url || "/placeholder.svg"} alt="Attached file" className="max-w-full h-auto" />
                </a>
              )}
              {message.content}
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs">
                  {new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
                {message.is_edited && <span className="text-xs italic">Edited</span>}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSendMessage} className="p-4 border-t">
        <div className="flex items-center space-x-2">
          <button type="button" className="text-gray-500 hover:text-gray-700" onClick={() => setShowFileUpload(true)}>
            <Paperclip size={24} />
          </button>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleTyping}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button type="button" className="text-gray-500 hover:text-gray-700">
            <Smile size={24} />
          </button>
          {newMessage.trim() ? (
            <button
              type="submit"
              className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <Send size={24} />
            </button>
          ) : (
            <button type="button" className="text-gray-500 hover:text-gray-700">
              <Mic size={24} />
            </button>
          )}
        </div>
      </form>
      {showFileUpload && (
        <FileUpload currentUser={currentUser} activeChat={activeChat} setShowFileUpload={setShowFileUpload} />
      )}
      {selectedMessage && (
        <MessageOptions message={selectedMessage} setSelectedMessage={setSelectedMessage} currentUser={currentUser} />
      )}
    </div>
  )
}

