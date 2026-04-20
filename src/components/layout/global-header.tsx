import Link from "next/link";
import Image from "next/image";
import { Search, Bell } from "lucide-react";

type Props = {
  username: string;
  avatarUrl: string | null;
  name: string;
  pendingCount: number;
};

export default function GlobalHeader({ username, avatarUrl, name, pendingCount }: Props) {
  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b px-4 h-14 flex items-center justify-between">
      <span className="text-lg font-bold tracking-tight">ScoutPass</span>
      <div className="flex items-center gap-1">
        <Link href="/buscar" className="w-9 h-9 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          <Search className="size-5" />
        </Link>
        <Link href="/notificacoes" className="relative w-9 h-9 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          <Bell className="size-5" />
          {pendingCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[14px] h-3.5 bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
              {pendingCount > 99 ? "99+" : pendingCount}
            </span>
          )}
        </Link>
        <Link href={`/perfil/${username}`} className="w-9 h-9 rounded-full bg-muted border overflow-hidden shrink-0 flex items-center justify-center ml-1">
          {avatarUrl ? (
            <Image src={avatarUrl} alt="" width={36} height={36} className="object-cover w-full h-full" />
          ) : (
            <span className="text-sm font-semibold">{name[0]?.toUpperCase()}</span>
          )}
        </Link>
      </div>
    </header>
  );
}
