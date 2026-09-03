// The gate in front of the webinar replay. A first name and an email, once, and
// the recording plays.
//
// Two fields on purpose. This sits between someone and an hour of video they
// came to watch, so every extra box is a reason to close the tab; name and email
// are what the CRM needs to follow up, and the rest can be asked later by
// someone who has earned it.
//
// "Once" means once per visitor, not once per page: the answer is kept in the
// shared leadIdentity store, so somebody who already identified at the
// calculator unlock, a Share dialog or an event CTA is never asked again here —
// and identifying here spares them those gates in turn.
//
// Non-blocking, like every other gate on the site: the video unlocks even if the
// lead POST fails, so a backend hiccup never leaves someone staring at a poster.

import { useEffect, useState } from "react";
import { User, Mail, PlayCircle, Loader2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { submitLead } from "@/lib/submitLead";
import { rememberLeadEmail } from "@/lib/emailCompose";
import { getLeadIdentity, saveLeadIdentity } from "@/lib/leadIdentity";

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  /** Fired once the visitor is known — start the video they clicked. */
  onUnlock: () => void;
  /** Title of the video that triggered the gate, recorded on the lead. */
  videoTitle?: string;
}

const VideoGateDialog = ({ open, onOpenChange, onUnlock, videoTitle }: Props) => {
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [hp, setHp] = useState("");            // honeypot — bots fill it, people can't see it
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  // Reopening must not show the last attempt's half-typed answers or an error
  // about a video the visitor has moved on from.
  useEffect(() => {
    if (!open) return;
    const id = getLeadIdentity();
    setFirstName(id?.firstName ?? "");
    setEmail(id?.email ?? "");
    setError("");
    setHp("");
    setSending(false);
  }, [open]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending) return;
    if (hp) return;                            // silent drop: only a bot got here
    if (!firstName.trim()) { setError("Please enter your first name."); return; }
    if (!isEmail(email)) { setError("Please enter a valid email address."); return; }
    setError("");
    setSending(true);

    const name = firstName.trim();
    const mail = email.trim();

    await submitLead("video-access", {
      firstName: name,
      email: mail,
      subject: videoTitle ? `Video access: ${videoTitle}` : "Video access",
    });
    rememberLeadEmail(mail);
    saveLeadIdentity({ firstName: name, email: mail });

    setSending(false);
    onUnlock();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-3xl bg-white">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl flex items-center gap-2">
            <PlayCircle className="w-5 h-5 text-primary" /> Watch the replay
          </DialogTitle>
          <DialogDescription>
            Tell us where to reach you and {videoTitle ? `"${videoTitle}"` : "the recording"} starts
            playing. We only ask the first time.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          {/* Honeypot — hidden from users */}
          <input
            type="text" name="company_website" tabIndex={-1} autoComplete="off"
            value={hp} onChange={(e) => setHp(e.target.value)} className="hidden" aria-hidden="true"
          />

          <div className="space-y-1">
            <Label htmlFor="vg-first" className="text-xs">First name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="vg-first" value={firstName} onChange={(e) => setFirstName(e.target.value)}
                placeholder="Alex" autoComplete="given-name" className="pl-9" required
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="vg-email" className="text-xs">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="vg-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com" autoComplete="email" className="pl-9" required
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button type="submit" variant="hero" className="w-full rounded-xl" disabled={sending}>
            {sending
              ? (<><Loader2 className="w-4 h-4 animate-spin" /> Starting…</>)
              : (<><PlayCircle className="w-4 h-4" /> Watch now</>)}
          </Button>
          <p className="text-[11px] leading-snug text-muted-foreground text-center">
            We'll send occasional EV news and updates. Unsubscribe anytime.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default VideoGateDialog;
