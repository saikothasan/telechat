import { useState } from "react"
import { createClient } from "@supabase/supabase-js"
import type { User } from "@supabase/supabase-js"
import { X } from "lucide-react"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

interface FileUploadProps {
  currentUser: User | null
  activeChat: { id: string; type: "user" | "group" } | null
  setShowFileUpload: (show: boolean) => void
}

export default function FileUpload({ currentUser, activeChat, setShowFileUpload }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  async function handleFileUpload() {
    if (!file || !activeChat || !currentUser) return

    setUploading(true)

    const fileExt = file.name.split(".").pop()
    const fileName = `${Math.random()}.${fileExt}`
    const filePath = `${activeChat.type}-${activeChat.id}/${fileName}`

    const { error: uploadError } = await supabase.storage.from("chat-files").upload(filePath, file)

    if (uploadError) {
      console.log("error", uploadError)
      setUploading(false)
      return
    }

    const { data } = supabase.storage.from("chat-files").getPublicUrl(filePath)

    const { error: messageError } = await supabase.from("messages").insert({
      content: file.name,
      sender_id: currentUser.id,
      chat_id: activeChat.id,
      file_url: data.publicUrl,
      read_by: [currentUser.id],
    })

    if (messageError) console.log("error", messageError)

    setUploading(false)
    setShowFileUpload(false)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Upload File</h3>
          <button onClick={() => setShowFileUpload(false)} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>
        <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="mb-4" />
        <button
          onClick={handleFileUpload}
          disabled={!file || uploading}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
        >
          {uploading ? "Uploading..." : "Upload"}
        </button>
      </div>
    </div>
  )
}

