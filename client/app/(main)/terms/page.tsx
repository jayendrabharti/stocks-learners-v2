import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { appName } from "@/utils/data";
import {
  FileText,
  AlertTriangle,
  Scale,
  UserX,
  Shield,
  Gavel,
} from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: `Terms & Conditions - ${appName}`,
  description:
    "Read our terms of service for using the virtual stock trading platform. Understand your rights, responsibilities, and how we operate.",
};

type ContentItem = {
  subtitle?: string;
  text: string;
};

type Section = {
  icon: typeof FileText;
  title: string;
  content: ContentItem[];
};

export default function TermsPage() {
  const lastUpdated = "December 8, 2025";

  const sections: Section[] = [
    {
      icon: FileText,
      title: "Acceptance of Terms",
      content: [
        {
          text: `By accessing or using ${appName}, you agree to be bound by these Terms and Conditions and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this platform.`,
        },
        {
          text: "We reserve the right to modify these terms at any time. Your continued use of the platform after changes are posted constitutes acceptance of the modified terms.",
        },
      ],
    },
    {
      icon: AlertTriangle,
      title: "Educational Platform Disclaimer",
      content: [
        {
          subtitle: "Virtual Trading Only",
          text: `${appName} is a virtual stock trading platform designed exclusively for educational purposes. All trading activities on this platform are simulated using virtual currency and do not involve real money or real financial markets.`,
        },
        {
          subtitle: "No Real Trading Services",
          text: "We do not provide real stock trading, brokerage services, or investment advice. This platform does not execute real trades on any stock exchange. Users cannot deposit or withdraw real money.",
        },
        {
          subtitle: "No Financial Advice",
          text: "Nothing on this platform constitutes financial, investment, legal, or tax advice. All information is provided for educational purposes only. Consult a certified financial advisor before making any real investment decisions.",
        },
        {
          subtitle: "Past Performance",
          text: "Virtual trading performance on this platform is not indicative of future results in real markets. Virtual trading success does not guarantee real trading success.",
        },
      ],
    },
    {
      icon: Scale,
      title: "User Responsibilities",
      content: [
        {
          subtitle: "Account Security",
          text: "You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorized access to your account.",
        },
        {
          subtitle: "Prohibited Activities",
          text: "You agree not to: (a) use the platform for any illegal purpose; (b) attempt to gain unauthorized access to any part of the platform; (c) interfere with other users' use of the platform; (d) use automated systems or software to extract data from the platform; (e) impersonate any person or entity; (f) manipulate virtual trading activities to gain unfair advantages.",
        },
        {
          subtitle: "Accurate Information",
          text: "You agree to provide accurate, current, and complete information during registration and to update such information as necessary.",
        },
      ],
    },
    {
      icon: UserX,
      title: "Account Termination",
      content: [
        {
          subtitle: "Your Right to Terminate",
          text: "You may delete your account at any time through the account settings or by contacting us. Upon deletion, your account data will be removed in accordance with our Privacy Policy.",
        },
        {
          subtitle: "Our Right to Terminate",
          text: "We reserve the right to suspend or terminate your account and access to the platform at our sole discretion, without notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties, or for any other reason.",
        },
        {
          subtitle: "Effect of Termination",
          text: "Upon termination, your right to use the platform will immediately cease. All provisions of these Terms which by their nature should survive termination shall survive, including ownership provisions, warranty disclaimers, and limitations of liability.",
        },
      ],
    },
    {
      icon: Shield,
      title: "Intellectual Property",
      content: [
        {
          subtitle: "Platform Ownership",
          text: `All content, features, and functionality of ${appName}, including but not limited to text, graphics, logos, icons, images, software, and data compilations, are the exclusive property of ${appName} or its licensors.`,
        },
        {
          subtitle: "Limited License",
          text: "We grant you a limited, non-exclusive, non-transferable license to access and use the platform for personal, educational purposes in accordance with these Terms.",
        },
        {
          subtitle: "Restrictions",
          text: "You may not reproduce, distribute, modify, create derivative works, publicly display, republish, download, store, or transmit any material from our platform without prior written consent.",
        },
      ],
    },
    {
      icon: Gavel,
      title: "Limitation of Liability",
      content: [
        {
          subtitle: "No Warranties",
          text: "The platform is provided on an 'as is' and 'as available' basis without warranties of any kind, either express or implied. We do not warrant that the platform will be uninterrupted, error-free, or free of viruses or other harmful components.",
        },
        {
          subtitle: "Limitation of Damages",
          text: `To the fullest extent permitted by law, ${appName} shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the platform.`,
        },
        {
          subtitle: "Maximum Liability",
          text: "Our total liability to you for all claims arising from or related to the platform is limited to the amount you paid us in the past 12 months, or ₹100, whichever is greater.",
        },
      ],
    },
  ];

  const additionalTerms = [
    {
      title: "Events and Competitions",
      points: [
        "Participation in virtual trading events is subject to additional event-specific rules.",
        "Event registration fees (if any) are non-refundable once the event begins.",
        "We reserve the right to modify, suspend, or cancel events at any time.",
        "Prize distributions (if applicable) are at our sole discretion and subject to verification.",
      ],
    },
    {
      title: "Data and Privacy",
      points: [
        "Your use of the platform is also governed by our Privacy Policy.",
        "We collect and use data as described in our Privacy Policy.",
        "You consent to the collection, use, and sharing of your information as described.",
      ],
    },
    {
      title: "Governing Law",
      points: [
        "These Terms shall be governed by and construed in accordance with the laws of India.",
        "Any disputes arising from these Terms or your use of the platform shall be subject to the exclusive jurisdiction of courts in India.",
      ],
    },
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-12 text-center">
        <div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
          <FileText className="text-primary h-8 w-8" />
        </div>
        <h1 className="mb-3 text-4xl font-bold tracking-tight">
          Terms & Conditions
        </h1>
        <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
          Please read these terms carefully before using {appName}. By using our
          platform, you agree to these terms.
        </p>
        <p className="text-muted-foreground mt-2 text-sm">
          Last Updated: {lastUpdated}
        </p>
      </div>

      {/* Important Notice */}
      <Card className="mb-8 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30">
        <CardContent className="pt-6">
          <h3 className="mb-2 flex items-center gap-2 font-semibold text-red-900 dark:text-red-100">
            <AlertTriangle className="h-5 w-5" />
            Important Notice
          </h3>
          <p className="text-sm leading-relaxed text-red-700 dark:text-red-300">
            {appName} is a virtual trading platform for educational purposes
            only. All trades are simulated with virtual money. This platform
            does not provide real trading services. No real money is involved.
            Past performance on this platform does not indicate future results
            in real markets. Always consult a certified financial advisor before
            making real investment decisions.
          </p>
        </CardContent>
      </Card>

      {/* Main Sections */}
      <div className="space-y-8">
        {sections.map((section, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
                  <section.icon className="text-primary h-5 w-5" />
                </div>
                {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {section.content.map((item, itemIndex) => (
                <div key={itemIndex}>
                  {item.subtitle && (
                    <h3 className="mb-2 font-semibold">{item.subtitle}</h3>
                  )}
                  <p className="text-muted-foreground leading-relaxed">
                    {item.text}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Additional Terms */}
      <div className="mt-8 space-y-6">
        {additionalTerms.map((term, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="text-xl">{term.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-muted-foreground space-y-2">
                {term.points.map((point, pointIndex) => (
                  <li key={pointIndex} className="flex gap-3">
                    <span className="text-primary bg-primary mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" />
                    <span className="leading-relaxed">{point}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Contact Section */}
      <Card className="mt-8">
        <CardContent className="pt-6">
          <h3 className="mb-2 font-semibold">Questions About These Terms?</h3>
          <p className="text-muted-foreground leading-relaxed">
            If you have any questions or concerns about these Terms and
            Conditions, please{" "}
            <a href="/contact" className="text-primary hover:underline">
              contact us
            </a>{" "}
            or email us at contact.yashrajthakur@gmail.com.
          </p>
        </CardContent>
      </Card>

      {/* Acknowledgment */}
      <div className="text-muted-foreground mt-12 text-center text-sm">
        <p>
          By using {appName}, you acknowledge that you have read, understood,
          and agree to be bound by these Terms and Conditions.
        </p>
      </div>
    </div>
  );
}
