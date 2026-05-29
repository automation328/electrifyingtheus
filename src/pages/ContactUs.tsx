import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const GHL_FORM_ID = "gSIFOhJAicpdZkkAfZjO";
const GHL_EMBED_SCRIPT = "https://link.msgsndr.com/js/form_embed.js";

const ContactUs = () => {
  useEffect(() => {
    if (document.querySelector(`script[src="${GHL_EMBED_SCRIPT}"]`)) return;
    const script = document.createElement("script");
    script.src = GHL_EMBED_SCRIPT;
    script.async = true;
    document.body.appendChild(script);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 pt-28 pb-20">
        <div className="container px-4">
          {/* Centered header */}
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
              Get In Touch
            </span>
            <h1 className="text-3xl md:text-5xl font-bold font-display text-foreground mb-4">
              Contact <span className="text-gradient-primary">Us</span>
            </h1>
            <p className="text-muted-foreground text-lg">
              Have questions about EVs, want EVan on your own site, or want to partner with us?
              We'd love to hear from you.
            </p>
          </div>

          {/* Centered form */}
          <div className="max-w-2xl mx-auto rounded-2xl overflow-hidden bg-card shadow-card">
            <iframe
              src={`https://api.leadconnectorhq.com/widget/form/${GHL_FORM_ID}`}
              style={{ width: "100%", height: "970px", border: "none", borderRadius: "3px" }}
              id={`inline-${GHL_FORM_ID}`}
              data-layout="{'id':'INLINE'}"
              data-trigger-type="alwaysShow"
              data-trigger-value=""
              data-activation-type="alwaysActivated"
              data-activation-value=""
              data-deactivation-type="neverDeactivate"
              data-deactivation-value=""
              data-form-name="Contact Us - Lovable"
              data-height="970"
              data-layout-iframe-id={`inline-${GHL_FORM_ID}`}
              data-form-id={GHL_FORM_ID}
              title="Contact Us"
            />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ContactUs;
