"use client";
import ApiClient from "@/utils/ApiClient";

export default async function getUser(): Promise<User | null> {
  try {
    const response = await ApiClient.get("/auth/user");

    const user: User | undefined = response.data.user;

    if (!user) {
      console.error("Failed to fetch user.");
      return null;
    }
    return user;
  } catch (error) {
    return null;
  }
}
