"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/sign-out-button";

const links = [
  { href: "/bank", label: "Bank" },
  { href: "/jobs", label: "Jobs" },
  { href: "/settings", label: "Settings" },
] as const;

function isActive(href: string, pathname: string) {
  if (href === "/bank") return pathname === "/bank";
  if (href === "/settings") return pathname === "/settings";
  if (href === "/jobs") return pathname === "/jobs" || pathname.startsWith("/jobs/");
  return false;
}

export function DashboardNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/95 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/95">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex min-w-0 flex-1 items-center gap-6">
          <Link
            href="/bank"
            className="shrink-0 text-sm font-semibold tracking-tight text-neutral-900 md:hidden dark:text-neutral-100"
          >
            layerlane-apply
          </Link>
          <div className="hidden flex-wrap items-center gap-6 text-sm md:flex">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={
                isActive(href, pathname)
                  ? "font-medium text-neutral-900 underline decoration-neutral-400 underline-offset-4 dark:text-neutral-100"
                  : "text-neutral-600 hover:text-neutral-900 hover:underline dark:text-neutral-400 dark:hover:text-neutral-100"
              }
            >
              {label}
            </Link>
          ))}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <div className="hidden md:block">
            <SignOutButton />
          </div>
          <button
            type="button"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-800 md:hidden dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav-panel"
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {open ? (
        <nav
          id="mobile-nav-panel"
          className="border-t border-neutral-200 bg-white px-4 py-4 dark:border-neutral-800 dark:bg-neutral-950 md:hidden"
        >
          <ul className="flex flex-col gap-1">
            {links.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  className={
                    isActive(href, pathname)
                      ? "block rounded-lg bg-neutral-100 px-3 py-2.5 text-[15px] font-semibold text-neutral-900 dark:bg-neutral-900 dark:text-neutral-50"
                      : "block rounded-lg px-3 py-2.5 text-[15px] font-medium text-neutral-800 hover:bg-neutral-100 dark:text-neutral-100 dark:hover:bg-neutral-900"
                  }
                  onClick={() => setOpen(false)}
                >
                  {label}
                </Link>
              </li>
            ))}
            <li className="mt-2 border-t border-neutral-200 pt-3 dark:border-neutral-800">
              <SignOutButton className="w-full rounded-lg px-3 py-2.5 text-left text-[15px] font-medium text-neutral-600 hover:bg-neutral-100 hover:no-underline dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-neutral-200" />
            </li>
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
