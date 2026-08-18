"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "./nav-items";

export function BottomNav() {
  const pathname = usePathname();

  if (
    pathname === "/login" ||
    pathname === "/onboarding" ||
    pathname.startsWith("/onboarding")
  ) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border-divider bg-surface-card/95 backdrop-blur-md md:hidden">
      <div className="flex items-center justify-around h-16">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 min-w-[56px] py-1 px-2 rounded-xl transition-colors ${
                isActive
                  ? "text-primary-forest"
                  : "text-text-muted hover:text-text-main"
              }`}
            >
              {item.icon}
              <span className="text-[10px] font-medium leading-none">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}