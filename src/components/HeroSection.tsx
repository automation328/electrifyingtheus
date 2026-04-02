import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
import logo from "@/assets/logo.png";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      <img
        src={heroBg}
        alt="Electric vehicles on American highway"
        className="absolute inset-0 w-full h-full object-cover"
        width={1920}
        height={1080}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-primary/80 via-primary/60 to-primary/90" />

      {/* Content */}
      <div className="relative z-10 container text-center px-4">
        <div className="max-w-4xl mx-auto">
          <img
            src={logo}
            alt="Electrifying the US logo"
            className="mx-auto h-32 md:h-48 lg:h-56 w-auto mb-8 animate-fade-up drop-shadow-2xl"
          />

          <p className="text-lg md:text-xl text-primary-foreground/90 max-w-2xl mx-auto mb-10 animate-fade-up font-light leading-relaxed"
            style={{ animationDelay: "0.2s" }}>
            Transforming how America moves — from EVs and e-bikes to electric buses and eVTOLs. 
            Your gateway to the zero-emission future.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-up" style={{ animationDelay: "0.4s" }}>
            <a href="#ev101">
              <Button variant="hero" size="lg" className="text-base px-8 py-6 rounded-2xl">
                Explore EV 101
              </Button>
            </a>
            <a href="https://afdc.energy.gov/fuels/electricity_locations.html#/find/nearest?fuel=ELEC" target="_blank" rel="noopener noreferrer">
              <Button variant="heroOutline" size="lg" className="text-base px-8 py-6 rounded-2xl">
                Find Charging Near Me
              </Button>
            </a>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <a href="#dashboard" className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-float">
        <ChevronDown className="text-primary-foreground/70" size={32} />
      </a>
    </section>
  );
};

export default HeroSection;
