import { Link } from "@tanstack/react-router";
import { Home, TrendingUp, Boxes, Sparkles, User } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type NavItem = {
  to: "/dashboard" | "/trends" | "/inventory" | "/assistant" | "/profile";
  label: string;
  icon: LucideIcon;
};

const ITEMS: NavItem[] = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/trends", label: "Trends", icon: TrendingUp },
  { to: "/inventory", label: "Inventory", icon: Boxes },
  { to: "/assistant", label: "AI", icon: Sparkles },
  { to: "/profile", label: "Profile", icon: User },
];

export function BottomNav() {
  return (
    <nav
      aria-label="Primary"
      className="sticky bottom-0 left-0 right-0 z-20 -mx-6 mt-6 border-t border-border bg-card/85 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 backdrop-blur-md sm:rounded-b-3xl"
    >
      <ul className="flex items-stretch justify-between">
        {ITEMS.map(({ to, label, icon: Icon }) => (
          <li key={to} className="flex-1">
            <Link
              to={to}
              aria-label={label}
              className="group flex min-h-11 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-1.5 text-muted-foreground transition-colors hover:text-foreground motion-safe:transition-all"
              activeProps={{ className: "!text-primary", "aria-current": "page" }}
              activeOptions={{ exact: true }}
            >
              {({ isActive }) => (
                <>
                  <span
                    aria-hidden="true"
                    className={`grid h-9 w-9 place-items-center rounded-2xl transition-all duration-200 ${
                      isActive
                        ? "bg-primary-container text-on-primary-container shadow-elevation-1 motion-safe:scale-105"
                        : "bg-transparent group-hover:bg-secondary"
                    }`}
                  >
                    <Icon className="h-[18px] w-[18px]" strokeWidth={isActive ? 2.4 : 2} />
                  </span>
                  <span className="text-[10px] font-medium tracking-wide">{label}</span>
                </>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
