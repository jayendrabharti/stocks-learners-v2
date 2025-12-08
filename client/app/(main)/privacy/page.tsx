import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { appName } from "@/utils/data";
import { Shield, Lock, Eye, Database, UserCheck, Mail } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: `Privacy Policy - ${appName}`,
  description:
    "Learn how we collect, use, and protect your data on our virtual stock trading platform. Your privacy and security are our top priorities.",
};

export default function PrivacyPolicyPage() {
  const lastUpdated = "December 8, 2025";

  const sections = [
    {
      icon: Database,
      title: "Information We Collect",
      content: [
        {
          subtitle: "Account Information",
          text: "When you create an account, we collect your name, email address, and authentication credentials through Google OAuth. This information is necessary to provide you with access to our virtual trading platform.",
        },
        {
          subtitle: "Trading Activity",
          text: "We collect and store data about your virtual trading activities, including stock purchases, sales, portfolio positions, watchlists, and transaction history. This data is used solely for educational purposes and platform functionality.",
        },
        {
          subtitle: "Usage Information",
          text: "We automatically collect information about how you interact with our platform, including pages visited, features used, and time spent on the platform. This helps us improve the user experience.",
        },
      ],
    },
    {
      icon: Lock,
      title: "How We Use Your Information",
      content: [
        {
          subtitle: "Platform Functionality",
          text: "Your information is used to provide core platform features, including portfolio management, trade execution simulation, event participation, and leaderboard rankings.",
        },
        {
          subtitle: "Communication",
          text: "We may use your email address to send important platform updates, event notifications, and educational content related to virtual trading.",
        },
        {
          subtitle: "Analytics & Improvement",
          text: "Aggregated, anonymized data may be used to analyze platform usage patterns and improve our services. Individual user data is never sold or shared with third parties.",
        },
      ],
    },
    {
      icon: Shield,
      title: "Data Security",
      content: [
        {
          subtitle: "Protection Measures",
          text: "We implement industry-standard security measures to protect your personal information, including encrypted connections (HTTPS), secure authentication tokens (JWT), and secure database storage.",
        },
        {
          subtitle: "Access Controls",
          text: "Access to user data is restricted to authorized personnel only and is used solely for platform maintenance and support purposes.",
        },
        {
          subtitle: "Data Retention",
          text: "We retain your account information and trading data for as long as your account is active. You may request account deletion at any time through our contact page.",
        },
      ],
    },
    {
      icon: Eye,
      title: "Information Sharing",
      content: [
        {
          subtitle: "Third-Party Services",
          text: "We use Google OAuth for authentication. By using our platform, you consent to Google's privacy policies regarding authentication services.",
        },
        {
          subtitle: "Legal Requirements",
          text: "We may disclose your information if required by law, court order, or governmental request, or to protect the rights, property, or safety of our platform and users.",
        },
        {
          subtitle: "No Sale of Data",
          text: "We do not sell, rent, or trade your personal information to third parties for marketing purposes.",
        },
      ],
    },
    {
      icon: UserCheck,
      title: "Your Rights",
      content: [
        {
          subtitle: "Access & Correction",
          text: "You have the right to access, update, or correct your personal information at any time through your account settings.",
        },
        {
          subtitle: "Data Deletion",
          text: "You may request deletion of your account and associated data by contacting us. Some data may be retained for legal or legitimate business purposes.",
        },
        {
          subtitle: "Opt-Out",
          text: "You can opt out of non-essential communications at any time through your account preferences.",
        },
      ],
    },
    {
      icon: Mail,
      title: "Contact Us",
      content: [
        {
          subtitle: "Privacy Questions",
          text: "If you have any questions about this Privacy Policy or how we handle your data, please contact us at contact.yashrajthakur@gmail.com or visit our Contact page.",
        },
        {
          subtitle: "Policy Updates",
          text: "We may update this Privacy Policy from time to time. Significant changes will be communicated via email or platform notification. Continued use of the platform after changes constitutes acceptance of the updated policy.",
        },
      ],
    },
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-12 text-center">
        <div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
          <Shield className="text-primary h-8 w-8" />
        </div>
        <h1 className="mb-3 text-4xl font-bold tracking-tight">
          Privacy Policy
        </h1>
        <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
          Your privacy is important to us. This policy explains how {appName}{" "}
          collects, uses, and protects your personal information.
        </p>
        <p className="text-muted-foreground mt-2 text-sm">
          Last Updated: {lastUpdated}
        </p>
      </div>

      {/* Introduction */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <p className="text-muted-foreground leading-relaxed">
            {appName} ("we", "our", or "us") is committed to protecting your
            privacy. This Privacy Policy describes how we collect, use,
            disclose, and safeguard your information when you use our virtual
            stock trading platform. Please read this policy carefully. By using{" "}
            {appName}, you agree to the collection and use of information in
            accordance with this policy.
          </p>
        </CardContent>
      </Card>

      {/* Policy Sections */}
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
                  <h3 className="mb-2 font-semibold">{item.subtitle}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {item.text}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Important Notice */}
      <Card className="mt-8 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
        <CardContent className="pt-6">
          <h3 className="mb-2 font-semibold text-amber-900 dark:text-amber-100">
            Virtual Trading Platform Notice
          </h3>
          <p className="text-sm leading-relaxed text-amber-700 dark:text-amber-300">
            {appName} is a virtual trading platform for educational purposes
            only. All trades are simulated with virtual money. We do not collect
            or process any real financial transactions, banking information, or
            investment data. No real money is involved in any trading activities
            on this platform.
          </p>
        </CardContent>
      </Card>

      {/* Footer Note */}
      <div className="text-muted-foreground mt-12 text-center text-sm">
        <p>
          For questions or concerns about this Privacy Policy, please{" "}
          <a href="/contact" className="text-primary hover:underline">
            contact us
          </a>
          .
        </p>
      </div>
    </div>
  );
}
