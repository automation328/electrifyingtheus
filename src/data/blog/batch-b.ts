import type { BlogPost } from "@/data/blog-posts";
import evSafety from "@/assets/ev-safety.jpg";
import evFamily from "@/assets/ev-family.jpg";
import heroBg from "@/assets/hero-bg.jpg";
import evSavings from "@/assets/ev-savings.jpg";
import evCharging from "@/assets/ev-charging.jpg";

export const BLOG_BATCH_B: BlogPost[] = [
  {
    slug: "install-level-2-home-charger-steps-permits-costs",
    title: "How to Install a Level 2 Home Charger: Steps, Permits and Planning",
    excerpt:
      "A practical walkthrough of adding a 240-volt home charger: checking your panel, choosing a unit, hiring a licensed electrician, handling permits and looking for utility rebates.",
    category: "Charging",
    date: "November 28, 2026",
    author: "Electrifying the US",
    readTime: "5 min read",
    image: evSafety,
    content: `> **Key takeaway:** A Level 2 home charger is a 240-volt circuit installed by a licensed electrician, usually with a permit. Total cost depends mostly on your electrical panel and how far the charger sits from it, so get a written quote before you buy anything.

Most EV owners do the bulk of their charging at home, and a Level 2 charger is the upgrade that makes that easy. If you are new to the terminology, read [EV Charging 101](/blog/charging-101-levels) first. This guide covers what happens after you decide to install one.

## Step 1: Check Whether You Need One

Many drivers get by on a standard household outlet (Level 1) because they drive modest distances each day. Add up your typical daily miles and compare them with how many miles you gain overnight. If you regularly come up short, or you want flexibility for longer days, Level 2 is worth it. Your car's manual lists the charging speeds it supports.

## Step 2: Look at Your Electrical Panel

Your electrician will check three things:

- **Spare capacity.** A Level 2 charger is a large, continuous load. The panel and service need enough headroom to carry it alongside your oven, dryer, heating and cooling.
- **Open breaker space.** The charger needs a dedicated two-pole breaker.
- **Distance.** The farther the charger is from the panel, the more wire and labor the job takes.

If the panel is full or the service is small, the electrician may suggest a panel upgrade. Some chargers can also share or limit power automatically, which can avoid an upgrade in some homes. Ask about it.

## Step 3: Choose a Charger

You will see two common styles. A **hardwired** unit is wired directly into the circuit. A **plug-in** unit connects to a 240-volt outlet, typically a NEMA 14-50. Hardwired is often considered the more robust option, while plug-in offers some flexibility. Your electrician can tell you which suits your setup.

When comparing models, look at:

- **Amperage.** Higher amperage charges faster, but your car has a maximum it can accept, and a faster charger needs a bigger circuit.
- **Connector.** Many automakers have moved to the NACS connector (standardized as SAE J3400), while older non-Tesla models use J1772. Check which your car uses and whether an adapter is needed.
- **Safety listing.** Look for a recognized safety certification, such as a UL listing.
- **Features.** Wi-Fi, scheduling and usage tracking are handy, especially if you use time-of-use rates (see our guide to [off-peak charging](/blog/time-of-use-rates-ev-charging-off-peak-savings)). Your car may also schedule charging on its own.
- **Cable length and weather rating,** especially for outdoor or driveway installs.

## Step 4: Find a Licensed Electrician

Hire a licensed, insured electrician with EV charger experience. Ask them for:

- A written, itemized quote that covers the breaker, wire, outlet or hardwiring, labor, permit fees and any panel work
- Confirmation that they will pull the permit and schedule the inspection
- Proof of licensing, which you can usually verify on your state's licensing website

Get at least two or three quotes. Prices vary widely depending on your home, so compare scope, not just the bottom line. Some utilities and charger makers also keep lists of qualified installers.

## Step 5: Permits and Inspections

Most jurisdictions require an electrical permit for a new 240-volt circuit, and an inspector may check the work afterward. Requirements differ by city and county, so ask your electrician or your local building department. If you rent or belong to an HOA or condo association, get written approval first. Our guide to [charging when you rent](/blog/charging-an-ev-when-you-rent-or-live-in-an-apartment) covers that conversation.

## Step 6: Check for Rebates

The federal tax credits for EVs and for home chargers have ended, so do not count on them. Today, help more often comes from states, utilities and local programs, and it can include rebates on charger hardware, installation or special EV rates. Programs change, and some require you to apply before you buy. Start with our [rebates and incentives page](/rebates-incentives), then confirm details with your utility.

## What Installation Day Looks Like

Many installs finish in a few hours when the panel is close and has room. The electrician mounts the charger or outlet, runs the wire, connects the breaker, tests the circuit and walks you through using it. The inspection, if required, may come later.

Before you plug in for the first time, set up the charger's app if it has one, confirm your charge limit in the car, and think about a charging schedule that fits your utility's rates.

## Safety Basics

- Never use a damaged cable or extension cord for EV charging.
- Keep the connector clean and dry, and hang the cable up off the ground.
- If a breaker trips repeatedly or a plug feels hot, stop and call your electrician.

## Frequently Asked Questions

### Can I install a Level 2 charger myself?

Unless you are a licensed electrician, hire one. A 240-volt circuit carries a serious shock and fire risk, and many areas require licensed work and a permit. A professional install also protects your home insurance and warranty.

### Do I need a new electrical panel?

Not always. Many homes have enough capacity, and some chargers can limit their draw to fit. An electrician's load assessment will tell you for certain.

### How long does it take to charge on Level 2?

It depends on your car's battery, its onboard charger and the charger's amperage. Many drivers add a full day's driving overnight. Check your car's manual for its maximum rate.

### Will my utility help pay?

Some do. Utility and state programs vary widely and change often, so check your utility's website and our [rebates page](/rebates-incentives).

**Ready to see what charging at home could save? Try the [gas vs. electricity cost calculator](/electricity-vs-gasoline) and read our [real cost of going electric](/blog/real-cost-of-going-electric-ev-savings-breakdown) breakdown.**`,
  },
  {
    slug: "charging-an-ev-when-you-rent-or-live-in-an-apartment",
    title: "Charging an EV When You Rent or Live in an Apartment",
    excerpt:
      "No garage, no problem for many renters. Learn how to combine workplace, public and Level 1 charging, talk to your landlord, and check whether your state has right-to-charge protections.",
    category: "Charging",
    date: "November 28, 2026",
    author: "Electrifying the US",
    readTime: "5 min read",
    image: evFamily,
    content: `> **Key takeaway:** You can own an EV without a home charger. Many renters build a routine around workplace, public and occasional Level 1 charging, and some states protect a tenant's right to request charging. Check your state and your lease.

"I rent, so an EV will not work for me" is one of the most common worries we hear. It is a fair concern, because charging at home is the cheapest and most convenient option. But plenty of renters make it work, and more apartment buildings are adding chargers every year.

## Start With Your Real Driving

Before worrying about plugs, count your miles. Many people drive well under what a full battery provides in a day. If you drive modest distances, you may only need to charge once or twice a week. That changes the question from "where do I plug in every night?" to "where do I plug in a couple of times a week?"

## Your Charging Options

### 1. Level 1 on a standard outlet

If you have a dedicated parking spot near an outlet, the cord that comes with many EVs plugs into a regular 120-volt outlet. It is slow, but overnight it can recover a useful amount of driving. Ask before you plug in. An outlet in a shared area may be on someone else's meter, and an extension cord is not a safe workaround for a long, continuous load.

### 2. Workplace charging

Some employers offer chargers, sometimes free or at a low rate. If yours does not, ask. Facilities teams sometimes respond to requests, especially if several employees ask. Parking for eight hours on even a slower charger can add plenty of miles.

### 3. Public Level 2 and DC fast charging

Chargers at grocery stores, libraries, parking garages and shopping centers work well if you can build charging into a routine stop. DC fast chargers are quicker but usually cost more per kWh than home charging. Use our [charger finder](/find-a-charger) to see what is near your home, work and regular errands, and read [Public EV Charging Explained](/blog/public-ev-charging-explained-networks-apps-plugs) for how the networks work.

### 4. Charging at the building

Ask your landlord or property manager about adding chargers. Many owners are open to it when tenants ask, especially in markets where EV drivers are a growing share of renters.

## Talking to Your Landlord or HOA

A good request is specific and easy to say yes to. Consider:

- **Naming the options.** A shared charger for all residents, a charger at your assigned space, or simply permission to install one at your own cost.
- **Offering to cover costs.** Many tenants offer to pay for the install and for their own electricity use, ideally through a separate meter or a charger that tracks usage.
- **Proposing licensed work.** A licensed electrician and any required permits protect the owner.
- **Getting it in writing.** Add the agreement to your lease or as an addendum, including what happens to the charger when you move out.

Utility and state programs sometimes support charging at multi-unit buildings, so ask your utility and check our [rebates and incentives page](/rebates-incentives). Programs vary and change, and the federal home charger credit has ended.

## Right-to-Charge Laws

Some states have laws that limit a landlord's, condo association's or HOA's ability to refuse a reasonable request to install a charger. The details differ a great deal: who pays, what insurance is required, which kinds of housing are covered, and whether renters are included. **Check your state**, and read your lease or community rules. If you are unsure, your state's consumer protection or housing agency can point you in the right direction.

## Costs to Expect

Public charging prices vary by network, location and time of day, and fast charging usually costs more than charging at home. Some utilities offer lower rates at off-peak hours, which can matter if you charge at a building with its own meter. To compare your options with gasoline, use our [cost calculator](/electricity-vs-gasoline) with your local rates.

## A Sample Weekly Routine

Here is how a renter with a moderate commute might work it out:

- Top up at work on a couple of days a week
- Add a Level 2 session while shopping
- Use a fast charger once in a while when running low
- Keep the battery between a comfortable low and high point rather than chasing 100 percent

Your own pattern will differ, so test it for a few weeks before you commit.

## Before You Buy or Lease

Test the routine in advance. Map the chargers near you with the [charger finder](/find-a-charger), visit them at the hours you would use them, and look at used and new listings in the [marketplace](/marketplace) once you know your needs.

## Frequently Asked Questions

### Can I really own an EV without home charging?

Yes, many people do. It takes a little planning, and it works best when you have a reliable workplace or nearby public charger.

### Is it safe to use an extension cord?

Avoid it for regular charging. EV charging is a long, heavy load. Use a properly rated outlet or a charger installed by a licensed electrician.

### What if my landlord says no?

Ask whether they will reconsider a plan that you pay for, or look to nearby chargers. Also check whether your state protects tenants who request charging.

### Does apartment charging cost more?

It can, especially if you rely on DC fast charging. Costs depend on your local rates and the networks near you.

**Want to see if an EV fits your life? Browse the [charger map](/find-a-charger) and compare costs with the [gas vs. electricity calculator](/electricity-vs-gasoline).**`,
  },
  {
    slug: "plan-your-first-ev-road-trip",
    title: "Planning Your First EV Road Trip: A Simple Checklist",
    excerpt:
      "Road trips in an EV are easy with a little planning. Use route planners, pick charging stops with a buffer, prepare for cold weather and follow basic charging etiquette.",
    category: "Ownership",
    date: "November 28, 2026",
    author: "Electrifying the US",
    readTime: "5 min read",
    image: heroBg,
    content: `> **Key takeaway:** An EV road trip comes down to knowing where you will charge, arriving with a buffer and leaving when you have enough to reach the next stop. A route planner does most of the math for you.

Long trips are the moment many new EV drivers worry about most. The good news is that the process is simple once you have done it once. You stop for a break, plug in, and drive on. Here is how to prepare.

## Before You Go

### Use a route planner

Your car's built-in navigation may plan charging stops automatically. Third-party route planners and charger apps can also map a trip using your model's range and charging speed. Compare them if you can, and check the chargers they pick against the [charger finder](/find-a-charger) and our [range map](/range-map).

A good planner considers your starting battery level, elevation, speed and temperature, but it is still an estimate. Treat it as a first draft.

### Check your charging access

Many newer EVs from non-Tesla brands can use Tesla Superchargers, some with an adapter. Most automakers have adopted the NACS connector, standardized as SAE J3400. Access, adapters and speeds vary by model and year, so **check your model** with your automaker before the trip. If your car uses the older CCS connector, the fast chargers on major corridors are still widely available.

For more on the networks and plugs, see [Public EV Charging Explained](/blog/public-ev-charging-explained-networks-apps-plugs).

### Set up accounts and payment

Create accounts on the networks along your route before you leave, add a payment method and download the apps. Some chargers accept a credit card tap, and some start automatically through the car, but others need the app. Doing this at home beats trying it on a rainy roadside with one bar of signal.

## Planning the Stops

- **Plan for a buffer.** Aim to arrive at each charger with a comfortable reserve rather than running near empty. Having more than you think you need protects you from a broken charger, traffic or a detour.
- **Charge for the next leg, not to 100 percent.** DC fast charging is usually quickest at a lower state of charge and slows as the battery fills. Stopping more often for shorter sessions can save time overall, though your car's behavior will vary.
- **Pick backups.** Note a second charger within reach of each stop in case the first is busy or offline.
- **Choose stops with amenities.** Restrooms, food and lighting make a 20- to 40-minute stop pleasant, and safer at night.
- **Use real-time information.** Charger apps often show whether a station is working or occupied, and recent driver comments can flag problems.

## Cold Weather and Other Range Factors

Range drops in cold weather, at high highway speeds, when towing and when climbing steep grades. Plan more conservative stops in those conditions. Preconditioning the battery before a fast charge, which many cars do automatically when you navigate to a charger, can speed things up in the cold. Our [winter driving guide](/blog/ev-cold-weather-winter-range-myths-vs-reality) goes deeper.

## Pack for the Trip

- The mobile charging cable that came with your car
- Any adapter your model needs
- Your charging apps, logged in
- A phone mount and charger cable
- Basic emergency items, as you would for any long drive

Check tire pressure too. Under-inflated tires reduce efficiency in any vehicle.

## Charging Etiquette

A few habits keep things running smoothly at busy stations:

- **Move your car when you finish.** Many stations charge idle fees, and others are waiting.
- **Do not park in a charging space if you are not charging.** The same goes for gas-powered cars.
- **Do not unplug someone else's car** unless it is clearly done and the network allows it.
- **Leave the cable neat,** and report broken equipment to the network.
- **Be kind about sharing.** If a pair of chargers share power, a quick chat can sort out who should plug in where.
- **Stay near your car** or watch the app for your session to finish.

## What If a Charger Is Broken?

It happens occasionally. This is why backups matter. Check the app, try another stall, or head for your backup. Report the issue to the network so it can be repaired.

## Enjoy the Stop

Many drivers find they like the pause. Stretch, eat, walk around and plan the next leg. Over time, you learn your car's pace, and routes begin to feel routine.

## Frequently Asked Questions

### How far can I go between stops?

It depends on your car, speed, weather and load. Your planner uses your model's data, but always leave a buffer.

### Do I have to charge to 100 percent on a trip?

Usually not. Charging for the next leg is often faster. Follow your car's guidance for how much to charge.

### What if I cannot find a charger?

Use more than one app, keep a backup stop in mind and start looking before your battery gets low. Our [charger finder](/find-a-charger) is a good place to start.

### Is a road trip cheaper in an EV?

Often, though it depends on how much you use fast charging and your local rates. Try the [cost calculator](/electricity-vs-gasoline).

**Mapping your route? Explore the [range map](/range-map) and the [charger finder](/find-a-charger) before you go.**`,
  },
  {
    slug: "time-of-use-rates-ev-charging-off-peak-savings",
    title: "Time-of-Use Rates: How Charging Off-Peak Can Lower Your Costs",
    excerpt:
      "Many utilities charge less for electricity at certain hours. Learn how time-of-use rates work, how to schedule charging in your car or app, and how to check your utility's EV plan.",
    category: "EV Savings",
    date: "November 28, 2026",
    author: "Electrifying the US",
    readTime: "5 min read",
    image: evSavings,
    content: `> **Key takeaway:** Under a time-of-use (TOU) plan, electricity costs less at certain hours. Because an EV can charge any time it is parked, you can often shift charging to the cheapest window. Whether it saves you money depends on your utility's rates, so check the details.

If you charge at home, the price per kilowatt-hour (kWh) you pay is a big part of your fuel cost. Time-of-use rates give you a way to lower it without changing how you drive.

## What Is a Time-of-Use Rate?

Electricity demand rises and falls through the day. Utilities that offer TOU pricing charge different rates depending on when you use power. A typical plan has:

- **Off-peak hours,** when demand is low and rates are lowest, often overnight
- **Peak hours,** when demand is high and rates are highest, commonly late afternoon and evening
- **Sometimes a shoulder period** in between

The exact hours, seasons and prices vary a lot by utility and by state. Some utilities offer a TOU plan for the whole house, and some offer a separate EV rate, a second meter or a plan just for charging.

## Why It Suits EVs

Most home charging happens while you sleep, and a car does not care when it fills up as long as it is ready by morning. That makes EVs unusually flexible. Charging in the off-peak window can lower your cost per mile, and it also eases pressure on the grid at busy hours.

## Is a TOU Plan Right for You?

A TOU plan usually helps most when you:

- Charge at home regularly
- Can move most of your usage to off-peak hours
- Have a flexible schedule, or a car and charger with scheduling

It may help less if you cannot avoid using a lot of power in the peak window, because the higher peak rate can raise your bill. Look at the rate sheet carefully, because the gap between peak and off-peak, and the fees tied to the plan, vary from utility to utility.

## How to Check Your Utility's Options

1. **Find your utility's website** and search for "EV rate," "time-of-use" or "electric vehicle."
2. **Read the rate schedule.** Note the hours, seasons, prices and any fixed monthly charges.
3. **Ask about a separate meter or EV-only plan.** Some require one, which can add cost.
4. **Look at your past bills.** Your utility's online account may show your usage by hour, which helps you estimate how a TOU plan would affect your total.
5. **Check whether you can switch back.** Some plans have trial periods and some do not.
6. **Ask about rebates.** Some utilities support chargers or EV rates. See our [rebates and incentives page](/rebates-incentives).

If you are unsure, call the utility and ask them to walk through an example based on your usage.

## How to Schedule Charging

You have a few ways to do it, and they often work together:

- **In the car.** Many EVs let you set a departure time or a charging window on the touchscreen.
- **In the car's app.** Manufacturer apps typically offer scheduling from your phone.
- **On the charger.** Many Wi-Fi chargers have their own timers and report how much energy you used.
- **Through your utility.** Some utilities have programs that manage charging for you in exchange for a discount.

Set the schedule so charging begins when the off-peak window opens and finishes before you leave. Then watch the first month's bill to see how it plays out. Preconditioning the cabin while still plugged in works well with a schedule, since the energy comes from the grid rather than the battery. Our [winter guide](/blog/ev-cold-weather-winter-range-myths-vs-reality) explains more.

## Things to Watch For

- **Override settings.** If you plug in and tell the car to "charge now," it may skip the schedule.
- **Daylight saving time.** Check that your clock settings still line up after the time changes.
- **Public charging.** TOU rates apply to your home meter. Public networks set their own prices.
- **Your whole-house load.** Running a dryer or oven in the peak window on top of your regular use can erode the savings.

## Estimating the Savings

You can get a rough idea with some simple math. Multiply the kWh your car uses by the difference between your peak and off-peak rates. For a more complete comparison against gasoline, use our [gas vs. electricity cost calculator](/electricity-vs-gasoline), and read the [real cost of going electric](/blog/real-cost-of-going-electric-ev-savings-breakdown) for the bigger picture. Check the numbers against your own bill, since local rates differ.

## Frequently Asked Questions

### Do I need a special meter?

Sometimes. Many utilities handle TOU on the same smart meter you already have, but some EV plans need a separate one. Ask your utility.

### Will a TOU plan raise my bill?

It can if much of your usage lands in peak hours. Review your usage pattern and the rate schedule before you switch.

### Does my car need to be smart to use TOU rates?

Not necessarily. Most modern EVs and Wi-Fi chargers have built-in scheduling, so check your car's settings or your charger's manual. Ask a licensed electrician if you are unsure what your equipment supports.

### Does this apply if I charge at work or in public?

No. TOU plans apply to your own electric account. Other places set their own prices.

**Curious what your charging could cost? Run the [calculator](/electricity-vs-gasoline) and learn about [financial savings](/financial-savings) with an EV.**`,
  },
  {
    slug: "public-ev-charging-explained-networks-apps-plugs",
    title: "Public EV Charging Explained: Networks, Apps, Plugs and Etiquette",
    excerpt:
      "How public charging actually works: the networks, the apps and payment options, the plug types and the shift to NACS (J3400), plus the etiquette that keeps stations friendly.",
    category: "Charging",
    date: "November 28, 2026",
    author: "Electrifying the US",
    readTime: "5 min read",
    image: evCharging,
    content: `> **Key takeaway:** Public charging is run by many different networks, each with its own app, pricing and payment. Most automakers are moving to the NACS plug (SAE J3400), but what your car can use today depends on its model, so check before you rely on a station.

Charging away from home looks confusing at first, mostly because several companies run it. Once you know the pieces, it gets simple. This guide assumes you know the basics of charging levels from [EV Charging 101](/blog/charging-101-levels).

## Who Runs the Chargers?

Public chargers are owned and operated by a mix of companies, including:

- **Charging networks** that run stations in many locations
- **Automakers,** such as Tesla with its Supercharger network
- **Utilities and local governments**
- **Businesses,** like shopping centers, hotels, restaurants and parking garages

A single parking lot may host more than one network. That is why a map that covers everything, like our [charger finder](/find-a-charger), is handy.

## Finding Chargers

- **Your car's navigation.** It often shows nearby chargers and whether they are in use.
- **Charger apps and maps.** Many show availability, speed, price and driver feedback.
- **Network apps.** These tell you about that network's stations.

Look for recent reviews. A charger that showed as working last year may be broken today.

## Paying for a Charge

Methods vary by network, and many stations accept more than one:

- **A network app,** linked to a payment card
- **A credit card tap** at the charger
- **An RFID card or membership**
- **Plug and Charge,** where the car and charger identify each other and bill your account automatically, on supported cars and stations
- **Free sessions,** which some businesses and workplaces offer

Prices can be per kWh, per minute or a flat fee, and they may change by time of day. Some networks offer a membership with lower rates, and some add idle fees if you stay plugged in after charging finishes. Read the price on the screen or app before you start.

## Plug Types

Here is how the main connectors look today:

- **J1772** is the standard Level 2 plug on most non-Tesla EVs sold in North America for years.
- **CCS** (Combined Charging System) adds two extra pins to J1772 for DC fast charging. It is common on non-Tesla cars.
- **NACS** is the compact connector Tesla developed. Standardized as **SAE J3400,** it handles both AC and DC charging in a single plug.
- **CHAdeMO** is an older DC fast standard, found on some early models and being phased out in many places.

### The NACS (J3400) Shift

Most major automakers have announced they are adopting NACS. Many newer non-Tesla EVs can use Tesla Superchargers, some with an adapter, and some new models are built with the NACS port. Stations from other networks are adding NACS cables alongside CCS. Compatibility depends on the car, the model year and the specific station, so **check your model** with your automaker's website or app and the charging network. Do not assume an adapter fits every car or every stall.

## Speed and Power

Chargers differ in how fast they can deliver power, and your car sets its own limit. A fast charger gives you only what your car can accept, and that rate usually tapers as the battery fills. Cold batteries charge more slowly too. If you are comparing stations, the posted kilowatt rating is the maximum, not a promise.

## Charging Etiquette

- **Unplug and move when you are done,** so others can use the stall.
- **Do not occupy a charger spot without charging.** That includes gas-powered vehicles.
- **Do not leave your car for hours at a fast charger.** Use Level 2 for longer stays.
- **Leave unplugging others alone** unless the car is clearly finished and the network permits it.
- **Coil the cable** and keep the connector off the ground.
- **Report problems** to the network through the app or the number on the charger.
- **Be patient and polite.** If the lot is busy, a little communication helps.

## Tips for Smoother Sessions

- Set up the apps and payment before you need them
- Have a backup charger in mind
- Keep your car's charge port clean and free of debris
- Pay attention to your session, and look at the app to confirm that charging has started
- Use public Level 2 when you can wait, and save fast charging for when you are traveling

If you drive long distances, see our guide to [planning your first road trip](/blog/plan-your-first-ev-road-trip).

## Frequently Asked Questions

### Do I need a different app for every network?

Often yes, though many stations also take a credit card, and some cars bill through Plug and Charge. Set up the apps for the networks you use most.

### Can any EV use any public charger?

Not always. Plug type, power level and software all matter. Check your model's compatibility.

### Is public charging more expensive than home charging?

Usually, especially DC fast charging. Prices depend on the network and the place. Compare with your home rate using our [calculator](/electricity-vs-gasoline).

### What should I do if a charger does not work?

Try another stall, check the app and report it. Then move on to your backup.

**Find a charger near you with our [charger finder](/find-a-charger), and keep reading with [EV Charging 101](/ev-charging-101).**`,
  },
];
