import Link from "next/link";
import {
  BsGithub,
  BsInstagram,
  BsLinkedin,
  BsTwitterX,
  BsFacebook,
  BsYoutube,
  BsTiktok,
  BsDiscord,
  BsWhatsapp,
  BsTelegram,
  BsSnapchat,
  BsPinterest,
  BsReddit,
  BsMedium,
  BsBehance,
  BsDribbble,
  BsSpotify,
  BsTwitch,
} from "react-icons/bs";
import { SiGmail, SiStackoverflow, SiCodepen } from "react-icons/si";
import { FaGlobe } from "react-icons/fa";

interface Social {
  name: string;
  url?: string | null;
  id?: string | null;
}

interface SocialLinkProps {
  social: Social;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}

// Function to detect social media platform from URL
function getSocialIcon(
  url: string | null | undefined,
  name: string,
  size: "sm" | "md" | "lg" = "md"
) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const iconClass = sizeClasses[size];

  if (!url) return <FaGlobe className={iconClass} />;

  const lowercaseUrl = url.toLowerCase();
  const lowercaseName = name.toLowerCase();

  // Check if it's an email address first
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (emailRegex.test(url)) {
    return <SiGmail className={iconClass} />;
  }

  // Platform detection based on URL patterns
  if (lowercaseUrl.includes("github.com"))
    return <BsGithub className={iconClass} />;
  if (lowercaseUrl.includes("linkedin.com"))
    return <BsLinkedin className={iconClass} />;
  if (lowercaseUrl.includes("instagram.com"))
    return <BsInstagram className={iconClass} />;
  if (lowercaseUrl.includes("twitter.com") || lowercaseUrl.includes("x.com"))
    return <BsTwitterX className={iconClass} />;
  if (lowercaseUrl.includes("facebook.com"))
    return <BsFacebook className={iconClass} />;
  if (lowercaseUrl.includes("youtube.com") || lowercaseUrl.includes("youtu.be"))
    return <BsYoutube className={iconClass} />;
  if (lowercaseUrl.includes("tiktok.com"))
    return <BsTiktok className={iconClass} />;
  if (
    lowercaseUrl.includes("discord.com") ||
    lowercaseUrl.includes("discord.gg")
  )
    return <BsDiscord className={iconClass} />;
  if (lowercaseUrl.includes("whatsapp.com") || lowercaseUrl.includes("wa.me"))
    return <BsWhatsapp className={iconClass} />;
  if (lowercaseUrl.includes("telegram.org") || lowercaseUrl.includes("t.me"))
    return <BsTelegram className={iconClass} />;
  if (lowercaseUrl.includes("snapchat.com"))
    return <BsSnapchat className={iconClass} />;
  if (lowercaseUrl.includes("pinterest.com"))
    return <BsPinterest className={iconClass} />;
  if (lowercaseUrl.includes("reddit.com"))
    return <BsReddit className={iconClass} />;
  if (lowercaseUrl.includes("medium.com"))
    return <BsMedium className={iconClass} />;
  if (lowercaseUrl.includes("behance.net"))
    return <BsBehance className={iconClass} />;
  if (lowercaseUrl.includes("dribbble.com"))
    return <BsDribbble className={iconClass} />;
  if (lowercaseUrl.includes("spotify.com"))
    return <BsSpotify className={iconClass} />;
  if (lowercaseUrl.includes("twitch.tv"))
    return <BsTwitch className={iconClass} />;
  if (lowercaseUrl.includes("gmail.com") || lowercaseUrl.includes("mailto:"))
    return <SiGmail className={iconClass} />;
  if (lowercaseUrl.includes("stackoverflow.com"))
    return <SiStackoverflow className={iconClass} />;
  if (lowercaseUrl.includes("codepen.io"))
    return <SiCodepen className={iconClass} />;

  // Fallback: check by name if URL doesn't match
  if (lowercaseName.includes("github"))
    return <BsGithub className={iconClass} />;
  if (lowercaseName.includes("linkedin"))
    return <BsLinkedin className={iconClass} />;
  if (lowercaseName.includes("instagram"))
    return <BsInstagram className={iconClass} />;
  if (lowercaseName.includes("twitter") || lowercaseName.includes("x"))
    return <BsTwitterX className={iconClass} />;
  if (lowercaseName.includes("facebook"))
    return <BsFacebook className={iconClass} />;
  if (lowercaseName.includes("youtube"))
    return <BsYoutube className={iconClass} />;
  if (lowercaseName.includes("tiktok"))
    return <BsTiktok className={iconClass} />;
  if (lowercaseName.includes("discord"))
    return <BsDiscord className={iconClass} />;
  if (lowercaseName.includes("whatsapp"))
    return <BsWhatsapp className={iconClass} />;
  if (lowercaseName.includes("telegram"))
    return <BsTelegram className={iconClass} />;
  if (lowercaseName.includes("snapchat"))
    return <BsSnapchat className={iconClass} />;
  if (lowercaseName.includes("pinterest"))
    return <BsPinterest className={iconClass} />;
  if (lowercaseName.includes("reddit"))
    return <BsReddit className={iconClass} />;
  if (lowercaseName.includes("medium"))
    return <BsMedium className={iconClass} />;
  if (lowercaseName.includes("behance"))
    return <BsBehance className={iconClass} />;
  if (lowercaseName.includes("dribbble"))
    return <BsDribbble className={iconClass} />;
  if (lowercaseName.includes("spotify"))
    return <BsSpotify className={iconClass} />;
  if (lowercaseName.includes("twitch"))
    return <BsTwitch className={iconClass} />;
  if (lowercaseName.includes("email") || lowercaseName.includes("gmail"))
    return <SiGmail className={iconClass} />;
  if (lowercaseName.includes("stackoverflow"))
    return <SiStackoverflow className={iconClass} />;
  if (lowercaseName.includes("codepen"))
    return <SiCodepen className={iconClass} />;

  // Default fallback
  return <FaGlobe className={iconClass} />;
}

// Function to format URL properly
function formatUrl(url: string | null | undefined): string {
  if (!url) return "#";

  // Check if it's an email address
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (emailRegex.test(url)) {
    return `mailto:${url}`;
  }

  // Check if it already has a protocol
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("mailto:")
  ) {
    return url;
  }

  // Default to https for other URLs
  return `https://${url}`;
}

export default function SocialLink({
  social,
  showText = false,
  size = "md",
}: SocialLinkProps) {
  const icon = getSocialIcon(social.url, social.name, size);
  const formattedUrl = formatUrl(social.url);

  return (
    <Link
      href={formattedUrl}
      target="_blank"
      className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 p-2 rounded-md hover:bg-muted/50"
      aria-label={`Visit ${social.name}`}
    >
      {icon}
      {showText && <span className="text-sm">{social.name}</span>}
      {!showText && <span className="sr-only">{social.name}</span>}
    </Link>
  );
}
