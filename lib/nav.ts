import { T } from "@/lib/design/tokens";

// 5-section navigation (spec §7.1). Each section owns a color and sub-tabs.
export interface SubTab {
  id: string;
  label: string;
  href: string;
}
export interface NavSection {
  id: string;
  label: string;
  icon: string;
  color: string;
  basePath: string;
  tabs: SubTab[];
}

export const NAV: NavSection[] = [
  {
    id: "command",
    label: "Command",
    icon: "⌘",
    color: T.blue,
    basePath: "/command",
    tabs: [
      { id: "brief", label: "Brief", href: "/command" },
      { id: "actions", label: "Actions", href: "/command/actions" },
      { id: "calendar", label: "Calendar", href: "/command/calendar" },
      { id: "ea", label: "EA", href: "/command/ea" },
      { id: "chat", label: "Chat", href: "/command/chat" },
    ],
  },
  {
    id: "intel",
    label: "Intel",
    icon: "◈",
    color: T.green,
    basePath: "/intel",
    tabs: [
      { id: "decisions", label: "Decisions", href: "/intel/decisions" },
      { id: "radar", label: "Radar", href: "/intel/radar" },
    ],
  },
  {
    id: "life",
    label: "Life",
    icon: "♥",
    color: T.rose,
    basePath: "/life",
    tabs: [
      { id: "inner", label: "Inner Circle", href: "/life" },
      { id: "checkin", label: "Check-in", href: "/life/checkin" },
    ],
  },
  {
    id: "wisdom",
    label: "Wisdom",
    icon: "⚡",
    color: T.plum,
    basePath: "/wisdom",
    tabs: [
      { id: "council", label: "Council", href: "/wisdom/council" },
      { id: "search", label: "Search", href: "/wisdom/search" },
      { id: "books", label: "Books", href: "/wisdom/books" },
    ],
  },
  {
    id: "system",
    label: "System",
    icon: "◎",
    color: T.amber,
    basePath: "/system",
    tabs: [
      { id: "autonomy", label: "Autonomy", href: "/system/autonomy" },
      { id: "observer", label: "Observer", href: "/system/observer" },
      { id: "intel", label: "Intel", href: "/system/intel" },
    ],
  },
];

export const sectionForPath = (path: string): NavSection =>
  NAV.find((s) => path === s.basePath || path.startsWith(s.basePath + "/")) ??
  NAV[0];
