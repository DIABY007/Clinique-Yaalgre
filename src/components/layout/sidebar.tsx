"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "./nav-items";

export function Sidebar() {
  const pathname = usePathname();

  if (
    pathname === "/login" ||
    pathname === "/onboarding" ||
    pathname.startsWith("/onboarding") ||
    pathname === "/admin"
  ) {
    return null;
  }

  return (
    <aside className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:left-0 md:w-64 md:border-r md:border-border-divider md:bg-surface-card z-40">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-border-divider px-6">
        <Image
          src="/logo.png"
          alt="Clinique Yaalgre"
          width={110}
          height={37}
          className="h-9 w-auto"
          priority
        />
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-1 p-4">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-primary-forest text-white shadow-sm"
                  : "text-text-muted hover:bg-primary-forest/5 hover:text-text-main"
              }`}
            >
              <span className={isActive ? "text-white" : "text-text-muted"}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border-divider px-6 py-4">
        <p className="text-xs text-text-muted">Clinique Yaalgre v1.0</p>
      </div>
    </aside>
  );
}