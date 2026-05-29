import { Lock } from "lucide-react";
import LegalLayout, { type LegalSection } from "@/components/LegalLayout";

const sections: LegalSection[] = [
  {
    heading: "Information We Collect",
    body: [
      "We gather data through information you provide directly and information collected automatically as you use our website and services.",
      "Information you provide directly includes contact information (such as your name, email, and phone number) and payment details when you register for events or services.",
      "Information collected automatically includes your IP address, browser type and details, the pages you visit, and device information. We use cookies and similar technologies to enhance your browsing experience.",
    ],
  },
  {
    heading: "How We Use Your Information",
    body: ["We use the information we collect to:"],
    list: [
      "Operate, maintain, and improve our website and services",
      "Send communications and respond to your inquiries",
      "Facilitate event registration",
      "Analyze traffic patterns and usage",
      "Diagnose and address technical issues",
      "Meet our legal and regulatory requirements",
    ],
  },
  {
    heading: "Sharing of Information",
    body: [
      "EVNoire does not sell your personal information.",
      "We may share data with trusted service providers — including email marketing services, analytics platforms, event registration tools, and payment processors — who are bound by confidentiality agreements and process the data only on our behalf.",
    ],
  },
  {
    heading: "Analytics Services Provided by Others",
    body: [
      "Third-party analytics partners may use cookies, web beacons, pixels, and similar tools to collect usage data. This helps us understand user behavior and improve our services.",
    ],
  },
  {
    heading: "Third-Party Links and Services",
    body: [
      "Our website may link to external sites. We are not responsible for the privacy practices or content of those third-party sites. We encourage you to review their privacy policies.",
    ],
  },
  {
    heading: "Your Rights and Choices",
    body: ["Depending on your location, you may have the right to:"],
    list: [
      "Request access to the personal data we hold about you",
      "Request corrections to inaccurate data",
      "Request deletion of your data",
      "Object to or restrict certain uses of your data",
      "Opt out of promotional emails via the unsubscribe link in any message",
    ],
  },
  {
    heading: "Children's Privacy",
    body: [
      "EVNoire does not knowingly collect or solicit information from children under the age of 13. If we learn we have collected such information, we will delete it.",
    ],
  },
  {
    heading: "Data Security",
    body: [
      "We take reasonable administrative, technical, and physical measures to protect your information. However, no method of transmission over the internet is completely secure, and we cannot guarantee absolute security.",
    ],
  },
  {
    heading: "International Users",
    body: [
      "Your information may be transferred, processed, and stored in the United States, where data protection laws may differ from those in your country.",
    ],
  },
  {
    heading: "Policy Updates",
    body: [
      "We may revise this Privacy Policy from time to time. Any changes will appear on this page with an updated effective date.",
    ],
  },
  {
    heading: "Mobile and SMS Terms of Service",
    body: [
      "EVNoire provides text messaging services. By opting in, you consent to receive recurring messages. Message and data rates may apply. You can unsubscribe at any time by texting STOP. For help, contact info@evnoire.com.",
    ],
  },
];

const PrivacyPolicy = () => (
  <LegalLayout
    badge="Privacy Policy"
    title="Privacy"
    highlight="Policy"
    icon={Lock}
    intro="EVNoire is committed to protecting your privacy. This Privacy Policy outlines how we collect, use, and safeguard your information."
    effectiveDate="January 1, 2026"
    sections={sections}
  />
);

export default PrivacyPolicy;
