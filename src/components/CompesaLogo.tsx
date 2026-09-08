import React from 'react';

interface CompesaLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'symbol';
  lightText?: boolean;
}

export const CompesaLogo: React.FC<CompesaLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'full',
  lightText = false
}) => {
  // Dimensions mapping
  const sizeMap = {
    xs: { symbol: 24, text: 'text-xs', gap: 'gap-1.5' },
    sm: { symbol: 32, text: 'text-sm', gap: 'gap-2' },
    md: { symbol: 40, text: 'text-base', gap: 'gap-2.5' },
    lg: { symbol: 52, text: 'text-xl', gap: 'gap-3' },
    xl: { symbol: 68, text: 'text-2xl', gap: 'gap-3.5' }
  };

  const { symbol, text, gap } = sizeMap[size];

  return (
    <div className={`inline-flex items-center ${gap} select-none ${className}`}>
      {/* Official Compesa Circular Emblem SVG */}
      <svg
        width={symbol}
        height={symbol}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform hover:scale-105"
      >
        {/* Top Lime Green Arc */}
        <path
          d="M 18,50 A 32,32 0 0,1 82,50 L 69,50 A 19,19 0 0,0 31,50 Z"
          fill="#6db326"
        />
        {/* Bottom Royal Blue Arc */}
        <path
          d="M 18,50 A 32,32 0 0,0 82,50 L 69,50 A 19,19 0 0,1 31,50 Z"
          fill="#0c4ea2"
        />
        {/* Center Blue Water Droplet */}
        <path
          d="M 50,28 C 50,28 36,48 36,58 A 14,14 0 0,0 64,58 C 64,48 50,28 50,28 Z"
          fill="#0c4ea2"
        />
      </svg>

      {/* Typography: compesa */}
      {variant === 'full' && (
        <span
          className={`font-black tracking-tight leading-none ${text} ${
            lightText ? 'text-white' : 'text-[#0c4ea2] dark:text-blue-400'
          }`}
          style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
        >
          compesa
        </span>
      )}
    </div>
  );
};
