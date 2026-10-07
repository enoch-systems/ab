"use client"

import { MessageCircle } from "lucide-react"

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

/** Always-visible launcher for the Smartsupp chat UI. */
export function LiveChatWidget() {
  return (
    <button
      type="button"
      onClick={openLiveChat}
      aria-label="Open live chat"
      title="Open live chat"
      className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 z-[90] flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/30 transition-transform hover:scale-105 active:scale-95 sm:bottom-6 sm:right-6"
    >
      <MessageCircle className="size-6" aria-hidden="true" />
    </button>
  )
}
