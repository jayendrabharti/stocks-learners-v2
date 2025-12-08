"use client";

import ApiClient from "@/utils/ApiClient";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, Calendar, DollarSign, Users, Trophy } from "lucide-react";

export default function EditEventPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;

  const [isLoading, setIsLoading] = useState(true);
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

  useEffect(() => {
    loadEventData();
  }, [eventId]);

  const loadEventData = async () => {
    try {
      const response = await ApiClient.get(`/admin/events/${eventId}`);

      if (response.status !== 200) throw new Error("Failed to load event");

      const data = response.data;
      
      setFormData({
        title: data.title,
        description: data.description || "",
        slug: data.slug,
        registrationStartAt: new Date(data.registrationStartAt).toISOString().slice(0, 16),
        registrationEndAt: new Date(data.registrationEndAt).toISOString().slice(0, 16),
        eventStartAt: new Date(data.eventStartAt).toISOString().slice(0, 16),
        eventEndAt: new Date(data.eventEndAt).toISOString().slice(0, 16),
        registrationFee: data.registrationFee.toString(),
        initialBalance: data.initialBalance.toString(),
        maxParticipants: data.maxParticipants?.toString() || "",
        bannerImage: data.bannerImage || "",
        rules: data.rules || "",
        prizes: data.prizes ? JSON.stringify(data.prizes, null, 2) : "",
      });
    } catch (error) {
      console.error("Error loading event:", error);
      alert("Failed to load event");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
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

      const response = await ApiClient.put(`/admin/events/${eventId}`, {
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

      if (response.status !== 200) {
        throw new Error("Failed to update event");
      }

      alert("Event updated successfully!");
      router.push("/admin/events");
    } catch (error) {
      console.error("Error updating event:", error);
      alert("Failed to update event");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

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
        <h1 className="text-3xl font-bold">Edit Event</h1>
        <p className="text-muted-foreground mt-2">
          Update event details and settings
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
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Event Title *</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
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
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
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
              />
            </div>
          </CardContent>
        </Card>

        {/* Rules and Prizes */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Rules & Prizes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="rules">Rules</Label>
              <Textarea
                id="rules"
                name="rules"
                value={formData.rules}
                onChange={handleChange}
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
                rows={4}
              />
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
            {isSubmitting ? "Saving..." : "Save Changes"}
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
