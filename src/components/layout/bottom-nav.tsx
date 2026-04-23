"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Map, Trophy, User, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  username: string;
  isModerator: boolean;
};

export default function BottomNav({ username, isModerator }: Props) {
  const pathname = usePathname();

  const links = [
    { href: "/home", label: "Feed", icon: Home },
    { href: "/desafios", label: "Desafios", icon: Trophy },
    { href: "/mapa", label: "Mapa", icon: Map },
    ...(isModerator ? [{ href: "/moderacao", label: "Moderação", icon: Shield }] : []),
    { href: `/perfil/${username}`, label: "Perfil", icon: User },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur safe-area-bottom"
      style={{ background: "rgba(12,10,9,0.94)", borderTop: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="flex items-stretch max-w-2xl mx-auto px-2">
        {links.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs transition-colors",
                isActive ? "text-[#f97316]" : "text-white/40 hover:text-white/80"
              )}
            >
              <div
                className={cn("rounded-full px-5 py-1.5 transition-colors")}
                style={isActive ? { background: "rgba(249,115,22,0.12)" } : {}}
              >
                <Icon className={cn("size-5", isActive && "stroke-[2.5px]")} />
              </div>
              <span className={cn("text-[10px]", isActive ? "font-semibold" : "font-medium")}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
