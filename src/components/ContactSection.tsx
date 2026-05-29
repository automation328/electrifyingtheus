import { useEffect } from "react";

const GHL_FORM_ID = "gSIFOhJAicpdZkkAfZjO";
const GHL_EMBED_SCRIPT = "https://link.msgsndr.com/js/form_embed.js";

const ContactSection = () => {
  useEffect(() => {
    if (document.querySelector(`script[src="${GHL_EMBED_SCRIPT}"]`)) return;
    const script = document.createElement("script");
    script.src = GHL_EMBED_SCRIPT;
    script.async = true;
    document.body.appendChild(script);
  }, []);

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

          <div className="max-w-2xl mx-auto">
            {/* GHL embedded form */}
            <div className="rounded-xl overflow-hidden bg-card">
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
                title="Contact Us - Lovable"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
