import Link from "next/link";
import Image from "next/image";
import { appName } from "@/utils/data";
import { FaGithub, FaTwitter, FaLinkedinIn } from "react-icons/fa";

export default function Footer() {
  const footerLinks = [
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" },
    { name: "Events", href: "/events" },
    { name: "Privacy", href: "/privacy" },
    { name: "Terms", href: "/terms" },
  ];

  const socialLinks = [
    { icon: FaGithub, href: "https://github.com", label: "GitHub" },
    { icon: FaTwitter, href: "https://twitter.com", label: "Twitter" },
    { icon: FaLinkedinIn, href: "https://linkedin.com", label: "LinkedIn" },
  ];

  return (
    <footer className="border-border bg-muted/30 mt-20 w-full border-t">
      <div className="container mx-auto px-4 py-8">
        {/* Main Content */}
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <Image
              src="/logos/stocks-learners-logo.png"
              alt={`${appName} Logo`}
              width={32}
              height={32}
              className="h-8 w-8"
            />
            <span className="text-lg font-bold">{appName}</span>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap items-center justify-center gap-6">
            {footerLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-muted-foreground hover:text-primary text-sm transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Social Links */}
          <div className="flex gap-3">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.label}
                className="hover:bg-primary hover:text-primary-foreground bg-muted flex h-9 w-9 items-center justify-center rounded-md transition-colors"
              >
                <social.icon size={18} />
              </a>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="border-border my-6 border-t" />

        {/* Bottom Section */}
        <div className="flex flex-col items-center justify-between gap-4 text-center md:flex-row md:text-left">
          <p className="text-muted-foreground text-xs">
            © {new Date().getFullYear()} {appName}. Virtual trading platform
            for educational purposes only.
          </p>
          <p className="text-muted-foreground text-xs">
            All trades are simulated with virtual money.
          </p>
        </div>
      </div>
    </footer>
  );
}
