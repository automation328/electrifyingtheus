import logo from "@/assets/logo.png";

const Footer = () => {
  return (
    <footer className="gradient-primary py-12 md:py-16">
      <div className="container">
        <div className="grid md:grid-cols-3 gap-8 items-start">
          <div>
            <img src={logo} alt="Electrifying the US" className="h-16 w-auto mb-4 brightness-0 invert" />
            <p className="text-primary-foreground/70 text-sm max-w-xs">
              Transforming how America moves toward a zero-emission future.
            </p>
          </div>

          <div>
            <h4 className="font-display font-bold text-primary-foreground mb-4">Quick Links</h4>
            <div className="space-y-2">
              {["About", "EV Dashboard", "EV 101", "Benefits", "Multimodal", "Contact"].map((l) => (
                <a
                  key={l}
                  href={`#${l.toLowerCase().replace(/ /g, "")}`}
                  className="block text-primary-foreground/70 hover:text-primary-foreground text-sm transition-colors"
                >
                  {l}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-display font-bold text-primary-foreground mb-4">Partner Sites</h4>
            <div className="space-y-2">
              <a href="https://www.electrifyingva.com/" target="_blank" rel="noopener noreferrer"
                className="block text-primary-foreground/70 hover:text-primary-foreground text-sm transition-colors">
                Electrifying Virginia
              </a>
              <a href="https://www.electrifyingmi.com/" target="_blank" rel="noopener noreferrer"
                className="block text-primary-foreground/70 hover:text-primary-foreground text-sm transition-colors">
                Electrifying Michigan
              </a>
              <a href="https://afdc.energy.gov/stations" target="_blank" rel="noopener noreferrer"
                className="block text-primary-foreground/70 hover:text-primary-foreground text-sm transition-colors">
                Find Charging Stations
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 mt-10 pt-6 text-center">
          <p className="text-primary-foreground/50 text-sm">
            © {new Date().getFullYear()} Electrifying The US. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
