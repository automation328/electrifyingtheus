// Shared legal disclaimers, kept in one place so the same wording shows wherever
// it's required (the EV incentives page, the calculator, and share dialogs).

// Calculator / cost-comparison disclaimer — shown on the incentives page and in
// the share flow for the EV vs Gas calculator results.
export const CALCULATOR_DISCLAIMER =
  "The Gas vs. EV Cost Calculator and similar tools on ElectrifyingTheUS.com generate estimated cost comparisons based on user-provided inputs and publicly available average data. These calculations are estimates only and are subject to significant variability.\n\n" +
  "EV CALCULATOR TOOL RESULTS ARE NOT GUARANTEES OR PROJECTIONS. ElectrifyingTheUS.com, EMobilityResearch (EMR), and their respective affiliates, subsidiaries, partners, and licensors expressly disclaim all liability for financial decisions made in reliance on calculator outputs. Results should be independently verified with qualified financial, insurance, automotive, utility, and relevant professionals.";

// The standing share disclaimer — shown in the share dialog on every surface,
// and carried into the share EMAIL whenever the surface has no more specific
// disclaimer of its own. Lived inline in ShareGate; it moved here so the email
// template and the on-page dialog cannot drift apart.
export const SHARE_DISCLAIMER =
  "The vehicle information, consumer data, pricing, range estimates, and charging data presented here are sourced from publicly available information and industry research. This content is intended for general informational purposes only and is subject to change without notice. ElectrifyingTheUS.com and its staff make no representations or warranties regarding the accuracy, completeness, or timeliness of this information. This content does not constitute a recommendation, endorsement, or advice of any kind. Consumers are solely responsible for conducting their own due diligence, verifying current pricing and availability with licensed dealers, and making independent purchase decisions. ElectrifyingTheUS.com assumes no liability for decisions made based on the information provided here.";

// Short third-party event notice — shown (always visible) on every event detail
// page. The bold "Third-Party Event Notice:" label is added in markup.
export const EVENT_THIRD_PARTY_NOTICE =
  "This event is organized and managed by an independent third party. ElectrifyingTheUS (ETUS) and its partners and affiliates does not host, sponsor, or endorse this event. Event details including date, time, location, and format are subject to change or cancellation without notice. Please verify all information directly with the organizer before making plans. ETUS is not responsible for any changes, cancellations, or inaccuracies related to this listing. If any issues arise please contact the event organizer directly.";

// Event calendar / listings disclaimer — shown (collapsible) on every event
// detail page. One paragraph per array entry; the contact line + Terms of Use
// link are rendered separately in the EventDisclaimer component.
export const EVENT_CALENDAR_DISCLAIMER: string[] = [
  "The event calendar is provided as a community resource and informational purposes only. Events listed are produced and managed by independent third-party organizers. We do not organize, host, sponsor, endorse, or have any affiliation with the events listed unless explicitly stated.",
  "Event details — including dates, times, locations, formats, registration requirements, fees, speakers, and availability — are subject to change or cancellation at any time without notice. We make no representations or warranties regarding the accuracy, completeness, or timeliness of any event information listed on this calendar.",
  "We strongly encourage all attendees to verify event details directly with the hosting organization prior to making travel arrangements, purchasing tickets, or committing resources of any kind. Electrifying the US and its partners and affiliates are not responsible for any loss, expense, inconvenience, or damages arising from attendance at, or reliance on information related to, any event listed on this calendar.",
  "Links to third-party event websites, registration pages, or external resources are provided for convenience only. ETUS does not control, endorse, or assume responsibility for the content, privacy practices, or accuracy of any third-party websites or platforms.",
  "Event listings are submitted by or sourced from public information. Inclusion of an event on this calendar does not constitute an endorsement, recommendation, or professional opinion.",
];

// EV Incentives disclaimer — shown on the incentives page and in the incentive
// share flow.
export const INCENTIVES_DISCLAIMER =
  "The EV Incentives and similar tools on ElectrifyingTheUS.com generate estimated cost comparisons based on user-provided inputs and publicly available average data. These calculations are estimates only and are subject to significant variability.\n\n" +
  "EV INCENTIVES TOOL RESULTS ARE NOT GUARANTEES OR PROJECTIONS. ElectrifyingTheUS.com, EMobilityResearch (EMR), and their respective affiliates, subsidiaries, partners, and licensors expressly disclaim all liability for financial decisions made in reliance on calculator outputs. Results should be independently verified with qualified financial, insurance, automotive, utility, and relevant professionals.";

// Marketplace — short third-party notice, always visible on the results page and
// on every vehicle detail page. The bold "Third-Party Listings:" label is added
// in markup, the same way the event notice does it.
//
// The point of the wording: say plainly that the cars are not ours, that the
// numbers are the seller's, and that the range figure is a rating rather than a
// measurement of the individual car — then tell the visitor what to check before
// they spend a Saturday driving to a dealer.
export const MARKETPLACE_THIRD_PARTY_NOTICE =
  "Vehicles shown here are listed by independent dealers and reach us through a third-party inventory feed. Electrifying the US does not sell vehicles, hold inventory, inspect these cars, or take part in the sale. Price, mileage, photographs, condition and availability are the seller's own and can change — or sell — at any time. Please confirm every detail directly with the dealer before travelling, paying a deposit, or making a decision.";

// Marketplace — the fuller disclaimer, one paragraph per entry, shown in a
// collapsible card under the results and on the vehicle detail page.
export const MARKETPLACE_LISTING_DISCLAIMER: string[] = [
  "Listings are supplied by a third-party vehicle inventory provider that aggregates dealer stock. Their appearance here is not an endorsement, recommendation, or verification of the vehicle, the dealer, or the asking price, and we have no affiliation with the seller unless expressly stated.",
  "Listing data — price, mileage, trim, photographs, location and availability — is provided by the dealer and refreshed periodically. A vehicle may already be sold, withdrawn, or priced differently than shown, and listings occasionally contain errors we cannot see or correct. We make no representation as to the accuracy, completeness or timeliness of any listing.",
  "Range figures are the EPA rating published for that vehicle's model year and, where the listing identifies it, that specific trim and drivetrain. They describe the model when new. They are not a measurement of the car in front of you: real-world range varies with weather, speed, terrain and driving style, and on a used electric vehicle it also depends on the health of a battery that has been in service for years. Have the battery's state of health checked before you buy.",
  "Running-cost figures are estimates produced from published efficiency ratings and average local energy and fuel prices, for comparison only. They are not a quote, and your own costs will differ with how and where you drive and charge.",
  "Incentives shown alongside a vehicle are informational. Eligibility is decided by the administering agency or utility — commonly on the basis of income, tax liability, the vehicle's price and history, and the account on your utility bill — and programmes change and run out of funding. Confirm what you qualify for with the programme itself before counting on it.",
  "Links to dealer websites and listing pages are provided for convenience. We do not control those sites and are not responsible for their content, privacy practices, or the conduct of any seller. Electrifying the US and its partners and affiliates accept no liability for any loss, expense or inconvenience arising from reliance on a listing shown here.",
];
