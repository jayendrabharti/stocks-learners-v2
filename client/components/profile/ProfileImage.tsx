"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import ReactCrop, { type Crop, type PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { LoaderCircle, PencilIcon, UploadIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useSession } from "@/providers/SessionProvider";
import { ProfileApi } from "@/services/profileApi";

async function getCroppedImg(
  image: HTMLImageElement,
  crop: PixelCrop,
): Promise<File> {
  const canvas = document.createElement("canvas");
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No 2d context");

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    crop.width,
    crop.height,
  );

  return new Promise<File>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], "profile-picture.png", {
          type: "image/png",
        });
        resolve(file);
      } else {
        reject(new Error("Canvas is empty"));
      }
    }, "image/png");
  });
}

export default function ProfileImage({ user }: { user: User }) {
  const { setUser } = useSession();

  const [imageUrl, setImageUrl] = useState<string | null>(user?.avatar || null);
  const [src, setSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop | undefined>(undefined);
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [uploading, startUploading] = useTransition();
  const imgRef = useRef<HTMLImageElement | null>(null);

  const handleOnImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Only image files are allowed");
        return;
      }

      setSrc(URL.createObjectURL(file));
      setCrop(undefined);
      setCompletedCrop(null);
      setImageUrl(null);
    }
  };

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    imgRef.current = e.currentTarget;
  };

  const handleUpload = () => {
    startUploading(async () => {
      try {
        if (!completedCrop) {
          toast.error("Please crop the image before uploading!");
          return;
        }

        if (imgRef.current && completedCrop) {
          const croppedFile = await getCroppedImg(
            imgRef.current,
            completedCrop,
          );

          const response = await ProfileApi.uploadProfilePicture(croppedFile);

          setImageUrl(response.avatarUrl);
          toast.success(
            response.message || "Profile picture updated successfully!",
          );

          // Update user in session
          setUser((prev) =>
            prev ? { ...prev, avatar: response.avatarUrl } : prev,
          );

          setSrc(null);
          setCompletedCrop(null);
        }
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to upload image",
        );
      }
    });
  };

  const handleCancel = () => {
    setSrc(null);
    setImageUrl(user?.avatar || null);
    setCompletedCrop(null);
  };

  return (
    <div className="flex flex-col">
      <div className="mx-auto">
        {!imageUrl && src ? (
          <div className="flex flex-col items-center gap-4">
            <span className="text-muted-foreground text-sm">
              Crop your image (square aspect ratio)
            </span>
            <ReactCrop
              crop={crop}
              onChange={setCrop}
              onComplete={setCompletedCrop}
              aspect={1}
              circularCrop
              className="max-w-md"
            >
              <Image
                ref={imgRef}
                src={src}
                alt="profile-image-cropper"
                width={400}
                height={400}
                onLoad={onImageLoad}
                style={{ maxWidth: "100%" }}
              />
            </ReactCrop>
            <div className="flex flex-row gap-2">
              <Button
                variant="default"
                onClick={handleUpload}
                disabled={uploading || !completedCrop}
              >
                {uploading ? (
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <UploadIcon className="mr-2 h-4 w-4" />
                )}
                {uploading ? "Uploading..." : "Upload"}
              </Button>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={uploading}
              >
                <XIcon className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            </div>
          </div>
        ) : imageUrl ? (
          <>
            <div className="border-muted relative flex h-48 w-48 flex-col items-center justify-center overflow-hidden rounded-full border-4">
              <img
                src={imageUrl}
                alt="profile-image"
                width={200}
                height={200}
                className="h-full w-full object-cover"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setImageUrl(null)}
              className="mx-auto mt-4 w-full"
              disabled={uploading}
            >
              <PencilIcon className="mr-2 h-4 w-4" />
              Change Picture
            </Button>
          </>
        ) : (
          <>
            <div
              className={cn(
                "outline-muted-foreground/25 hover:outline-muted-foreground/50 relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl outline-2 transition-colors outline-dashed",
                "bg-muted/50 aspect-square h-48 w-48",
              )}
            >
              <input
                type="file"
                name="image"
                accept="image/*"
                onChange={handleOnImageChange}
                className="absolute h-full w-full cursor-pointer opacity-0"
                disabled={uploading}
              />
              <UploadIcon className="text-muted-foreground mb-2 h-12 w-12" />
              <span className="text-muted-foreground px-4 text-center text-sm font-medium">
                Click to upload profile picture
              </span>
              <span className="text-muted-foreground mt-1 text-xs">
                Max 5MB, PNG/JPG
              </span>
            </div>
            {user?.avatar && (
              <Button
                variant="ghost"
                onClick={() => setImageUrl(user.avatar)}
                className="text-muted-foreground mx-auto mt-4 w-full"
              >
                <XIcon className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
