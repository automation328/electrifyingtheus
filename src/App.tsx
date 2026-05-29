import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop.tsx";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Calculator from "./pages/Calculator.tsx";
import Assistant from "./pages/Assistant.tsx";
import ElectricityVsGasoline from "./pages/ElectricityVsGasoline.tsx";
import News from "./pages/News.tsx";
import BlogPost from "./pages/BlogPost.tsx";
import Events from "./pages/Events.tsx";
import Careers from "./pages/Careers.tsx";
import RebatesIncentives from "./pages/RebatesIncentives.tsx";
import WorkforceEconomicDevelopment from "./pages/WorkforceEconomicDevelopment.tsx";
import EvRoadSafety from "./pages/EvRoadSafety.tsx";
import SteamEducation from "./pages/SteamEducation.tsx";
import EvCharging101 from "./pages/EvCharging101.tsx";
import EvsInWinter from "./pages/EvsInWinter.tsx";
import FinancialSavings from "./pages/FinancialSavings.tsx";
import UsEvPolicies from "./pages/UsEvPolicies.tsx";
import ReducedEmissions from "./pages/ReducedEmissions.tsx";
import PrivacyPolicy from "./pages/PrivacyPolicy.tsx";
import TermsConditions from "./pages/TermsConditions.tsx";
import ContactUs from "./pages/ContactUs.tsx";
import ThankYou from "./pages/ThankYou.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/calculator" element={<Calculator />} />
          <Route path="/assistant" element={<Assistant />} />
          <Route path="/electricity-vs-gasoline" element={<ElectricityVsGasoline />} />
          <Route path="/news" element={<News />} />
          <Route path="/blog" element={<Navigate to="/news" replace />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/events" element={<Events />} />
          <Route path="/careers" element={<Careers />} />
          <Route path="/rebates-incentives" element={<RebatesIncentives />} />
          <Route path="/workforce-economic-development" element={<WorkforceEconomicDevelopment />} />
          <Route path="/ev-road-safety" element={<EvRoadSafety />} />
          <Route path="/steam-education" element={<SteamEducation />} />
          <Route path="/ev-charging-101" element={<EvCharging101 />} />
          <Route path="/evs-in-winter" element={<EvsInWinter />} />
          <Route path="/financial-savings" element={<FinancialSavings />} />
          <Route path="/us-ev-policies" element={<UsEvPolicies />} />
          <Route path="/reduced-emissions" element={<ReducedEmissions />} />
          <Route path="/contact-us" element={<ContactUs />} />
          <Route path="/thank-you" element={<ThankYou />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsConditions />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
