"use client"

import { MessageCircleMore } from "lucide-react"
import { useEffect, useState } from "react"

export const LIVE_CHAT_TOGGLE_EVENT = "logix:toggle-live-chat"

type SmartsuppWindow = Window & {
  smartsupp?: (...args: string[]) => void
}

/** Open the live support widget from the Smartsupp integration. */
export function openLiveChat() {
  if (typeof window === "undefined") return

  const smartsuppApi = (window as SmartsuppWindow).smartsupp
  if (typeof smartsuppApi === "function") {
    smartsuppApi("chat:open")
  }
}

/** Visible launch button so public pages always expose support immediately. */
export function LiveChatWidget() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        type="button"
        onClick={openLiveChat}
        className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-[0_20px_50px_-16px_rgba(59,130,246,0.65)] transition hover:-translate-y-0.5 hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        aria-label="Open live chat"
      >
        <MessageCircleMore className="h-4 w-4" />
        <span>Live chat</span>
      </button>
    </div>
  )
}
