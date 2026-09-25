"use client"

import { useEffect, useRef, useState } from "react"
import { Headphones, MessageCircle, Send, X } from "lucide-react"

export const LIVE_CHAT_TOGGLE_EVENT = "logix:toggle-live-chat"

/** Programmatically toggle the floating live chat widget from anywhere. */
export function openLiveChat() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(LIVE_CHAT_TOGGLE_EVENT))
  }
}

type ChatMessage = {
  id: number
  from: "agent" | "user"
  text: string
  time: string
}

function nowTime() {
  return new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
}

const AGENT_GREETING =
  "Hi there 👋 You're chatting with ArcBest Support. How can we help you today?"

const AGENT_AUTO_REPLY =
  "Thanks for your message! A live specialist will pick this up shortly. For urgent help, email support@arcbest.com or call +1 (800) 555-0147 — we're available 24/7."

/**
 * Floating live support chat widget.
 * NOTE: Placeholder implementation — messages are answered with a canned
 * reply only. A real live chat backend will be integrated here later.
 */
export function LiveChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 0, from: "agent", text: AGENT_GREETING, time: nowTime() },
  ])
  const [draft, setDraft] = useState("")
  const [typing, setTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const replyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const handler = () => setOpen((o) => !o)
    window.addEventListener(LIVE_CHAT_TOGGLE_EVENT, handler)
    return () => window.removeEventListener(LIVE_CHAT_TOGGLE_EVENT, handler)
  }, [])

  useEffect(() => {
    return () => {
      if (replyTimer.current) clearTimeout(replyTimer.current)
    }
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" })
  }, [messages, typing, open])

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    const text = draft.trim()
    if (!text || typing) return
    setMessages((m) => [...m, { id: Date.now(), from: "user", text, time: nowTime() }])
    setDraft("")
    setTyping(true)
    // Placeholder canned response — replace with real live chat integration.
    replyTimer.current = setTimeout(() => {
      setTyping(false)
      setMessages((m) => [
        ...m,
        { id: Date.now() + 1, from: "agent", text: AGENT_AUTO_REPLY, time: nowTime() },
      ])
    }, 1500)
  }

  const sendSuggestedMessage = (text: string) => {
    if (typing) return
    setMessages((m) => [...m, { id: Date.now(), from: "user", text, time: nowTime() }])
    setTyping(true)
    replyTimer.current = setTimeout(() => {
      setTyping(false)
      setMessages((m) => [
        ...m,
        { id: Date.now() + 1, from: "agent", text: AGENT_AUTO_REPLY, time: nowTime() },
      ])
    }, 1500)
  }

  return (
    <>
      {/* Floating toggle */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={open ? "Close live chat" : "Open live chat"}
        className="fixed z-[90] bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 sm:bottom-6 sm:right-6 inline-flex items-center gap-2.5 rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground pl-4 pr-4 sm:pr-5 py-3.5 shadow-xl shadow-primary/30 boty-transition hover:scale-105 active:scale-95 cursor-pointer"
      >
        {open ? (
          <X className="w-5 h-5" />
        ) : (
          <>
            <MessageCircle className="w-5 h-5" />
            <span className="relative flex h-2.5 w-2.5 -ml-1 -mr-1.5 sm:-mr-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-70" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400 ring-2 ring-white/40" />
            </span>
            <span className="text-xs font-semibold tracking-wide sm:text-sm">Live chat</span>
          </>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          role="dialog"
          aria-label="ArcBest live chat"
          className="fixed z-[90] left-2 right-2 bottom-[calc(5rem+env(safe-area-inset-bottom))] sm:left-auto sm:right-6 sm:bottom-24 sm:w-[24rem] flex flex-col h-[min(35rem,calc(100dvh-6.5rem))] max-h-[calc(100dvh-6.5rem)] bg-card border border-border rounded-[26px] sm:rounded-3xl logix-shadow overflow-hidden animate-scale-fade-in"
        >
          {/* Header */}
          <div className="bg-gradient-to-br from-primary to-accent text-white px-4 py-3.5 sm:px-5 sm:py-4 flex items-center gap-3 shrink-0">
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/15">
              <span className="font-serif text-base font-semibold">A</span>
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-primary bg-emerald-300" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-serif text-base font-semibold leading-tight">ArcBest Support</p>
              <p className="text-xs text-white/80 flex items-center gap-1.5 mt-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> Online · replies in minutes
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Minimize chat"
              className="rounded-lg p-1.5 hover:bg-white/15 boty-transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto bg-background/60 px-3.5 py-4 sm:px-4">
            <div className="mb-4 flex items-center gap-2 text-[10px] text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              <span>Today</span>
              <span className="h-px flex-1 bg-border" />
            </div>
            {messages.map((m) => (
              <div key={m.id} className={`mb-3 flex items-end gap-2 ${m.from === "user" ? "justify-end" : "justify-start"}`}>
                {m.from === "agent" && <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">A</div>}
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    m.from === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-card border border-border text-foreground rounded-bl-md"
                  }`}
                >
                  <p>{m.text}</p>
                  <p className={`mt-1 text-[10px] ${m.from === "user" ? "text-white/70" : "text-muted-foreground"}`}>
                    {m.time}
                    {m.from === "user" && <span className="ml-1.5">✓✓</span>}
                  </p>
                </div>
              </div>
            ))}
            {typing && (
              <div className="mb-3 flex items-end gap-2">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">A</div>
                <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
                <span className="self-end text-[10px] text-muted-foreground">typing</span>
              </div>
            )}
            {messages.length === 1 && !typing && (
              <div className="mt-5 flex flex-wrap gap-2 pl-8">
                {["Track my shipment", "Get a shipping quote", "Talk to an agent"].map((suggestion) => (
                  <button key={suggestion} type="button" onClick={() => sendSuggestedMessage(suggestion)} className="rounded-full border border-primary/20 bg-card px-3 py-2 text-[11px] font-medium text-primary transition hover:bg-primary/5">
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="shrink-0 border-t border-border bg-card p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:pb-3">
            <div className="flex items-center gap-2 bg-background border border-border rounded-full pl-4 pr-1.5 py-1.5 focus-within:ring-2 focus-within:ring-primary/50">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                type="text"
                placeholder="Type your message…"
                aria-label="Chat message"
                className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground/60 min-w-0"
              />
              <button
                type="submit"
                disabled={!draft.trim()}
                aria-label="Send message"
                className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center boty-transition hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="mt-2 text-center text-[10px] text-muted-foreground">
              Powered by ArcBest Live · Available 24/7
            </p>
          </form>
        </div>
      )}
    </>
  )
}
