"use client";

import ApiClient from "@/utils/ApiClient";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, Calendar, DollarSign, Users, Trophy } from "lucide-react";

export default function CreateEventPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    slug: "",
    registrationStartAt: "",
    registrationEndAt: "",
    eventStartAt: "",
    eventEndAt: "",
    registrationFee: "",
    initialBalance: "",
    maxParticipants: "",
    bannerImage: "",
    rules: "",
    prizes: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Auto-generate slug from title
    if (name === "title") {
      const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      setFormData(prev => ({ ...prev, slug }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Parse prizes JSON
      let prizesData = null;
      if (formData.prizes) {
        try {
          prizesData = JSON.parse(formData.prizes);
        } catch {
          alert("Invalid prizes JSON format");
          setIsSubmitting(false);
          return;
        }
      }

      const response = await ApiClient.post("/admin/events", {
        title: formData.title,
        description: formData.description || null,
        slug: formData.slug,
        registrationStartAt: new Date(formData.registrationStartAt).toISOString(),
        registrationEndAt: new Date(formData.registrationEndAt).toISOString(),
        eventStartAt: new Date(formData.eventStartAt).toISOString(),
        eventEndAt: new Date(formData.eventEndAt).toISOString(),
        registrationFee: parseFloat(formData.registrationFee),
        initialBalance: parseFloat(formData.initialBalance),
        maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : null,
        bannerImage: formData.bannerImage || null,
        rules: formData.rules || null,
        prizes: prizesData,
      });

      if (response.status === 201) {
        alert("Event created successfully!");
        router.push("/admin/events");
      }
    } catch (error: any) {
      console.error("Error creating event:", error);
      const message = error.response?.data?.error?.message || error.message || "Failed to create event";
      const details = error.response?.data?.error?.details;
      
      if (details && Array.isArray(details)) {
        alert(`${message}\n\n${details.join("\n")}`);
      } else {
        alert(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/admin/events")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Events
        </Button>
        <h1 className="text-3xl font-bold">Create New Event</h1>
        <p className="text-muted-foreground mt-2">
          Set up a new trading competition event
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Basic Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Basic Information
            </CardTitle>
            <CardDescription>Event title, description, and slug</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Event Title *</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Summer Trading Championship 2024"
                required
              />
            </div>

            <div>
              <Label htmlFor="slug">URL Slug *</Label>
              <Input
                id="slug"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                placeholder="summer-trading-championship-2024"
                required
              />
              <p className="text-sm text-muted-foreground mt-1">
                Auto-generated from title, or customize
              </p>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Compete with traders across the country..."
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="bannerImage">Banner Image URL</Label>
              <Input
                id="bannerImage"
                name="bannerImage"
                value={formData.bannerImage}
                onChange={handleChange}
                placeholder="https://example.com/banner.jpg"
              />
            </div>
          </CardContent>
        </Card>

        {/* Event Dates */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Event Schedule
            </CardTitle>
            <CardDescription>Registration and event dates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="registrationStartAt">Registration Start *</Label>
                <Input
                  id="registrationStartAt"
                  name="registrationStartAt"
                  type="datetime-local"
                  value={formData.registrationStartAt}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="registrationEndAt">Registration End *</Label>
                <Input
                  id="registrationEndAt"
                  name="registrationEndAt"
                  type="datetime-local"
                  value={formData.registrationEndAt}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="eventStartAt">Event Start *</Label>
                <Input
                  id="eventStartAt"
                  name="eventStartAt"
                  type="datetime-local"
                  value={formData.eventStartAt}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="eventEndAt">Event End *</Label>
                <Input
                  id="eventEndAt"
                  name="eventEndAt"
                  type="datetime-local"
                  value={formData.eventEndAt}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financial Settings */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Financial Settings
            </CardTitle>
            <CardDescription>Registration fee and initial balance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="registrationFee">Registration Fee (₹) *</Label>
                <Input
                  id="registrationFee"
                  name="registrationFee"
                  type="number"
                  step="0.01"
                  value={formData.registrationFee}
                  onChange={handleChange}
                  placeholder="100"
                  required
                />
              </div>
              <div>
                <Label htmlFor="initialBalance">Initial Balance (₹) *</Label>
                <Input
                  id="initialBalance"
                  name="initialBalance"
                  type="number"
                  step="0.01"
                  value={formData.initialBalance}
                  onChange={handleChange}
                  placeholder="100000"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Participants */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Participants
            </CardTitle>
            <CardDescription>Maximum number of participants (optional)</CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="maxParticipants">Max Participants</Label>
              <Input
                id="maxParticipants"
                name="maxParticipants"
                type="number"
                value={formData.maxParticipants}
                onChange={handleChange}
                placeholder="Leave empty for unlimited"
              />
            </div>
          </CardContent>
        </Card>

        {/* Rules and Prizes */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Rules & Prizes</CardTitle>
            <CardDescription>Event rules and prize structure</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="rules">Rules</Label>
              <Textarea
                id="rules"
                name="rules"
                value={formData.rules}
                onChange={handleChange}
                placeholder="1. All trades must be completed before event end&#10;2. No intraday positions allowed&#10;3. Winners determined by total P&L"
                rows={6}
              />
            </div>

            <div>
              <Label htmlFor="prizes">Prizes (JSON format)</Label>
              <Textarea
                id="prizes"
                name="prizes"
                value={formData.prizes}
                onChange={handleChange}
                placeholder='{"1st": "₹10,000", "2nd": "₹5,000", "3rd": "₹2,500"}'
                rows={4}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Enter prizes in JSON format
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting}
            className="flex-1"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? "Creating..." : "Create Event"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => router.push("/admin/events")}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
