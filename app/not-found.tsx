import Link from "next/link"

/**
 * Branded 404 page — rendered for any unmatched route.
 * Also satisfies Next.js's "missing required error components" dev warning.
 */
export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-background">
      <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-4">404</p>
      <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-foreground mb-3">
        Page not found
      </h1>
      <p className="text-sm sm:text-base text-muted-foreground max-w-md mb-8">
        The page you&apos;re looking for doesn&apos;t exist or may have moved.
      </p>
      <Link
        href="/"
        className="inline-flex items-center justify-center bg-primary text-primary-foreground px-6 py-3 rounded-full text-sm tracking-wide boty-transition hover:bg-primary/90 boty-shadow cursor-pointer"
      >
        Back to Home
      </Link>
    </main>
  )
}
