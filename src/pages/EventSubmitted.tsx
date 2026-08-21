// The page someone lands on after submitting /list-your-event.
//
// A route of its own rather than the shared /thank-you page, for two reasons:
// the copy has to be about an event under review (not "your message is on its
// way"), and a distinct URL is something you can point a conversion goal at.
//
// It sets expectations honestly: the event is NOT live yet. Somebody reviews it
// first, and the organiser gets an email with the link when it goes up. Saying
// so here is what stops the "I submitted it, where is it?" email.

import { Link, useLocation } from "react-router-dom";
import { CheckCircle2, ArrowRight, Mail, Eye, CalendarDays } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

interface SubmittedState {
  eventTitle?: string;
  email?: string;
}

const STEPS = [
  {
    icon: Eye,
    title: "We review it",
    body: "Our team checks the details are complete and the event is a fit for the calendar. This usually takes a couple of working days.",
  },
  {
    icon: CalendarDays,
    title: "It goes live",
    body: "Once approved, your event appears on the Electrifying the US events calendar with its own page.",
  },
  {
    icon: Mail,
    title: "You get the link",
    body: "We email you the live event link as soon as it is published, so you can share it straight away.",
  },
];

const EventSubmitted = () => {
  // Passed by ListYourEvent on navigate. Absent if someone opens this URL
  // directly, which is why every use of it is optional.
  const state = (useLocation().state ?? {}) as SubmittedState;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 pt-28 pb-20">
        <div className="container px-4">
          <div className="max-w-2xl mx-auto text-center">
            <div className="mx-auto mb-6 w-20 h-20 rounded-full gradient-green flex items-center justify-center shadow-lg">
              <CheckCircle2 className="w-11 h-11 text-secondary-foreground" />
            </div>

            <span className="inline-block px-4 py-1.5 rounded-full bg-secondary/10 text-secondary text-sm font-semibold mb-4">
              Submission received
            </span>

            <h1 className="text-4xl md:text-6xl font-bold font-display text-foreground mb-4">
              Thank <span className="text-gradient-primary">you!</span>
            </h1>

            <p className="text-muted-foreground text-lg leading-relaxed mb-2">
              {state.eventTitle
                ? <>We've received your submission for <strong className="text-foreground">{state.eventTitle}</strong>.</>
                : <>We've received your event submission.</>}
            </p>
            <p className="text-muted-foreground leading-relaxed mb-10">
              It's with our team now — it isn't on the calendar just yet.
              {state.email ? <> We'll be in touch at <strong className="text-foreground">{state.email}</strong>.</> : null}
            </p>

            {/* What happens next — the part that prevents the follow-up email. */}
            <div className="grid sm:grid-cols-3 gap-4 text-left mb-12">
              {STEPS.map((s, i) => (
                <div key={s.title} className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="grid place-items-center w-8 h-8 rounded-xl bg-primary/10 text-primary shrink-0">
                      <s.icon className="w-4 h-4" />
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                      Step {i + 1}
                    </span>
                  </div>
                  <h2 className="font-display font-bold text-foreground mb-1.5">{s.title}</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/events">
                <Button variant="hero" size="lg" className="text-base px-8 rounded-2xl gap-2">
                  Browse events <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link to="/list-your-event">
                <Button variant="green" size="lg" className="text-base px-8 rounded-2xl">
                  Submit another event
                </Button>
              </Link>
            </div>

            <p className="text-sm text-muted-foreground mt-8">
              Something not right? <Link to="/contact-us" className="text-primary font-semibold hover:underline">Get in touch</Link> and
              we'll fix it before it goes live.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default EventSubmitted;
