import { useState } from "react";
import { MessageCircle } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger,
} from "@/components/ui/dialog";
import ContactForm from "@/components/forms/ContactForm";

// Floating contact widget. Clicking the bubble pops up the same Contact Us form
// used in the homepage Contact section (shared <ContactForm />), so leads land
// in GoHighLevel + Slack identically.
const ContactWidget = () => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          aria-label="Contact us"
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full gradient-primary shadow-xl flex items-center justify-center hover:scale-110 transition-transform"
        >
          <MessageCircle className="text-primary-foreground" size={24} />
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-xl max-h-[88vh] overflow-y-auto">
        <DialogHeader className="text-left">
          <DialogTitle className="font-display text-2xl">Contact Us</DialogTitle>
          <DialogDescription>
            Have questions about EVs or want to partner with us? We'd love to hear from you.
          </DialogDescription>
        </DialogHeader>
        <div className="pt-2">
          <ContactForm idPrefix="w-" onSuccess={() => { /* keep the thank-you visible; user closes the dialog */ }} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ContactWidget;
