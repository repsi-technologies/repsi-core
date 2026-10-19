"use client";

import React, { useState } from "react";
import Image, { ImageProps } from "next/image";
import { cn } from "@/lib/utils";
import { Dumbbell } from "lucide-react";

export interface ImageWithSkeletonProps extends Omit<ImageProps, "onLoad"> {
  wrapperClassName?: string;
  skeletonClassName?: string;
  showIcon?: boolean;
  onLoad?: (event: React.SyntheticEvent<HTMLImageElement, Event>) => void;
}

/**
 * ImageWithSkeleton
 * Displays a warm cream / light grey animated skeleton placeholder with smooth shimmer
 * until the Next.js image finishes downloading and decoding, then seamlessly cross-fades
 * the image in.
 */
export function ImageWithSkeleton({
  src,
  alt,
  className,
  wrapperClassName,
  skeletonClassName,
  showIcon = false,
  fill,
  width,
  height,
  priority,
  onLoad,
  ...props
}: ImageWithSkeletonProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div
      className={cn(
        "relative overflow-hidden",
        fill ? "w-full h-full" : "",
        wrapperClassName
      )}
    >
      {/* Shimmer Skeleton Placeholder */}
      {!isLoaded && (
        <div
          className={cn(
            "absolute inset-0 z-10 bg-[#FAF9F6] border border-[#E7E4DE] flex flex-col items-center justify-center overflow-hidden transition-opacity duration-300",
            skeletonClassName
          )}
          aria-hidden="true"
        >
          {/* Subtle Shimmer Beam */}
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/60 to-transparent animate-[shimmer_1.8s_infinite]" />

          {/* Optional Gym Icon placeholder */}
          {showIcon && (
            <div className="relative z-10 w-10 h-10 rounded-full bg-white/80 border border-[#E7E4DE] flex items-center justify-center text-[#858890]/40">
              <Dumbbell className="w-5 h-5 animate-pulse" />
            </div>
          )}
        </div>
      )}

      {/* Next.js Image */}
      <Image
        src={src}
        alt={alt}
        fill={fill}
        width={width}
        height={height}
        priority={priority}
        className={cn(
          "transition-opacity duration-500 ease-out",
          isLoaded ? "opacity-100" : "opacity-0",
          className
        )}
        onLoad={(e) => {
          setIsLoaded(true);
          onLoad?.(e);
        }}
        {...props}
      />
    </div>
  );
}

export default ImageWithSkeleton;
