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
    <main className="min-h-screen flex flex-col items-center justify-center px-6 bg-[#09090b] relative overflow-hidden">
      {/* Ambient glow */}
      <div
        className="absolute -top-36 -right-36 w-[360px] h-[360px] pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(249,115,22,0.15), transparent 65%)" }}
      />

      <div className="w-full max-w-sm relative z-10">
        <h1 className="text-[32px] font-semibold tracking-tight leading-tight mb-2">
          ScoutPass
        </h1>
        <p className="text-sm text-white/55 mb-9">Sua jornada começa aqui</p>

        <LoginForm />
      </div>

      <p className="text-center text-sm text-white/55 relative z-10 mt-8">
        Novo por aqui?{" "}
        <Link href="/cadastro" className="text-white font-medium hover:underline underline-offset-4">
          Crie uma conta
        </Link>
      </p>
    </main>
  );
}
