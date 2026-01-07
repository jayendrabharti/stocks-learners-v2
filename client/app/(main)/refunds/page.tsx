import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { appName } from "@/utils/data";
import {
  RefreshCcw,
  XCircle,
  Clock,
  PackageX,
  AlertTriangle,
  ShieldCheck,
  Mail,
} from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: `Cancellations & Refunds - ${appName}`,
  description:
    "Learn about our cancellation and refund policies for event registrations and other paid services on our virtual stock trading platform.",
};

export default function RefundsPolicyPage() {
  const lastUpdated = "January 7, 2026";

  const sections = [
    {
      icon: RefreshCcw,
      title: "Cancellation Policy",
      content: [
        {
          subtitle: "Cancellation Window",
          text: "YASH RAJ SINGH believes in helping its customers as far as possible, and has therefore a liberal cancellation policy. Cancellations will be considered only if the request is made within 3-5 days of placing the order.",
        },
        {
          subtitle: "Processing Limitations",
          text: "The cancellation request may not be entertained if the orders have been communicated to the vendors/merchants and they have initiated the process of shipping them.",
        },
      ],
    },
    {
      icon: PackageX,
      title: "Non-Cancellable Items",
      content: [
        {
          subtitle: "Perishable Items",
          text: "YASH RAJ SINGH does not accept cancellation requests for perishable items like flowers, eatables etc. However, refund/replacement can be made if the customer establishes that the quality of product delivered is not good.",
        },
      ],
    },
    {
      icon: AlertTriangle,
      title: "Damaged or Defective Items",
      content: [
        {
          subtitle: "Reporting Damaged Items",
          text: "In case of receipt of damaged or defective items please report the same to our Customer Service team. The request will, however, be entertained once the merchant has checked and determined the same at his own end.",
        },
        {
          subtitle: "Reporting Timeline",
          text: "This should be reported within 3-5 days of receipt of the products.",
        },
      ],
    },
    {
      icon: XCircle,
      title: "Product Discrepancy",
      content: [
        {
          subtitle: "Product Not As Described",
          text: "In case you feel that the product received is not as shown on the site or as per your expectations, you must bring it to the notice of our customer service within 3-5 days of receiving the product.",
        },
        {
          subtitle: "Complaint Resolution",
          text: "The Customer Service Team after looking into your complaint will take an appropriate decision.",
        },
      ],
    },
    {
      icon: ShieldCheck,
      title: "Warranty Claims",
      content: [
        {
          subtitle: "Manufacturer Warranty",
          text: "In case of complaints regarding products that come with a warranty from manufacturers, please refer the issue to them directly.",
        },
      ],
    },
    {
      icon: Clock,
      title: "Refund Processing",
      content: [
        {
          subtitle: "Processing Time",
          text: "In case of any Refunds approved by YASH RAJ SINGH, it'll take 3-5 days for the refund to be processed to the end customer.",
        },
        {
          subtitle: "Refund Method",
          text: "Refunds will be credited to the original payment method used during the transaction.",
        },
      ],
    },
    {
      icon: Mail,
      title: "Contact Us",
      content: [
        {
          subtitle: "Customer Service",
          text: "For refund requests or questions about this policy, please contact us at contact.yashrajthakur@gmail.com or visit our Contact page. Include your order details for faster processing.",
        },
        {
          subtitle: "Policy Updates",
          text: "We reserve the right to modify this policy at any time. Changes will be posted on this page with an updated revision date. Continued use of our services after changes constitutes acceptance of the updated policy.",
        },
      ],
    },
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-12 text-center">
        <div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
          <RefreshCcw className="text-primary h-8 w-8" />
        </div>
        <h1 className="mb-3 text-4xl font-bold tracking-tight">
          Cancellations & Refunds
        </h1>
        <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
          Our policy on cancellations, refunds, and related processes for paid
          services on {appName}.
        </p>
        <p className="text-muted-foreground mt-2 text-sm">
          Last Updated: {lastUpdated}
        </p>
      </div>

      {/* Introduction */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <p className="text-muted-foreground leading-relaxed">
            YASH RAJ SINGH believes in helping its customers as far as possible,
            and has therefore a liberal cancellation policy. This Cancellation
            and Refund Policy outlines the terms and conditions under which you
            may cancel your orders or request refunds. Please read this policy
            carefully before making any purchases on our platform.
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
      <Card className="mt-8 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30">
        <CardContent className="pt-6">
          <h3 className="mb-2 font-semibold text-blue-900 dark:text-blue-100">
            Important Notice
          </h3>
          <p className="text-sm leading-relaxed text-blue-700 dark:text-blue-300">
            All cancellation and refund requests are subject to review by our
            team. Processing times may vary based on the payment method and
            banking procedures. For any queries, please reach out to our
            customer service team.
          </p>
        </CardContent>
      </Card>

      {/* Footer Note */}
      <div className="text-muted-foreground mt-12 text-center text-sm">
        <p>
          For questions or concerns about this Cancellation & Refund Policy,
          please{" "}
          <a href="/contact" className="text-primary hover:underline">
            contact us
          </a>
          .
        </p>
      </div>
    </div>
  );
}
