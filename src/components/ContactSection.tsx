import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MapPin, Send } from "lucide-react";
import { toast } from "sonner";

const ContactSection = () => {
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", zip: "", company: "", message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Thank you! We'll be in touch soon.");
    setForm({ firstName: "", lastName: "", email: "", zip: "", company: "", message: "" });
  };

  return (
    <section id="contact" className="py-20 md:py-28">
      <div className="container">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
              Get In Touch
            </span>
            <h2 className="text-3xl md:text-5xl font-bold font-display text-foreground mb-4">
              Contact <span className="text-gradient-primary">Us</span>
            </h2>
            <p className="text-muted-foreground text-lg">
              Have questions about EVs or want to partner with us? We'd love to hear from you.
            </p>
          </div>

          <div className="grid md:grid-cols-5 gap-8">
            {/* Info */}
            <div className="md:col-span-2 space-y-6">
              <div className="gradient-primary rounded-3xl p-6 md:p-8">
                <h3 className="text-xl font-bold font-display text-primary-foreground mb-6">
                  Let's Connect
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-primary-foreground/90">
                    <Mail size={18} />
                    <span className="text-sm">info@electrifyingtheus.com</span>
                  </div>
                  <div className="flex items-center gap-3 text-primary-foreground/90">
                    <MapPin size={18} />
                    <span className="text-sm">Nationwide Initiative</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="md:col-span-3 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <Input
                  placeholder="First Name *"
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  required
                  className="rounded-xl h-12"
                />
                <Input
                  placeholder="Last Name *"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  required
                  className="rounded-xl h-12"
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <Input
                  type="email"
                  placeholder="Email *"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  className="rounded-xl h-12"
                />
                <Input
                  placeholder="Zip Code *"
                  value={form.zip}
                  onChange={(e) => setForm({ ...form, zip: e.target.value })}
                  required
                  className="rounded-xl h-12"
                />
              </div>
              <Input
                placeholder="Company or Organization *"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                required
                className="rounded-xl h-12"
              />
              <Textarea
                placeholder="Write a message *"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                required
                rows={4}
                className="rounded-xl resize-none"
              />
              <Button type="submit" variant="hero" size="lg" className="w-full rounded-xl">
                <Send size={18} />
                Send Message
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
