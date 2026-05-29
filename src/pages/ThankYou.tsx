import { Link } from "react-router-dom";
import { CheckCircle2, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

const ThankYou = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 flex items-center justify-center pt-28 pb-20">
        <div className="container px-4">
          <div className="max-w-xl mx-auto text-center">
            <div className="mx-auto mb-6 w-20 h-20 rounded-full gradient-green flex items-center justify-center shadow-lg">
              <CheckCircle2 className="w-11 h-11 text-secondary-foreground" />
            </div>

            <span className="inline-block px-4 py-1.5 rounded-full bg-secondary/10 text-secondary text-sm font-semibold mb-4">
              Message received
            </span>

            <h1 className="text-4xl md:text-6xl font-bold font-display text-foreground mb-4">
              Thank <span className="text-gradient-primary">you!</span>
            </h1>

            <p className="text-muted-foreground text-lg leading-relaxed mb-10">
              Your message is on its way to our team. We'll be in touch shortly at the email you
              provided. In the meantime, keep exploring the road to zero-emission mobility.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/">
                <Button variant="hero" size="lg" className="text-base px-8 rounded-2xl">
                  Back to Home
                </Button>
              </Link>
              <Link to="/electricity-vs-gasoline">
                <Button variant="green" size="lg" className="text-base px-8 rounded-2xl gap-2">
                  EV vs Gas Calculator <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ThankYou;
