import Link from "next/link";
import Image from "next/image";
import { appName } from "@/utils/data";
import {
  FaTwitter,
  FaInstagram,
  FaFacebookF,
  FaLinkedinIn,
  FaYoutube,
} from "react-icons/fa";
import { SiApple, SiGoogleplay } from "react-icons/si";

export default function Footer() {
  const footerLinks = {
    company: [
      { name: "About Us", href: "/about" },
      { name: "Pricing", href: "/pricing" },
      { name: "Blog", href: "/blog" },
      { name: "Careers", href: "/careers" },
      { name: "Help & Support", href: "/contact" },
    ],
    products: [
      { name: "Stocks", href: "/stocks" },
      { name: "Watchlist", href: "/stocks/watchlist" },
      { name: "Portfolio", href: "/stocks/portfolio" },
      { name: "Indices", href: "/stocks/indices" },
      { name: "Stock Screener", href: "/stocks/screener" },
    ],
    resources: [
      { name: "Market News", href: "/news" },
      { name: "Trading Guide", href: "/guide" },
      { name: "FAQs", href: "/faq" },
      { name: "Terms & Conditions", href: "/terms" },
      { name: "Privacy Policy", href: "/privacy" },
    ],
  };

  const socialLinks = [
    { icon: FaTwitter, href: "https://twitter.com", label: "Twitter" },
    { icon: FaInstagram, href: "https://instagram.com", label: "Instagram" },
    { icon: FaFacebookF, href: "https://facebook.com", label: "Facebook" },
    { icon: FaLinkedinIn, href: "https://linkedin.com", label: "LinkedIn" },
    { icon: FaYoutube, href: "https://youtube.com", label: "YouTube" },
  ];

  const marketLinks = {
    exchanges: [
      { name: "NSE", href: "https://www.nseindia.com/" },
      { name: "BSE", href: "https://www.bseindia.com/" },
      { name: "MCX", href: "https://www.mcxindia.com/" },
    ],
    legal: [
      { name: "Terms and Conditions", href: "/terms" },
      { name: "Policies and Procedures", href: "/policies" },
      { name: "Privacy Policy", href: "/privacy" },
      { name: "Disclosure", href: "/disclosure" },
    ],
  };

  return (
    <footer className="bg-muted/30 border-border mt-20 w-full border-t">
      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          {/* Left Section - Brand & Contact */}
          <div className="lg:col-span-4">
            <Link href="/" className="mb-6 inline-block">
              <div className="flex items-center gap-3">
                <Image
                  src="/logos/stocks-learners-logo.png"
                  alt={`${appName} Logo`}
                  width={40}
                  height={40}
                  className="h-10 w-10"
                />
                <span className="text-2xl font-bold">{appName}</span>
              </div>
            </Link>

            <div className="text-muted-foreground mb-6 space-y-1 text-sm">
              <p>Virtual Stock Trading Platform</p>
              <p>Practice Trading Without Risk</p>
              <p>Learn & Grow Your Skills</p>
            </div>

            {/* Contact Information */}
            <div className="mb-6 space-y-2">
              <Link
                href="/contact"
                className="text-primary block text-sm font-medium hover:underline"
              >
                Contact Us
              </Link>
              <div className="text-muted-foreground space-y-1 text-sm">
                <p className="font-medium">Support & Inquiries:</p>
                <a
                  href="mailto:contact.yashrajthakur@gmail.com"
                  className="hover:text-primary transition-colors"
                >
                  contact.yashrajthakur@gmail.com
                </a>
              </div>
            </div>

            {/* Social Media Links */}
            <div className="mb-6">
              <div className="flex gap-3">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="bg-muted hover:bg-primary hover:text-primary-foreground flex h-9 w-9 items-center justify-center rounded-md transition-colors"
                  >
                    <social.icon size={16} />
                  </a>
                ))}
              </div>
            </div>

            {/* Download App Section */}
            <div>
              <p className="mb-3 text-sm font-medium">Download the App</p>
              <div className="flex gap-3">
                <a
                  href="#"
                  className="border-border hover:bg-muted flex items-center gap-2 rounded-lg border px-3 py-2 transition-colors"
                >
                  <SiApple size={20} />
                  <span className="text-xs">App Store</span>
                </a>
                <a
                  href="#"
                  className="border-border hover:bg-muted flex items-center gap-2 rounded-lg border px-3 py-2 transition-colors"
                >
                  <SiGoogleplay size={20} />
                  <span className="text-xs">Play Store</span>
                </a>
              </div>
            </div>
          </div>

          {/* Right Section - Links */}
          <div className="lg:col-span-8">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
              {/* Company Links */}
              <div>
                <h3 className="mb-4 text-sm font-semibold tracking-wide uppercase">
                  {appName.toUpperCase()}
                </h3>
                <ul className="space-y-2">
                  {footerLinks.company.map((link) => (
                    <li key={link.name}>
                      <Link
                        href={link.href}
                        className="text-muted-foreground hover:text-primary text-sm transition-colors"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Products Links */}
              <div>
                <h3 className="mb-4 text-sm font-semibold tracking-wide uppercase">
                  PRODUCTS
                </h3>
                <ul className="space-y-2">
                  {footerLinks.products.map((link) => (
                    <li key={link.name}>
                      <Link
                        href={link.href}
                        className="text-muted-foreground hover:text-primary text-sm transition-colors"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Resources Links */}
              <div>
                <h3 className="mb-4 text-sm font-semibold tracking-wide uppercase">
                  RESOURCES
                </h3>
                <ul className="space-y-2">
                  {footerLinks.resources.map((link) => (
                    <li key={link.name}>
                      <Link
                        href={link.href}
                        className="text-muted-foreground hover:text-primary text-sm transition-colors"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright & Version */}
        <div className="border-border mt-8 flex flex-col items-center justify-between gap-4 border-t pt-8 sm:flex-row">
          <p className="text-muted-foreground text-sm">
            © 2016-{new Date().getFullYear()} {appName}. All rights reserved.
          </p>
          <p className="text-muted-foreground text-sm">Version: 1.0.0</p>
        </div>

        {/* Others Section */}
        <div className="border-border mt-8 border-t pt-8">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold">Others:</span>
            <div className="flex flex-wrap items-center gap-2">
              {marketLinks.exchanges.map((link, index) => (
                <span key={link.name} className="flex items-center">
                  <a
                    href={link.href}
                    target="_blank"
                    rel="nofollow noreferrer"
                    className="text-muted-foreground hover:text-primary text-sm transition-colors"
                  >
                    {link.name}
                  </a>
                  {index < marketLinks.exchanges.length - 1 && (
                    <span className="text-muted-foreground mx-2">•</span>
                  )}
                </span>
              ))}
              <span className="text-muted-foreground mx-2">•</span>
              {marketLinks.legal.map((link, index) => (
                <span key={link.name} className="flex items-center">
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-primary text-sm transition-colors"
                  >
                    {link.name}
                  </Link>
                  {index < marketLinks.legal.length - 1 && (
                    <span className="text-muted-foreground mx-2">•</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="border-border mt-8 border-t pt-8">
          <p className="text-muted-foreground text-center text-xs leading-relaxed">
            <strong>Disclaimer:</strong> {appName} is a virtual stock trading
            platform for educational purposes only. All trades are simulated
            with virtual money. This platform does not provide real trading
            services. Past performance is not indicative of future results.
            Please consult a certified financial advisor before making any
            investment decisions.
          </p>
        </div>
      </div>
    </footer>
  );
}
