"use client";
export default function Popup() {
  const handleComplete = () => {
    // Send message to parent window
    window.opener?.postMessage("popupSuccess", window.location.origin);
    // Close popup
    window.close();
  };

  return (
    <div className="p-6 text-center">
      <h2 className="mb-4 text-xl font-semibold">Popup Window</h2>
      <button
        onClick={handleComplete}
        className="rounded-lg bg-green-600 px-4 py-2 text-white"
      >
        Complete Action & Close
      </button>
    </div>
  );
}
