"use client"

/**
 * Root-level error boundary — the last line of defence when the root layout
 * itself fails. It replaces the entire document, so it must render its own
 * <html>/<body> and cannot rely on Tailwind (globals.css isn't loaded here) —
 * hence the inline styles.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          textAlign: "center",
          padding: 24,
          background: "#F7F4EF",
          color: "#1c1917",
          fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
        }}
      >
        <p style={{ margin: 0, fontSize: 12, letterSpacing: "0.3em", textTransform: "uppercase", opacity: 0.6 }}>
          Oops
        </p>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600 }}>Something went wrong</h1>
        <p style={{ margin: 0, fontSize: 14, opacity: 0.7, maxWidth: 420 }}>
          An unexpected error occurred. Please try again.
        </p>
        <button
          onClick={reset}
          style={{
            marginTop: 8,
            padding: "12px 24px",
            borderRadius: 9999,
            border: "none",
            background: "#1c1917",
            color: "#F7F4EF",
            fontSize: 14,
            letterSpacing: "0.05em",
            cursor: "pointer",
          }}
        >
          Try Again
        </button>
      </body>
    </html>
  )
}
