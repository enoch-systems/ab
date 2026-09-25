"use client"

import { useState } from "react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { LiveChatWidget } from "@/components/shared/live-chat"
import { ChevronDown, Search } from "lucide-react"

const faqCategories = [
  {
    title: "Tracking & Shipment Status",
    questions: [
      { q: "How do I track my package?", a: "Enter the tracking number provided in your confirmation email or SMS into the tracking search bar on our homepage or visit the standalone tracking page. You can also log in to your customer dashboard to see all your shipments with their complete status timelines in one place." },
      { q: "How often is tracking information updated?", a: "Tracking information is updated in real-time as each scan event occurs at our facilities and with our drivers. Most statuses are reflected within 5-15 minutes of the actual event. International shipments may show longer intervals between updates due to customs processing." },
      { q: "What do the different shipment statuses mean?", a: "Order Created = order placed and awaiting confirmation. Confirmed = label printed and pickup scheduled. Picked Up = courier collected your package. In Transit = package moving between facilities. Arrived at Facility = at destination hub. Out for Delivery = with final mile driver. Delivered = delivered successfully. Exception = delay or issue requiring attention." },
      { q: "Why is my tracking not updating?", a: "Occasionally scans may be missed or delayed. If there has been no update for more than 48 hours for a domestic shipment or 72 hours for an international one, please contact our support team for a manual investigation." },
    ]
  },
  {
    title: "Domestic Shipping",
    questions: [
      { q: "How long does domestic delivery take?", a: "Standard: 2-3 business days between major US cities and 3-5 business days for remote areas. Express: next business day in major metropolitan areas. Premium: same-day delivery may be available in select service areas." },
      { q: "What is the cost of shipping?", a: "Costs are dynamically calculated in USD based on origin, destination, actual versus dimensional weight, and service level." },
      { q: "Can I schedule a pickup time?", a: "Yes. When creating a shipment you can choose from time slots: Morning (9AM–12PM), Afternoon (12PM–4PM), or Evening (4PM–7PM). A confirmation SMS will be sent the day before." },
      { q: "Do you deliver across the United States?", a: "Yes. ArcBest serves all 50 states, including remote areas that may require 1-2 additional business days for last-mile delivery." },
    ]
  },
  {
    title: "International Shipping",
    questions: [
      { q: "Which countries do you ship to?", a: "We ship to over 190 countries including: United States, Canada, Mexico, United Kingdom, Germany, France, UAE, Saudi Arabia, China, India, Japan, Brazil, Australia, South Africa and more." },
      { q: "How long does international shipping take?", a: "Express Air: 3-5 business days to major cities (London, Dubai, Toronto, Frankfurt, Tokyo). Standard Air: 5-10 business days. Sea Freight: 4-8 weeks for container and bulk shipments." },
      { q: "Are customs duties included?", a: "No. Recipient is responsible for import duties, taxes and customs clearance fees in the destination country. We provide HS codes and commercial invoices for clearance." },
      { q: "What items are prohibited internationally?", a: "Prohibited items include but are not limited to: counterfeit goods, narcotics, flammable liquids, aerosols, lithium batteries in bulk, firearms, perishables without cold chain, plants, seeds, and ivory or protected species materials." },
    ]
  },
  {
    title: "Insurance & Claims",
    questions: [
      { q: "Is my shipment insured?", a: "Every shipment includes basic carrier liability. Additional cargo insurance is available at checkout to cover the declared value against loss, damage and theft." },
      { q: "How do I file a damage/loss claim?", a: "For damaged shipments, photograph both the packaging and contents immediately upon receipt. Submit the claim with photos, invoice and tracking number within 48 hours of delivery via our claims form or support email. Payouts are processed within 7-14 business days of approval." },
      { q: "What happens if the recipient is not available?", a: "Our driver will attempt delivery three times on three consecutive business days. After the third attempt the package is held at the nearest facility for pick up for up to 14 days before return to sender." },
    ]
  },
  {
    title: "Business Accounts & Bulk Shipping",
    questions: [
      { q: "Do you offer corporate rates?", a: "For high-volume shippers (20+ shipments / month) we offer custom pricing, volume discounts up to 35%, dedicated account managers, weekly invoicing, and API / Excel bulk upload integrations." },
      { q: "Can I import goods using ArcBest?", a: "Yes. We provide end-to-end international shipping services including overseas pickup, freight coordination, customs documentation, and final-mile delivery. Contact sales@arcbest.com for a quote." },
    ]
  },
  {
    title: "Returns & Refunds",
    questions: [
      { q: "Can I cancel a shipment?", a: "Shipments can be cancelled free of charge up until the point of pickup. Once picked up, the shipment is in transit and only a partial refund of the domestic leg is available." },
      { q: "Do you offer return logistics?", a: "Yes. When creating a shipment you can pay for an optional return label so the recipient can ship items back at a discounted rate. Perfect for eCommerce businesses with returns policies." },
    ]
  },
]

export default function FAQPage() {
  const [search, setSearch] = useState('')
  const q = search.trim().toLowerCase()

  const filtered = q
    ? faqCategories
        .map(cat => ({
          ...cat,
          questions: cat.questions.filter(qst =>
            qst.q.toLowerCase().includes(q) || qst.a.toLowerCase().includes(q),
          ),
        }))
        .filter(cat => cat.questions.length > 0)
    : faqCategories

  return (
    <main className="min-h-screen overflow-x-hidden">
      <Header />
      <div className="pt-28 pb-20">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <span className="text-sm tracking-[0.3em] uppercase text-primary font-semibold mb-4 block">
              Got Questions?
            </span>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-foreground mb-4 text-balance">
              Frequently Asked Questions
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to know about shipping, tracking, insurance and our service levels.
            </p>
          </div>

          <div className="relative max-w-2xl mx-auto mb-12">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search the help center…"
              className="w-full bg-card border border-border rounded-full pl-12 pr-4 py-4 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base logix-shadow"
            />
          </div>

          <div className="space-y-14">
            {filtered.length === 0 && (
              <div className="text-center py-14 bg-card rounded-3xl border border-border">
                <p className="text-muted-foreground">No questions match your search.</p>
              </div>
            )}
            {filtered.map((category) => (
              <section key={category.title}>
                <h2 className="font-serif text-2xl md:text-3xl text-foreground mb-6 pb-4 border-b border-border/50">
                  {category.title}
                </h2>
                <div className="space-y-3 sm:space-y-4">
                  {category.questions.map((item, index) => {
                    const [open, setOpen] = useState(false)
                    return (
                      <details
                        key={index}
                        className="group bg-card rounded-2xl logix-shadow overflow-hidden boty-transition border border-border"
                        open={open}
                      >
                        <summary
                          onClick={(e) => { e.preventDefault(); setOpen(!open) }}
                          className="flex items-center justify-between gap-4 px-5 sm:px-6 py-4 sm:py-5 cursor-pointer list-none text-foreground font-semibold hover:text-primary boty-transition"
                        >
                          <span className="text-sm md:text-base">{item.q}</span>
                          <ChevronDown className={`w-5 h-5 text-muted-foreground flex-shrink-0 boty-transition ${open ? 'rotate-180' : ''}`} />
                        </summary>
                        <div className="px-5 sm:px-6 pb-5 sm:pb-6">
                          <p className="text-sm md:text-base text-muted-foreground leading-relaxed">{item.a}</p>
                        </div>
                      </details>
                    )
                  })}
                </div>
              </section>
            ))}
          </div>

          <div className="mt-20 text-center bg-card rounded-3xl p-10 md:p-14 logix-shadow border border-border">
            <h2 className="font-serif text-2xl md:text-3xl text-foreground mb-3">
              Still have questions?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Can't find the answer you're looking for? Reach out to our friendly support team, 24/7.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href="mailto:support@arcbest.com" className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-8 py-3.5 rounded-full text-sm tracking-wide boty-transition hover:bg-primary/90 cursor-pointer">
                Email Support
              </a>
              <a href="tel:+18005550147" className="inline-flex items-center justify-center gap-2 bg-card border border-border text-foreground px-8 py-3.5 rounded-full text-sm tracking-wide boty-transition hover:bg-accent/10 cursor-pointer">
                Call +1 (800) 555-0147
              </a>
            </div>
          </div>
        </div>
      </div>
      <Footer />
      <LiveChatWidget />
    </main>
  )
}
