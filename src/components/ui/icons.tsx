import { type JSX } from '@solidjs/web';
// Lucide icons, inlined for Solid 2. Icon data is ISC-licensed:
// https://github.com/lucide-icons/lucide
import { type Component, omit } from 'solid-js';

const DEFAULT_SIZE = 24;
const DEFAULT_STROKE_WIDTH = 2;

export type IconProps = Omit<
  JSX.SvgSVGAttributes<SVGSVGElement>,
  'children'
> & {
  absoluteStrokeWidth?: boolean;
  color?: string;
  height?: number | string;
  size?: number | string;
  strokeWidth?: number | string;
  width?: number | string;
};

const isA11yProp = (props: IconProps) =>
  Object.keys(props).some(
    (key) => key.startsWith('aria-') || key === 'role' || key === 'title',
  );

const Icon: Component<IconProps & { children: JSX.Element; name: string }> = (
  props,
) => {
  const rest = omit(
    props,
    'absoluteStrokeWidth',
    'children',
    'class',
    'color',
    'height',
    'name',
    'size',
    'strokeWidth',
    'width',
  );

  const width = () => props.width ?? props.size ?? DEFAULT_SIZE;
  const height = () => props.height ?? props.size ?? DEFAULT_SIZE;
  const strokeWidth = () =>
    props.absoluteStrokeWidth
      ? (Number(props.strokeWidth ?? DEFAULT_STROKE_WIDTH) * DEFAULT_SIZE) /
        Number(width())
      : (props.strokeWidth ?? DEFAULT_STROKE_WIDTH);

  return (
    <svg
      aria-hidden={isA11yProp(props) ? undefined : 'true'}
      class={['lucide', `lucide-${props.name}`, props.class]}
      fill="none"
      height={height()}
      stroke={props.color ?? 'currentColor'}
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width={strokeWidth()}
      viewBox="0 0 24 24"
      width={width()}
      xmlns="http://www.w3.org/2000/svg"
      {...rest}
    >
      {props.children}
    </svg>
  );
};

export const ArrowDown = (props: IconProps) => (
  <Icon
    name="arrow-down"
    {...props}
  >
    <path d="M12 5v14" />
    <path d="m19 12-7 7-7-7" />
  </Icon>
);

export const ArrowDownWideNarrow = (props: IconProps) => (
  <Icon
    name="arrow-down-wide-narrow"
    {...props}
  >
    <path d="m3 16 4 4 4-4" />
    <path d="M7 20V4" />
    <path d="M11 4h10" />
    <path d="M11 8h7" />
    <path d="M11 12h4" />
  </Icon>
);

export const ArrowLeft = (props: IconProps) => (
  <Icon
    name="arrow-left"
    {...props}
  >
    <path d="m12 19-7-7 7-7" />
    <path d="M19 12H5" />
  </Icon>
);

export const ArrowLeftRight = (props: IconProps) => (
  <Icon
    name="arrow-left-right"
    {...props}
  >
    <path d="M8 3 4 7l4 4" />
    <path d="M4 7h16" />
    <path d="m16 21 4-4-4-4" />
    <path d="M20 17H4" />
  </Icon>
);

export const ArrowRight = (props: IconProps) => (
  <Icon
    name="arrow-right"
    {...props}
  >
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </Icon>
);

export const ArrowUp = (props: IconProps) => (
  <Icon
    name="arrow-up"
    {...props}
  >
    <path d="m5 12 7-7 7 7" />
    <path d="M12 19V5" />
  </Icon>
);

export const ArrowUpNarrowWide = (props: IconProps) => (
  <Icon
    name="arrow-up-narrow-wide"
    {...props}
  >
    <path d="m3 8 4-4 4 4" />
    <path d="M7 4v16" />
    <path d="M11 12h4" />
    <path d="M11 16h7" />
    <path d="M11 20h10" />
  </Icon>
);

export const Bookmark = (props: IconProps) => (
  <Icon
    name="bookmark"
    {...props}
  >
    <path d="M17 3a2 2 0 0 1 2 2v15a1 1 0 0 1-1.496.868l-4.512-2.578a2 2 0 0 0-1.984 0l-4.512 2.578A1 1 0 0 1 5 20V5a2 2 0 0 1 2-2z" />
  </Icon>
);

export const CalendarRange = (props: IconProps) => (
  <Icon
    name="calendar-range"
    {...props}
  >
    <rect
      height="18"
      rx="2"
      width="18"
      x="3"
      y="3"
    />
    <path d="M16 2v3" />
    <path d="M3 9h18" />
    <path d="M8 2v3" />
    <path d="M17 13h-6" />
    <path d="M13 17H7" />
    <path d="M7 13h.01" />
    <path d="M17 17h.01" />
  </Icon>
);

export const Check = (props: IconProps) => (
  <Icon
    name="check"
    {...props}
  >
    <path d="M20 6 9 17l-5-5" />
  </Icon>
);

export const ChevronDown = (props: IconProps) => (
  <Icon
    name="chevron-down"
    {...props}
  >
    <path d="m6 9 6 6 6-6" />
  </Icon>
);

export const ChevronRight = (props: IconProps) => (
  <Icon
    name="chevron-right"
    {...props}
  >
    <path d="m9 18 6-6-6-6" />
  </Icon>
);

export const ExternalLink = (props: IconProps) => (
  <Icon
    name="external-link"
    {...props}
  >
    <path d="M15 3h6v6" />
    <path d="M10 14 21 3" />
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
  </Icon>
);

export const Globe = (props: IconProps) => (
  <Icon
    name="globe"
    {...props}
  >
    <circle
      cx="12"
      cy="12"
      r="10"
    />
    <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
    <path d="M2 12h20" />
  </Icon>
);

export const GraduationCap = (props: IconProps) => (
  <Icon
    name="graduation-cap"
    {...props}
  >
    <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" />
    <path d="M22 10v6" />
    <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" />
  </Icon>
);

export const Info = (props: IconProps) => (
  <Icon
    name="info"
    {...props}
  >
    <circle
      cx="12"
      cy="12"
      r="10"
    />
    <path d="M12 16v-4" />
    <path d="M12 8h.01" />
  </Icon>
);

export const Library = (props: IconProps) => (
  <Icon
    name="library"
    {...props}
  >
    <path d="m16 6 4 14" />
    <path d="M12 6v14" />
    <path d="M8 8v12" />
    <path d="M4 4v16" />
  </Icon>
);

export const Link2 = (props: IconProps) => (
  <Icon
    name="link-2"
    {...props}
  >
    <path d="M9 17H7A5 5 0 0 1 7 7h2" />
    <path d="M15 7h2a5 5 0 1 1 0 10h-2" />
    <line
      x1="8"
      x2="16"
      y1="12"
      y2="12"
    />
  </Icon>
);

export const ListChecks = (props: IconProps) => (
  <Icon
    name="list-checks"
    {...props}
  >
    <path d="M13 5h8" />
    <path d="M13 12h8" />
    <path d="M13 19h8" />
    <path d="m3 17 2 2 4-4" />
    <path d="m3 7 2 2 4-4" />
  </Icon>
);

export const LoaderCircle = (props: IconProps) => (
  <Icon
    name="loader-circle"
    {...props}
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </Icon>
);

export const Lock = (props: IconProps) => (
  <Icon
    name="lock"
    {...props}
  >
    <rect
      height="11"
      rx="2"
      ry="2"
      width="18"
      x="3"
      y="11"
    />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </Icon>
);

export const Minus = (props: IconProps) => (
  <Icon
    name="minus"
    {...props}
  >
    <path d="M5 12h14" />
  </Icon>
);

export const Moon = (props: IconProps) => (
  <Icon
    name="moon"
    {...props}
  >
    <path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401" />
  </Icon>
);

export const Network = (props: IconProps) => (
  <Icon
    name="network"
    {...props}
  >
    <rect
      height="6"
      rx="1"
      width="6"
      x="16"
      y="16"
    />
    <rect
      height="6"
      rx="1"
      width="6"
      x="2"
      y="16"
    />
    <rect
      height="6"
      rx="1"
      width="6"
      x="9"
      y="2"
    />
    <path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3" />
    <path d="M12 12V8" />
  </Icon>
);

export const RotateCcw = (props: IconProps) => (
  <Icon
    name="rotate-ccw"
    {...props}
  >
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
  </Icon>
);

export const Search = (props: IconProps) => (
  <Icon
    name="search"
    {...props}
  >
    <path d="m21 21-4.34-4.34" />
    <circle
      cx="11"
      cy="11"
      r="8"
    />
  </Icon>
);

export const SearchX = (props: IconProps) => (
  <Icon
    name="search-x"
    {...props}
  >
    <path d="m13.5 8.5-5 5" />
    <path d="m8.5 8.5 5 5" />
    <circle
      cx="11"
      cy="11"
      r="8"
    />
    <path d="m21 21-4.3-4.3" />
  </Icon>
);

export const SlidersHorizontal = (props: IconProps) => (
  <Icon
    name="sliders-horizontal"
    {...props}
  >
    <path d="M10 5H3" />
    <path d="M12 19H3" />
    <path d="M14 3v4" />
    <path d="M16 17v4" />
    <path d="M21 12h-9" />
    <path d="M21 19h-5" />
    <path d="M21 5h-7" />
    <path d="M8 10v4" />
    <path d="M8 12H3" />
  </Icon>
);

export const Sparkles = (props: IconProps) => (
  <Icon
    name="sparkles"
    {...props}
  >
    <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" />
    <path d="M20 2v4" />
    <path d="M22 4h-4" />
    <circle
      cx="4"
      cy="20"
      r="2"
    />
  </Icon>
);

export const Star = (props: IconProps) => (
  <Icon
    name="star"
    {...props}
  >
    <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />
  </Icon>
);

export const Sun = (props: IconProps) => (
  <Icon
    name="sun"
    {...props}
  >
    <circle
      cx="12"
      cy="12"
      r="4"
    />
    <path d="M12 2v2" />
    <path d="M12 20v2" />
    <path d="m4.93 4.93 1.41 1.41" />
    <path d="m17.66 17.66 1.41 1.41" />
    <path d="M2 12h2" />
    <path d="M20 12h2" />
    <path d="m6.34 17.66-1.41 1.41" />
    <path d="m19.07 4.93-1.41 1.41" />
  </Icon>
);

export const TriangleAlert = (props: IconProps) => (
  <Icon
    name="triangle-alert"
    {...props}
  >
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </Icon>
);

export const Wand2 = (props: IconProps) => (
  <Icon
    name="wand-sparkles"
    {...props}
  >
    <path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72" />
    <path d="m14 7 3 3" />
    <path d="M5 6v4" />
    <path d="M19 14v4" />
    <path d="M10 2v2" />
    <path d="M7 8H3" />
    <path d="M21 16h-4" />
    <path d="M11 3H9" />
  </Icon>
);

export const X = (props: IconProps) => (
  <Icon
    name="x"
    {...props}
  >
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </Icon>
);
