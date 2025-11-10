"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, LoaderCircle, SaveIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useTransition } from "react";
import { toast } from "sonner";
import { getErrorMessage } from "@/utils/utils";
import ProfileImage from "./ProfileImage";
import { useSession } from "@/providers/SessionProvider";
import ApiClient from "@/utils/ApiClient";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().optional(),
  avatar: z.string().optional(),
  dateOfBirth: z.date().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfileForm({
  user,
  className = "",
}: {
  user: User;
  className?: string;
}) {
  const { refreshSession } = useSession();
  const [saving, startSaving] = useTransition();

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      avatar: user?.avatar || undefined,
      phone: user?.phone || "",
      dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth) : undefined,
    },
  });

  function onSubmit(data: ProfileFormData) {
    startSaving(async () => {
      try {
        await ApiClient.post("/auth/user", data);
        toast.success("Profile updated successfully!");
        refreshSession();
      } catch (error) {
        toast.error(getErrorMessage(error));
      }
    });
  }

  return (
    <div
      className={cn(
        "space-y-6 w-full",
        "bg-card border-border border rounded-2xl p-5 shadow-md",
        className
      )}
    >
      <ProfileImage user={user} />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <span className="w-full text-center border border-border p-2 m-2 bg-card rounded-md text-lg font-bold block shadow-md">
            {user.email}
          </span>

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your full name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your phone number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dateOfBirth"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date of Birth</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      captionLayout="dropdown"
                      onSelect={field.onChange}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full">
            {saving ? <LoaderCircle className="animate-spin" /> : <SaveIcon />}
            {saving ? "Saving..." : "Save Profile"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
