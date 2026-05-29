import { GraduationCap } from "lucide-react";
import ContentPageLayout, { type ContentSection, type ContentStat, type ContentSource, type ContentShot } from "@/components/ContentPageLayout";
import steamEducation from "@/assets/steam-education.jpg";
import schoolBus from "@/assets/school-bus.jpg";
import workforce from "@/assets/workforce.jpg";
import electricTransitBus from "@/assets/electric-transit-bus.jpg";

const gallery: ContentShot[] = [
  { src: steamEducation, caption: "STEAM classroom sparks EV careers" },
  { src: schoolBus, caption: "Clean electric school buses on route" },
  { src: workforce, caption: "Hands-on high-voltage technician training" },
  { src: electricTransitBus, caption: "Electric transit fleets need skilled crews" },
];

const video = { youtubeId: "OpVTrredEZ8", title: "EPA's Clean School Bus Program Quick Facts" };

const stats: ContentStat[] = [
  { value: "$5B", label: "EPA Clean School Bus funding to modernize fleets (FY2022-2026)" },
  { value: "5 years", label: "Federal investment window driving demand for trained EV technicians" },
  { value: "800V+", label: "High-voltage systems technicians must be certified to service safely" },
  { value: "STEAM", label: "Science, technology, engineering, arts, and math feed the pipeline" },
];

const sections: ContentSection[] = [
  {
    heading: "Why clean transportation needs a skilled workforce",
    body: [
      "Electrifying America's school buses, transit fleets, and personal vehicles is not only about the vehicles themselves. Every electric bus, charger, and depot upgrade needs people who can build, install, operate, and maintain it safely. As fleets shift from diesel and gasoline to battery-electric drivetrains, the skills that mechanics, electricians, and fleet operators need are changing fast.",
      "STEAM education, which blends science, technology, engineering, arts, and math, is the foundation of that pipeline. It introduces students to the electrical theory, software, and design thinking behind modern vehicles long before they reach a technical college or apprenticeship. Building this workforce early ensures that as federal programs put cleaner buses on the road, the technicians needed to keep them running are ready.",
    ],
    list: [
      "High-voltage drivetrains and battery packs that replace internal-combustion engines",
      "Charging hardware and the electrical infrastructure that powers depots",
      "Vehicle software, diagnostics, and telematics for fleet management",
      "Safety and emergency response procedures unique to electric vehicles",
    ],
  },
  {
    heading: "EPA Clean School Bus training resources",
    body: [
      "The EPA's Clean School Bus Program was created by the 2021 Infrastructure Investment and Jobs Act to invest roughly five billion dollars over five years (fiscal years 2022 through 2026) in replacing older diesel school buses with cleaner models. To support districts adopting these vehicles, the EPA maintains a Workforce Development and Training Resources page that points to materials for the people who will operate and service the new fleets.",
      "A featured resource is the National Fire Protection Association's First Responder Alternative Fuel Vehicles Training Program, a set of web-based learning modules for personnel who handle fires and other emergencies involving alternative fuel and electric vehicles. The EPA invites school districts, manufacturers, and training organizations to submit additional resources so the directory continues to grow alongside the program.",
    ],
    list: [
      "NFPA First Responder Alternative Fuel Vehicles Training (web-based modules)",
      "EPA Clean School Bus Program guidance for districts deploying new buses",
      "Manufacturer-led operator and maintenance training tied to bus awards",
    ],
  },
  {
    heading: "High-voltage systems, batteries, and charging maintenance",
    body: [
      "Servicing an electric vehicle is fundamentally different from working on a gasoline engine. Battery packs and drivetrains operate at hundreds of volts, enough to be lethal without proper procedures, so technicians need dedicated training in de-energizing systems, personal protective equipment, and lockout practices before they ever open a high-voltage component.",
      "Beyond safety, technicians learn the chemistry and behavior of lithium-ion batteries, how power electronics and electric motors work, and how to diagnose faults using specialized tools. A growing share of the job also involves charging infrastructure, known as EVSE, which requires electrical knowledge to install, commission, and maintain depot and public chargers reliably.",
    ],
    list: [
      "High-voltage safety: de-energization, PPE, insulated tools, and lockout/tagout",
      "Battery chemistry, thermal management, and pack diagnostics",
      "Electric motors, inverters, and power electronics fundamentals",
      "EVSE installation, commissioning, and preventive maintenance",
      "Software diagnostics, firmware updates, and telematics data",
    ],
  },
  {
    heading: "Community colleges, apprenticeships, and certifications",
    body: [
      "Much of the hands-on EV workforce is trained through community and technical colleges, registered apprenticeships, and industry certification programs. These pathways combine classroom instruction with paid, supervised work so learners can earn while they build real skills on real equipment.",
      "Recognized credentials help employers verify competency. The National Institute for Automotive Service Excellence, known as ASE, offers light-duty and medium- or heavy-duty certifications, and electrical licensing covers the infrastructure side of charging. Stacking these credentials with manufacturer-specific and high-voltage safety training creates a clear ladder from entry level to advanced specialist.",
    ],
    list: [
      "Community and technical college EV and automotive technology programs",
      "Registered apprenticeships that pair paid work with instruction",
      "ASE certifications, including electric vehicle and hybrid credentials",
      "Electrical licensing and EVSE-specific installer training",
      "Manufacturer and OEM training tied to specific vehicle platforms",
    ],
  },
  {
    heading: "Building the K-12 STEAM pipeline",
    body: [
      "A durable clean-transportation workforce starts well before college. K-12 STEAM programs spark interest in how vehicles, batteries, and electrical systems work, often using the electric school bus parked outside as a living classroom. Hands-on projects, design challenges, and exposure to real technicians help students see clean energy as a career, not just a science lesson.",
      "Connecting classroom learning to local fleets and employers turns curiosity into a clear path. When students understand that the bus carrying them to school is part of a national effort to cut emissions, and that the people who service it earn good wages, STEAM education becomes a recruiting tool for the entire industry.",
    ],
  },
  {
    heading: "Equity and diversity in the clean-energy workforce",
    body: [
      "Clean transportation funding is meant to deliver cleaner air and good jobs to the communities that have historically faced the worst pollution and the fewest opportunities. Reaching that goal requires deliberate effort to open training and apprenticeship pathways to women, people of color, rural residents, and workers transitioning from legacy automotive and fossil-fuel jobs.",
      "Equity is not only fair, it is practical. A workforce that reflects the communities it serves is more likely to be retained, and broad recruitment widens the talent pool an industry will need to fill the wave of new technician, installer, and operator roles created as fleets electrify.",
    ],
    list: [
      "Targeted outreach and scholarships to broaden who enters training",
      "Reskilling support for diesel mechanics and auto workers moving to EVs",
      "Wraparound services such as transportation, childcare, and mentorship",
      "Partnerships with community organizations in priority neighborhoods",
    ],
  },
  {
    heading: "How to get involved and find programs",
    body: [
      "Whether you are a student, a career changer, an educator, or a school district administrator, there are concrete ways to plug into the clean-transportation workforce. Start with the EPA Clean School Bus resources and the Department of Energy's workforce and Alternative Fuels Data Center materials, then look locally for the colleges and employers training the next generation of technicians.",
    ],
    list: [
      "Explore the EPA Clean School Bus Workforce Development and Training Resources page",
      "Search the Department of Energy Alternative Fuels Data Center for training and credentials",
      "Contact local community colleges about EV and automotive technology programs",
      "Ask fleet operators and bus manufacturers about apprenticeships and operator training",
      "Educators can request fleet visits and ride-and-drive events for STEAM classes",
    ],
  },
];

const sources: ContentSource[] = [
  { label: "EPA — Clean School Bus: Workforce Development & Training Resources", url: "https://www.epa.gov/cleanschoolbus/workforce-development-and-training-resources" },
  { label: "EPA — Clean School Bus Program (overview & funding)", url: "https://www.epa.gov/cleanschoolbus" },
  { label: "U.S. Department of Energy — Alternative Fuels Data Center", url: "https://afdc.energy.gov/" },
];

const SteamEducation = () => (
  <ContentPageLayout
    badge="EV 101 · Education"
    kicker="EV 101 · Field Brief"
    title="STEAM"
    highlight="Education"
    intro="STEAM education builds the science, technology, engineering, arts, and math skills that power America's clean-transportation workforce. From K-12 classrooms to apprenticeships and EPA Clean School Bus training, it is the pipeline that keeps electric buses, chargers, and fleets running safely."
    pullQuote="Every electric bus on the road needs a trained technician behind it, and that pipeline starts in the classroom."
    heroImage={steamEducation}
    icon={GraduationCap}
    stats={stats}
    sections={sections}
    gallery={gallery}
    video={video}
    sources={sources}
  />
);

export default SteamEducation;
