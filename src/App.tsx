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
import EventFromPumpToPlug from "./pages/EventFromPumpToPlug.tsx";
import EventDetail from "./pages/EventDetail.tsx";
import Gallery from "./pages/Gallery.tsx";
import ListYourEvent from "./pages/ListYourEvent.tsx";
import Careers from "./pages/Careers.tsx";
import PostAJob from "./pages/PostAJob.tsx";
import FindACharger from "./pages/FindACharger.tsx";
import RebatesIncentives from "./pages/RebatesIncentives.tsx";
import WorkforceEconomicDevelopment from "./pages/WorkforceEconomicDevelopment.tsx";
import EvRoadSafety from "./pages/EvRoadSafety.tsx";
import SteamEducation from "./pages/SteamEducation.tsx";
import EvCharging101 from "./pages/EvCharging101.tsx";
import SaveWithEvsWebinar from "./pages/SaveWithEvsWebinar.tsx";
import EvsInWinter from "./pages/EvsInWinter.tsx";
import FinancialSavings from "./pages/FinancialSavings.tsx";
import UsEvPolicies from "./pages/UsEvPolicies.tsx";
import ReducedEmissions from "./pages/ReducedEmissions.tsx";
import SelfDrivingVehicles from "./pages/SelfDrivingVehicles.tsx";
import EvtolDroneDelivery from "./pages/EvtolDroneDelivery.tsx";
import SustainableAviation from "./pages/SustainableAviation.tsx";
import ElectricSchoolBuses from "./pages/ElectricSchoolBuses.tsx";
import HeavyDutyElectrification from "./pages/HeavyDutyElectrification.tsx";
import ElectricPublicTransit from "./pages/ElectricPublicTransit.tsx";
import RideshareRentalFleets from "./pages/RideshareRentalFleets.tsx";
import MicroMobility from "./pages/MicroMobility.tsx";
import SustainableMaritime from "./pages/SustainableMaritime.tsx";
import PrivacyPolicy from "./pages/PrivacyPolicy.tsx";
import TermsConditions from "./pages/TermsConditions.tsx";
import ContactUs from "./pages/ContactUs.tsx";
import ThankYou from "./pages/ThankYou.tsx";
import NotFound from "./pages/NotFound.tsx";
import ContactWidget from "./components/ContactWidget.tsx";
import VisitorTracker from "./components/VisitorTracker.tsx";
import GoogleAnalytics from "./components/GoogleAnalytics.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <GoogleAnalytics />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/calculator" element={<Calculator />} />
          <Route path="/assistant" element={<Assistant />} />
          <Route path="/electricity-vs-gasoline" element={<ElectricityVsGasoline />} />
          <Route path="/news" element={<News />} />
          <Route path="/blog" element={<Navigate to="/news" replace />} />
          {/* Legacy blog slugs → current SEO slugs (preserve old links). */}
          <Route path="/blog/real-cost-of-going-electric" element={<Navigate to="/blog/real-cost-of-going-electric-ev-savings-breakdown" replace />} />
          <Route path="/blog/clean-energy-workforce-opportunities" element={<Navigate to="/blog/ev-clean-energy-workforce-jobs-opportunities" replace />} />
          <Route path="/blog/beyond-cars-multimodal-future" element={<Navigate to="/blog/beyond-cars-electric-bikes-buses-multimodal-transportation" replace />} />
          <Route path="/blog/evs-in-winter-myths-vs-reality" element={<Navigate to="/blog/ev-cold-weather-winter-range-myths-vs-reality" replace />} />
          <Route path="/blog/cleaner-air-healthier-neighborhoods" element={<Navigate to="/blog/electric-vehicles-air-quality-public-health-benefits" replace />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/events" element={<Events />} />
          <Route path="/events/from-pump-to-plug" element={<EventFromPumpToPlug />} />
          <Route path="/events/:slug" element={<EventDetail />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/list-your-event" element={<ListYourEvent />} />
          <Route path="/careers" element={<Careers />} />
          <Route path="/post-a-job" element={<PostAJob />} />
          <Route path="/find-a-charger" element={<FindACharger />} />
          <Route path="/rebates-incentives" element={<RebatesIncentives />} />
          <Route path="/workforce-economic-development" element={<WorkforceEconomicDevelopment />} />
          <Route path="/ev-road-safety" element={<EvRoadSafety />} />
          <Route path="/steam-education" element={<SteamEducation />} />
          <Route path="/ev-charging-101" element={<EvCharging101 />} />
          <Route path="/save-with-evs-webinar" element={<SaveWithEvsWebinar />} />
          <Route path="/evs-in-winter" element={<EvsInWinter />} />
          <Route path="/financial-savings" element={<FinancialSavings />} />
          <Route path="/us-ev-policies" element={<UsEvPolicies />} />
          <Route path="/reduced-emissions" element={<ReducedEmissions />} />
          <Route path="/self-driving-vehicles" element={<SelfDrivingVehicles />} />
          <Route path="/evtol-drone-delivery" element={<EvtolDroneDelivery />} />
          <Route path="/sustainable-aviation" element={<SustainableAviation />} />
          <Route path="/electric-school-buses" element={<ElectricSchoolBuses />} />
          <Route path="/heavy-duty-electrification" element={<HeavyDutyElectrification />} />
          <Route path="/electric-public-transit" element={<ElectricPublicTransit />} />
          <Route path="/rideshare-rental-fleets" element={<RideshareRentalFleets />} />
          <Route path="/micro-mobility" element={<MicroMobility />} />
          <Route path="/sustainable-maritime" element={<SustainableMaritime />} />
          <Route path="/contact-us" element={<ContactUs />} />
          <Route path="/thank-you" element={<ThankYou />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsConditions />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        {/* Floating contact widget — visible on every page. */}
        <ContactWidget />
        {/* Logs each visit (IP + geo) to Slack — fires once per session. */}
        <VisitorTracker />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
