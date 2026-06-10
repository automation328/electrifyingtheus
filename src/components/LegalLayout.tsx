import { useEffect } from "react";
import { ShieldCheck, type LucideIcon } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export interface LegalSection {
  heading: string;
  body: string[];
  list?: string[];
}

interface LegalLayoutProps {
  badge: string;
  title: string;
  highlight: string;
  intro: string;
  effectiveDate: string;
  sections: LegalSection[];
  icon?: LucideIcon;
}

const LegalLayout = ({
  badge, title, highlight, intro, effectiveDate, sections, icon: Icon = ShieldCheck,
}: LegalLayoutProps) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 pt-28 pb-16">
        {/* Header */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-secondary/5 to-transparent" aria-hidden />
          <div className="container relative z-10 px-4 max-w-3xl">
            <div className="text-center max-w-2xl mx-auto pb-2">
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
                <Icon className="w-4 h-4" /> {badge}
              </span>
              <h1 className="text-4xl md:text-5xl font-bold font-display text-foreground mb-3">
                {title} <span className="text-gradient-primary">{highlight}</span>
              </h1>
              <p className="text-muted-foreground">{intro}</p>
              <p className="text-xs text-muted-foreground mt-3">Effective date: {effectiveDate}</p>
            </div>
          </div>
        </section>

        {/* Body */}
        <article className="container px-4 max-w-3xl mt-10 space-y-8">
          {sections.map((s, i) => (
            <section key={i}>
              <h2 className="text-xl font-bold font-display text-foreground mb-3">
                <span className="text-primary mr-2">{String(i + 1).padStart(2, "0")}</span>
                {s.heading}
              </h2>
              {s.body.map((p, j) => (
                <p key={j} className="text-muted-foreground leading-relaxed mb-3">{p}</p>
              ))}
              {s.list && (
                <ul className="list-disc pl-6 space-y-1.5 text-muted-foreground">
                  {s.list.map((li, k) => (
                    <li key={k} className="leading-relaxed">{li}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}

          <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
            Questions about this policy? Contact us at{" "}
            <a href="mailto:Info@electrifyingtheus.com" className="font-semibold text-primary hover:underline">
              Info@electrifyingtheus.com
            </a>.
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
};

export default LegalLayout;
