import LoginForm from "@/components/auth/login-form";
import Link from "next/link";

function BrandMark() {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: "#f97316", boxShadow: "0 4px 14px rgba(249,115,22,0.35)" }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#09090b" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 17h2l1-3h5l2 3h3" />
          <circle cx="18.5" cy="17" r="2.5" />
          <circle cx="5.5" cy="17" r="2.5" />
          <path d="M9 11l3-5h4l1 3" />
        </svg>
      </div>
      <span className="text-[18px] font-semibold tracking-tight">ScoutPass</span>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-[1.1fr_1fr]">

      {/* ── Hero panel (desktop only) ── */}
      <aside
        className="hidden lg:flex flex-col justify-between relative overflow-hidden p-10 xl:p-14"
        style={{
          background: `
            linear-gradient(180deg, rgba(9,9,11,0.2) 0%, rgba(9,9,11,0.75) 100%),
            repeating-linear-gradient(135deg, #1a1a1d 0 12px, #141417 12px 24px)
          `,
        }}
      >
        {/* Orange glows */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `
              radial-gradient(ellipse at 20% 110%, rgba(249,115,22,0.25), transparent 55%),
              radial-gradient(ellipse at 80% 0%, rgba(249,115,22,0.10), transparent 50%)
            `,
          }}
        />

        <div className="flex items-center justify-between relative">
          <BrandMark />
          <span className="font-mono text-[11px] tracking-[1.4px] text-white/40 uppercase">
            [ IMG · Serra da Chapada ]
          </span>
        </div>

        <div className="relative max-w-lg">
          <p className="font-mono text-[11px] tracking-[1.8px] text-orange-400 uppercase mb-5">
            // Rede de pilotos · BR
          </p>
          <h2 className="text-[44px] xl:text-[52px] font-semibold leading-[1.05] tracking-tight mb-5">
            Ande. Registre.<br />Colecione.
          </h2>
          <p className="text-base leading-relaxed text-white/70 mb-10 max-w-md">
            Descubra desafios, conquiste locais e construa sua coleção de medalhas.
            Cada check-in é uma marca no mapa — e uma história pra contar.
          </p>

          <div className="grid grid-cols-3 gap-7">
            {[
              { n: "2.4k", k: "Pilotos ativos" },
              { n: "127", k: "Desafios abertos" },
              { n: "38k", k: "Check-ins" },
            ].map(({ n, k }) => (
              <div key={k}>
                <span className="font-mono text-[26px] font-medium tracking-tight block leading-none">{n}</span>
                <span className="font-mono text-[10px] tracking-[1.4px] text-white/55 uppercase mt-1.5 block">{k}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* ── Form panel ── */}
      <main className="min-h-screen flex flex-col px-6 py-7 sm:px-10 md:px-14 lg:px-16 lg:justify-center relative overflow-hidden bg-[#09090b]">
        {/* Ambient glow — mobile only */}
        <div
          className="absolute -top-36 -right-36 w-[360px] h-[360px] pointer-events-none lg:hidden"
          style={{ background: "radial-gradient(circle, rgba(249,115,22,0.18), transparent 65%)" }}
        />

        {/* Brand — visible on mobile, absolute on desktop */}
        <div className="relative z-10 lg:hidden">
          <BrandMark />
        </div>

        <div className="flex-1 flex flex-col justify-center max-w-sm w-full mx-auto mt-10 lg:mt-0 relative z-10">
          <h1 className="text-[28px] sm:text-[32px] font-semibold tracking-tight leading-tight mb-2">
            Sua jornada começa aqui
          </h1>
          <p className="text-sm text-white/55 mb-9">Entre para continuar sua rota.</p>

          <LoginForm />
        </div>

        <p className="text-center text-sm text-white/55 relative z-10 mt-6 lg:mt-8">
          Novo por aqui?{" "}
          <Link href="/cadastro" className="text-white font-medium hover:underline underline-offset-4">
            Crie uma conta
          </Link>
        </p>
      </main>
    </div>
  );
}
