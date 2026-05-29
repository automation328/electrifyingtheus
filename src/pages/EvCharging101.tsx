import { BatteryCharging } from "lucide-react";
import ContentPageLayout, { type ContentSection, type ContentStat, type ContentSource, type ContentShot } from "@/components/ContentPageLayout";
import evCharging from "@/assets/ev-charging.jpg";
import evFamily from "@/assets/ev-family.jpg";
import rideshareFleet from "@/assets/rideshare-fleet.jpg";
import micromobility from "@/assets/micromobility.jpg";

const gallery: ContentShot[] = [
  { src: evCharging, caption: "DC fast charging on a road trip" },
  { src: evFamily, caption: "Level 2 home charging overnight" },
  { src: rideshareFleet, caption: "Public fast chargers for fleets" },
  { src: micromobility, caption: "J1772 and NACS connectors" },
];

const video = { youtubeId: "CSBvg7NSz4I", title: "Level 1, Level 2, & DC Fast Charging Explained" };

const stats: ContentStat[] = [
  { value: "200K+", label: "Public charging ports across the U.S. and growing every quarter" },
  { value: "80%", label: "Typical charge added at a DC fast charger before the speed tapers" },
  { value: "~25 mi", label: "Range added per hour of charging on a typical Level 2 unit" },
  { value: "500K", label: "Public and private chargers targeted nationwide by 2030" },
];

const sections: ContentSection[] = [
  {
    heading: "The three charging levels",
    body: [
      "EV charging is grouped into three levels based on how much power they deliver. Level 1 and Level 2 supply alternating current (AC) that the car converts on board, while DC fast charging delivers direct current straight to the battery for much faster fill-ups.",
      "Higher power means faster charging, but it also requires different equipment. Most everyday charging happens slowly and overnight at the lowest two levels, with fast charging reserved for road trips and quick top-ups.",
    ],
    list: [
      "Level 1: a standard 120-volt household outlet at about 1.9 kW, adding roughly 5 miles of range per hour. No special equipment needed, but slow.",
      "Level 2: 240-volt (home) or 208-volt (commercial) at roughly 2.9 to 19.2 kW, adding about 25 miles of range per hour. The workhorse of home, workplace, and public charging.",
      "DC fast charging (Level 3): high-power direct current up to 500 kW, adding roughly 100 to 200+ miles of range in 30 minutes. Built for highways and quick stops.",
    ],
  },
  {
    heading: "Connector and plug types",
    body: [
      "EV plugs are not all the same, but adapters and a shift toward a common standard are making compatibility much simpler. Level 1 and Level 2 charging across nearly all non-Tesla EVs in North America uses the same J1772 plug.",
      "For fast charging, the connector you need depends on the vehicle, though the industry is converging on the North American Charging Standard (NACS, standardized as SAE J3400).",
    ],
    list: [
      "J1772: the standard AC plug for Level 1 and Level 2 charging on most EVs sold in North America.",
      "CCS (Combined Charging System): adds two DC pins below the J1772 plug; the prevailing DC fast charging standard for most non-Tesla models.",
      "NACS / J3400: Tesla's connector, now an open standard that most major automakers have committed to adopting, handling both AC and DC charging.",
      "CHAdeMO: an older DC fast charging connector used mainly by some Japanese models; increasingly being phased out.",
      "Adapters: Tesla vehicles include adapters for CCS or CHAdeMO, and CCS drivers can buy NACS adapters to use Tesla Superchargers.",
    ],
  },
  {
    heading: "Charging at home",
    body: [
      "For most drivers, home is where the vast majority of charging happens. Plug in when you get home, and you wake up to a full battery every morning without ever visiting a station.",
      "A Level 1 cordset plugs into a regular wall outlet and works fine for plug-in hybrids or low-mileage drivers. Many owners install a Level 2 unit on a 240-volt circuit, the same kind a clothes dryer uses, to recharge a typical battery overnight. Installation costs vary, but rebates from utilities and governments often offset a large share.",
    ],
  },
  {
    heading: "Public and workplace charging",
    body: [
      "Away from home, Level 2 chargers at workplaces, shopping centers, hotels, and parking garages let you top up while you go about your day. DC fast chargers along highways and at travel plazas handle longer trips where you need range quickly.",
      "The national network is expanding rapidly. The federal National Electric Vehicle Infrastructure (NEVI) program and related grants are funding a backbone of fast chargers along major corridors, part of a national goal of 500,000 public and private chargers by 2030. The U.S. has already surpassed 200,000 public charging ports, with DC fast charging ports among the fastest-growing categories.",
    ],
  },
  {
    heading: "Finding a charger and planning trips",
    body: [
      "Locating a charger is easier than ever. The U.S. Department of Energy's Alternative Fueling Station Locator maps tens of thousands of stations across the United States and Canada, letting you filter by connector type, charging level, and network.",
      "Most EVs and charging networks also offer apps and in-dash route planners that find chargers along your route, show real-time availability, and account for your battery level. For road trips, plan stops around fast chargers and aim to charge to roughly 80 percent, since charging slows considerably beyond that point.",
    ],
  },
  {
    heading: "Costs, etiquette, and battery health",
    body: [
      "Charging at home is typically far cheaper per mile than gasoline, and many utilities offer lower overnight rates that make it cheaper still. Public Level 2 charging is often inexpensive or free, while DC fast charging costs more for the convenience and speed.",
      "Good charging habits help everyone. Move your car once it is charged so others can use the spot, do not unplug someone else's vehicle, and avoid parking in charging spaces if you are not actively charging.",
      "For long battery life, daily charging to about 80 percent and avoiding frequent deep discharges is gentler on the battery. Reserve charging to 100 percent for days you need maximum range, and lean on slower home charging rather than fast charging for everyday use.",
    ],
  },
];

const sources: ContentSource[] = [
  { label: "U.S. DOE Alternative Fuels Data Center — Electric Vehicle Charging Stations", url: "https://afdc.energy.gov/stations" },
  { label: "AFDC — Electric Vehicle Charging Levels, Speeds, and Connectors", url: "https://afdc.energy.gov/fuels/electricity-stations" },
  { label: "AFDC — Electric Vehicle Charging Infrastructure Trends", url: "https://afdc.energy.gov/fuels/electricity-infrastructure-trends" },
];

const EvCharging101 = () => (
  <ContentPageLayout
    badge="EV 101 · Charging"
    kicker="EV 101 · Field Brief"
    title="EV Charging"
    highlight="101"
    intro="Charging an EV is simpler than most people expect: plug in at home overnight, top up while you run errands, and fast-charge on road trips. Here is how the levels, plugs, and the growing national network all fit together."
    pullQuote="Charging an EV is easier than people think: most of it happens overnight at home while you sleep."
    heroImage={evCharging}
    icon={BatteryCharging}
    stats={stats}
    sections={sections}
    gallery={gallery}
    video={video}
    sources={sources}
  />
);

export default EvCharging101;
