export type NavLink = {
  name: string
  href: string
  badge?: number
}

/**
 * Public header navigation.
 *
 * Homepage sections are one page — the links below scroll to each section
 * (desktop dropdown + mobile list), so there are no dead routes.
 */
export const navigation = {
  shared: [
    { name: "Overview", href: "/customer/dashboard" },
    { name: "Profile", href: "/customer/profile" },
    { name: "Notifications", href: "/customer/notifications" },
    { name: "Inbox", href: "/customer/inbox" },
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
