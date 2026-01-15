// Re-export from apiErrors for backward compatibility
export {
  getErrorMessage,
  parseApiError,
  isInsufficientFundsError,
  isMarketClosedError,
  isAuthError,
} from "./apiErrors";
export type { ParsedError, ErrorCode } from "./apiErrors";

export const formatTimestamp = (
  timestamp: string | number | Date,
  format = 1,
) => {
  if (!timestamp) return null;

  const date = new Date(timestamp);
  const day = date.getDate().toString().padStart(2, "0");
  const month = date.toLocaleString("default", { month: "short" });
  const year = date.getFullYear();
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "pm" : "am";
  hours = hours % 12 || 12; // Convert to 12-hour format and handle midnight (0)

  if (format == 2) {
    return `${month} ${day}, ${year}`;
  }
  return `${day} ${month} ${year} • ${hours}:${minutes} ${ampm}`;
};

export async function convertBlobUrlToFile(blobUrl: string) {
  const response = await fetch(blobUrl);
  const blob = await response.blob();
  const fileName = Math.random().toString(36).slice(2, 9);
  const mimeType = blob.type || "application/octet-stream";
  const file = new File([blob], `${fileName}.${mimeType.split("/")[1]}`, {
    type: mimeType,
  });
  return file;
}

export const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
