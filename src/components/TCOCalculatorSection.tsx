import { Button } from "@/components/ui/button";
import { Calculator, Zap, DollarSign, BarChart3, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const features = [
  {
    icon: Calculator,
    title: "Side-by-Side Comparison",
    desc: "Compare any EV vs gas vehicle with real cost data",
  },
  {
    icon: DollarSign,
    title: "True Cost of Ownership",
    desc: "Fuel, maintenance, insurance, incentives & depreciation",
  },
  {
    icon: BarChart3,
    title: "Break-Even Analysis",
    desc: "See exactly when your EV pays for itself",
  },
  {
    icon: Zap,
    title: "AI-Powered Insights",
    desc: "Get plain-English recommendations instantly",
  },
];

const TCOCalculatorSection = () => {
  return (
    <section id="tco-calculator" className="py-20 md:py-28 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-muted/50 via-background to-muted/30" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-secondary/5 rounded-full blur-3xl" />

      <div className="container relative z-10 px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Calculator className="w-4 h-4" />
            TCO Calculator
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
            EV vs Gas:{" "}
            <span className="text-gradient-primary">Which Saves You More?</span>
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Compare the total cost of ownership between electric and gas vehicles.
            Factor in incentives, fuel costs, maintenance, and more — all in one place.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {features.map((f) => (
            <div
              key={f.title}
              className="group relative p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <f.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link to="/electricity-vs-gasoline">
            <Button variant="hero" size="lg" className="text-base px-10 py-6 rounded-2xl gap-3">
              Launch Calculator
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
          <p className="text-sm text-muted-foreground mt-4">Free • No signup required • U.S. data</p>
        </div>
      </div>
    </section>
  );
};

export default TCOCalculatorSection;
