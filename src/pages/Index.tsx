import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import VideoTestimonialsSection from "@/components/VideoTestimonialsSection";
import StatsSection from "@/components/StatsSection";
import AboutSection from "@/components/AboutSection";
import AgentChatSection from "@/components/AgentChatSection";
import EV101Section from "@/components/EV101Section";
import BenefitsSection from "@/components/BenefitsSection";
import MultimodalSection from "@/components/MultimodalSection";
import FeaturedEventsSection from "@/components/FeaturedEventsSection";
import TCOCalculatorSection from "@/components/TCOCalculatorSection";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import { homeLd } from "@/lib/structured-data";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <JsonLd data={homeLd()} />
      <Navbar />
      {/* The hero rotates events, jobs and articles, none of which is the page's
          topic, so the page heading is for screen readers and search engines. */}
      <h1 className="sr-only">Electrifying the US: EV savings, charging, incentives and events</h1>
      <HeroSection />
      <AboutSection />
      <VideoTestimonialsSection />
      <StatsSection />
      <AgentChatSection />
      <BenefitsSection />
      <EV101Section />
      <MultimodalSection />
      <TCOCalculatorSection />
      <FeaturedEventsSection />
      <Footer />
    </div>
  );
};

export default Index;
