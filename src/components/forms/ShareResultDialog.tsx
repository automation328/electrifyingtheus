// "Send this" share popup — Email / Text a shareable to a friend (or yourself).
// Originally built for the EV vs Gas calculator; now generic so every page's
// share menu offers the exact same flow.
//
// Captures BOTH the sender ("from") and recipient ("to") contact details and
// upserts them into GoHighLevel via the secure /api/lead proxy with the
// surface-specific share tag. The recipient contact carries the share link so
// a GHL workflow on that tag can fire email/SMS. For the email channel we also
// send the branded HTML email directly via /api/share-email (Resend), so the
// recipient gets a designed email with the thumbnail inline.

import { useEffect, useState } from "react";
import { Send, Mail, MessageSquare, Loader2, Check } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { submitLead, type LeadFormType } from "@/lib/submitLead";
import { sendShareEmail } from "@/lib/sendShareEmail";
import { toast } from "sonner";

type Channel = "email" | "sms";

interface ShareResultDialogProps {
  /** The shareable link (absolute, or relative — resolved against the origin). */
  shareUrl: string;
  /** What's being shared — named in the dialog + saved to GHL. */
  contentTitle: string;
  /** Optional extra context (e.g. "$9,000 saved over 5 years") saved to GHL. */
  summary?: string;
  /** Surface-specific lead tag. Defaults to the calculator's. */
  formType?: LeadFormType;
  /** Trigger element. Omit when controlling `open` externally (see below). */
  trigger?: React.ReactNode;
  /** Controlled open state — used by ShareGate's Email / SMS options. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Preselect the channel each time the dialog opens. */
  presetChannel?: Channel;
  /** Prefill the sender fields (e.g. from the share gate). */
  senderNameDefault?: string;
  senderEmailDefault?: string;
  /** When set, the email channel also delivers the branded HTML email. */
  emailContent?: { title: string; description?: string; meta?: string; imageUrl?: string };
  /** Dialog headline + sub-line (defaults are generic). */
  dialogTitle?: string;
  dialogDescription?: string;
}

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
const isPhone = (v: string) => v.replace(/\D/g, "").length >= 10;

const ShareResultDialog = ({
  shareUrl, contentTitle, summary, formType = "calculator-share", trigger,
  open: openProp, onOpenChange, presetChannel, senderNameDefault, senderEmailDefault,
  emailContent, dialogTitle = "Send this", dialogDescription,
}: ShareResultDialogProps) => {
  const [openState, setOpenState] = useState(false);
  const controlled = openProp !== undefined;
  const open = controlled ? openProp : openState;
  const setOpen = (o: boolean) => {
    if (!controlled) setOpenState(o);
    onOpenChange?.(o);
  };

  const [channel, setChannel] = useState<Channel>(presetChannel ?? "email");
  const [senderName, setSenderName] = useState("");
  const [senderContact, setSenderContact] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientContact, setRecipientContact] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  const absoluteUrl = shareUrl.startsWith("http")
    ? shareUrl
    : (typeof window !== "undefined" ? window.location.origin + shareUrl : shareUrl);

  // Each open: apply the preset channel and prefill empty sender fields from
  // the gate, so the visitor doesn't retype what they just entered.
  useEffect(() => {
    if (!open) return;
    if (presetChannel) setChannel(presetChannel);
    if (senderNameDefault) setSenderName((v) => v || senderNameDefault);
    if (senderEmailDefault && (presetChannel ?? "email") === "email") {
      setSenderContact((v) => v || senderEmailDefault);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const valid = channel === "email"
    ? isEmail(senderContact) && isEmail(recipientContact)
    : isPhone(senderContact) && isPhone(recipientContact);

  const reset = () => {
    setSenderName(""); setSenderContact("");
    setRecipientName(""); setRecipientContact("");
    setDone(false); setSending(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || sending) return;
    setSending(true);

    // CRM capture + GHL workflow trigger (same shape as the calculator share).
    const leadOk = await submitLead(formType, {
      // Recipient → standard GHL contact fields (the messaged party).
      firstName: recipientName,
      email: channel === "email" ? recipientContact : "",
      phone: channel === "sms" ? recipientContact : "",
      // Sender + context.
      senderName,
      senderEmail: channel === "email" ? senderContact : "",
      senderPhone: channel === "sms" ? senderContact : "",
      shareChannel: channel,
      shareUrl: absoluteUrl,
      vehicleSummary: contentTitle,
      savingsSummary: summary ?? "",
    });

    // Branded HTML email straight to the recipient (email channel only).
    let emailOk = false;
    if (channel === "email" && emailContent) {
      emailOk = await sendShareEmail({
        to: recipientContact.trim(),
        recipientName: recipientName.trim() || undefined,
        senderEmail: senderContact.trim(),
        senderName: senderName.trim() || undefined,
        title: emailContent.title,
        description: emailContent.description,
        meta: emailContent.meta,
        imageUrl: emailContent.imageUrl,
        url: absoluteUrl,
      });
    }

    setSending(false);
    // Email channel only counts as sent if the server actually accepted the
    // email (a CRM-capture success is NOT delivery). When there's no email to
    // send (sms, or no emailContent), fall back to the lead-capture result.
    const ok = channel === "email" && emailContent ? emailOk : leadOk;
    if (ok) {
      setDone(true);
      toast.success(
        channel === "email" ? "On its way by email" : "On its way by text",
        { description: `We'll send ${recipientName || "your friend"} "${contentTitle}".` },
      );
      setTimeout(() => { setOpen(false); reset(); }, 1400);
    } else {
      toast.error("Couldn't send right now", { description: "Please try again in a moment." });
    }
  };

  const contactType = channel === "email" ? "email" : "tel";
  const contactPlaceholder = channel === "email" ? "name@example.com" : "(555) 123-4567";

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-md rounded-3xl bg-white">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl flex items-center gap-2">
            <Send className="w-5 h-5 text-primary" /> {dialogTitle}
          </DialogTitle>
          <DialogDescription>
            {dialogDescription ?? <>Email or text <span className="font-medium text-foreground">{contentTitle}</span> — straight to their inbox or phone.</>}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Channel */}
          <ToggleGroup
            type="single"
            value={channel}
            onValueChange={(v) => v && setChannel(v as Channel)}
            className="grid grid-cols-2 gap-2"
          >
            <ToggleGroupItem value="email" className="rounded-xl border border-border bg-white text-foreground hover:bg-muted data-[state=on]:border-primary data-[state=on]:bg-primary/10 data-[state=on]:text-primary gap-2">
              <Mail className="w-4 h-4" /> Email
            </ToggleGroupItem>
            <ToggleGroupItem value="sms" className="rounded-xl border border-border bg-white text-foreground hover:bg-muted data-[state=on]:border-primary data-[state=on]:bg-primary/10 data-[state=on]:text-primary gap-2">
              <MessageSquare className="w-4 h-4" /> Text
            </ToggleGroupItem>
          </ToggleGroup>

          {/* From */}
          <div className="rounded-2xl border border-border p-3 space-y-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">From you</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="sr-from-name" className="text-xs">Your name</Label>
                <Input id="sr-from-name" value={senderName} onChange={(e) => setSenderName(e.target.value)} placeholder="Alex" autoComplete="name" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="sr-from-contact" className="text-xs">Your {channel === "email" ? "email" : "mobile"}</Label>
                <Input id="sr-from-contact" type={contactType} value={senderContact} onChange={(e) => setSenderContact(e.target.value)} placeholder={contactPlaceholder} required />
              </div>
            </div>
          </div>

          {/* To */}
          <div className="rounded-2xl border border-border p-3 space-y-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Send to</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="sr-to-name" className="text-xs">Their name</Label>
                <Input id="sr-to-name" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="Jordan" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="sr-to-contact" className="text-xs">Their {channel === "email" ? "email" : "mobile"}</Label>
                <Input id="sr-to-contact" type={contactType} value={recipientContact} onChange={(e) => setRecipientContact(e.target.value)} placeholder={contactPlaceholder} required />
              </div>
            </div>
          </div>

          {/* Standard text-message rates disclaimer (always shown) */}
          <p className="text-[11px] leading-snug text-muted-foreground">
            By sending, you confirm you have permission to contact this person. If sending by text,
            standard message &amp; data rates may apply. One message per share; reply STOP to opt out.
          </p>

          <Button type="submit" variant="hero" className="w-full rounded-xl" disabled={!valid || sending || done}>
            {done ? (<><Check className="w-4 h-4" /> Sent</>)
              : sending ? (<><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>)
              : (<><Send className="w-4 h-4" /> {channel === "email" ? "Email it" : "Text it"}</>)}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ShareResultDialog;
