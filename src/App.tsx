import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop.tsx";
import SeoRouteHead from "./components/SeoRouteHead.tsx";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { lazy, Suspense, type ComponentType } from "react";
import { importWithRetry } from "@/lib/chunk-retry";
import { ChunkErrorBoundary } from "./components/LoadFailed.tsx";
import Index from "./pages/Index.tsx";
import ThemeApplier from "./components/ThemeApplier.tsx";
import ContactWidget from "./components/ContactWidget.tsx";
import AnalyticsTracker from "./components/AnalyticsTracker.tsx";
import GoogleAnalytics from "./components/GoogleAnalytics.tsx";
import RequireEditor from "./components/admin/RequireEditor.tsx";
import { blogConfig, eventsConfig, galleryConfig, jobsConfig, vehiclesConfig, incentivesConfig } from "./pages/admin/collections/configs.ts";

// Each page loads as its own chunk, so a visit downloads only the page it needs
// instead of the whole site.
const page = <P,>(load: () => Promise<{ default: ComponentType<P> }>) => lazy(() => importWithRetry(load));
const Calculator = page(() => import("./pages/Calculator.tsx"));
const Assistant = page(() => import("./pages/Assistant.tsx"));
const ElectricityVsGasoline = page(() => import("./pages/ElectricityVsGasoline.tsx"));
const GmEvVsGas = page(() => import("./pages/GmEvVsGas.tsx"));
const News = page(() => import("./pages/News.tsx"));
const BlogPost = page(() => import("./pages/BlogPost.tsx"));
const Events = page(() => import("./pages/Events.tsx"));
const EvSafetyWebinar = page(() => import("./pages/EvSafetyWebinar.tsx"));
const Updates = page(() => import("./pages/Updates.tsx"));
const EventDetail = page(() => import("./pages/EventDetail.tsx"));
const Gallery = page(() => import("./pages/Gallery.tsx"));
const ListYourEvent = page(() => import("./pages/ListYourEvent.tsx"));
const Careers = page(() => import("./pages/Careers.tsx"));
const PostAJob = page(() => import("./pages/PostAJob.tsx"));
const FindACharger = page(() => import("./pages/FindACharger.tsx"));
const RangeMap = page(() => import("./pages/RangeMap.tsx"));
const Marketplace = page(() => import("./pages/Marketplace.tsx"));
const VehicleListing = page(() => import("./pages/VehicleListing.tsx"));
const RebatesIncentives = page(() => import("./pages/RebatesIncentives.tsx"));
const RebateEligibility = page(() => import("./pages/RebateEligibility.tsx"));
const WorkforceEconomicDevelopment = page(() => import("./pages/WorkforceEconomicDevelopment.tsx"));
const EvRoadSafety = page(() => import("./pages/EvRoadSafety.tsx"));
const SteamEducation = page(() => import("./pages/SteamEducation.tsx"));
const EvCharging101 = page(() => import("./pages/EvCharging101.tsx"));
const SaveWithEvsWebinar = page(() => import("./pages/SaveWithEvsWebinar.tsx"));
const FromPumpToPlugPart3 = page(() => import("./pages/FromPumpToPlugPart3.tsx"));
const FromPumpToPlugPart2 = page(() => import("./pages/FromPumpToPlugPart2.tsx"));
const EvsInWinter = page(() => import("./pages/EvsInWinter.tsx"));
const FinancialSavings = page(() => import("./pages/FinancialSavings.tsx"));
const UsEvPolicies = page(() => import("./pages/UsEvPolicies.tsx"));
const ReducedEmissions = page(() => import("./pages/ReducedEmissions.tsx"));
const SelfDrivingVehicles = page(() => import("./pages/SelfDrivingVehicles.tsx"));
const EvtolDroneDelivery = page(() => import("./pages/EvtolDroneDelivery.tsx"));
const SustainableAviation = page(() => import("./pages/SustainableAviation.tsx"));
const ElectricSchoolBuses = page(() => import("./pages/ElectricSchoolBuses.tsx"));
const HeavyDutyElectrification = page(() => import("./pages/HeavyDutyElectrification.tsx"));
const ElectricPublicTransit = page(() => import("./pages/ElectricPublicTransit.tsx"));
const RideshareRentalFleets = page(() => import("./pages/RideshareRentalFleets.tsx"));
const MicroMobility = page(() => import("./pages/MicroMobility.tsx"));
const SustainableMaritime = page(() => import("./pages/SustainableMaritime.tsx"));
const PrivacyPolicy = page(() => import("./pages/PrivacyPolicy.tsx"));
const TermsConditions = page(() => import("./pages/TermsConditions.tsx"));
const ContactUs = page(() => import("./pages/ContactUs.tsx"));
const ThankYou = page(() => import("./pages/ThankYou.tsx"));
const EventSubmitted = page(() => import("./pages/EventSubmitted.tsx"));
const NotFound = page(() => import("./pages/NotFound.tsx"));
const CustomPage = page(() => import("./pages/CustomPage.tsx"));
const ThemeEditor = page(() => import("./pages/admin/ThemeEditor.tsx"));
const SeoEditor = page(() => import("./pages/admin/SeoEditor.tsx"));
const AdminLogin = page(() => import("./pages/admin/AdminLogin.tsx"));
const AdminLayout = page(() => import("./pages/admin/AdminLayout.tsx"));
const AdminHome = page(() => import("./pages/admin/AdminHome.tsx"));
const PagesManager = page(() => import("./pages/admin/PagesManager.tsx"));
const MediaManager = page(() => import("./pages/admin/MediaManager.tsx"));
const NavEditor = page(() => import("./pages/admin/NavEditor.tsx"));
const FooterEditor = page(() => import("./pages/admin/FooterEditor.tsx"));
const KnowledgeBaseManager = page(() => import("./pages/admin/KnowledgeBaseManager.tsx"));
const UsersManager = page(() => import("./pages/admin/UsersManager.tsx"));
const ActivityManager = page(() => import("./pages/admin/ActivityManager.tsx"));
const SubmissionsManager = page(() => import("./pages/admin/SubmissionsManager.tsx"));
const StatisticsManager = page(() => import("./pages/admin/StatisticsManager.tsx"));
const CollectionManager = page(() => import("./components/admin/CollectionManager.tsx"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeApplier />
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <SeoRouteHead />
        <GoogleAnalytics />
        <ChunkErrorBoundary>
        <Suspense fallback={<div className="min-h-screen" />}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/calculator" element={<Calculator />} />
          <Route path="/assistant" element={<Assistant />} />
          <Route path="/electricity-vs-gasoline" element={<ElectricityVsGasoline />} />
          <Route path="/gm-ev-vs-gas" element={<GmEvVsGas />} />
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
          {/* The Part 2 webinar ran on 27 Aug 2026; its registration page is retired.
              Send the old URL to the recording, the same way past blog slugs redirect. */}
          <Route path="/events/from-pump-to-plug" element={<Navigate to="/from-pump-to-plug-part-2" replace />} />
          {/* Part 3 ran on 19 Nov 2026; its registration page now points to the replay. */}
          <Route path="/events/from-pump-to-plug-part-3" element={<Navigate to="/from-pump-to-plug-part-3" replace />} />
          <Route path="/events/:slug" element={<EventDetail />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/list-your-event" element={<ListYourEvent />} />
          <Route path="/careers" element={<Careers />} />
          <Route path="/post-a-job" element={<PostAJob />} />
          <Route path="/find-a-charger" element={<FindACharger />} />
          <Route path="/range-map" element={<RangeMap />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/marketplace/:id" element={<VehicleListing />} />
          <Route path="/rebates-incentives" element={<RebatesIncentives />} />
          <Route path="/rebate-eligibility" element={<RebateEligibility />} />
          <Route path="/workforce-economic-development" element={<WorkforceEconomicDevelopment />} />
          <Route path="/ev-road-safety" element={<EvRoadSafety />} />
          <Route path="/steam-education" element={<SteamEducation />} />
          <Route path="/ev-charging-101" element={<EvCharging101 />} />
          <Route path="/save-with-evs-webinar" element={<SaveWithEvsWebinar />} />
          <Route path="/from-pump-to-plug-part-2" element={<FromPumpToPlugPart2 />} />
          <Route path="/from-pump-to-plug-part-3" element={<FromPumpToPlugPart3 />} />
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
          {/* Its own URL, so the copy can be about an event under review and the
              submission is trackable as a conversion. */}
          <Route path="/list-your-event/thank-you" element={<EventSubmitted />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsConditions />} />
          {/* Webinar recap (coded page; replaces the earlier CMS page at this path). */}
          <Route path="/evsafetywebinar" element={<EvSafetyWebinar />} />
          {/* The general deck, embedded from FlipHTML5. */}
          <Route path="/updates" element={<Updates />} />
          {/* Its first address. Links to it are already out in the world. */}
          <Route path="/slides" element={<Navigate to="/updates" replace />} />
          {/* Internal analytics dashboard — password-gated (ANALYTICS_PASSWORD). */}
          {/* Editors only: the CMS login guards it. /api/analytics still takes the shared password. */}
          <Route path="/admin" element={<Navigate to="/admin/content/statistics" replace />} />
          {/* CMS content editor — Supabase Auth, invite-only editors. */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/content" element={<RequireEditor><AdminLayout /></RequireEditor>}>
            <Route index element={<AdminHome />} />
            <Route path="statistics" element={<StatisticsManager />} />
            <Route path="blog" element={<CollectionManager config={blogConfig} />} />
            <Route path="events" element={<CollectionManager config={eventsConfig} />} />
            <Route path="gallery" element={<CollectionManager config={galleryConfig} />} />
            <Route path="jobs" element={<CollectionManager config={jobsConfig} />} />
            <Route path="media" element={<MediaManager />} />
            <Route path="pages" element={<PagesManager />} />
            <Route path="navigation" element={<NavEditor />} />
            <Route path="footer" element={<FooterEditor />} />
            <Route path="theme" element={<ThemeEditor />} />
            <Route path="seo" element={<SeoEditor />} />
            <Route path="vehicles" element={<CollectionManager config={vehiclesConfig} />} />
            <Route path="incentives" element={<CollectionManager config={incentivesConfig} />} />
            <Route path="knowledge-base" element={<KnowledgeBaseManager />} />
            <Route path="users" element={<UsersManager />} />
            <Route path="submissions" element={<SubmissionsManager />} />
            <Route path="activity" element={<ActivityManager />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          {/* Catch-all: renders a CMS-created custom page if one exists, else 404. */}
          <Route path="*" element={<CustomPage />} />
        </Routes>
        </Suspense>
        </ChunkErrorBoundary>
        {/* Floating contact widget — visible on every page. */}
        <ContactWidget />
        {/* First-party analytics: pageviews + clicks → Supabase; Slack once/session. */}
        <AnalyticsTracker />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
