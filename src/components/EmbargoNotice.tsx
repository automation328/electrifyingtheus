// Confidential / embargo acknowledgement shown once per browser session after a
// reviewer signs in. Reminds the individual NOT to share their login or any
// pre-launch information. Non-dismissible except via the explicit "agree" button
// so it can't be clicked away. (The gate already authenticated them; this is the
// confidentiality reminder on top.)

import { useEffect, useState } from "react";
import { ShieldAlert, Lock, EyeOff } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const ACK_KEY = "etu_embargo_ack";

const EmbargoNotice = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Show once per browser session (resets when the tab/browser is closed).
    try {
      if (sessionStorage.getItem(ACK_KEY) !== "1") setOpen(true);
    } catch {
      setOpen(true);
    }
  }, []);

  const agree = () => {
    try { sessionStorage.setItem(ACK_KEY, "1"); } catch { /* private mode */ }
    setOpen(false);
  };

  return (
    // Any close path (X, Escape, click-outside, or the button) acknowledges so
    // it won't immediately re-open for the rest of the session.
    <Dialog open={open} onOpenChange={(o) => { if (!o) agree(); }}>
      <DialogContent className="sm:max-w-lg rounded-3xl bg-white">
        <DialogHeader>
          <div className="mx-auto mb-2 grid place-items-center w-14 h-14 rounded-2xl bg-amber-100 text-amber-600">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <DialogTitle className="font-display text-2xl text-center">
            Confidential — Embargoed Preview
          </DialogTitle>
          <DialogDescription className="text-center">
            You've been given private early access ahead of launch. By continuing you agree:
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-3 my-2 text-sm text-foreground">
          <li className="flex items-start gap-3">
            <Lock className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <span><span className="font-semibold">Do not share your login.</span> It's personal to you and every sign-in is logged.</span>
          </li>
          <li className="flex items-start gap-3">
            <EyeOff className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <span><span className="font-semibold">Do not share any information</span> — no screenshots, links, content, or details — with anyone before the public launch.</span>
          </li>
          <li className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <span>All material here is <span className="font-semibold">embargoed and confidential</span>. Access is monitored.</span>
          </li>
        </ul>

        <Button
          onClick={agree}
          className="w-full gradient-primary text-primary-foreground font-semibold"
        >
          I understand &amp; agree
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default EmbargoNotice;
