/** Hairline icons drawn for AFTERGLOW. Decorative: buttons carry the labels. */
import type { SVGProps } from 'react';

const base: SVGProps<SVGSVGElement> = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: false,
};

export const SoundOnIcon = () => (
  <svg {...base}>
    <path d="M4 9.5h3l4.5-4v13L7 14.5H4z" />
    <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />
  </svg>
);

export const SoundOffIcon = () => (
  <svg {...base}>
    <path d="M4 9.5h3l4.5-4v13L7 14.5H4z" />
    <path d="M16 9.5l5 5M21 9.5l-5 5" />
  </svg>
);

export const SlidersIcon = () => (
  <svg {...base}>
    <path d="M5 7h9M18 7h1M5 17h1M10 17h9" />
    <circle cx="16" cy="7" r="2" />
    <circle cx="8" cy="17" r="2" />
  </svg>
);

export const ChaptersIcon = () => (
  <svg {...base}>
    <circle cx="5" cy="6" r="1.2" />
    <circle cx="5" cy="12" r="1.2" />
    <circle cx="5" cy="18" r="1.2" />
    <path d="M9.5 6H19M9.5 12H17M9.5 18H19" />
  </svg>
);

export const CloseIcon = () => (
  <svg {...base}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export const ChevronLeftIcon = () => (
  <svg {...base}>
    <path d="M14.5 5.5L8 12l6.5 6.5" />
  </svg>
);

export const ChevronRightIcon = () => (
  <svg {...base}>
    <path d="M9.5 5.5L16 12l-6.5 6.5" />
  </svg>
);

export const SparkIcon = () => (
  <svg {...base}>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6.3 6.3l2.4 2.4M15.3 15.3l2.4 2.4M6.3 17.7l2.4-2.4M15.3 8.7l2.4-2.4" />
  </svg>
);
