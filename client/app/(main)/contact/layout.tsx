import { Metadata } from "next";
import { appName } from "@/utils/data";

export const metadata: Metadata = {
  title: `Contact Us - ${appName}`,
  description:
    "Get in touch with our team. Send us your questions, feedback, or support requests.",
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
