import { ShieldCheck } from "lucide-react";
import LegalLayout, { type LegalSection, type LegalAppendix } from "@/components/LegalLayout";

const preamble: string[] = [
  `ElectrifyingTheUS, EMR, EVN and their partners and affiliates ("we," "our," or "us") are committed to protecting your privacy. This Privacy Policy describes how we collect, use, disclose, retain, and protect information about you when you visit https://electrifyingtheus.com and use our Services, including the all tools, AI chatbot, cost calculators, rebate and incentive tools, SMS communications, event registration, and any lead capture or contact forms on the Site.`,
  `This Policy applies to all users across all U.S. states. Additional state-specific rights are addressed in Section 10.`,
];

const sections: LegalSection[] = [
  {
    heading: "Information We Collect",
    body: [],
    blocks: [
      {
        subheading: "Information You Provide Directly",
        body: [`We collect information you voluntarily provide, including:`],
        list: [
          `Contact information such as your name, email address, phone number, and zip code through lead capture or contact forms;`,
          `Content of AI chatbot interactions, including any personal details you voluntarily share;`,
          `Data entered into calculators or tools (vehicle type, mileage, utility rate, location);`,
          `Payment details when you register for events or services;`,
          `Newsletter and email subscription preferences;`,
          `Your mobile phone number and opt-in consent when enrolling in SMS communications.`,
        ],
      },
      {
        subheading: "Information Collected Automatically",
        body: [`When you visit the Site, we and our service providers automatically collect:`],
        list: [
          `IP address and approximate geographic location;`,
          `Browser type, version, and settings; device type and operating system;`,
          `Pages visited, time on page, clickstream data, and referral URL;`,
          `Date and time of your visit;`,
          `Cookies, web beacons, pixel tags, and similar tracking technologies (see Section 05).`,
        ],
      },
      {
        subheading: "Chat and Interaction Logs",
        body: [
          `Conversations with our AI chatbot may be logged and stored for quality assurance, safety monitoring, and model improvement. Chat logs may include full conversation text, timestamps, and session identifiers. Do not share sensitive personal information (such as Social Security numbers, financial account numbers, or health information) through the chatbot.`,
        ],
      },
      {
        subheading: "SMS and Text Message Data",
        body: [
          `If you opt in to SMS communications, we collect and retain your mobile phone number, opt-in consent records (including timestamp, source, and method of consent), message interaction data (delivery status, opt-out requests), and any inbound messages you send to our shortcode or longcode. This data is used solely to administer the SMS program and comply with applicable law.`,
        ],
      },
    ],
  },
  {
    heading: "How We Use Your Information",
    body: [`We use the information we collect to:`],
    list: [
      `Operate, maintain, and improve our website, tools, and Services;`,
      `Respond to your inquiries and requests submitted through forms or the chatbot;`,
      `Send requested information about EV programs, rebates, incentives, and related topics;`,
      `Send marketing and promotional communications (where opted in or permitted by law);`,
      `Deliver SMS/text messages for which you have provided express written consent;`,
      `Facilitate event registration and program participation;`,
      `Analyze usage patterns and improve AI chatbot and calculator performance;`,
      `Train, test, and refine AI models (using de-identified or aggregated data where feasible);`,
      `Detect, investigate, and prevent fraudulent or unauthorized activity;`,
      `Comply with applicable legal obligations and enforce our Terms;`,
      `Diagnose and address technical issues.`,
    ],
  },
  {
    heading: "Sharing of Information",
    body: [
      `ElectrifyingTheUS, EMR, EVN and it's parters, wiil not sell your personal information.`,
      `We may share data with trusted service providers — including email marketing platforms, analytics services, AI and machine learning infrastructure providers, event registration tools, CRM platforms, and payment processors — who are bound by confidentiality agreements and process data only on our behalf.`,
      `We may also disclose information if required by law, court order, or to protect the rights, property, or safety of our organization, users, or the public. In the event of a merger or acquisition, your information may be transferred subject to the same privacy protections.`,
    ],
  },
  {
    heading: "Analytics Services Provided by Others",
    body: [
      `Third-party analytics partners (such as Google Analytics) may use cookies, web beacons, pixels, and similar tools to collect usage data, helping us understand user behavior and improve our services. These providers may collect information about your online activities across different websites over time. We recommend reviewing their privacy policies.`,
    ],
  },
  {
    heading: "Cookies and Tracking Technologies",
    body: [
      `We use cookies, web beacons, local storage, and similar technologies to collect information about your Site use, personalize your experience, and analyze traffic. You may control cookies through your browser settings, though some Site features may not function properly if cookies are disabled. We honor Do Not Track signals to the extent required by applicable law.`,
    ],
  },
  {
    heading: "Your Rights and Choices",
    body: [`Depending on your location, you may have the right to:`],
    list: [
      `Request access to the personal data we hold about you;`,
      `Request corrections to inaccurate data;`,
      `Request deletion of your data, subject to legal retention obligations;`,
      `Object to or restrict certain uses of your data;`,
      `Opt out of promotional emails via the unsubscribe link in any message;`,
      `Opt out of SMS communications by replying STOP to any text message;`,
      `Obtain a portable copy of personal data we hold about you (where required by law).`,
    ],
    footer: [`To exercise any of these rights, contact us at info@electrifyingtheus.com.`],
  },
  {
    heading: "Children's Privacy",
    body: [
      `The Site is not directed to children under the age of 13, and we do not knowingly collect or solicit information from children under 13. If we learn we have inadvertently collected such information, we will promptly delete it. If you believe we have collected information from a child under 13, please contact us immediately.`,
    ],
  },
  {
    heading: "Data Security",
    body: [
      `We take reasonable administrative, technical, and physical measures to protect your information from unauthorized access, disclosure, alteration, or destruction, including encrypted data transmission (TLS/HTTPS), access controls, and regular security assessments. However, no method of transmission over the internet is completely secure, and we cannot guarantee absolute security. In the event of a breach requiring notification under applicable law, we will notify affected users as required.`,
    ],
  },
  {
    heading: "International Users",
    body: [
      `Your information may be transferred, processed, and stored in the United States, where data protection laws may differ from those in your country. By using the Site, you consent to the transfer of your information to the United States.`,
    ],
  },
  {
    heading: "State Privacy Rights",
    body: [],
    blocks: [
      {
        subheading: "California Residents (CCPA/CPRA)",
        body: [
          `California residents have the right to: know what personal information is collected; request deletion; request correction of inaccurate data; opt out of sale or sharing; limit use of sensitive personal information; and be free from discrimination for exercising these rights. To submit a CCPA request or to opt out, contact info@electrifyingtheus.com or use the "Do Not Sell or Share My Personal Information" link on the Site.`,
        ],
      },
      {
        subheading: "Virginia, Colorado, Connecticut, Texas, and Other States",
        body: [
          `Residents of states with comprehensive privacy laws (including VCDPA, CPA, CTDPA, and TDPSA) may have rights to access, correct, delete, and port personal data, and to opt out of targeted advertising and sale of data. Submit requests to info@electrifyingtheus.com. We will respond within the timeframe required by applicable law.`,
        ],
      },
    ],
  },
  {
    heading: "Mobile and SMS Terms of Service — Summary",
    body: [
      `ElectrifyingTheUS provides text messaging services. By opting in, you consent to receive recurring messages related to EV programs, events, rebates, and updates. Message and data rates may apply. You can unsubscribe at any time by texting STOP to any message. For help, contact info@electrifyingtheus.com. Full SMS Terms are provided in Document 3 of this package, which governs all text messaging services and is incorporated into this Privacy Policy by reference.`,
    ],
  },
  {
    heading: "Policy Updates",
    body: [
      `We may revise this Privacy Policy from time to time. Any changes will appear on this page with an updated effective date. Material changes will be communicated via Site notice or email where applicable. Your continued use of the Site after the effective date constitutes acceptance of the revised Policy.`,
      `Contact: info@electrifyingtheus.com | https://electrifyingtheus.com`,
    ],
  },
];

export const smsTerms: LegalAppendix = {
  heading: "SMS & Text Messaging Terms of Service",
  effectiveDate: "June 15, 2026  |  ElectrifyingTheUS.com  |  EVHybridNoire / EVN and its Affiliates",
  preamble: [
    `TCPA COMPLIANCE NOTICE: These SMS Terms are designed to comply with the Telephone Consumer Protection Act (TCPA), 47 U.S.C. § 227; FCC regulations; the CTIA Messaging Principles and Best Practices; and applicable state telemarketing and consumer protection laws. Opt-in consent is required before any text message is sent to you. We do not send unsolicited text messages.`,
  ],
  sections: [
    {
      heading: "Program Description",
      body: [
        `ElectrifyingTheUS, EMR, EVN and their respective affiliates, subsidiaries, partners, and licensors ("we," "us," or "our") operate an SMS/text messaging program (the "SMS Program") through which we may send you text messages relating to:`,
      ],
      list: [
        `Electric vehicle education, tips, and adoption resources;`,
        `EV rebate and incentive alerts, including new program announcements and deadline reminders;`,
        `Ride & Drive event invitations, reminders, and follow-ups;`,
        `E-Mobility Fellowship Pipeline Program (EFPP) updates and announcements;`,
        `Program and organizational news and updates;`,
        `Responses to inbound SMS inquiries you initiate;`,
        `Time-sensitive program and enrollment deadline notifications;`,
        `Transactional messages related to event registrations or service requests you have initiated.`,
      ],
      footer: [
        `Message frequency will vary. You may receive up to e.g., four (4) messages per month, though frequency may be higher during active event or program periods. We reserve the right to modify message frequency with notice.`,
      ],
    },
    {
      heading: "How to Opt In",
      body: [
        `Participation in the SMS Program is entirely voluntary. You may only be enrolled in the SMS Program if you have provided express written consent through one of the following methods:`,
      ],
      list: [
        `Checking an opt-in checkbox on a web form on the Site (the checkbox must be unchecked by default and cannot be pre-selected);`,
        `Signing a written opt-in form at an in-person event;`,
        `Verbally confirming opt-in consent that is documented and recorded with your acknowledgment.`,
      ],
      footer: [
        `At the time of opt-in, you will receive a confirmation message disclosing: the program name, message frequency, that message and data rates may apply, instructions to reply STOP to unsubscribe, instructions to reply HELP for assistance, and a link to our full Privacy Policy and these SMS Terms.`,
        `IMPORTANT: Your consent to receive SMS messages is not a condition of purchasing any goods or services and is not required to participate in any program or to access any content on the Site.`,
      ],
    },
    {
      heading: "Standard Opt-In Disclosure Language",
      body: [
        `The following disclosure must appear clearly and conspicuously at all SMS opt-in points:`,
        `"By providing your mobile phone number and checking this box, you consent to receive recurring automated text messages from ElectrifyingTheUS / EVN about EV programs, events, rebates, and updates. Message frequency varies. Message and data rates may apply. Reply STOP to unsubscribe at any time. Reply HELP for help. Consent is not a condition of any purchase or program participation. View our Privacy Policy and SMS Terms at [URL]."`,
      ],
      footer: [
        `This exact disclosure language, or a substantively equivalent version reviewed by legal counsel, must appear at every opt-in point before the user submits their phone number.`,
      ],
    },
    {
      heading: "How to Opt Out (Unsubscribe)",
      body: [`You may opt out of the SMS Program at any time using any of the following methods:`],
      list: [
        `Reply STOP to any text message you receive from us. This is the primary and FCC-required opt-out mechanism.`,
        `Reply CANCEL, END, QUIT, or UNSUBSCRIBE — all of these keywords will also process your opt-out.`,
        `Contact us directly at info@electrifyingtheus.com and request removal from SMS communications.`,
        `Update your communication preferences through your account settings on the Site (if applicable).`,
      ],
      footer: [
        `Upon receipt of a STOP (or equivalent keyword) reply, we will send you one final confirmation message stating that you have been unsubscribed and will receive no further messages. After that confirmation, no further SMS messages will be sent to your number unless you affirmatively re-enroll.`,
        `Opt-out requests will be processed within a reasonable time, not to exceed ten (10) business days, though we aim to process immediately. During that processing period, you may receive one or two additional messages already in queue. These are not violations of your opt-out request.`,
        `We will honor all opt-out requests and will not send marketing messages to any number that has opted out. Opt-out records are maintained indefinitely to ensure compliance.`,
      ],
    },
    {
      heading: "How to Get Help",
      body: [`If you need help with the SMS Program, you may:`],
      list: [
        `Reply HELP to any text message. You will receive an automated response with the program name, a brief description, customer support contact information, and opt-out instructions.`,
        `Email us at info@electrifyingtheus.com.`,
        `Visit https://test.electrifyingtheus.com for additional information.`,
      ],
      footer: [
        `Customer support is available via email Monday through Friday during normal business hours. We aim to respond to all inquiries within two (2) business days.`,
      ],
    },
    {
      heading: "Message and Data Rates",
      body: [
        `Standard message and data rates may apply to all SMS messages sent to and received from us, depending on your mobile carrier plan. These charges are billed by your mobile carrier, not by ElectrifyingTheUS, EMR or EVNoire and their respective affiliates, subsidiaries, partners, and licensors. is not responsible for any charges assessed by your carrier in connection with the SMS Program.`,
        `We recommend confirming your carrier's SMS/text messaging rates before opting in if you are uncertain about applicable charges. Participants on unlimited texting plans typically incur no additional charge.`,
      ],
    },
    {
      heading: "Supported Carriers",
      body: [
        `The SMS Program is available on most major U.S. wireless carriers, including but not limited to AT&T, Verizon, T-Mobile, Sprint (T-Mobile), US Cellular, and regional carriers. Carrier support may vary, and not all features may be available on all carriers. We are not liable for delays or failures in the delivery of messages caused by carrier issues, network outages, or other factors outside our control.`,
        `If you change your mobile phone number, you are responsible for notifying us and updating your communication preferences to avoid messages being sent to the new subscriber of your previous number.`,
      ],
    },
    {
      heading: "Consent Records and Recordkeeping",
      body: [`We maintain records of all SMS opt-in and opt-out events, including:`],
      list: [
        `The mobile phone number enrolled;`,
        `The date, time, and method of opt-in consent;`,
        `The source of opt-in (web form URL, keyword, event, etc.);`,
        `The opt-in disclosure language presented at the time of consent;`,
        `The date and time of any opt-out request and the method used.`,
      ],
      footer: [
        `These records are retained for a minimum of four (4) years from the date of consent or opt-out (whichever is later) to support TCPA compliance documentation. Consent records may be produced in response to regulatory inquiries, litigation holds, or legal process.`,
      ],
    },
    {
      heading: "Prohibited Uses",
      body: [`The SMS Program may not be used for:`],
      list: [
        `Spam or unsolicited commercial messages to individuals who have not opted in;`,
        `Phishing, fraud, or any deceptive communications;`,
        `Transmitting malware, viruses, or harmful code via SMS;`,
        `Sending emergency alerts or communications that may be mistaken for government emergency notifications;`,
        `Any communication that violates the TCPA, CTIA guidelines, FCC rules, or applicable state telemarketing laws.`,
      ],
    },
    {
      heading: "TCPA and Applicable Law Compliance",
      body: [
        `ElectrifyingTheUS / EMR / EVN and their respective affiliates, subsidiaries, partners, and licensors operates the SMS Program in compliance with:`,
      ],
      list: [
        `The Telephone Consumer Protection Act (TCPA), 47 U.S.C. § 227, and regulations promulgated thereunder by the FCC;`,
        `The CTIA Short Code Monitoring Handbook and CTIA Messaging Principles and Best Practices (current version);`,
        `The CAN-SPAM Act of 2003 (to the extent applicable to mobile messaging);`,
        `Applicable state telemarketing, consumer protection, and privacy laws, including the California Invasion of Privacy Act (CIPA) and Florida Telephone Solicitation Act (FTSA);`,
        `The wireless carrier's acceptable use policies and messaging program requirements.`,
      ],
      footer: [
        `We do not use automatic telephone dialing systems (ATDS) without first obtaining the required prior express written consent from the recipient. Transactional or informational messages sent in direct response to a user-initiated action may be sent consistent with applicable exemptions.`,
      ],
    },
    {
      heading: "Limitation of Liability for SMS",
      body: [
        `To The Fullest Extent Permitted By Law, ElectrifyingTheUS, EMR, EVN And Their Respective Affiliates, Subsidiaries, Partners, And Licensors Shall Not Be Liable For Any Damages, Losses, Or Claims Arising From: (A) Failure Or Delay In Delivery Of SMS Messages Due To Carrier Issues, Network Outages, Or Technical Failures; (B) Any Charges Assessed By Your Mobile Carrier; (C) Your Failure To Opt Out Of SMS Communications Using The Provided Mechanisms; Or (D) Any Third-Party Interception Of SMS Messages, As Text Messages Are Not Encrypted End-To-End And Should Not Be Used To Transmit Sensitive Personal Information.`,
      ],
    },
    {
      heading: "Changes to SMS Terms",
      body: [
        `We may update these SMS Terms from time to time to reflect changes in law, carrier requirements, or our program. Material changes will be communicated via SMS prior to taking effect, and the updated Terms will be posted on the Site. Your continued participation in the SMS Program after the effective date of any change constitutes your acceptance of the revised Terms.`,
      ],
    },
    {
      heading: "Contact for SMS Support",
      body: [
        `For all SMS-related questions, opt-out requests, or support: Email: info@electrifyingtheus.com | Website: https://test.electrifyingtheus.com | Response time: Within 2 business days.`,
      ],
    },
  ],
};

const PrivacyPolicy = () => (
  <LegalLayout
    badge="Privacy Policy"
    title="Privacy"
    highlight="Policy"
    icon={ShieldCheck}
    intro="ElectrifyingTheUS.com and its partners and affiliates — how we collect, use, disclose, retain, and protect your information."
    effectiveDate="June 15, 2026"
    preamble={preamble}
    sections={sections}
    appendices={[smsTerms]}
  />
);

export default PrivacyPolicy;
