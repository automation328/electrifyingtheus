import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import StatsSection from "@/components/StatsSection";
import AboutSection from "@/components/AboutSection";
import AgentChatSection from "@/components/AgentChatSection";
import EV101Section from "@/components/EV101Section";
import BenefitsSection from "@/components/BenefitsSection";
import MultimodalSection from "@/components/MultimodalSection";
import FeaturedEventsSection from "@/components/FeaturedEventsSection";
import TCOCalculatorSection from "@/components/TCOCalculatorSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <AboutSection />
      <StatsSection />
      <AgentChatSection />
      <EV101Section />
      <BenefitsSection />
      <MultimodalSection />
      <TCOCalculatorSection />
      <FeaturedEventsSection />
      <Footer />
    </div>
  );
};

export default Index;
