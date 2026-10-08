"use client"

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
