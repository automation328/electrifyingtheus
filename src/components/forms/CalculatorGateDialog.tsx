// Lead gate for the EV vs Gas calculator. Clicking "Calculate my savings" opens
// this popup; once the visitor gives a first name + email, results are revealed
// and the lead is upserted into GoHighLevel via the secure /api/lead proxy.
//
// Non-blocking by design: results unlock even if the lead POST hiccups, so a
// backend issue never traps the visitor behind the gate.

import { useState } from "react";
import { Sparkles, User, Mail, Loader2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { submitLead } from "@/lib/submitLead";

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  /** Fired with the visitor's first name once captured — reveal the results. */
  onUnlock: (firstName: string) => void;
  /** Context for GHL, e.g. "Tesla Model 3 vs Toyota Camry". */
  vehicleSummary?: string;
  /** Visitor's state name, saved to the contact for routing. */
  stateName?: string;
}

const CalculatorGateDialog = ({ open, onOpenChange, onUnlock, vehicleSummary, stateName }: Props) => {
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);

  const valid = firstName.trim().length > 0 && isEmail(email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || sending) return;
    setSending(true);
    // Upsert into GoHighLevel (tag `calculator-lead`) + fire the Slack alert via
    // the secure /api/lead proxy. Non-blocking — results unlock regardless.
    await submitLead("calculator-unlock", {
      firstName: firstName.trim(),
      email: email.trim(),
      vehicleSummary: vehicleSummary ?? "",
      city: stateName ?? "",
    });
    setSending(false);
    // Hand the name up so the page can show the "Thank you, {name}!" intro, then
    // close the dialog to reveal the results beneath it.
    onUnlock(firstName.trim());
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-3xl bg-white">
        <DialogHeader>
          <DialogTitle className="font-charge text-2xl flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" /> See your savings
          </DialogTitle>
          <DialogDescription>
            Enter your name and email to unlock your personalized results
            {vehicleSummary ? ` for the ${vehicleSummary}` : ""}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="gate-first" className="text-xs">First name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="gate-first" value={firstName} onChange={(e) => setFirstName(e.target.value)}
                placeholder="Alex" autoComplete="given-name" className="pl-9" required
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="gate-email" className="text-xs">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="gate-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com" autoComplete="email" className="pl-9" required
              />
            </div>
          </div>

          <Button type="submit" variant="hero" className="w-full rounded-xl" disabled={!valid || sending}>
            {sending ? (<><Loader2 className="w-4 h-4 animate-spin" /> Unlocking…</>)
              : (<><Sparkles className="w-4 h-4" /> Show my savings</>)}
          </Button>
          <p className="text-[11px] leading-snug text-muted-foreground text-center">
            We'll email your results and occasional EV savings tips. Unsubscribe anytime.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CalculatorGateDialog;
