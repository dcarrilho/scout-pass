import Link from "next/link";
import { verifyAdmin } from "@/lib/dal";
import { ChevronLeft, Users, Trophy } from "lucide-react";

const TABS = [
  { href: "/admin/usuarios", label: "Usuários", icon: Users },
  { href: "/admin/desafios", label: "Desafios", icon: Trophy },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await verifyAdmin();

  return (
    <div className="min-h-screen" style={{ background: "#0a0908" }}>
      {/* Header */}
      <div
        className="sticky top-0 z-50 px-4 py-3 flex items-center gap-3"
        style={{ background: "rgba(10,9,8,0.95)", borderBottom: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(12px)" }}
      >
        <Link
          href="/home"
          className="w-8 h-8 flex items-center justify-center rounded-full transition-colors text-white/50 hover:text-white"
          style={{ background: "rgba(255,255,255,0.06)" }}
        >
          <ChevronLeft className="size-4" />
        </Link>
        <div className="flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#a855f7" }}>
            Painel
          </p>
          <p className="text-sm font-bold text-white leading-tight">Administração</p>
        </div>
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={{ background: "rgba(168,85,247,0.15)", color: "#a855f7", border: "1px solid rgba(168,85,247,0.3)" }}
        >
          ADMIN
        </span>
      </div>

      {/* Tab navigation */}
      <div
        className="flex px-4 gap-1 pt-3 pb-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        {TABS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors text-white/40 hover:text-white/80"
            style={{ borderBottom: "2px solid transparent" }}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        ))}
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {children}
      </div>
    </div>
  );
}
