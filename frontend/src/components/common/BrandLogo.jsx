import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Official VaxAssist AI Brand Logo & Emblem
 * Faithfully renders the shield, medical cross, healthcare human silhouette, and AI neural circuit traces.
 */
export function BrandIcon({ className = "h-8 w-8" }) {
  return (
    <svg 
      viewBox="0 0 120 120" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0 select-none", className)}
      aria-hidden="true"
    >
      {/* Outer Cyan Shield Contour */}
      <path 
        d="M58 12C36 17 26 25 24 38C22 58 31 82 56 102C57.3 103 58.7 103 60 102C63 99.5 66 97 69 94" 
        stroke="#15C2D9" 
        strokeWidth="7" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      
      {/* Inner Shield Subtle Ridge */}
      <path 
        d="M34 40C33 55 40 73 58 87" 
        stroke="#15C2D9" 
        strokeWidth="3.5" 
        strokeLinecap="round" 
        opacity="0.7"
      />

      {/* Medical Cross Center (Vibrant Cyan #15C2D9) */}
      <path 
        d="M50 38H62C63.1 38 64 38.9 64 40V48H72C73.1 48 74 48.9 74 50V62C74 63.1 73.1 64 72 64H64V72C64 73.1 63.1 74 62 74H50C48.9 74 48 73.1 48 72V64H40C38.9 64 38 63.1 38 62V50C38 48.9 38.9 48 40 48H48V40C48 38.9 48.9 38 50 38Z" 
        fill="#15C2D9"
      />

      {/* Human Silhouette Head (Adaptive Dark/Light) */}
      <circle cx="77" cy="28" r="7.5" className="fill-vax-dark dark:fill-white" />

      {/* Human Silhouette Torso / Right Shield Boundary */}
      <path 
        d="M64 33C71 34 76 39 80 47C83 54 84 64 77 75C73 82 66 89 58 95C67 85 75 75 77 65C79 55 76 43 64 33Z" 
        className="fill-vax-dark dark:fill-white"
      />

      {/* AI Circuit Branches & Nodes in Cyan */}
      <path d="M82 45C86 44 91 42 94 38H98" stroke="#15C2D9" strokeWidth="3.5" strokeLinecap="round"/>
      <circle cx="102" cy="38" r="4.5" fill="#15C2D9"/>

      <path d="M84 56C89 56 94 54 99 50H106" stroke="#15C2D9" strokeWidth="3.5" strokeLinecap="round"/>
      <circle cx="110" cy="50" r="4.5" fill="#15C2D9"/>

      <path d="M81 68C85 69 90 69 94 65L98 62" stroke="#15C2D9" strokeWidth="3.5" strokeLinecap="round"/>
      <circle cx="102" cy="59" r="4.5" fill="#15C2D9"/>
    </svg>
  );
}

export function BrandLogo({
  variant = "full", // "full" | "icon" | "image"
  size = "md",      // "sm" | "md" | "lg" | "xl"
  subtitle,
  className,
}) {
  const sizeMap = {
    sm: { icon: "h-7 w-7", text: "text-lg", img: "h-8" },
    md: { icon: "h-9 w-9", text: "text-xl", img: "h-9" },
    lg: { icon: "h-11 w-11", text: "text-2xl", img: "h-12" },
    xl: { icon: "h-14 w-14", text: "text-3xl", img: "h-16" },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  if (variant === "image") {
    return (
      <div className={cn("flex items-center gap-2.5", className)}>
        <img 
          src="/vaxassist-logo.png" 
          alt="VaxAssist AI" 
          className={cn("w-auto object-contain rounded-md", currentSize.img)} 
        />
        {subtitle && (
          <span className="text-xs text-muted-foreground font-mono">{subtitle}</span>
        )}
      </div>
    );
  }

  if (variant === "icon") {
    return <BrandIcon className={cn(currentSize.icon, className)} />;
  }

  return (
    <div className={cn("flex items-center gap-2.5 group select-none", className)}>
      <BrandIcon className={cn(currentSize.icon, "transition-transform group-hover:scale-105")} />
      
      <div className="flex flex-col leading-none">
        <span className={cn("font-extrabold tracking-tight font-sans text-foreground", currentSize.text)}>
          <span className="text-[#15C2D9]">Vax</span>
          <span className="text-vax-dark dark:text-white">Assist</span>{' '}
          <span className="text-[#15C2D9]">AI</span>
        </span>
        {subtitle ? (
          <span className="text-[11px] font-medium text-muted-foreground tracking-wide mt-1">
            {subtitle}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export default BrandLogo;
