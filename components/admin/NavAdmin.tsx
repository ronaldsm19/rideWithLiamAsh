"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin", label: "Solicitudes", match: (p: string) => p === "/admin" },
  { href: "/admin/rodadas", label: "Rodadas", match: (p: string) => p.startsWith("/admin/rodadas") },
];

export default function NavAdmin() {
  const pathname = usePathname();
  return (
    <nav className="mb-8 flex gap-1 border-b border-line pb-px">
      {TABS.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
            tab.match(pathname)
              ? "text-fg after:absolute after:inset-x-0 after:bottom-[-1px] after:h-[2px] after:rounded-full after:bg-accent"
              : "text-muted hover:text-fg"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
