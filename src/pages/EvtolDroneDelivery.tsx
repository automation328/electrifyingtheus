import { PlaneTakeoff } from "lucide-react";
import ContentPageLayout, { type ContentSection, type ContentStat, type ContentSource, type ContentShot } from "@/components/ContentPageLayout";
import evtolDrone from "@/assets/evtol-drone.jpg";
import evtol from "@/assets/evtol.jpg";
import sustainableAviation from "@/assets/sustainable-aviation.jpg";
import selfDriving from "@/assets/self-driving.jpg";

const gallery: ContentShot[] = [
  { src: evtolDrone, caption: "Electric vertical takeoff and landing aircraft" },
  { src: evtol, caption: "Air taxis built for short urban hops" },
  { src: sustainableAviation, caption: "A new electric layer above the runway" },
  { src: selfDriving, caption: "Autonomy and electrification, airborne" },
];

const stats: ContentStat[] = [
  { value: "Zero", label: "Tailpipe emissions from all-electric vertical-takeoff aircraft" },
  { value: "<250 mi", label: "Sweet spot for short-range regional and urban air mobility" },
  { value: "Minutes", label: "Drone delivery times to rural homes and hospital rooftops" },
  { value: "2025", label: "U.S. DOT released a national Advanced Air Mobility strategy" },
];

const sections: ContentSection[] = [
  {
    heading: "What an eVTOL actually is",
    body: [
      "An eVTOL — electric vertical takeoff and landing aircraft — lifts off like a helicopter but flies on electric motors and batteries instead of a turbine. Distributing thrust across many small rotors makes the craft quieter, simpler, and far cleaner than the helicopters it aims to replace.",
      "Designed for short hops of a few dozen miles, eVTOLs are built to shuttle a handful of passengers over the congestion below — airport runs, cross-city trips, and regional connections that are slow by road but trivial by air.",
    ],
  },
  {
    heading: "Drone delivery: medical, rural, and last-mile",
    body: [
      "Delivery drones are already moving prescriptions, lab samples, and small parcels through the air. For rural communities and hospital networks, an electric drone can cover in minutes a trip that takes a van an hour, with no road and no emissions in between.",
      "Because each flight is small, electric, and automated, drone delivery targets exactly the trips that are most wasteful on the ground — a single light package sent across town in a two-ton vehicle.",
    ],
  },
  {
    heading: "The infrastructure: vertiports and airspace",
    body: [
      "A working aerial network needs more than aircraft. Vertiports — compact landing pads with fast chargers — are being designed onto rooftops, parking structures, and transit hubs, while regulators map out low-altitude corridors so air taxis and drones can share the sky safely.",
      "Much of this borrows directly from the EV world: high-power charging, battery thermal management, and fleet software all carry over from electric cars to electric aircraft.",
    ],
  },
  {
    heading: "Safety, noise, and certification",
    body: [
      "Advanced air mobility only scales if it earns public trust. The advantages are real, but so are the hurdles regulators are working through before these aircraft become routine.",
    ],
    list: [
      "Certification: the FAA must type-certify each aircraft and license pilots and operators before commercial passenger service.",
      "Redundancy: multiple independent motors mean the loss of one rotor need not end a flight safely.",
      "Noise: electric propulsion is dramatically quieter than helicopters, a key to community acceptance.",
      "Airspace integration: new traffic-management systems keep eVTOLs and drones separated from each other and from traditional aviation.",
      "National strategy: the U.S. DOT's 2025 Advanced Air Mobility plan lays out the roadmap for safe, scaled deployment.",
    ],
  },
];

const sources: ContentSource[] = [
  { label: "U.S. DOT — Advanced Air Mobility National Strategy (2025)", url: "https://www.transportation.gov/sites/dot.gov/files/2025-12/AAM%20National%20Strategy%202025.pdf" },
  { label: "FAA — Advanced Air Mobility", url: "https://www.faa.gov/air-taxis" },
  { label: "U.S. Department of Energy — Sustainable Transportation", url: "https://www.energy.gov/eere/sustainable-transportation" },
];

const EvtolDroneDelivery = () => (
  <ContentPageLayout
    badge="Beyond Cars · Aerial"
    kicker="Multimodal · Field Brief"
    title="eVTOLs &"
    highlight="Drone Delivery"
    intro="A new layer of transportation is forming overhead. Battery-powered air taxis are beginning to carry passengers above gridlocked streets, while delivery drones reach rural homes and hospital rooftops in minutes — an era of on-demand aerial mobility unimaginable a decade ago."
    heroImage={evtolDrone}
    icon={PlaneTakeoff}
    pullQuote="Quiet, electric, and vertical — eVTOLs turn the sky above a city into usable transportation infrastructure."
    stats={stats}
    sections={sections}
    gallery={gallery}
    sources={sources}
  />
);

export default EvtolDroneDelivery;
