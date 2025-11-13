import { Metadata } from "next";
import Link from "next/link";
import { appName } from "@/utils/data";
import {
  Target,
  Users,
  Shield,
  TrendingUp,
  BookOpen,
  Award,
} from "lucide-react";

export const metadata: Metadata = {
  title: `About Us - ${appName}`,
  description: `Learn about ${appName} - Your trusted virtual stock trading platform for learning and practicing trading without risk.`,
};

export default function AboutPage() {
  const features = [
    {
      icon: Target,
      title: "Our Mission",
      description:
        "To democratize stock market education by providing a risk-free environment where anyone can learn trading without losing real money.",
    },
    {
      icon: Users,
      title: "For Everyone",
      description:
        "Whether you're a complete beginner or an experienced trader, our platform helps you practice strategies and learn at your own pace.",
    },
    {
      icon: Shield,
      title: "Risk-Free Learning",
      description:
        "Practice with virtual money, make mistakes, learn from them, and build confidence before entering the real market.",
    },
    {
      icon: TrendingUp,
      title: "Real Market Data",
      description:
        "Experience real-time market data from NSE and BSE exchanges, giving you authentic trading experience.",
    },
    {
      icon: BookOpen,
      title: "Educational Focus",
      description:
        "Learn trading concepts, market analysis, portfolio management, and risk assessment through hands-on practice.",
    },
    {
      icon: Award,
      title: "Build Skills",
      description:
        "Develop trading skills, test strategies, and track your performance over time with detailed analytics.",
    },
  ];

  const team = [
    {
      name: "Market Data",
      description:
        "Real-time stock prices from NSE/BSE exchanges powered by Groww API integration.",
    },
    {
      name: "Virtual Trading",
      description:
        "Simulated trading environment with CNC (delivery) and MIS (intraday) product types.",
    },
    {
      name: "Portfolio Management",
      description:
        "Track your holdings, P&L, and performance with comprehensive portfolio analytics.",
    },
    {
      name: "Watchlist & Alerts",
      description:
        "Monitor your favorite stocks and stay updated with market movements.",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <div className="mx-auto max-w-4xl text-center">
        <h1 className="mb-6 text-4xl font-bold md:text-5xl lg:text-6xl">
          About <span className="text-primary">{appName}</span>
        </h1>
        <p className="text-muted-foreground mb-8 text-lg md:text-xl">
          Your gateway to learning stock market trading without any financial
          risk. Practice, learn, and grow your trading skills with virtual
          money.
        </p>
      </div>

      {/* What We Do Section */}
      <div className="bg-muted/30 my-16 rounded-2xl p-8 md:p-12">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-6 text-3xl font-bold md:text-4xl">What We Do</h2>
          <p className="text-muted-foreground mb-6 text-lg leading-relaxed">
            {appName} is a virtual stock trading platform designed for
            educational purposes. We provide a realistic trading experience
            using real market data but with virtual money, allowing you to learn
            and practice trading strategies without any financial risk.
          </p>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Our platform integrates with NSE and BSE exchanges to provide
            real-time stock prices, historical data, and market indices. You can
            practice buying and selling stocks, track your portfolio
            performance, and understand market dynamics in a safe environment.
          </p>
        </div>
      </div>

      {/* Features Grid */}
      <div className="my-16">
        <h2 className="mb-12 text-center text-3xl font-bold md:text-4xl">
          Why Choose Us
        </h2>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-card hover:border-primary rounded-xl border border-transparent p-6 transition-all hover:shadow-lg"
            >
              <div className="bg-primary/10 text-primary mb-4 inline-flex rounded-lg p-3">
                <feature.icon size={24} />
              </div>
              <h3 className="mb-3 text-xl font-semibold">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Platform Features */}
      <div className="bg-muted/30 my-16 rounded-2xl p-8 md:p-12">
        <h2 className="mb-12 text-center text-3xl font-bold md:text-4xl">
          Platform Features
        </h2>
        <div className="grid gap-8 md:grid-cols-2">
          {team.map((item, index) => (
            <div key={index} className="bg-card rounded-lg p-6">
              <h3 className="mb-3 text-xl font-semibold">{item.name}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Our Story */}
      <div className="my-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-6 text-center text-3xl font-bold md:text-4xl">
            Our Story
          </h2>
          <div className="text-muted-foreground space-y-4 text-lg leading-relaxed">
            <p>
              The stock market can be intimidating for beginners. The fear of
              losing real money often prevents people from learning how to trade
              and invest. We created {appName} to solve this problem.
            </p>
            <p>
              Our platform provides a completely risk-free environment where you
              can practice trading with virtual money. You get access to real
              market data, learn how to analyze stocks, practice different
              trading strategies, and build confidence – all without risking a
              single rupee.
            </p>
            <p>
              Whether you want to learn about intraday trading, delivery-based
              investing, or simply understand how the stock market works,{" "}
              {appName} is your perfect companion. Make mistakes, learn from
              them, and become a better trader before you invest real money.
            </p>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-primary/10 border-primary my-16 rounded-2xl border p-8 text-center md:p-12">
        <h2 className="mb-4 text-3xl font-bold md:text-4xl">
          Ready to Start Learning?
        </h2>
        <p className="text-muted-foreground mx-auto mb-8 max-w-2xl text-lg">
          Join {appName} today and start your journey to becoming a confident
          trader. Practice with ₹10,00,000 virtual cash and real market data.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/login"
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-8 py-3 font-semibold transition-colors"
          >
            Get Started Free
          </Link>
          <Link
            href="/contact"
            className="bg-muted hover:bg-muted/80 rounded-lg px-8 py-3 font-semibold transition-colors"
          >
            Contact Us
          </Link>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="border-border mx-auto max-w-3xl rounded-lg border p-6">
        <h3 className="mb-3 text-lg font-semibold">Important Disclaimer</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {appName} is purely an educational platform. All trading on this
          platform uses virtual money only. This is not a real trading platform
          and does not provide actual brokerage services. Past performance in
          virtual trading does not guarantee future results in real trading.
          Always consult with a certified financial advisor before making real
          investment decisions. We are not responsible for any financial losses
          incurred in real trading based on practice on this platform.
        </p>
      </div>
    </div>
  );
}
