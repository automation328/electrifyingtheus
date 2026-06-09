// Gated "share via email" button. On first use per browser session it captures
// the visitor's first name + email (upserted to GoHighLevel via the secure
// /api/lead proxy), then opens a prefilled compose window in their webmail (see
// openEmailCompose — works without a desktop mail client). Once captured, later
// clicks open the composer straight away.
//
// Shares the same "share_unlocked" session flag as ShareGate, so a visitor who
// already unlocked sharing isn't re-asked.

import { useState } from "react";
import { Mail, User, Loader2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { submitLead, type LeadFormType } from "@/lib/submitLead";
import { openEmailCompose, rememberLeadEmail } from "@/lib/emailCompose";

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
const SESSION_KEY = "share_unlocked";

interface Props {
  /** Email subject line. */
  subject: string;
  /** Email body. */
  body: string;
  /** Lead tag for GHL/Slack. */
  formType: LeadFormType;
  /** Headline saved to the GHL note + shown in the dialog. */
  title: string;
  /** Extra context for the GHL note (e.g. company · location). */
  summary?: string;
  /** Trigger styling. */
  className?: string;
  ariaLabel?: string;
  /** Trigger contents — defaults to a mail icon. */
  children?: React.ReactNode;
}

const EmailShareButton = ({
  subject, body, formType, title, summary, className, ariaLabel = "Share via email", children,
}: Props) => {
  const [open, setOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const valid = firstName.trim().length > 0 && isEmail(email);

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    let unlocked = false;
    try { unlocked = sessionStorage.getItem(SESSION_KEY) === "1"; } catch { /* private mode */ }
    if (unlocked) {
      openEmailCompose({ subject, body });
      return;
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
      message: `Shared "${title}" via email${summary ? ` — ${summary}` : ""}`,
    });
    rememberLeadEmail(email.trim());
    try { sessionStorage.setItem(SESSION_KEY, "1"); } catch { /* private mode */ }
    setSending(false);
    setOpen(false);
    openEmailCompose({ subject, body, fromEmail: email.trim() });
  };

  return (
    <>
      <button type="button" onClick={onClick} aria-label={ariaLabel} className={className}>
        {children ?? <Mail className="w-4 h-4" />}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl bg-white">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" /> Share via email
            </DialogTitle>
            <DialogDescription>
              Enter your name and email to share{" "}
              <span className="font-medium text-foreground">{title}</span>. We'll open your email
              with the message ready to send.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="email-share-first" className="text-xs">First name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email-share-first" value={firstName} onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Alex" autoComplete="given-name" className="pl-9" required
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="email-share-email" className="text-xs">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email-share-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com" autoComplete="email" className="pl-9" required
                />
              </div>
            </div>
            <Button type="submit" variant="hero" className="w-full rounded-xl" disabled={!valid || sending}>
              {sending ? (<><Loader2 className="w-4 h-4 animate-spin" /> One moment…</>)
                : (<><Mail className="w-4 h-4" /> Open email</>)}
            </Button>
            <p className="text-[11px] leading-snug text-muted-foreground text-center">
              We'll send occasional EV updates. Unsubscribe anytime.
            </p>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EmailShareButton;
