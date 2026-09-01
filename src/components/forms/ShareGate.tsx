// Share-with-lead-gate. A small "Share" trigger that, on first use in a session,
// captures the visitor's first name + email BEFORE revealing the share options.
// The lead is upserted into GoHighLevel (+ Slack alert) via the secure /api/lead
// proxy with a surface-specific tag (photo / article / incentive share).
//
// Once captured anywhere on the site (this share, the calculator unlock, or an
// event action), the visitor's name + email are remembered (see lib/leadIdentity)
// so the gate is skipped and they go straight to the share options next time.

import { useState } from "react";
import {
  Share2, User, Mail, Loader2, Facebook, Linkedin, MessageCircle, MessageSquare, Copy, MoreHorizontal,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { submitLead, type LeadFormType } from "@/lib/submitLead";
import { rememberLeadEmail } from "@/lib/emailCompose";
import { getLeadIdentity, saveLeadIdentity } from "@/lib/leadIdentity";
import ShareResultDialog from "@/components/forms/ShareResultDialog";
import { toast } from "sonner";

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

const SHARE_DISCLAIMER =
  "The vehicle information, consumer data, pricing, range estimates, and charging data presented here are sourced from publicly available information and industry research. This content is intended for general informational purposes only and is subject to change without notice. ElectrifyingTheUS.com and its staff make no representations or warranties regarding the accuracy, completeness, or timeliness of this information. This content does not constitute a recommendation, endorsement, or advice of any kind. Consumers are solely responsible for conducting their own due diligence, verifying current pricing and availability with licensed dealers, and making independent purchase decisions. ElectrifyingTheUS.com assumes no liability for decisions made based on the information provided here.";

// X (Twitter) wordmark — lucide ships only the legacy bird.
const XLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

type ShareFormType = Extract<
  LeadFormType,
  "photo-share" | "article-share" | "incentive-share" | "event-share" | "job-share" | "calculator-share" | "charger-share"
>;

interface ShareGateProps {
  /** Relative route ("/blog/x") or absolute URL ("https://…"). */
  url: string;
  /** Headline shared alongside the link. */
  title: string;
  /** Surface-specific lead tag. */
  formType: ShareFormType;
  /** Extra context saved to the GHL contact note (e.g. the item name). */
  summary?: string;
  /** Full description / excerpt — included in the shared email & message body. */
  description?: string;
  /** Thumbnail URL — its absolute form is appended so the recipient sees it. */
  image?: string;
  /** Short meta line (date · location, author · category, …) for the body. */
  meta?: string;
  /** Trigger look: compact icon, or icon + label. */
  variant?: "icon" | "label";
  /** Trigger label when variant="label". */
  label?: string;
  className?: string;
  /** Stop the click from bubbling to a parent <Link>/<a> card. Default true. */
  stopNav?: boolean;
  /** Extra surface-specific legal disclaimer shown above the standard one (e.g.
   *  the calculator estimate disclaimer). Also forwarded to the send dialog. */
  disclaimer?: string;
  /** Event shares only: "Saturday, SEP 19, 2026 · 11a - 4p". Passing this
   *  switches the share EMAIL to the labelled event layout and the CTA to
   *  "Events Details". The on-page share sheet is unaffected. */
  eventDateTime?: string;
}

const ShareGate = ({
  url, title, formType, summary, description, image, meta,
  variant = "icon", label = "Share", className, stopNav = true, disclaimer,
  eventDateTime,
}: ShareGateProps) => {
  const [open, setOpen] = useState(false);
  const [captured, setCaptured] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  // "Send this" dialog (Email / Text a friend) — same flow as the calculator.
  const [sendOpen, setSendOpen] = useState(false);
  const [sendChannel, setSendChannel] = useState<"email" | "sms">("email");

  const toAbsolute = (u: string) =>
    u.startsWith("http") ? u : (typeof window !== "undefined" ? window.location.origin + u : u);

  const absoluteUrl = toAbsolute(url);
  const absoluteImage = image ? toAbsolute(image) : "";

  // Rich plain-text body for email / messaging channels: title, description,
  // meta, thumbnail link, then the page link (which unfurls a preview in most
  // email clients). Social networks (FB/LinkedIn) read the page's OG tags, so
  // they only need the URL.
  const shareBody = [
    title,
    meta || undefined,
    description || undefined,
    absoluteImage ? `Image: ${absoluteImage}` : undefined,
    `Read more: ${absoluteUrl}`,
  ].filter(Boolean).join("\n\n");

  const valid = firstName.trim().length > 0 && isEmail(email);

  const openShare = (e: React.MouseEvent) => {
    if (stopNav) { e.preventDefault(); e.stopPropagation(); }
    // If the visitor already identified themselves at any earlier gate (calculator,
    // a previous share, an event action), skip straight to the share options and
    // reuse their saved name + email. Otherwise show the name/email form first.
    const id = getLeadIdentity();
    if (id) {
      setFirstName(id.firstName);
      setEmail(id.email);
      setCaptured(true);
    } else {
      setCaptured(false);
    }
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || sending) return;
    setSending(true);
    await submitLead(formType, {
      firstName: firstName.trim(),
      email: email.trim(),
      subject: title,
      message: `Shared "${title}"${summary ? ` — ${summary}` : ""}`,
      shareUrl: absoluteUrl,
    });
    rememberLeadEmail(email.trim());
    saveLeadIdentity({ firstName: firstName.trim(), email: email.trim() });
    setSending(false);
    // Reveal the share options (non-blocking — proceeds even if the POST hiccups).
    setCaptured(true);
  };

  // Email & SMS open the "Send this" dialog (sender + recipient, server-side
  // send) — the exact same flow as the calculator's "Email / Text result".
  const openSend = (channel: "email" | "sms") => {
    setSendChannel(channel);
    setOpen(false);
    setSendOpen(true);
  };

  const shareTo = (network: "facebook" | "linkedin" | "whatsapp") => {
    const u = encodeURIComponent(absoluteUrl);
    const links: Record<"facebook" | "linkedin" | "whatsapp", string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(shareBody)}`,
    };
    window.open(links[network], "_blank", "noopener,noreferrer");
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(absoluteUrl);
      toast.success("Link copied");
    } catch {
      toast.error("Couldn't copy", { description: "Copy the link from your address bar." });
    }
  };

  // Native OS share sheet (mobile + some desktops) — covers SMS, AirDrop, and
  // any other installed app. Only offered when the browser supports it.
  const canNativeShare = typeof navigator !== "undefined" && typeof navigator.share === "function";
  const nativeShare = async () => {
    try {
      await navigator.share({ title, text: title, url: absoluteUrl });
    } catch { /* user dismissed the sheet */ }
  };

  const row =
    "w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm text-foreground hover:bg-muted transition-colors text-left";

  return (
    <>
      <button
        type="button"
        onClick={openShare}
        aria-label={`Share: ${title}`}
        className={
          className ??
          (variant === "label"
            ? "inline-flex items-center gap-1.5 rounded-full bg-card/90 border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:text-primary hover:border-primary/40 shadow-sm transition-colors"
            : "inline-grid place-items-center w-9 h-9 rounded-full bg-card/90 border border-border text-foreground hover:text-primary hover:border-primary/40 shadow-sm transition-colors")
        }
      >
        <Share2 className="w-4 h-4" />
        {variant === "label" && label}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl bg-white">
          {!captured ? (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-2xl flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-primary" /> Share this
                </DialogTitle>
                <DialogDescription>
                  Enter your name and email to share <span className="font-medium text-foreground">{title}</span>.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="share-first" className="text-xs">First name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="share-first" value={firstName} onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Alex" autoComplete="given-name" className="pl-9" required
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="share-email" className="text-xs">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="share-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com" autoComplete="email" className="pl-9" required
                    />
                  </div>
                </div>
                <Button type="submit" variant="hero" className="w-full rounded-xl" disabled={!valid || sending}>
                  {sending ? (<><Loader2 className="w-4 h-4 animate-spin" /> One moment…</>)
                    : (<><Share2 className="w-4 h-4" /> Continue to share</>)}
                </Button>
                <p className="text-[11px] leading-snug text-muted-foreground text-center">
                  We'll send occasional EV updates. Unsubscribe anytime.
                </p>
              </form>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-2xl flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-primary" /> Share this
                </DialogTitle>
                <DialogDescription>
                  Pick where to share <span className="font-medium text-foreground">{title}</span>.
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 gap-1 pt-1">
                <button type="button" onClick={() => openSend("email")} className={row}>
                  <Mail className="w-4 h-4 text-muted-foreground" /> Email
                </button>
                <button type="button" onClick={() => shareTo("linkedin")} className={row}>
                  <Linkedin className="w-4 h-4" style={{ color: "#0A66C2" }} /> LinkedIn
                </button>
                <button type="button" onClick={() => shareTo("facebook")} className={row}>
                  <Facebook className="w-4 h-4" style={{ color: "#1877F2" }} /> Facebook
                </button>
                <button type="button" onClick={() => shareTo("whatsapp")} className={row}>
                  <MessageCircle className="w-4 h-4" style={{ color: "#25D366" }} /> WhatsApp
                </button>
                <button type="button" onClick={() => openSend("sms")} className={row}>
                  <MessageSquare className="w-4 h-4" style={{ color: "#16a34a" }} /> Text message (SMS)
                </button>
                {canNativeShare && (
                  <button type="button" onClick={nativeShare} className={row}>
                    <MoreHorizontal className="w-4 h-4 text-muted-foreground" /> More options…
                  </button>
                )}
                <div className="my-1 h-px bg-border" />
                <button type="button" onClick={copyLink} className={row}>
                  <Copy className="w-4 h-4 text-muted-foreground" /> Copy link
                </button>
              </div>
            </>
          )}

          <details className="mt-1 group">
            <summary className="cursor-pointer select-none text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80 hover:text-muted-foreground">
              Disclaimer
            </summary>
            {disclaimer && (
              <p className="mt-1.5 text-[10px] leading-relaxed text-muted-foreground whitespace-pre-line">
                {disclaimer}
              </p>
            )}
            <p className="mt-1.5 text-[10px] leading-relaxed text-muted-foreground">
              {SHARE_DISCLAIMER}
            </p>
          </details>
        </DialogContent>
      </Dialog>

      {/* Email / Text a friend — same sender+recipient flow as the calculator's
          "Email / Text result"; the gate's name + email prefill the sender. */}
      <ShareResultDialog
        open={sendOpen}
        onOpenChange={setSendOpen}
        presetChannel={sendChannel}
        formType={formType}
        shareUrl={absoluteUrl}
        contentTitle={title}
        summary={summary}
        senderNameDefault={firstName.trim() || undefined}
        senderEmailDefault={email.trim() || undefined}
        disclaimer={disclaimer}
        emailContent={{
          title,
          description: description || summary,
          meta,
          imageUrl: absoluteImage || undefined,
          eventDateTime,
          ctaLabel: eventDateTime ? "Events Details" : undefined,
        }}
      />
    </>
  );
};

export default ShareGate;
