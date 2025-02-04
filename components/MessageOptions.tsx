import { useState } from "react"
import { createClient } from "@supabase/supabase-js"
import type { User } from "@supabase/supabase-js"
import { MoreVertical, Edit, Trash, Share } from "lucide-react"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

interface MessageOptionsProps {
  message: {
    id: string
    content: string
    sender_id: string
  }
  setSelectedMessage: (message: null) => void
  currentUser: User | null
}

export default function MessageOptions({ message, setSelectedMessage, currentUser }: MessageOptionsProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState(message.content)

  async function handleEditMessage() {
    if (editedContent.trim() === message.content) {
      setIsEditing(false)
      return
    }

    const { error } = await supabase
      .from("messages")
      .update({ content: editedContent, is_edited: true })
      .eq("id", message.id)

    if (error) console.log("error", error)
    else {
      setIsEditing(false)
      setSelectedMessage(null)
    }
  }

  async function handleDeleteMessage() {
    const { error } = await supabase.from("messages").delete().eq("id", message.id)

    if (error) console.log("error", error)
    else setSelectedMessage(null)
  }

  function handleForwardMessage() {
    // Implement message forwarding logic here
    console.log("Forward message:", message.content)
    setSelectedMessage(null)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Message Options</h3>
          <button onClick={() => setSelectedMessage(null)} className="text-gray-500 hover:text-gray-700">
            <MoreVertical size={24} />
          </button>
        </div>
        {isEditing ? (
          <div className="mb-4">
            <input
              type="text"
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="w-full px-3 py-2 border rounded"
            />
            <div className="mt-2 flex justify-end space-x-2">
              <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded">
                Cancel
              </button>
              <button onClick={handleEditMessage} className="px-4 py-2 bg-blue-500 text-white rounded">
                Save
              </button>
            </div>
          </div>
        ) : (
          <p className="mb-4">{message.content}</p>
        )}
        <div className="flex justify-around">
          {message.sender_id === currentUser?.id && (
            <>
              <button onClick={() => setIsEditing(true)} className="text-blue-500 hover:text-blue-700">
                <Edit size={24} />
              </button>
              <button onClick={handleDeleteMessage} className="text-red-500 hover:text-red-700">
                <Trash size={24} />
              </button>
            </>
          )}
          <button onClick={handleForwardMessage} className="text-green-500 hover:text-green-700">
            <Share size={24} />
          </button>
        </div>
      </div>
    </div>
  )
}

