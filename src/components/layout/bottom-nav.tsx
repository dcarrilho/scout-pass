"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Trophy, Bell, User } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  username: string;
  isModerator: boolean;
  pendingCount: number;
};

export default function BottomNav({ username, isModerator: _isModerator, pendingCount }: Props) {
  const pathname = usePathname();

  const links = [
    { href: "/home", label: "Feed", icon: Home, badge: 0 },
    { href: "/desafios", label: "Desafios", icon: Trophy, badge: 0 },
    { href: "/notificacoes", label: "Notificações", icon: Bell, badge: pendingCount },
    { href: `/perfil/${username}`, label: "Perfil", icon: User, badge: 0 },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur safe-area-bottom">
      <div className="flex items-stretch max-w-2xl mx-auto px-2">
        {links.map(({ href, label, icon: Icon, badge }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className={cn("relative rounded-full px-5 py-1.5 transition-colors", isActive && "bg-primary/10")}>
                <Icon className={cn("size-5", isActive && "stroke-[2.5px]")} />
                {badge > 0 && (
                  <span className="absolute top-0.5 right-2 min-w-[16px] h-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                    {badge > 99 ? "99+" : badge}
                  </span>
                )}
              </div>
              <span className={cn("text-[10px]", isActive ? "font-semibold" : "font-medium")}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
