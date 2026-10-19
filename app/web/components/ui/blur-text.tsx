"use client";

import React, { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";

export interface BlurTextSegment {
  text: string;
  className?: string;
  breakAfter?: boolean;
}

interface BlurTextProps {
  text?: string;
  segments?: BlurTextSegment[];
  delay?: number;
  wordDelay?: number;
  lineDelay?: number;
  duration?: number;
  animateBy?: "words" | "lines";
  className?: string;
  as?: keyof React.JSX.IntrinsicElements;
}

export function BlurText({
  text,
  segments,
  delay = 0.1,
  wordDelay = 0.05,
  lineDelay = 0.18,
  duration = 0.75,
  animateBy = "words",
  className = "",
  as: Component = "div",
}: BlurTextProps) {
  const shouldReduceMotion = useReducedMotion();

  // Flatten words for word-by-word animation
  const wordsList = useMemo(() => {
    if (segments && segments.length > 0) {
      const items: Array<{
        word: string;
        className?: string;
        isLastInSegment: boolean;
        breakAfter: boolean;
        key: string;
      }> = [];

      segments.forEach((seg, sIdx) => {
        const segWords = seg.text.split(" ").filter(Boolean);
        segWords.forEach((w, wIdx) => {
          items.push({
            word: w,
            className: seg.className,
            isLastInSegment: wIdx === segWords.length - 1,
            breakAfter: Boolean(seg.breakAfter && wIdx === segWords.length - 1),
            key: `s${sIdx}-w${wIdx}-${w}`,
          });
        });
      });

      return items;
    }

    if (text) {
      return text
        .split(" ")
        .filter(Boolean)
        .map((w, idx) => ({
          word: w,
          className: undefined,
          isLastInSegment: false,
          breakAfter: false,
          key: `w${idx}-${w}`,
        }));
    }

    return [];
  }, [text, segments]);

  if (shouldReduceMotion) {
    return (
      <Component className={className}>
        {segments ? (
          segments.map((seg, idx) => (
            <React.Fragment key={idx}>
              <span className={seg.className}>{seg.text}</span>
              {seg.breakAfter && <br />}
              {" "}
            </React.Fragment>
          ))
        ) : (
          <span>{text}</span>
        )}
      </Component>
    );
  }

  // Staggered by line
  if (animateBy === "lines" && segments && segments.length > 0) {
    return (
      <Component className={className}>
        {segments.map((seg, idx) => {
          const lineOffset = delay + idx * lineDelay;

          return (
            <React.Fragment key={`line-${idx}-${seg.text}`}>
              <motion.span
                initial={{
                  filter: "blur(10px)",
                  opacity: 0,
                  y: 16,
                }}
                animate={{
                  filter: "blur(0px)",
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  duration,
                  delay: lineOffset,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className={`inline-block ${seg.className || ""}`}
                style={{
                  willChange: "transform, filter, opacity",
                }}
              >
                {seg.text}
              </motion.span>
              {seg.breakAfter && <br className="hidden sm:inline" />}
              {idx < segments.length - 1 && !seg.breakAfter && " "}
            </React.Fragment>
          );
        })}
      </Component>
    );
  }

  // Staggered by word
  return (
    <Component className={className}>
      {wordsList.map((item, index) => {
        const wordDelayOffset = delay + index * wordDelay;

        return (
          <React.Fragment key={item.key}>
            <motion.span
              initial={{
                filter: "blur(10px)",
                opacity: 0,
                y: 16,
              }}
              animate={{
                filter: "blur(0px)",
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration,
                delay: wordDelayOffset,
                ease: [0.22, 1, 0.36, 1],
              }}
              className={`inline-block ${item.className || ""}`}
              style={{
                willChange: "transform, filter, opacity",
              }}
            >
              {item.word}
            </motion.span>
            {item.breakAfter ? (
              <br className="block" />
            ) : (
              <span className="inline-block">&nbsp;</span>
            )}
          </React.Fragment>
        );
      })}
    </Component>
  );
}
