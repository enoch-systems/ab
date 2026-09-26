export type NavLink = {
  name: string
  href: string
  badge?: number
  /** One-line explanation shown under the name in the signed-in account menu. */
  blurb?: string
}

/**
 * Public header navigation.
 *
 * `shared` is the signed-in customer menu — the header renders it as a two-line
 * row (icon, name, blurb) in the desktop account dropdown and the mobile sheet.
 * `explore` is for visitors who are not signed in yet; the header hides it once
 * a customer session exists so the marketing links stop competing with the
 * shipping workspace.
 *
 * Homepage sections are one page — the links below scroll to each section
 * (desktop dropdown + mobile list), so there are no dead routes.
 */
export const navigation = {
  shared: [
    {
      name: "Overview",
      href: "/customer/dashboard",
      blurb: "Live status for every shipment you have with us",
    },
    {
      name: "Profile",
      href: "/customer/profile",
      blurb: "Your contact details and saved preferences",
    },
    {
      name: "Notifications",
      href: "/customer/notifications",
      blurb: "Tracking alerts and account updates",
    },
    {
      name: "Inbox",
      href: "/customer/inbox",
      blurb: "Conversations with your logistics specialist",
    },
  ] satisfies NavLink[],
  /**
   * "Explore" menu: homepage sections scroll in place; entries that have a
   * dedicated page (FAQ, Contact) open that page instead — so no dead links.
   */
  explore: [
    { name: "Our Services", href: "/#services", blurb: "Express, freight, sea & warehousing" },
    { name: "How It Works", href: "/#how-it-works", blurb: "Pickup to doorstep in 4 steps" },
    { name: "Delivery Coverage", href: "/#coverage", blurb: "50 states + 190 countries" },
    { name: "Why ArcBest", href: "/#why-us", blurb: "Rated 4.9/5 by 5,000+ shippers" },
    { name: "FAQ", href: "/faq", blurb: "Answers before you ask" },
    { name: "Contact Us", href: "/contact", blurb: "Talk to a logistics specialist" },
  ] satisfies (NavLink & { blurb: string })[],
} as const
