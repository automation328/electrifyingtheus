import { Snowflake } from "lucide-react";
import ContentPageLayout, { type ContentSection, type ContentStat, type ContentSource, type ContentShot } from "@/components/ContentPageLayout";
import evWinter from "@/assets/ev-winter.jpg";
import evFamily from "@/assets/ev-family.jpg";
import evCharging from "@/assets/ev-charging.jpg";
import rideshareFleet from "@/assets/rideshare-fleet.jpg";

const stats: ContentStat[] = [
  { value: "10-30%", label: "Typical range loss in deep cold, mostly from cabin heating" },
  { value: "Up to ~2x", label: "Heat-pump efficiency vs. a resistive heater in cold weather" },
  { value: "Instant", label: "Torque and traction control that meters wheel slip on snow and ice" },
  { value: "~3,500-4,000 lb+", label: "Battery-packed weight that lowers the center of gravity for stability" },
];

const sections: ContentSection[] = [
  {
    heading: "The cold-weather range reality",
    body: [
      "Every vehicle works harder in winter, and EVs are no exception. In deep cold you can expect roughly a 10 to 30 percent drop in driving range, with the worst losses showing up on short trips that never let the cabin and battery fully warm up. This is real, but it is also predictable and manageable once you understand what is happening.",
      "Most of the loss is not the battery itself failing. It is the energy spent heating the cabin and the battery pack. A gas car dumps waste engine heat into the cabin for free, while an EV has to make that heat from stored electricity. Cold also slows the chemical reactions inside the battery, which temporarily reduces both available capacity and how fast it can take a charge.",
      "The practical takeaway: plan a little extra buffer on cold days, charge a bit more often, and lean on the cold-weather tools your EV already has. Range recovers fully once temperatures climb back up. Nothing about the cold permanently harms a healthy pack.",
    ],
  },
  {
    heading: "Preconditioning and heat pumps",
    body: [
      "Preconditioning is the single most effective winter habit for an EV owner. While the car is still plugged in, you warm the cabin and the battery using grid power instead of range. You leave with a defrosted windshield, a comfortable cabin, and a battery already at an efficient operating temperature, so far less of your stored energy gets burned on heat once you are driving.",
      "Schedule preconditioning for your departure time in the app or on the dash, especially before your morning commute and before a fast-charging stop. Warming the pack on the way to a charger lets it accept power faster and shortens the session.",
      "Many newer EVs use a heat pump rather than a simple resistive heater. A heat pump moves ambient heat instead of generating it from scratch, and in cold conditions it can be roughly twice as efficient at warming the cabin. If your EV has one, you will notice a smaller winter range hit. Either way, heated seats and a heated steering wheel warm you directly and draw far less energy than blasting the cabin air, so use them first.",
    ],
  },
  {
    heading: "Traction, weight and instant torque on snow and ice",
    body: [
      "EVs have some genuine winter advantages. The battery pack sits low in the floor, giving a low center of gravity and balanced front-to-rear weight that helps the car stay planted and resist body roll in slippery corners.",
      "Electric motors also respond instantly and precisely, so the traction and stability systems can meter torque to a slipping wheel in milliseconds, far faster than a combustion drivetrain. Many EVs are available with all-wheel drive using two motors, adding grip on steep or snow-covered roads.",
      "None of this replaces good winter tires. Tires are still what actually grip the road, and a dedicated set of winter tires will outperform all-seasons on snow and ice regardless of how clever the drivetrain is. Be smooth with the accelerator: instant torque can spin tires on ice if you stomp on it, so ease into the throttle on slick surfaces.",
    ],
  },
  {
    heading: "Regenerative braking in the snow",
    body: [
      "Regenerative braking recovers energy by using the motor to slow the car, but in cold weather it behaves differently and you should plan for it. When the battery is very cold it cannot accept a charge quickly, so the car temporarily limits or disables regen until the pack warms up. You may feel the usual one-pedal deceleration is weaker than normal at first.",
      "Strong regen on a single driven axle can also unsettle the car on snow or ice, much like braking too hard. On slippery surfaces, reduce aggressive one-pedal driving, lower the regen setting if your EV allows it, and let the car coast and slow more gently. Preconditioning warms the pack and restores normal regen behavior sooner.",
    ],
  },
  {
    heading: "Prepare your vehicle: a winter checklist",
    body: [
      "NHTSA stresses that planning and preventative maintenance matter most in winter. Get your vehicle serviced before the cold sets in and run through the basics so you are not caught out by the first storm.",
    ],
    list: [
      "Battery: cold weather reduces battery power. Have the 12-volt battery and the high-voltage system checked, and keep the EV plugged in when parked in extreme cold so the pack can keep itself conditioned.",
      "Tires: check tread depth and keep pressure at the recommended level, since cold air lowers tire pressure. Consider dedicated winter or snow tires if you live where it snows.",
      "Lights and wipers: make sure all lights work so you can see and be seen, replace worn wiper blades, and top off washer fluid with a winter-rated, freeze-resistant formula.",
      "Visibility: keep the windshield, windows, mirrors, lights and the entire roof cleared of snow and ice before you drive.",
      "Emergency kit: pack a blanket, extra warm clothing and gloves, a flashlight, a phone charger, jumper cables, a snow brush and ice scraper, a small shovel, sand or cat litter for traction, water and snacks, and a first-aid kit.",
      "Floor mats: make sure mats are the correct size and properly secured so they cannot slide forward and interfere with the pedals.",
    ],
  },
  {
    heading: "Driving safely in winter weather",
    body: [
      "Once the basics are covered, how you drive matters most. NHTSA's core guidance for snow and ice is to slow down and give yourself room, because it takes longer to control or stop any vehicle on a slippery road.",
    ],
    list: [
      "Slow down and accelerate, brake and steer gently and gradually to keep the tires from breaking traction.",
      "Increase your following distance so you have plenty of time and space to stop for vehicles ahead.",
      "Do not use cruise control on snow, ice or wet roads, where you need full manual control of throttle and braking.",
      "Do not crowd a snow plow or drive beside it. Plows move slowly, make wide turns and stop often, so stay well behind and pass with caution.",
      "Know your car: understand how your antilock brakes and electronic stability control behave, and stay calm and steer where you want to go if the vehicle begins to skid.",
      "Be extra cautious on bridges, overpasses and shaded areas, which freeze first and stay icy longest.",
    ],
  },
  {
    heading: "Charging in the cold and what to do if you are stranded",
    body: [
      "Cold batteries charge more slowly, so expect fast-charging sessions to take longer when the pack is chilly. Precondition the battery on your way to a charger to speed things up, and on long winter trips plan charging stops with a little more margin than you would in summer. Day to day, charging at home overnight while plugged in keeps the pack conditioned and ready.",
      "If you become stopped or stranded, NHTSA advises staying focused on yourself, your passengers, your car and your surroundings. An EV is a real advantage here: with a charged battery you can run the heater and keep the cabin warm without idling an engine or worrying about exhaust fumes, and heated seats stretch that warmth even further on limited energy.",
    ],
    list: [
      "Stay with your vehicle unless help is clearly visible and within close walking distance. It provides shelter and makes you easier to find.",
      "Make yourself visible: tie a bright cloth to the antenna or a window and turn on hazard lights or an interior light when help may be near.",
      "Use the heater in measured bursts to stay warm while conserving battery, and bundle up with the blankets and warm clothing from your emergency kit.",
      "Call for help and share your location, route and expected arrival time with someone before you set out so others know where you are.",
      "Keep an exhaust pipe clear of snow if you are in a gas vehicle. EVs have no exhaust, removing the carbon monoxide risk while you wait.",
    ],
  },
];

const sources: ContentSource[] = [
  { label: "NHTSA — Winter Driving Tips", url: "https://www.nhtsa.gov/winter-driving-tips" },
  { label: "U.S. DOE Alternative Fuels Data Center — Maintaining EVs in Cold Weather", url: "https://afdc.energy.gov/vehicles/electric-maintenance" },
  { label: "fueleconomy.gov — EVs in Cold Weather", url: "https://www.fueleconomy.gov/feg/coldweatherEV.shtml" },
];

const gallery: ContentShot[] = [
  { src: evWinter, caption: "Range dips, confidence holds in deep cold" },
  { src: evFamily, caption: "Precondition while plugged in before departure" },
  { src: evCharging, caption: "Warm the pack for faster cold charging" },
  { src: rideshareFleet, caption: "Low battery weight aids snow traction" },
];

const video = {
  youtubeId: "6LWL90paufE",
  title: "Electric car real-world WINTER range test – FULL RESULTS | Tesla Model Y vs Rivals | What Car?",
};

const EvsInWinter = () => (
  <ContentPageLayout
    badge="EV 101 · Winter"
    kicker="EV 101 · Field Brief"
    pullQuote="The notion that EVs can't handle winter is a myth: a low battery and instant traction make them some of the most planted cars on snow."
    title="EVs in"
    highlight="Winter"
    intro="The idea that EVs cannot handle winter is a myth. They lose some range in deep cold, just as gas cars lose fuel economy, but a low battery, instant traction control, and the ability to warm up while plugged in make a well-prepared EV one of the most confident cars on a snowy road."
    heroImage={evWinter}
    icon={Snowflake}
    stats={stats}
    sections={sections}
    sources={sources}
    gallery={gallery}
    video={video}
  />
);

export default EvsInWinter;
