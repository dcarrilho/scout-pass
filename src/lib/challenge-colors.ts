export type ColorKey = "blue" | "amber" | "purple" | "emerald" | "orange" | "rose" | "slate";

const COLOR_MAP: Record<ColorKey, { progress: string; badge: string; icon_bg: string; header: string }> = {
  blue:    { progress: "bg-blue-500",    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",          icon_bg: "bg-blue-100 dark:bg-blue-900/30",    header: "text-blue-700 dark:text-blue-400" },
  amber:   { progress: "bg-amber-500",   badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",      icon_bg: "bg-amber-100 dark:bg-amber-900/30",  header: "text-amber-700 dark:text-amber-400" },
  purple:  { progress: "bg-purple-500",  badge: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",  icon_bg: "bg-purple-100 dark:bg-purple-900/30", header: "text-purple-700 dark:text-purple-400" },
  emerald: { progress: "bg-emerald-500", badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300", icon_bg: "bg-emerald-100 dark:bg-emerald-900/30", header: "text-emerald-700 dark:text-emerald-400" },
  orange:  { progress: "bg-orange-500",  badge: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",  icon_bg: "bg-orange-100 dark:bg-orange-900/30", header: "text-orange-700 dark:text-orange-400" },
  rose:    { progress: "bg-rose-500",    badge: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",          icon_bg: "bg-rose-100 dark:bg-rose-900/30",    header: "text-rose-700 dark:text-rose-400" },
  slate:   { progress: "bg-slate-500",   badge: "bg-slate-100 text-slate-700 dark:bg-slate-900/40 dark:text-slate-300",      icon_bg: "bg-slate-100 dark:bg-slate-900/30",  header: "text-slate-700 dark:text-slate-400" },
};

export function getSeriesColor(key: string | null | undefined) {
  return COLOR_MAP[(key as ColorKey) ?? "amber"] ?? COLOR_MAP.amber;
}
