import { useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"
import type { User } from "@supabase/supabase-js"
import { ArrowLeft, Camera } from "lucide-react"
import type React from "react" // Added import for React

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

interface CreateGroupProps {
  currentUser: User | null
  setShowCreateGroup: (show: boolean) => void
}

export default function CreateGroup({ currentUser, setShowCreateGroup }: CreateGroupProps) {
  const [groupName, setGroupName] = useState("")
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [avatarUrl, setAvatarUrl] = useState("")
  const [allUsers, setAllUsers] = useState<User[]>([])

  useEffect(() => {
    fetchUsers()
  }, [])

  async function fetchUsers() {
    const { data, error } = await supabase.from("profiles").select("*").neq("id", currentUser?.id)
    if (error) console.log("error", error)
    else setAllUsers(data || [])
  }

  async function handleCreateGroup() {
    if (!groupName.trim() || selectedUsers.length === 0 || !currentUser) return

    // Create the group
    const { data: groupData, error: groupError } = await supabase
      .from("groups")
      .insert({
        name: groupName,
        avatar_url: avatarUrl,
        created_by: currentUser.id,
      })
      .select()

    if (groupError) {
      console.log("error creating group", groupError)
      return
    }

    const groupId = groupData[0].id

    // Add members to the group
    const groupMembers = [currentUser.id, ...selectedUsers].map((userId) => ({
      group_id: groupId,
      user_id: userId,
    }))

    const { error: memberError } = await supabase.from("group_members").insert(groupMembers)

    if (memberError) {
      console.log("error adding group members", memberError)
      return
    }

    // Create a chat for this group
    const { error: chatError } = await supabase.from("chats").insert({
      type: "group",
      group_id: groupId,
    })

    if (chatError) console.log("error creating chat", chatError)
    else setShowCreateGroup(false)
  }

  async function handleAvatarUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    const fileExt = file.name.split(".").pop()
    const fileName = `${Math.random()}.${fileExt}`
    const filePath = `group-avatars/${fileName}`

    const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file)

    if (uploadError) {
      console.log("error", uploadError)
      return
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath)
    setAvatarUrl(data.publicUrl)
  }

  return (
    <div className="w-3/4 bg-white p-8">
      <button
        onClick={() => setShowCreateGroup(false)}
        className="mb-4 flex items-center text-gray-600 hover:text-gray-800"
      >
        <ArrowLeft size={24} className="mr-2" /> Back
      </button>
      <h2 className="text-2xl font-bold mb-4">Create New Group</h2>
      <div className="mb-4 relative">
        <img
          src={avatarUrl || "/placeholder.svg?height=100&width=100"}
          alt="Group Avatar"
          className="w-24 h-24 rounded-full"
        />
        <label
          htmlFor="avatar-upload"
          className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-2 cursor-pointer"
        >
          <Camera size={20} color="white" />
        </label>
        <input type="file" id="avatar-upload" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="group-name">
          Group Name
        </label>
        <input
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          id="group-name"
          type="text"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2">Select Members</label>
        <div className="max-h-60 overflow-y-auto">
          {allUsers.map((user) => (
            <div key={user.id} className="flex items-center mb-2">
              <input
                type="checkbox"
                id={user.id}
                value={user.id}
                checked={selectedUsers.includes(user.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedUsers([...selectedUsers, user.id])
                  } else {
                    setSelectedUsers(selectedUsers.filter((id) => id !== user.id))
                  }
                }}
                className="mr-2"
              />
              <label htmlFor={user.id}>{user.email}</label>
            </div>
          ))}
        </div>
      </div>
      <button
        onClick={handleCreateGroup}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
      >
        Create Group
      </button>
    </div>
  )
}

