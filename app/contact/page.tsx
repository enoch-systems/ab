"use client"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Phone, Mail, MapPin, Clock, MessageCircle, Send, Headphones, ExternalLink } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { openLiveChat, LiveChatWidget } from "@/components/shared/live-chat"
import { COMPANY_MAPS_URL } from "@/lib/site"

const contactChannels = [
  {
    name: "Phone",
    icon: Phone,
    primary: "+1 (800) 555-0147",
    secondary: "Mon – Sun · 24/7",
    href: "tel:+18005550147",
  },
  {
    name: "Email",
    icon: Mail,
    primary: "support@arcbest.com",
    secondary: "Reply within 2 hours",
    href: "mailto:support@arcbest.com",
  },
  {
    name: "Live Chat",
    icon: MessageCircle,
    primary: "Available online",
    secondary: "Instant messaging",
    href: "/contact",
  },
  {
    name: "Head Office",
    icon: MapPin,
    primary: "Fort Smith · United States",
    secondary: "8401 McClure Dr, AR 72916",
    href: COMPANY_MAPS_URL,
    external: true,
    action: "View in Maps",
  },
]

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' })
  const [sending, setSending] = useState(false)

  const onChange = (f: string, v: string) => setForm(p => ({ ...p, [f]: v }))

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    setTimeout(() => {
      setSending(false)
      toast.success('Message sent! Our team will get back to you shortly.')
      setForm({ name: '', email: '', phone: '', subject: '', message: '' })
    }, 800)
  }

  return (
    <main className="min-h-screen overflow-x-hidden">
      <Header />
      <div className="pt-28 pb-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-sm tracking-[0.3em] uppercase text-primary font-semibold mb-4 block">
              Get In Touch
            </span>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-foreground mb-4 text-balance">
              Contact Us
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Have a question, need a quote, or want to open a corporate account? Our team is available around the clock to assist.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6 mb-16">
            {contactChannels.map((ch) => {
              const content = (
                <>
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                    <ch.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-1">{ch.name}</h3>
                  <p className="font-serif text-lg font-semibold text-foreground mb-1">{ch.primary}</p>
                  {/* The office card is a place, not a service window — it shows
                      the street address plus a maps link instead of a clock. */}
                  {ch.action ? (
                    <p className="text-xs text-muted-foreground">{ch.secondary}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Clock className="w-3 h-3" /> {ch.secondary}</p>
                  )}
                </>
              )

              if (ch.name === "Live Chat") {
                return (
                  <button
                    key={ch.name}
                    type="button"
                    onClick={openLiveChat}
                    className="bg-card rounded-2xl border border-border p-6 logix-shadow boty-transition hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10 text-left"
                  >
                    {content}
                  </button>
                )
              }

              return (
                <a
                  key={ch.name}
                  href={ch.href}
                  {...(ch.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="bg-card rounded-2xl border border-border p-6 logix-shadow boty-transition hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10"
                >
                  {content}
                  {ch.action && (
                    <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                      {ch.action}
                      <ExternalLink className="h-3 w-3" />
                    </span>
                  )}
                </a>
              )
            })}
          </div>

          <div className="rounded-[28px] border border-border bg-card shadow-[0_20px_60px_rgba(15,23,42,0.08)] overflow-hidden">
            <form onSubmit={submit} className="p-5 sm:p-6 md:p-8 lg:p-10 space-y-5 sm:space-y-6">
              <div className="space-y-2">
                <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-semibold text-foreground">Send us a message</h2>
                <p className="text-sm sm:text-base text-muted-foreground">We respond to every inquiry. Use the form below for fastest service.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">Full name</label>
                  <input required value={form.name} onChange={e => onChange('name', e.target.value)} className="w-full h-12 bg-background border border-border rounded-2xl px-4 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm transition-all" placeholder="John Doe" />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">Email</label>
                  <input required type="email" value={form.email} onChange={e => onChange('email', e.target.value)} className="w-full h-12 bg-background border border-border rounded-2xl px-4 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm transition-all" placeholder="john@company.com" />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">Phone</label>
                  <input value={form.phone} onChange={e => onChange('phone', e.target.value)} className="w-full h-12 bg-background border border-border rounded-2xl px-4 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm transition-all" placeholder="+1 (555) 123-4567" />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">Subject</label>
                  <select required value={form.subject} onChange={e => onChange('subject', e.target.value)} className="w-full h-12 bg-background border border-border rounded-2xl px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm transition-all appearance-none">
                    <option value="">Select a topic…</option>
                    <option>General inquiry</option>
                    <option>Track a shipment</option>
                    <option>Quote / Pricing</option>
                    <option>Corporate / Bulk account</option>
                    <option>Claim or complaint</option>
                    <option>Partnership</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">Message</label>
                <textarea required value={form.message} onChange={e => onChange('message', e.target.value)} rows={5} className="w-full bg-background border border-border rounded-2xl px-4 py-3 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm resize-none transition-all" placeholder="Tell us about your logistics needs…" />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={sending}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 sm:px-8 py-3 rounded-full text-sm font-medium transition-all hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60 shadow-md shadow-primary/20"
                >
                  {sending ? 'Sending…' : (<>Send Message <Send className="w-4 h-4" /></>)}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <LiveChatWidget />
      <Footer />
    </main>
  )
}
