import evCharging from "@/assets/ev-charging.jpg";
import rideshareFleet from "@/assets/rideshare-fleet.jpg";
import evFamily from "@/assets/ev-family.jpg";
import steamEducation from "@/assets/steam-education.jpg";
import workforce from "@/assets/workforce.jpg";
import evPolicy from "@/assets/ev-policy.jpg";
import micromobility from "@/assets/micromobility.jpg";

export interface Job {
  title: string;
  company: string;
  department: string;
  location: string;
  type: string;
  description: string;
  /** Hero/card image for this exact role. */
  image: string;
  featured?: boolean;
  applyEmail?: string;
  /** External application URL — where Apply routes after the lead is captured.
   *  Falls back to a LinkedIn jobs search for the title + company if unset. */
  applyUrl?: string;
}

export const JOBS: Job[] = [
  {
    title: "EV Charging Network Engineer",
    company: "VoltGrid Networks",
    department: "Infrastructure",
    location: "Hybrid · Austin, TX",
    type: "Full-time",
    description: "Design and scale DC fast-charging deployments across the Southwest corridor. Own site engineering, utility coordination, and uptime.",
    image: evCharging,
    featured: true,
  },
  {
    title: "Fleet Electrification Consultant",
    company: "Meridian Mobility",
    department: "Partnerships",
    location: "Remote · U.S.",
    type: "Full-time",
    description: "Help municipalities and businesses plan, fund, and roll out electric fleets — TCO modeling, grant strategy, and vendor selection.",
    image: rideshareFleet,
    featured: true,
  },
  {
    title: "Community Engagement Manager",
    company: "Electrifying the US",
    department: "Outreach",
    location: "Hybrid · Detroit, MI",
    type: "Full-time",
    description: "Lead grassroots EV education and ride & drive events, building relationships with community organizations, utilities, and local leaders.",
    image: evFamily,
  },
  {
    title: "EV Education Specialist",
    company: "Electrifying the US",
    department: "Education",
    location: "Remote · U.S.",
    type: "Full-time",
    description: "Develop and deliver clear, engaging content that helps everyday drivers understand EVs, charging, incentives, and total cost of ownership.",
    image: steamEducation,
  },
  {
    title: "Workforce Development Coordinator",
    company: "Clean Energy Trades Alliance",
    department: "Workforce",
    location: "Richmond, VA",
    type: "Full-time",
    description: "Connect job seekers with clean-energy training and career pathways, partnering with labor unions, employers, and community colleges.",
    image: workforce,
  },
  {
    title: "Data & Research Analyst",
    company: "EmobilityResearch.com",
    department: "Research",
    location: "Remote · U.S.",
    type: "Full-time",
    description: "Turn mobility, energy, and adoption data into insights and reports that guide programs and inform public conversation.",
    image: evPolicy,
  },
  {
    title: "Ride & Drive Event Coordinator",
    company: "Electrifying the US",
    department: "Events",
    location: "Atlanta, GA",
    type: "Contract",
    description: "Plan and run hands-on EV experiences end-to-end — logistics, vehicles, vendors, volunteers, and an unforgettable attendee experience.",
    image: micromobility,
  },
];
