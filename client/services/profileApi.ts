import ApiClient from "@/utils/ApiClient";

export interface ProfilePictureUploadResponse {
  message: string;
  user: User;
  avatarUrl: string;
}

export interface ProfilePictureResponse {
  avatarUrl: string;
}

export class ProfileApi {
  /**
   * Upload profile picture
   */
  static async uploadProfilePicture(
    file: File,
  ): Promise<ProfilePictureUploadResponse> {
    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await ApiClient.post("/profile/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return response.data;
    } catch (error: any) {
      console.error("Error uploading profile picture:", error);
      throw new Error(
        error.response?.data?.error?.message ||
          "Failed to upload profile picture",
      );
    }
  }

  /**
   * Get profile picture URL
   */
  static async getProfilePicture(userId: string): Promise<string | null> {
    try {
      const response = await ApiClient.get(`/profile/avatar/${userId}`);
      return response.data.avatarUrl;
    } catch (error) {
      console.error("Error fetching profile picture:", error);
      return null;
    }
  }

  /**
   * Delete profile picture
   */
  static async deleteProfilePicture(): Promise<{ message: string }> {
    try {
      const response = await ApiClient.delete("/profile/upload");
      return response.data;
    } catch (error: any) {
      console.error("Error deleting profile picture:", error);
      throw new Error(
        error.response?.data?.error?.message ||
          "Failed to delete profile picture",
      );
    }
  }
}
