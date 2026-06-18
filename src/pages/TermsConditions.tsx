import { FileText } from "lucide-react";
import LegalLayout, { type LegalSection } from "@/components/LegalLayout";

const preamble: string[] = [
  `These Terms of Use ("Terms") constitute a legally binding agreement between you ("User," "you," or "your") and ElectrifyingTheUS (ETUS), EMobilityResearch (EMR) and EVNoire (EVN), and their respective affiliates, subsidiaries, partners, and licensors (collectively, "ElectrifyingTheUS," "we," "our," or "us") governing your access to and use of the website located at https://test.electrifyingtheus.com and any successor URLs, subdomains, mobile applications, APIs, or digital tools associated therewith (collectively, the "Site" or "Services").`,
  `By Accessing Or Using The Site In Any Way — Including Interacting With The AI Chatbot, Using Any Calculator, Viewing Rebate Or Incentive Information, Or Opting In To SMS Communications — You Agree To Be Bound By These Terms. If You Do Not Agree, You Must Immediately Cease Use Of The Site.`,
];

const sections: LegalSection[] = [
  {
    heading: "Acceptance of Terms",
    body: [
      `Your access to and use of the Site constitutes your agreement to these Terms and our Privacy Policy, which is incorporated herein by reference. These Terms apply to all visitors, users, and others who access or use the Site. We reserve the right to update these Terms at any time without prior notice. Your continued use of the Site following any changes constitutes your acceptance of the revised Terms. The most current version will always be available on the Site with the updated effective date.`,
    ],
  },
  {
    heading: "Description of Services",
    body: [
      `ElectrifyingTheUS provides an informational platform relating to electric vehicles ("EVs"), e-mobility, and clean transportation, including but not limited to:`,
    ],
    list: [
      `An artificial intelligence-powered chatbot providing general EV information, incentives, and adoption guidance;`,
      `Cost comparison calculators estimating EV versus gasoline vehicle operating costs;`,
      `Aggregated information regarding EV rebates and incentives from utility companies, federal agencies, state governments, and municipalities;`,
      `Educational content, articles, and resources relating to electric vehicles and e-mobility equity;`,
      `SMS and text message communications for enrolled users (subject to separate SMS Terms);`,
      `Links and references to third-party programs, government portals, and utility services;`,
      `Event registration and program information for Electrifying The US initiatives including Ride & Drive events and the E-Mobility programming.`,
    ],
    footer: [
      `All Services are provided for general informational purposes only. ElectrifyingTheUS does not guarantee the availability, accuracy, completeness, or timeliness of any information provided.`,
    ],
  },
  {
    heading: "User Conduct",
    body: [`When using our Services, you agree not to engage in unlawful or harmful activities, including:`],
    list: [
      `Violating any applicable federal, state, or local laws or regulations;`,
      `Distributing spam, unsolicited commercial messages, or unauthorized bulk communications;`,
      `Transmitting viruses, malware, ransomware, or any other malicious code;`,
      `Attempting unauthorized access to our systems, data, AI infrastructure, or user accounts;`,
      `Scraping, crawling, or harvesting data from the Site without express written permission;`,
      `Reverse engineering, decompiling, or attempting to extract source code from the AI chatbot or any tool;`,
      `Submitting false, misleading, or inaccurate information through any form, chatbot, or tool;`,
      `Interfering with or disrupting the integrity, security, or performance of the Site.`,
    ],
  },
  {
    heading: "Intellectual Property",
    body: [
      `All content on the Services — including text, graphics, logos, images, data compilations, software (including the AI chatbot and calculator tools), and other materials (collectively, "Content") — is the property of EMobilityResearch, ElectrifyingTheUS, and their respective affiliates, subsidiaries, partners, and licensors. Its content suppliers and is protected by United States and international copyright, trademark, patent, trade secret, and other intellectual property laws.`,
      `Reproduction, distribution, modification, or use of any Content requires our prior written permission. You are granted a limited, non-exclusive, non-transferable, revocable license to access and use the Site solely for personal, non-commercial informational purposes. No other rights are granted by implication or otherwise.`,
    ],
  },
  {
    heading: "Third-Party Links",
    body: [
      `Our Services may contain links to third-party websites, including government agency portals, utility company websites, vehicle manufacturer sites, and other external resources. We are not responsible for the content, accuracy, privacy practices, or operations of those websites. Accessing third-party sites is at your own risk. We strongly recommend reviewing the terms and privacy policies of any third-party site you visit.`,
    ],
  },
  {
    heading: "Third-Party Data and API Sources",
    body: [
      `Certain information — including EV rebate and incentive data, utility program details, and government incentive information — is sourced from live third-party APIs, data feeds, and databases. ElectrifyingTheUS does not control and is not responsible for the accuracy, completeness, timeliness, or availability of third-party source data. You should independently verify all rebate and incentive information directly with the relevant administering authority before relying on it for any financial or legal decision.`,
    ],
  },
  {
    heading: "Mobile and SMS Terms",
    body: [
      `By opting in to SMS or text message communications from ElectrifyingTheUS, EMobilityResearch and their respective affiliates, subsidiaries, partners, and licensors. You consent to receive recurring text messages related to EV programs, events, rebate alerts, and updates. Standard message and data rates may apply. You may reply STOP to unsubscribe at any time or HELP for support. Full SMS terms are set forth in Document 3 of this package.`,
    ],
  },
  {
    heading: "Disclaimer of Warranties",
    body: [
      `The Site And All Content, Tools, Calculators, AI Chatbot Outputs, SMS Communications, And Services Are Provided On An "As Is" And "As Available" Basis Without Warranties Of Any Kind, Either Express Or Implied, Including But Not Limited To Warranties Of Merchantability, Fitness For A Particular Purpose, Title, Or Non-Infringement.`,
      `Some jurisdictions do not allow the exclusion of certain warranties. In such jurisdictions, our warranties are limited to the maximum extent permitted by applicable law.`,
    ],
  },
  {
    heading: "Limitation of Liability",
    body: [
      `To The Fullest Extent Permitted By Applicable Law, In No Event Shall ElectrifyingTheUS, EMobilityResearch, EVN And Their Respective Affiliates, Subsidiaries, Partners, And Licensors Or Their Officers, Directors, Employees, Agents, Licensors, Or Affiliates Be Liable For Any Indirect, Incidental, Special, Consequential, Punitive, Or Exemplary Damages — Including Damages For Loss Of Profits, Data, Or Goodwill — Arising From Your Use Of Or Reliance On The Site, AI Chatbot, Calculators, Rebate Information, Or SMS Communications.`,
      `In No Event Shall Aggregate Liability Exceed The Greater Of $100.00 Or Amounts Paid By You To ElectrifyingTheUS In The Prior Twelve (12) Months.`,
    ],
  },
  {
    heading: "Indemnification",
    body: [
      `You agree to defend, indemnify, and hold harmless EMobilityResearch, ElectrifyingTheUS, EVN, and their officers, directors, employees, contractors, agents, licensors, and affiliates from and against any and all claims, damages, obligations, losses, liabilities, costs, and expenses (including attorney's fees) arising from your use of the Site, your violation of these Terms, or your violation of any third-party right.`,
    ],
  },
  {
    heading: "Governing Law and Dispute Resolution",
    body: [
      `These Terms shall be governed by the laws of the United States and, where applicable, the laws of the State of Georgia (for EMR/ETUS/EVN entity matters) and the State of California (for ElectrifyingTheUS and their officers, directors, employees, contractors, agents, licensors, and affiliates site operations), without giving effect to conflict-of-law provisions. Any dispute not resolved informally shall be submitted to binding arbitration administered by the American Arbitration Association (AAA) on an individual basis. CLASS ACTION AND REPRESENTATIVE CLAIMS ARE EXPRESSLY WAIVED.`,
    ],
  },
  {
    heading: "Changes to Terms",
    body: [
      `We may update these Terms from time to time. Any changes will be posted to the Site with an updated effective date. Your continued use of the Services constitutes your acceptance of the revised Terms.`,
    ],
  },
  {
    heading: "Contact",
    body: [
      `For questions about these Terms, contact us at: info@electrifyingtheus.com | https://electrifyingtheus.com`,
    ],
  },
];

const TermsConditions = () => (
  <LegalLayout
    badge="Terms of Use"
    title="Terms of"
    highlight="Use"
    icon={FileText}
    intro="These Terms of Use govern your access to and use of ElectrifyingTheUS.com and all associated tools, calculators, the AI chatbot, and services. Please read them carefully."
    effectiveDate="June 15, 2026"
    preamble={preamble}
    sections={sections}
  />
);

export default TermsConditions;
