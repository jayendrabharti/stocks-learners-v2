"use client";
import { motion, useAnimation, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import { ReactNode } from "react";

export default function Reveal({
  children,
  className = "",
  type = "bottomUp",
  duration = 0.6,
  delay = 0,
  once = false,
}: {
  children: ReactNode;
  className?: string;
  type?:
    | "bottomUp"
    | "topDown"
    | "scaleOut"
    | "leftRight"
    | "rightLeft"
    | "fadeIn";
  duration?: number;
  delay?: number;
  once?: boolean;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref);
  const controls = useAnimation();
  const [hasBeenVisible, setHasBeenVisible] = useState(false);

  useEffect(() => {
    if (isInView) {
      controls.start("visible");
      if (once) {
        setHasBeenVisible(true);
      }
    } else {
      if (once && hasBeenVisible) {
        // Stay visible if once is true and has already been visible
        controls.set("visible");
      } else {
        controls.set("hidden");
      }
    }
  }, [isInView, controls, once, hasBeenVisible]);

  const variants = {
    bottomUp: {
      hidden: { opacity: 0, y: 25 },
      visible: { opacity: 1, y: 0 },
    },
    topDown: {
      hidden: { opacity: 0, y: -25 },
      visible: { opacity: 1, y: 0 },
    },
    scaleOut: {
      hidden: { scale: 0.5, opacity: 0 },
      visible: { scale: 1, opacity: 1 },
    },
    leftRight: {
      hidden: { opacity: 0, x: -25 },
      visible: { opacity: 1, x: 0 },
    },
    rightLeft: {
      hidden: { opacity: 0, x: 25 },
      visible: { opacity: 1, x: 0 },
    },
    fadeIn: {
      hidden: { opacity: 0 },
      visible: { opacity: 1 },
    },
  };

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={variants[type]}
      transition={{ duration, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}