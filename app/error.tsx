"use client"

import { useEffect } from "react"
import Link from "next/link"

/**
 * Route-level error boundary. Catches render errors anywhere below the root
 * layout and offers a retry, so a crash never takes down the whole page tree.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Surface the real error in the console / server logs for debugging.
    console.error(error)
  }, [error])

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-background">
      <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-4">Oops</p>
      <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-foreground mb-3">
        Something went wrong
      </h1>
      <p className="text-sm sm:text-base text-muted-foreground max-w-md mb-8">
        An unexpected error occurred. Please try again — if it keeps happening, come
        back in a few minutes.
      </p>
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center justify-center bg-primary text-primary-foreground px-6 py-3 rounded-full text-sm tracking-wide boty-transition hover:bg-primary/90 boty-shadow cursor-pointer"
        >
          Try Again
        </button>
        <Link
          href="/"
          className="inline-flex items-center justify-center border border-border text-foreground px-6 py-3 rounded-full text-sm tracking-wide boty-transition hover:bg-muted cursor-pointer"
        >
          Back to Home
        </Link>
      </div>
    </main>
  )
}
