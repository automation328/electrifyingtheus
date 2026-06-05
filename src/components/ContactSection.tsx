import { Sparkles } from "lucide-react";
import ContactForm from "@/components/forms/ContactForm";

const ContactSection = () => {
  return (
    <section id="contact" className="py-20 md:py-28">
      <div className="container">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
              <Sparkles className="w-3.5 h-3.5" /> Get In Touch
            </span>
            <h2 className="text-3xl md:text-5xl font-bold font-display text-foreground mb-4">
              Contact <span className="text-gradient-primary">Us</span>
            </h2>
            <p className="text-muted-foreground text-lg">
              Have questions about EVs or want to partner with us? We'd love to hear from you.
            </p>
          </div>

          <div className="relative rounded-[1.75rem] border border-border bg-card shadow-elevated overflow-hidden">
            <div className="h-1.5 w-full gradient-hero" aria-hidden />
            <div className="p-6 md:p-9">
              <ContactForm idPrefix="h-" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
