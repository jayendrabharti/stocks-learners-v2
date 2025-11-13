"use client";

import React from "react";
import Link from "next/link";
import {
  Shield,
  Target,
  Users,
  BarChart3,
  ArrowRight,
  CheckCircle,
  Zap,
  PiggyBank,
  Activity,
  Brain,
  Lightbulb,
  Award,
  TrendingUp,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  const features = [
    {
      icon: <PiggyBank className="h-8 w-8" />,
      title: "₹10 Lakh Virtual Money",
      description:
        "Start with ₹10,00,000 virtual cash to practice trading. Learn without any financial risk to your real money.",
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/50",
      hoverBg: "group-hover:bg-emerald-600 dark:group-hover:bg-emerald-500",
    },
    {
      icon: <Activity className="h-8 w-8" />,
      title: "Live Market Data",
      description:
        "Access real-time stock prices, market movements, and live data from NSE and BSE exchanges.",
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950/50",
      hoverBg: "group-hover:bg-blue-600 dark:group-hover:bg-blue-500",
    },
    {
      icon: <Target className="h-8 w-8" />,
      title: "Portfolio Management",
      description:
        "Track your virtual investments, monitor profit/loss, and analyze your trading performance in real-time.",
      color: "text-violet-600 dark:text-violet-400",
      bgColor: "bg-violet-50 dark:bg-violet-950/50",
      hoverBg: "group-hover:bg-violet-600 dark:group-hover:bg-violet-500",
    },
    {
      icon: <Brain className="h-8 w-8" />,
      title: "Trading Education",
      description:
        "Learn stock market fundamentals, trading strategies, and risk management without losing real money.",
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-50 dark:bg-amber-950/50",
      hoverBg: "group-hover:bg-amber-600 dark:group-hover:bg-amber-500",
    },
    {
      icon: <BarChart3 className="h-8 w-8" />,
      title: "Real Market Conditions",
      description:
        "Experience actual market volatility, price movements, and trading scenarios in a safe environment.",
      color: "text-rose-600 dark:text-rose-400",
      bgColor: "bg-rose-50 dark:bg-rose-950/50",
      hoverBg: "group-hover:bg-rose-600 dark:group-hover:bg-rose-500",
    },
    {
      icon: <Lightbulb className="h-8 w-8" />,
      title: "Strategy Testing",
      description:
        "Test different trading strategies and investment approaches before applying them with real money.",
      color: "text-cyan-600 dark:text-cyan-400",
      bgColor: "bg-cyan-50 dark:bg-cyan-950/50",
      hoverBg: "group-hover:bg-cyan-600 dark:group-hover:bg-cyan-500",
    },
  ];

  const benefits = [
    "Practice trading with ₹10 lakh virtual money completely risk-free",
    "Learn from real market data and live price movements",
    "Build confidence and develop trading skills before investing real money",
    "Test and refine your investment strategies without financial consequences",
    "Understand market volatility and timing without real losses",
    "Access comprehensive portfolio tracking and performance analytics",
    "Experience real trading scenarios in a safe learning environment",
    "No registration fees, hidden costs, or financial commitments required",
  ];

  const learningStats = [
    {
      icon: <Shield className="h-10 w-10" />,
      title: "100% Risk-Free",
      description:
        "Learn trading without any financial risk to your real money",
      highlight: "Safe Learning",
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/50",
      badgeBg: "bg-emerald-100 dark:bg-emerald-900/30",
      badgeText: "text-emerald-700 dark:text-emerald-300",
    },
    {
      icon: <Activity className="h-10 w-10" />,
      title: "Real Market Data",
      description:
        "Practice with live stock prices and actual market conditions",
      highlight: "Live Data",
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950/50",
      badgeBg: "bg-blue-100 dark:bg-blue-900/30",
      badgeText: "text-blue-700 dark:text-blue-300",
    },
    {
      icon: <Award className="h-10 w-10" />,
      title: "Comprehensive Training",
      description:
        "Build skills from basic concepts to advanced trading strategies",
      highlight: "Full Education",
      color: "text-violet-600 dark:text-violet-400",
      bgColor: "bg-violet-50 dark:bg-violet-950/50",
      badgeBg: "bg-violet-100 dark:bg-violet-900/30",
      badgeText: "text-violet-700 dark:text-violet-300",
    },
  ];

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="from-background via-muted/20 to-background relative overflow-hidden border-b bg-linear-to-b px-6 pt-16 pb-20 md:pt-24 md:pb-28">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 opacity-30">
            <div className="h-[500px] w-[500px] rounded-full bg-linear-to-br from-emerald-400/20 via-blue-400/20 to-violet-400/20 blur-3xl" />
          </div>
        </div>

        <div className="mx-auto max-w-7xl">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Left content */}
            <div className="space-y-8">
              <div className="space-y-6">
                <Badge variant="secondary" className="text-sm font-medium">
                  <TrendingUp className="mr-1.5 h-3.5 w-3.5" />
                  Virtual Trading Platform
                </Badge>
                <h1 className="text-foreground text-4xl leading-tight font-bold tracking-tight md:text-5xl lg:text-6xl">
                  Practice Stock Trading with{" "}
                  <span className="bg-linear-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent dark:from-emerald-400 dark:to-blue-400">
                    Virtual Money
                  </span>
                </h1>
                <p className="text-muted-foreground text-lg leading-relaxed md:text-xl">
                  Master the art of stock trading without risking real money.
                  Start with ₹10,00,000 virtual cash and learn from real market
                  conditions.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button size="lg" className="group" asChild>
                  <Link href="/login">
                    Start Trading Now
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="#features">Learn More</Link>
                </Button>
              </div>

              <div className="text-muted-foreground flex flex-wrap items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-emerald-100 p-1.5 dark:bg-emerald-950">
                    <Shield className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span>100% Safe</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-blue-100 p-1.5 dark:bg-blue-950">
                    <Zap className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span>Real-time Data</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-violet-100 p-1.5 dark:bg-violet-950">
                    <Users className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                  </div>
                  <span>Beginner Friendly</span>
                </div>
              </div>
            </div>

            {/* Right content - Logo */}
            <div className="relative flex items-center justify-center lg:justify-end">
              <div className="relative">
                <div className="absolute inset-0 -z-10 animate-pulse rounded-3xl bg-linear-to-br from-emerald-200/50 via-blue-200/50 to-violet-200/50 blur-2xl dark:from-emerald-900/30 dark:via-blue-900/30 dark:to-violet-900/30" />
                <img
                  src="/logos/stocks-learners-logo-with-title-original.png"
                  alt="StockLearners App Logo"
                  className="relative h-80 w-80 rounded-2xl object-contain"
                  style={{
                    filter: "drop-shadow(0 20px 40px rgb(0 0 0 / 0.1))",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-background px-6 py-20 md:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 space-y-4 text-center">
            <Badge variant="outline" className="mb-4">
              <BookOpen className="mr-1.5 h-3.5 w-3.5" />
              Features
            </Badge>
            <h2 className="text-foreground text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
              Everything You Need to{" "}
              <span className="bg-linear-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent dark:from-emerald-400 dark:to-blue-400">
                Learn Trading
              </span>
            </h2>
            <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
              Professional-grade tools and features to accelerate your trading
              education.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="group relative overflow-hidden border-2 transition-all duration-300 hover:shadow-lg"
              >
                <CardHeader className="pb-4">
                  <div
                    className={`mb-4 flex h-14 w-14 items-center justify-center rounded-xl ${feature.bgColor} ${feature.color} transition-all duration-300 ${feature.hoverBg} group-hover:text-white`}
                  >
                    {feature.icon}
                  </div>
                  <CardTitle className="text-foreground text-xl font-semibold">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-muted/30 border-y px-6 py-20 md:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge variant="outline">
                  <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
                  Benefits
                </Badge>
                <h2 className="text-foreground text-3xl font-bold tracking-tight md:text-4xl">
                  Why Choose Our{" "}
                  <span className="bg-linear-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent dark:from-emerald-400 dark:to-blue-400">
                    Trading Platform?
                  </span>
                </h2>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Master stock trading with our comprehensive virtual trading
                  platform designed for learners and practice.
                </p>
              </div>

              <div className="space-y-3">
                {benefits.map((benefit, index) => (
                  <div
                    key={index}
                    className="bg-background/60 hover:bg-background flex items-start gap-3 rounded-lg p-3 transition-colors"
                  >
                    <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-foreground text-sm leading-relaxed">
                      {benefit}
                    </span>
                  </div>
                ))}
              </div>

              <Button size="lg" className="group" asChild>
                <Link href="/login">
                  Get Started Today
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>

            <div className="relative hidden lg:block">
              <Card className="border-2">
                <CardContent className="p-8">
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="rounded-xl bg-linear-to-br from-emerald-500 to-emerald-600 p-4 shadow-lg">
                        <BarChart3 className="h-10 w-10 text-white" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-3/4 rounded-full bg-linear-to-r from-emerald-200 to-emerald-300 dark:from-emerald-800 dark:to-emerald-700" />
                        <div className="h-3 w-1/2 rounded-full bg-linear-to-r from-blue-200 to-blue-300 dark:from-blue-800 dark:to-blue-700" />
                      </div>
                    </div>
                    <div className="bg-muted/50 space-y-3 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="h-2 w-24 rounded-full bg-linear-to-r from-emerald-400 to-emerald-500" />
                        <div className="bg-muted-foreground/20 h-2 w-12 rounded-full" />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="h-2 w-32 rounded-full bg-linear-to-r from-blue-400 to-blue-500" />
                        <div className="bg-muted-foreground/20 h-2 w-16 rounded-full" />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="h-2 w-20 rounded-full bg-linear-to-r from-violet-400 to-violet-500" />
                        <div className="bg-muted-foreground/20 h-2 w-10 rounded-full" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Learning Benefits Section */}
      <section className="bg-background px-6 py-20 md:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <Badge variant="outline" className="mb-4">
              <Brain className="mr-1.5 h-3.5 w-3.5" />
              Learning Benefits
            </Badge>
            <h2 className="text-foreground mb-4 text-3xl font-bold tracking-tight md:text-4xl">
              Why Learn Trading with Virtual Money?
            </h2>
            <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
              Master the stock market without risking your hard-earned money.
              Build skills and confidence first.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {learningStats.map((stat, index) => (
              <Card
                key={index}
                className="border-2 text-center transition-all duration-300 hover:shadow-lg"
              >
                <CardContent className="space-y-6 p-8">
                  <div className="flex justify-center">
                    <div
                      className={`flex h-20 w-20 items-center justify-center rounded-2xl ${stat.bgColor} ${stat.color}`}
                    >
                      {stat.icon}
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className={`${stat.badgeBg} ${stat.badgeText} border-0`}
                  >
                    {stat.highlight}
                  </Badge>
                  <h3 className="text-foreground text-xl font-bold">
                    {stat.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="mt-16 border-2">
            <CardContent className="space-y-6 p-8 text-center md:p-12">
              <h3 className="text-foreground text-2xl font-bold md:text-3xl">
                Perfect for Beginners and Experienced Traders
              </h3>
              <p className="text-muted-foreground mx-auto max-w-3xl text-lg leading-relaxed">
                Whether you're completely new to trading or an experienced
                investor looking to test new strategies, our virtual trading
                platform provides a safe environment to learn, practice, and
                improve your skills without any financial risk.
              </p>
              <Button size="lg" className="group" asChild>
                <Link href="/login">
                  Start Learning Today
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="from-background via-muted/30 to-background relative overflow-hidden border-t bg-linear-to-b px-6 py-20 md:py-28">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-30">
            <div className="h-[600px] w-[600px] rounded-full bg-linear-to-br from-emerald-400/20 via-blue-400/20 to-violet-400/20 blur-3xl" />
          </div>
        </div>

        <div className="mx-auto max-w-4xl">
          <Card className="bg-background/80 border-2 backdrop-blur">
            <CardContent className="space-y-8 p-8 text-center md:p-12">
              <div className="space-y-4">
                <h2 className="text-foreground text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
                  Ready to Start Your Trading Journey?
                </h2>
                <p className="text-muted-foreground mx-auto max-w-2xl text-lg md:text-xl">
                  Begin learning with ₹10 lakh virtual money today. No credit
                  card required, completely free to start.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Button size="lg" className="group" asChild>
                  <Link href="/login">
                    Start Virtual Trading
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="#features">Learn More</Link>
                </Button>
              </div>

              <div className="text-muted-foreground flex flex-wrap items-center justify-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-emerald-100 p-1.5 dark:bg-emerald-950">
                    <Shield className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span>100% Risk-Free</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-blue-100 p-1.5 dark:bg-blue-950">
                    <Zap className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span>Instant Setup</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-violet-100 p-1.5 dark:bg-violet-950">
                    <PiggyBank className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                  </div>
                  <span>Virtual Money</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
