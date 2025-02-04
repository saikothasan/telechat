import { useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"
import type { User } from "@supabase/supabase-js"
import { ArrowLeft, Camera } from "lucide-react"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

interface ProfileSettingsProps {
  currentUser: User | null
  setShowSettings: (show: boolean) => void
}

export default function ProfileSettings({ currentUser, setShowSettings }: ProfileSettingsProps) {
  const [fullName, setFullName] = useState("")
  const [bio, setBio] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")

  useEffect(() => {
    if (currentUser) {
      fetchProfile()
    }
  }, [currentUser])

  async function fetchProfile() {
    const { data, error } = await supabase.from("profiles").select("*").eq("id", currentUser?.id).single()

    if (error) {
      console.log("error", error)
    } else if (data) {
      setFullName(data.full_name || "")
      setBio(data.bio || "")
      setAvatarUrl(data.avatar_url || "")
    }
  }

  async function updateProfile() {
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        bio: bio,
        avatar_url: avatarUrl,
        updated_at: new Date(),
      })
      .eq("id", currentUser?.id)

    if (error) {
      console.log("error", error)
    } else {
      setShowSettings(false)
    }
  }

  async function handleAvatarUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    const fileExt = file.name.split(".").pop()
    const fileName = `${Math.random()}.${fileExt}`
    const filePath = `${currentUser?.id}/${fileName}`

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
        onClick={() => setShowSettings(false)}
        className="mb-4 flex items-center text-gray-600 hover:text-gray-800"
      >
        <ArrowLeft size={24} className="mr-2" /> Back
      </button>
      <h2 className="text-2xl font-bold mb-4">Profile Settings</h2>
      <div className="mb-4 relative">
        <img
          src={avatarUrl || "/placeholder.svg?height=100&width=100"}
          alt="Avatar"
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
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="full-name">
          Full Name
        </label>
        <input
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          id="full-name"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="bio">
          Bio
        </label>
        <textarea
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
        />
      </div>
      <button
        onClick={updateProfile}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
      >
        Save Changes
      </button>
    </div>
  )
}

