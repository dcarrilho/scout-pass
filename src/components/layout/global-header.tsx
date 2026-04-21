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
    <header
      className="sticky top-0 z-50 backdrop-blur px-4 h-14 flex items-center justify-between"
      style={{ background: "rgba(12,10,9,0.92)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
    >
      <span className="text-lg font-bold tracking-tight text-white">ScoutPass</span>
      <div className="flex items-center gap-1">
        <Link href="/buscar" className="w-9 h-9 flex items-center justify-center rounded-full text-white/50 hover:text-white hover:bg-white/08 transition-colors">
          <Search className="size-5" />
        </Link>
        <Link href="/notificacoes" className="relative w-9 h-9 flex items-center justify-center rounded-full text-white/50 hover:text-white hover:bg-white/08 transition-colors">
          <Bell className="size-5" />
          {pendingCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[14px] h-3.5 bg-[#f97316] text-[#0c0a09] text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
              {pendingCount > 99 ? "99+" : pendingCount}
            </span>
          )}
        </Link>
        <Link href={`/perfil/${username}`} className="w-9 h-9 rounded-full overflow-hidden shrink-0 flex items-center justify-center ml-1 text-white/80 font-semibold text-sm" style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.12)" }}>
          {avatarUrl ? (
            <Image src={avatarUrl} alt="" width={36} height={36} className="object-cover w-full h-full" />
          ) : (
            <span>{name[0]?.toUpperCase()}</span>
          )}
        </Link>
      </div>
    </header>
  );
}
