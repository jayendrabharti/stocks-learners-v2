"use client";

import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    fetch(
      "https://groww.in/v1/api/charting_service/v2/chart/exchange/NSE/segment/CASH/TCS/daily?intervalInMinutes=60",
    ).then((res) => {
      const data = res.json();
      console.log("data", data);
    });
  }, []);

  return <div>home</div>;
}
