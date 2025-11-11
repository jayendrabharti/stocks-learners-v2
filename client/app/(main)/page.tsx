// export default function Home() {
//   return <div>home</div>;
// }
"use client";
import { useEffect } from "react";

export default function Parent() {
  const handlePopupMessage = (event: MessageEvent) => {
    // Ensure message is from your origin (for security)
    if (event.origin !== window.location.origin) return;

    if (event.data === "popupSuccess") {
      console.log("✅ Popup action completed!");
      // Call your desired function here
      alert("Popup triggered a callback!");
    }
  };

  useEffect(() => {
    window.addEventListener("message", handlePopupMessage);
    return () => window.removeEventListener("message", handlePopupMessage);
  }, []);

  const openPopup = () => {
    const popup = window.open(
      "/popup", // this route/component will render Popup.jsx
      "popupWindow",
      "width=500,height=600",
    );

    // Optional: Poll if popup closed without success
    const timer = setInterval(() => {
      if (popup?.closed) {
        clearInterval(timer);
        console.log("Popup closed manually");
      }
    }, 500);
  };

  return (
    <div className="p-6">
      <button
        onClick={openPopup}
        className="rounded-lg bg-blue-600 px-4 py-2 text-white"
      >
        Open Popup
      </button>
    </div>
  );
}
