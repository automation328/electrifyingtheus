// Lead-gated outbound action. Renders a button that, on click, asks the visitor
// for their first name + email, submits the lead (GoHighLevel + Slack via the
// secure /api/lead proxy), then proceeds to `href` in a new tab. Used for the
// "Add to calendar" and "Register" actions on event pages so every event CTA —
// like Share already does — captures the lead first.

import { useState } from "react";
import { Loader2, User, Mail } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { submitLead, type LeadFormType } from "@/lib/submitLead";
import { rememberLeadEmail } from "@/lib/emailCompose";

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

type ActionFormType = Extract<LeadFormType, "event-register" | "event-calendar">;

interface EventActionGateProps {
  /** Destination opened in a new tab once the lead is captured. */
  href: string;
  /** Lead tag — registration vs. add-to-calendar. */
  formType: ActionFormType;
  /** Event title (saved to the lead note). */
  title: string;
  /** Date · location line (saved to the lead note). */
  summary?: string;
  /** Button label. */
  label: string;
  /** Optional leading icon node. */
  icon?: React.ReactNode;
  className?: string;
}

const EventActionGate = ({
  href, formType, title, summary, label, icon, className,
}: EventActionGateProps) => {
  const [open, setOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);

  const valid = firstName.trim().length > 0 && isEmail(email);
  const isRegister = formType === "event-register";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || sending) return;
    setSending(true);
    await submitLead(formType, {
      firstName: firstName.trim(),
      email: email.trim(),
      subject: title,
      message: `${label} — "${title}"${summary ? ` (${summary})` : ""}`,
    });
    rememberLeadEmail(email.trim());
    setSending(false);
    setOpen(false);
    // Proceed to the destination (registration page / Google Calendar).
    window.open(href, "_blank", "noopener,noreferrer");
  };

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {icon}{label}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl bg-white">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">
              {isRegister ? "Register for this event" : "Add to your calendar"}
            </DialogTitle>
            <DialogDescription>
              {isRegister
                ? "Tell us who you are and we'll take you to registration."
                : "Tell us who you are and we'll add this to your calendar."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-1">
            <div>
              <Label htmlFor="eag-first">First name</Label>
              <div className="relative mt-1.5">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="eag-first"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Jordan"
                  className="pl-9"
                  autoFocus
                />
              </div>
            </div>
            <div>
              <Label htmlFor="eag-email">Email</Label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="eag-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="pl-9"
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={!valid || sending}
              className="w-full gradient-primary text-primary-foreground font-semibold"
            >
              {sending
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> One sec…</>
                : (isRegister ? "Continue to register" : "Add to calendar")}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EventActionGate;
