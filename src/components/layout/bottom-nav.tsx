"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Trophy, User, ShieldCheck } from "lucide-react";
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
    { href: `/perfil/${username}`, label: "Perfil", icon: User },
    ...(isModerator ? [{ href: "/moderacao", label: "Moderação", icon: ShieldCheck }] : []),
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background safe-area-bottom">
      <div className="flex items-stretch max-w-2xl mx-auto">
        {links.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 py-3 text-xs transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("size-5", isActive && "stroke-[2.5px]")} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
