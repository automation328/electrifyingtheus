import { CheckCircle } from "lucide-react";
import evFamily from "@/assets/ev-family.jpg";

const features = [
  "Hands-On EV Ride & Drive Experiences",
  "Cutting-Edge Mobility Research & Analysis",
  "E-Mobility Workforce Upskilling & Economic Inclusion",
  "Public Health Education — Zero Emission Mobility",
  "Multi-Channel Digital Education & Engagement",
  "Strategic Data Collection & Analysis",
];

const AboutSection = () => {
  return (
    <section id="about" className="py-20 md:py-28">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Image */}
          <div className="relative">
            <div className="rounded-3xl overflow-hidden shadow-xl">
              <img
                src={evFamily}
                alt="Family enjoying an electric vehicle"
                className="w-full h-auto object-cover"
                loading="lazy"
                width={1280}
                height={720}
              />
            </div>
            {/* Floating badge */}
            <div className="absolute -bottom-6 -right-4 md:right-8 glass-card rounded-2xl p-4 md:p-5 animate-float">
              <div className="text-2xl font-bold font-display text-primary">50+ States</div>
              <div className="text-sm text-muted-foreground">Nationwide Impact</div>
            </div>
          </div>

          {/* Content */}
          <div>
            <span className="inline-block px-4 py-1.5 rounded-full bg-secondary/10 text-secondary text-sm font-semibold mb-4">
              About Us
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-display text-foreground mb-6 leading-tight">
              Driving America's <span className="text-gradient-primary">Zero-Emission and Clean Energy</span> Future
            </h2>
            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
              ElectrifyingTheUS is a groundbreaking, national brand-agnostic partnership/initiative
              transforming how Americans understand and embrace multimodal Zero-Emission Mobility and
              Clean Energy. We unite utilities, automakers, community organizations, labor unions, and
              more in a shared mission. Our members and partners are dedicated to advancing
              transportation electrification and clean energy across the country.
            </p>

            <div className="grid sm:grid-cols-2 gap-3">
              {features.map((f, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted transition-colors">
                  <CheckCircle className="text-secondary mt-0.5 shrink-0" size={20} />
                  <span className="text-sm font-medium text-foreground">{f}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-4 mt-8">
              <a href="https://www.electrifyingva.com/" target="_blank" rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-xl bg-primary/10 text-primary font-semibold text-sm hover:bg-primary/20 transition-colors">
                Electrifying Virginia
              </a>
              <a href="https://www.electrifyingmi.com/" target="_blank" rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-xl bg-secondary/10 text-secondary font-semibold text-sm hover:bg-secondary/20 transition-colors">
                Electrifying Michigan
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
