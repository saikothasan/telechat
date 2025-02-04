"use client"

import { useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"
import { Auth } from "@supabase/auth-ui-react"
import { ThemeSupa } from "@supabase/auth-ui-shared"
import Sidebar from "./Sidebar"
import ChatArea from "./ChatArea"
import ProfileSettings from "./ProfileSettings"
import CreateGroup from "./CreateGroup"
import type { User } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function ChatInterface() {
  const [session, setSession] = useState<any>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [activeChat, setActiveChat] = useState<{ id: string; type: "user" | "group" } | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [showCreateGroup, setShowCreateGroup] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setCurrentUser(session?.user ?? null)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setCurrentUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="w-full max-w-md">
          <Auth supabaseClient={supabase} appearance={{ theme: ThemeSupa }} providers={["google", "github"]} />
        </div>
      </div>
    )
  }

  return (
    <div className="flex w-full h-screen">
      <Sidebar
        currentUser={currentUser}
        setActiveChat={setActiveChat}
        setShowSettings={setShowSettings}
        setShowCreateGroup={setShowCreateGroup}
      />
      {showSettings ? (
        <ProfileSettings currentUser={currentUser} setShowSettings={setShowSettings} />
      ) : showCreateGroup ? (
        <CreateGroup currentUser={currentUser} setShowCreateGroup={setShowCreateGroup} />
      ) : (
        <ChatArea currentUser={currentUser} activeChat={activeChat} />
      )}
    </div>
  )
}

