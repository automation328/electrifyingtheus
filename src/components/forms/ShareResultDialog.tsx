// Email / Text-a-result share popup for the EV vs Gas calculator.
//
// Captures BOTH the sender ("from") and recipient ("to") contact details and
// upserts them into GoHighLevel via the secure /api/lead proxy with a
// `calculator-share` tag. The recipient contact carries the result link
// (stored on contact.website) so a GHL workflow on that tag fires the actual
// email/SMS — no email/SMS provider keys live in this app.

import { useState } from "react";
import { Send, Mail, MessageSquare, Loader2, Check } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { submitLead } from "@/lib/submitLead";
import { toast } from "sonner";

type Channel = "email" | "sms";

interface ShareResultDialogProps {
  /** The shareable result link (the calculator URL already encodes full state). */
  shareUrl: string;
  /** e.g. "Tesla Model 3 vs Toyota Camry" — for context in GHL + the note. */
  vehicleSummary: string;
  /** e.g. "$9,000 saved over 5 years on fuel" (optional). */
  savingsSummary?: string;
  /** The element that opens the dialog. */
  trigger: React.ReactNode;
}

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
const isPhone = (v: string) => v.replace(/\D/g, "").length >= 10;

const ShareResultDialog = ({ shareUrl, vehicleSummary, savingsSummary, trigger }: ShareResultDialogProps) => {
  const [open, setOpen] = useState(false);
  const [channel, setChannel] = useState<Channel>("email");
  const [senderName, setSenderName] = useState("");
  const [senderContact, setSenderContact] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientContact, setRecipientContact] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

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

    const ok = await submitLead("calculator-share", {
      // Recipient → standard GHL contact fields (the messaged party).
      firstName: recipientName,
      email: channel === "email" ? recipientContact : "",
      phone: channel === "sms" ? recipientContact : "",
      // Sender + context.
      senderName,
      senderEmail: channel === "email" ? senderContact : "",
      senderPhone: channel === "sms" ? senderContact : "",
      shareChannel: channel,
      shareUrl,
      vehicleSummary,
      savingsSummary: savingsSummary ?? "",
    });

    setSending(false);
    if (ok) {
      setDone(true);
      toast.success(
        channel === "email" ? "Result on its way by email" : "Result on its way by text",
        { description: `We'll send ${recipientName || "your friend"} the ${vehicleSummary} comparison.` },
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
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-3xl bg-white">
        <DialogHeader>
          <DialogTitle className="font-charge text-2xl flex items-center gap-2">
            <Send className="w-5 h-5 text-primary" /> Send this result
          </DialogTitle>
          <DialogDescription>
            Email or text the {vehicleSummary} comparison — it reopens exactly as you see it.
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
              : (<><Send className="w-4 h-4" /> {channel === "email" ? "Email the result" : "Text the result"}</>)}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ShareResultDialog;
