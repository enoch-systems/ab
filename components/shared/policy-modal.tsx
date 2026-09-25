"use client"

import { useEffect, useState } from "react"
import { X, Copy, Check } from "lucide-react"

type ModalType = "privacy" | "terms" | "shipping" | "about"

interface PolicyModalProps {
  type: ModalType | null
  onClose: () => void
}

const content: Record<ModalType, { title: string; body: string }> = {
  about: {
    title: "About ArcBest",
    body: `ArcBest is a full-service logistics and shipment tracking platform built for businesses and individuals who need their freight moved reliably, transparently and fast. From a single envelope to a full container, we connect shippers across the United States with a global partner network spanning 190+ countries.

What We Do
Our platform covers the entire journey — door-to-door domestic delivery across all 50 states in 1-3 business days, international air and sea freight with customs clearance, same-day and next-day express courier in major US metros, secure warehousing and fulfilment, and optional comprehensive cargo insurance against loss, damage and theft on every shipment.

Real-Time Visibility
Every shipment is tracked from pickup through to proof of delivery. Customers see live status timelines, scan events and delivery confirmations as they happen, simply by entering a tracking number on our homepage or by signing in to a personal dashboard that brings every shipment, notification and invoice together in one place.

Built For Business
Creating a shipment takes minutes. Enter sender, recipient and package details, pick a pickup window, and get an instant transparent quote before you pay. Shipments are priced on actual or dimensional weight, so what you are quoted is what you pay. High-volume shippers get volume pricing, dedicated account managers, weekly invoicing and exportable shipment records, while our operations team monitors freight around the clock.

Security and Trust
Customer accounts are protected with industry-standard authentication, session-based route protection and encrypted data handling, with no public signup exposure. Pricing is always upfront with no hidden fees, every shipment carries base carrier liability, and eligible express delays are refunded under our service guarantee.

Our Numbers
1.2M+ shipments delivered, 2,400+ cities covered, 25,000+ customers served, and a 98.6% on-time delivery rate — backed by an ISO 9001 certified operations team and 24/7 phone, email and live chat support.

We exist to make shipping simple. Wherever your cargo needs to go, ArcBest gets it there and keeps you informed at every step.

Talk to us
Questions about your freight, customs documentation or corporate rates? Email support@arcbest.com or call +1 (800) 555-0147 and our team will take it from there.`
  },
  privacy: {
    title: "Privacy Policy",
    body: `We respect your privacy and are committed to protecting the personal information you provide when using our website or placing an order.

Information We Collect
Information provided by customers may include information necessary to process orders, provide customer support, arrange delivery, and communicate with customers regarding their purchases.

How We Use Your Information
Customer information should only be used for legitimate business purposes related to providing our products and services.

Data Security
We take reasonable steps to protect customer information and maintain the security of information submitted through our website.

Contact
Customers should contact our customer service team if they have questions regarding their personal information or its use.

Customer service email: support@arcbest.com`
  },
  terms: {
    title: "Terms of Service",
    body: `By using our website or placing an order, you agree to the store's current terms, policies, and conditions.

Customers are responsible for reviewing product information, sizing information, order details, shipping information, and applicable return or exchange conditions before completing an order.

Once an order is placed and processed, the applicable processing, shipping, return, exchange, and product policies will apply.

Custom Orders
Custom wigs are subject to specific processing requirements because they are made according to the customer's requested specifications. Due to the hygienic nature of hair products and the labor involved in custom wig construction, custom wigs are final sale except where the specific "Our Error" policy applies. Custom wigs cannot be returned simply because the customer changes their mind or no longer wants the product.

Altered Units and Sale Items
All sales of altered units and sale items are final. These items are not eligible for the standard ready to ship return and exchange policy.

Ready to Ship Wigs
Eligible ready to ship wigs may be returned for store credit or exchanged within 7 days of delivery. A 25% restocking fee applies. The security tag must remain fully intact. The lace must completely remain uncut. The wig must be completely unworn. The wig must be free from perfumes, smoke, glue, or other smells. The customer is responsible for tracked return shipping.

Return Process
To request support, customers must contact support@arcbest.com with their order or shipment number. The support team will provide the next steps and any required return or claim instructions.

Damaged or Defective Items
Customers should inspect packages promptly after delivery. If a shipment arrives damaged or incomplete, contact support@arcbest.com promptly with the shipment number and clear photos of the package and contents so the claim can be reviewed.

Our Error Policy
If the store sends the wrong item, the customer may qualify for a resolution under the "Our Error" policy. Qualifying errors are strictly limited to: Wrong Item Sent — the customer received a completely different wig style or texture from what is listed on the original invoice. Wrong Cap Size Sent — the customer ordered a specific cap size but received a different cap size. This policy applies to custom orders and does not apply to ready to ship or sale items.

To qualify for review, the customer must contact ArcBest promptly through support@arcbest.com and provide the shipment number, clear photos, and any other requested evidence.

If the store confirms that the error was made by the store, prepaid return shipping will be provided and a replacement will be issued after the returned unit is received and inspected.

The store does not cover return costs for units that have been cut, styled, glued, or altered by the customer or a stylist.`
  },
  shipping: {
    title: "Shipping Policy",
    body: `All deliveries are handled by DHL and are door to door.

Ready to Deliver Wigs
Ready to deliver wigs are processed within 3 to 5 business days. After processing, standard shipping takes approximately 5 to 7 business days after delivery depending on the customer's location.

Custom Orders
Processing time for custom orders varies depending on the requested style. Customers should allow the applicable processing time before the order is shipped.

Express Shipping
Express shipping is available at checkout for customers who require faster delivery. Express shipping is available at an additional cost.

Shipping Rates
Shipping rates vary depending on the customer's location and the weight of the order. The exact shipping cost will be displayed at checkout before the customer completes the order.

Free Shipping
Free shipping is available for orders over $800. Free shipping does not apply to wholesale or bulk orders.

Tracking
All deliveries are handled through DHL. Tracking numbers will be provided after the order has been processed.

Customer Service
For any shipping-related inquiries, reach out to us at support@arcbest.com.`
  }
}

const EMAIL_REGEX = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g

function EmailLink({ email }: { email: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(email)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea")
      textarea.value = email
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand("copy")
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <span className="inline-flex items-center gap-1.5 align-middle">
      <a
        href={`mailto:${email}`}
        className="font-bold text-primary hover:text-primary/80 underline underline-offset-2 boty-transition"
      >
        {email}
      </a>
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 boty-transition cursor-pointer"
        aria-label={`Copy ${email}`}
        title="Copy email"
      >
        {copied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
      </button>
    </span>
  )
}

function renderWithEmails(text: string) {
  const parts = text.split(EMAIL_REGEX)
  return parts.map((part, index) => {
    if (EMAIL_REGEX.test(part)) {
      return <EmailLink key={index} email={part} />
    }
    return <span key={index}>{part}</span>
  })
}

export function PolicyModal({ type, onClose }: PolicyModalProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (type) {
      requestAnimationFrame(() => setVisible(true))
    } else {
      setVisible(false)
    }
  }, [type])

  useEffect(() => {
    if (!type) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose()
    }
    document.addEventListener("keydown", handleEscape)
    document.body.style.overflow = "hidden"

    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = ""
    }
  }, [type])

  function handleClose() {
    setVisible(false)
    setTimeout(onClose, 300)
  }

  if (!type) return null

  const { title, body } = content[type]
  // Bodies are authored with CRLF line endings, so normalise before splitting
  // into paragraphs / headings.
  const normalized = body.replace(/\r\n/g, "\n").replace(/[ \t]+$/gm, "")

  return (
    <>
      <div
        className={`fixed inset-0 z-100 backdrop-blur-sm bg-black/30 transition-all duration-300 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleClose}
      />

      <div
        className={`fixed inset-0 z-101 flex items-center justify-center p-4 transition-all duration-300 ${
          visible ? "opacity-100 scale-100" : "opacity-0 scale-75"
        }`}
      >
        <div
          className="bg-card rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto boty-shadow hide-scrollbar" data-lenis-prevent
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sticky top-0 bg-card z-10 flex items-center justify-between p-6 pb-4 border-b border-border/50">
            <h2 className="text-lg font-bold text-foreground">{title}</h2>
            <button
              type="button"
              onClick={handleClose}
              className="w-8 h-8 rounded-full bg-background flex items-center justify-center text-foreground/60 hover:text-foreground boty-transition"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 pt-4">
            {normalized.split("\n\n").map((paragraph, i) => {
              const [firstLine, ...restLines] = paragraph.split("\n")
              const isHeading = firstLine.length < 50 && !firstLine.endsWith(".") && !firstLine.includes("@")

              if (isHeading) {
                return (
                  <div key={i} className="mt-6 mb-4 first:mt-0 last:mb-0">
                    <h3 className="font-medium text-foreground mb-2">{firstLine}</h3>
                    {restLines.length > 0 && (
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {renderWithEmails(restLines.join(" "))}
                      </p>
                    )}
                  </div>
                )
              }

              return (
                <p key={i} className="text-sm text-muted-foreground leading-relaxed mb-4 last:mb-0">
                  {renderWithEmails(paragraph)}
                </p>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}