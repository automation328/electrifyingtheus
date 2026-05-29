import { FileText } from "lucide-react";
import LegalLayout, { type LegalSection } from "@/components/LegalLayout";

const sections: LegalSection[] = [
  {
    heading: "Acceptance of Terms",
    body: [
      "Your access to and use of the Services is conditioned on your acceptance of and compliance with these Terms. By accessing or using the Services, you agree to be bound by these Terms.",
    ],
  },
  {
    heading: "User Conduct",
    body: ["When using our Services, you agree not to engage in unlawful or harmful activities, including:"],
    list: [
      "Violating any applicable laws or regulations",
      "Distributing spam or unsolicited communications",
      "Transmitting viruses or other malicious code",
      "Attempting unauthorized access to our systems or data",
    ],
  },
  {
    heading: "Intellectual Property",
    body: [
      "All content on the Services, including text, graphics, logos, and images, is the property of EVNoire and is protected by applicable intellectual property laws.",
      "Reproduction, distribution, or use of this content requires our prior written permission.",
    ],
  },
  {
    heading: "Third-Party Links",
    body: [
      "Our Services may contain links to third-party websites. We are not responsible for the content or practices of those websites. Accessing them is at your own risk.",
    ],
  },
  {
    heading: "Mobile Terms",
    body: [
      "By opting in to SMS, you consent to receive recurring text messages. Standard message and data rates may apply. You may reply STOP to unsubscribe or HELP for support.",
    ],
  },
  {
    heading: "Disclaimer",
    body: [
      "Our Services are provided “as is” and “as available” without warranties of any kind, whether express or implied.",
    ],
  },
  {
    heading: "Limitation of Liability",
    body: [
      "To the fullest extent permitted by law, EVNoire disclaims responsibility for any direct, indirect, incidental, or consequential damages arising from your use of the Services.",
    ],
  },
  {
    heading: "Governing Law",
    body: [
      "These Terms are governed by the laws of the State of Georgia, without regard to its conflict-of-law principles.",
    ],
  },
  {
    heading: "Changes to Terms",
    body: [
      "We may update these Terms from time to time. Your continued use of the Services constitutes your acceptance of any changes.",
    ],
  },
];

const TermsConditions = () => (
  <LegalLayout
    badge="Terms & Conditions"
    title="Terms &"
    highlight="Conditions"
    icon={FileText}
    intro="Please read these Terms and Conditions carefully before using our website and services."
    effectiveDate="January 1, 2026"
    sections={sections}
  />
);

export default TermsConditions;
