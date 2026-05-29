import { DollarSign } from "lucide-react";
import ContentPageLayout, { type ContentSection, type ContentStat, type ContentSource, type ContentShot } from "@/components/ContentPageLayout";
import financialSavings from "@/assets/financial-savings.jpg";
import evSavings from "@/assets/ev-savings.jpg";
import evFamily from "@/assets/ev-family.jpg";
import evCharging from "@/assets/ev-charging.jpg";

const stats: ContentStat[] = [
  { value: "~9 cents", label: "Saved per mile driving electric vs. gas (fuel + maintenance)" },
  { value: "$6K-$10K", label: "Typical maintenance savings over a vehicle's lifetime" },
  { value: "~20 vs 2,000+", label: "Moving parts in an EV drivetrain vs. a gas engine" },
  { value: "$70-$200/mo", label: "Fuel savings — average drivers up to high-mileage drivers" },
];

const sections: ContentSection[] = [
  {
    heading: "Fuel cost savings: electricity beats gasoline per mile",
    body: [
      "The single biggest reason EVs cost less to run is fuel. Charging an EV at home typically costs between $30 and $60 a month, while a comparable gas vehicle's fuel bill often exceeds $150. Coltura estimates the average U.S. driver saves about $70 every month on fuel after switching, and high-mileage drivers save closer to $200 a month.",
      "Measured per mile, electricity is dramatically cheaper than gasoline. Coltura puts the average EV savings at roughly 9.2 cents per mile versus gas, with fuel alone accounting for about 6.2 cents of that. Electricity prices are also far more stable than gasoline, so EV owners are largely shielded from the price spikes that hit drivers at the pump.",
    ],
  },
  {
    heading: "The \"gasoline superuser\" effect",
    body: [
      "Coltura's central insight is that gasoline consumption is highly concentrated. A minority of drivers — the people who commute long distances, drive for work, or simply rack up serious annual mileage — burn a hugely disproportionate share of the nation's gasoline. Coltura calls these drivers \"gasoline superusers.\"",
      "Because savings scale with the miles you drive, these high-mileage drivers also have the most to gain by going electric. While an average driver might save around $70 a month on fuel, a superuser can save roughly $200 a month — thousands of dollars a year. The further you drive, the faster an EV pays for itself, which flips the usual assumption that EVs only make sense for light, short-trip use.",
    ],
  },
  {
    heading: "Maintenance savings: a far simpler machine",
    body: [
      "EVs are mechanically much simpler than gas cars. An electric drivetrain has on the order of 20 moving parts, compared with well over 2,000 in a typical internal combustion vehicle. Fewer parts means fewer things to wear out, break, or service. Coltura measures EV maintenance at about 7.9 cents per mile, versus roughly 10.9 to 11.9 cents per mile for gas cars, crossovers, SUVs, and trucks.",
      "Many routine gas-car expenses simply disappear. As Coltura puts it, with an EV you \"never think about oil changes — it's just software updates.\" Common savings include:",
    ],
    list: [
      "No oil changes, spark plugs, timing belts, or fuel-system service",
      "No exhaust system, catalytic converter, or emissions repairs",
      "Regenerative braking captures energy when slowing down, so brake pads and rotors last far longer",
      "No transmission to service — most EVs use a single-speed gearbox",
      "Fewer fluids and filters to replace over the vehicle's life",
    ],
  },
  {
    heading: "Total cost of ownership over the vehicle's life",
    body: [
      "Lower fuel and maintenance costs add up. Coltura estimates the average EV driver saves over $1,000 a year on fuel and maintenance combined, and concludes that electric vehicles are cheaper to own long term for most drivers — saving thousands of dollars over five years or more.",
      "When you tally everything an EV avoids over its lifetime — fuel, oil changes, engine repairs, exhaust work, and reduced brake wear — maintenance savings alone commonly land in the $6,000 to $10,000 range. Combined with fuel savings, the total cost of ownership of an EV often comes out well below a comparable gas car even before factoring in any purchase incentives.",
    ],
  },
  {
    heading: "Incentives and tax benefits lower the upfront cost",
    body: [
      "The most common objection to EVs is the sticker price, but incentives can meaningfully close the gap. Federal, state, local, and utility programs can reduce the effective purchase price and the cost of installing a home charger, which shortens the time it takes for fuel and maintenance savings to pay back the initial investment.",
      "Incentive amounts and eligibility change frequently and vary by location, income, and whether the vehicle is new or used. Before buying, check the current programs available where you live so you can fold them into your total-cost comparison rather than judging an EV on sticker price alone.",
    ],
  },
  {
    heading: "Resale value and smart electricity-rate tips",
    body: [
      "As battery technology matures and demand for used EVs grows, resale value has become more competitive with gas cars, and an EV with a healthy battery and lower lifetime wear can hold its value well. A simpler drivetrain also means fewer expensive failures that drag down a used car's worth.",
      "You can stretch your fuel savings even further by being deliberate about how you charge. A few practical habits make a real difference:",
    ],
    list: [
      "Charge at home overnight, where electricity is far cheaper than public fast charging",
      "Switch to a time-of-use electricity plan and charge during off-peak hours",
      "Ask your utility about dedicated EV charging rates or charging rebates",
      "Use scheduled or smart charging to automatically target the cheapest rate windows",
      "Lean on public DC fast charging mainly for road trips, not daily top-ups",
    ],
  },
];

const sources: ContentSource[] = [
  { label: "Coltura — EV vs Gas Calculator", url: "https://coltura.org/ev-vs-gas-calculator/" },
  { label: "U.S. DOE Alternative Fuels Data Center — Reducing EV Costs", url: "https://afdc.energy.gov/vehicles/electric" },
  { label: "Consumer Reports — EV Ownership Cost Study", url: "https://www.consumerreports.org/cars/hybrids-evs/evs-offer-big-savings-over-traditional-gas-powered-cars-a7820795671/" },
];

const gallery: ContentShot[] = [
  { src: financialSavings, caption: "Lower lifetime cost of ownership" },
  { src: evSavings, caption: "Cheaper fuel per mile" },
  { src: evFamily, caption: "Fewer parts, lower maintenance" },
  { src: evCharging, caption: "Cheaper charging at home" },
];

const video = { youtubeId: "g-Qk07feExU", title: "Cheaper over time: EVs versus gas-powered vehicles" };

const FinancialSavings = () => (
  <ContentPageLayout
    badge="EV 101 · Savings"
    kicker="EV 101 · Field Brief"
    title="Financial"
    highlight="Savings"
    intro="Going electric saves money in two big ways: cheaper fuel per mile and far lower maintenance. Over a vehicle's lifetime those savings add up to thousands of dollars — and the more you drive, the more you save."
    pullQuote="Over its lifetime, an EV can save a typical driver thousands versus gas — on fuel and maintenance alone."
    heroImage={financialSavings}
    icon={DollarSign}
    stats={stats}
    sections={sections}
    gallery={gallery}
    video={video}
    sources={sources}
  />
);

export default FinancialSavings;
