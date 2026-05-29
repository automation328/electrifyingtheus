import { Leaf } from "lucide-react";
import ContentPageLayout, { type ContentSection, type ContentStat, type ContentSource, type ContentShot } from "@/components/ContentPageLayout";
import reducedEmissions from "@/assets/reduced-emissions.jpg";
import sustainableAviation from "@/assets/sustainable-aviation.jpg";
import maritime from "@/assets/maritime.jpg";
import micromobility from "@/assets/micromobility.jpg";

const stats: ContentStat[] = [
  { value: "Zero", label: "Direct tailpipe emissions from an all-electric vehicle" },
  { value: "~60%", label: "Lower lifecycle greenhouse gases than the average new gasoline car" },
  { value: "All 50", label: "U.S. states where a typical EV beats the average gas car on emissions" },
  { value: "1-2 yrs", label: "Typical driving payback for the extra emissions of battery manufacturing" },
];

const sections: ContentSection[] = [
  {
    heading: "Zero tailpipe emissions and cleaner local air",
    body: [
      "All-electric vehicles produce zero direct emissions. There is no tailpipe, so they release no carbon dioxide, no nitrogen oxides, and no particulate matter as you drive. Plug-in hybrids produce zero direct emissions when running in all-electric mode, and only switch to tailpipe emissions once the internal combustion engine engages.",
      "Because conventional cars and trucks emit pollutants right at street level, removing the tailpipe matters most where people actually breathe. Shifting drivers to EVs reduces the smog-forming and toxic pollutants that concentrate along busy roads, near schools, and in dense neighborhoods, which improves local air quality and public health.",
    ],
    list: [
      "Carbon dioxide, the primary greenhouse gas tied to climate change",
      "Nitrogen oxides, which form smog and ground-level ozone",
      "Fine particulate matter linked to asthma and heart and lung disease",
      "Unburned hydrocarbons and other volatile organic compounds",
      "Carbon monoxide from incomplete fuel combustion",
    ],
  },
  {
    heading: "Looking beyond the tailpipe: well-to-wheel emissions",
    body: [
      "Tailpipe emissions are only one factor in a vehicle's true environmental footprint. A fair comparison uses life cycle emissions, which the U.S. Department of Energy breaks into fuel-cycle emissions, often called well-to-wheel, and vehicle-cycle emissions from building and disposing of the vehicle itself.",
      "Well-to-wheel emissions capture everything it takes to move the car a mile. For a gasoline vehicle that means extracting crude oil, refining it into fuel, and distributing it, plus the tailpipe emissions of burning it. For an EV it means the emissions created when generating the electricity used to charge the battery. Counting these upstream steps gives an apples-to-apples comparison instead of crediting EVs with an unrealistic zero.",
    ],
  },
  {
    heading: "The electricity grid mix shapes EV emissions",
    body: [
      "An EV is only as clean as the power that charges it, so its life cycle emissions depend on the local electricity generation mix. In regions that rely on low-emission sources such as hydro, nuclear, wind, and solar, all-electric vehicles and plug-in hybrids have an especially large life cycle emissions advantage over comparable gasoline or diesel vehicles.",
      "In areas with higher-emission electricity, often coal-heavy grids, the benefit is smaller, though still meaningful in most cases. The encouraging trend is that the U.S. grid keeps getting cleaner as coal plants retire and wind and solar capacity grows, which means the same EV charged today will be responsible for fewer emissions every year it stays on the road.",
    ],
    list: [
      "The share of coal, natural gas, nuclear, and renewables on the regional grid",
      "Time-of-day charging, since overnight and midday mixes can differ",
      "Transmission and charging losses between the power plant and the battery",
      "The efficiency of the specific EV in miles per kilowatt-hour",
    ],
  },
  {
    heading: "EVs are cleaner across nearly every U.S. region",
    body: [
      "Even after accounting for the power plants behind the plug, driving on electricity produces fewer greenhouse gas emissions than driving on gasoline in the vast majority of the country. Analyses from the Department of Energy and the EPA find that a typical electric vehicle beats the average new gasoline car on lifecycle emissions in all 50 states, including those with the most fossil-heavy grids.",
      "Tools like the fueleconomy.gov Beyond Tailpipe Emissions Calculator let you compare a specific EV against a gasoline model using the actual generation mix for your ZIP code, so you can see the real upstream picture where you live rather than relying on a single national average.",
    ],
  },
  {
    heading: "Battery manufacturing emissions and the payback over a vehicle's life",
    body: [
      "Building an EV, and especially its battery, produces more emissions up front than building a comparable gasoline car. The Department of Energy includes these vehicle-cycle emissions, from raw-material mining through battery production, recycling, and disposal, in its cradle-to-grave accounting so the manufacturing footprint is not ignored.",
      "That early carbon debt is repaid quickly. Because an EV emits so much less while driving, it typically erases the extra manufacturing emissions within the first year or two of normal use, then keeps pulling ahead for the rest of its life. Expanding battery recycling and cleaner manufacturing continue to shrink that initial footprint.",
    ],
  },
  {
    heading: "Charging with renewables drives emissions toward zero",
    body: [
      "Drivers can take direct control of their EV emissions by choosing where the electricity comes from. Pairing an EV with rooftop solar, a community solar subscription, or a utility green-power plan can cut charging emissions close to zero, turning the car into a genuinely near-zero way to get around.",
      "Charging at home overnight or during sunny midday hours can also tap into a cleaner slice of the grid, and as utilities add more wind and solar, every EV on the system automatically gets greener without the owner doing anything at all.",
    ],
  },
];

const sources: ContentSource[] = [
  { label: "U.S. DOE Alternative Fuels Data Center — Electricity Vehicle Emissions", url: "https://afdc.energy.gov/vehicles/electric_emissions.html" },
  { label: "U.S. DOE & EPA fueleconomy.gov — Beyond Tailpipe Emissions Calculator", url: "https://www.fueleconomy.gov/feg/Find.do?action=bt1" },
  { label: "U.S. EPA — Electric Vehicle Myths", url: "https://www.epa.gov/greenvehicles/electric-vehicle-myths" },
];

const gallery: ContentShot[] = [
  { src: reducedEmissions, caption: "Zero tailpipe emissions on the road" },
  { src: sustainableAviation, caption: "Cleaner fuels for low-carbon flight" },
  { src: maritime, caption: "Electrifying ports and shipping lanes" },
  { src: micromobility, caption: "Clean mobility for short urban trips" },
];

const video = { youtubeId: "M69GBL0IDzI", title: "Energy 101: Electric Vehicles" };

const ReducedEmissions = () => (
  <ContentPageLayout
    badge="EV 101 · Emissions"
    kicker="EV 101 · Field Brief"
    title="Reduced"
    highlight="Emissions"
    intro="Electric vehicles eliminate tailpipe pollution entirely and, even after accounting for the power that charges them, produce far fewer lifecycle greenhouse gas emissions than gasoline cars. As the grid keeps getting cleaner, every EV on the road gets greener over time."
    pullQuote="With zero tailpipe emissions and a grid that cleans up every year, EVs cut lifetime pollution and clear the air we breathe."
    heroImage={reducedEmissions}
    icon={Leaf}
    stats={stats}
    sections={sections}
    gallery={gallery}
    video={video}
    sources={sources}
  />
);

export default ReducedEmissions;
