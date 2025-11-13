"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/providers/SessionProvider";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import { appName } from "@/utils/data";
import { toast } from "sonner";
import ApiClient from "@/utils/ApiClient";

export default function ContactPage() {
  const { user } = useSession();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    mobile: "",
    message: "",
  });

  // Update form when user loads
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        email: user.email || prev.email,
        name: user.name || prev.name,
      }));
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (
      !formData.email ||
      !formData.name ||
      !formData.mobile ||
      !formData.message
    ) {
      toast.error("Please fill all fields");
      return;
    }

    if (!/^\d{10}$/.test(formData.mobile)) {
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setLoading(true);

    try {
      const response = await ApiClient.post("/contact/submit", formData);

      if (response.data.success) {
        toast.success("Message sent successfully! We'll get back to you soon.");
        // Reset form
        setFormData({
          email: user?.email || "",
          name: user?.name || "",
          mobile: "",
          message: "",
        });
      } else {
        toast.error(response.data.message || "Failed to send message");
      }
    } catch (error: any) {
      console.error("Contact form error:", error);
      toast.error(
        error.response?.data?.message ||
          "Failed to send message. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const contactInfo = [
    {
      icon: Mail,
      title: "Email",
      value: "contact.yashrajthakur@gmail.com",
      href: "mailto:contact.yashrajthakur@gmail.com",
    },
    {
      icon: Phone,
      title: "Phone",
      value: "+91 9876543210",
      href: "tel:+919876543210",
    },
    {
      icon: MapPin,
      title: "Address",
      value: "Virtual Trading Hub, Bengaluru, Karnataka, India",
      href: null,
    },
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold md:text-5xl">Contact Us</h1>
          <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
            Have questions or feedback? We'd love to hear from you. Send us a
            message and we'll respond as soon as possible.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Contact Information */}
          <div className="lg:col-span-1">
            <Card className="p-6">
              <h2 className="mb-6 text-xl font-semibold">Get in Touch</h2>
              <div className="space-y-6">
                {contactInfo.map((info, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="bg-primary/10 text-primary rounded-lg p-3">
                      <info.icon size={20} />
                    </div>
                    <div>
                      <h3 className="mb-1 font-medium">{info.title}</h3>
                      {info.href ? (
                        <a
                          href={info.href}
                          className="text-muted-foreground hover:text-primary text-sm transition-colors"
                        >
                          {info.value}
                        </a>
                      ) : (
                        <p className="text-muted-foreground text-sm">
                          {info.value}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-border mt-8 border-t pt-6">
                <h3 className="mb-3 font-medium">Support Hours</h3>
                <div className="text-muted-foreground space-y-1 text-sm">
                  <p>Monday - Friday: 9:00 AM - 6:00 PM</p>
                  <p>Saturday: 10:00 AM - 4:00 PM</p>
                  <p>Sunday: Closed</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card className="p-6 md:p-8">
              <h2 className="mb-6 text-xl font-semibold">Send us a Message</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Your name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      required
                      className="mt-2"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="mobile">Mobile Number *</Label>
                  <Input
                    id="mobile"
                    type="tel"
                    placeholder="9876543210"
                    value={formData.mobile}
                    onChange={(e) => {
                      const value = e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 10);
                      setFormData({ ...formData, mobile: value });
                    }}
                    required
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="message">Message *</Label>
                  <Textarea
                    id="message"
                    placeholder="Tell us how we can help you..."
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    required
                    rows={6}
                    className="mt-2"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full md:w-auto"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2" size={16} />
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            </Card>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <h2 className="mb-8 text-center text-3xl font-bold">
            Frequently Asked Questions
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="p-6">
              <h3 className="mb-2 font-semibold">Is {appName} free to use?</h3>
              <p className="text-muted-foreground text-sm">
                Yes! {appName} is completely free. You get ₹10,00,000 virtual
                cash to practice trading.
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="mb-2 font-semibold">Is the market data real?</h3>
              <p className="text-muted-foreground text-sm">
                Yes, we provide real-time market data from NSE and BSE
                exchanges, but all trades are virtual.
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="mb-2 font-semibold">Can I lose real money?</h3>
              <p className="text-muted-foreground text-sm">
                No! All trading is done with virtual money. You cannot lose any
                real money on this platform.
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="mb-2 font-semibold">How do I get started?</h3>
              <p className="text-muted-foreground text-sm">
                Simply sign up with your email or Google account, and you'll
                instantly get ₹10,00,000 virtual cash to start trading.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
