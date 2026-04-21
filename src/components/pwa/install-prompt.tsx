"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPrompt() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    if (sessionStorage.getItem("pwa-dismissed")) { setDismissed(true); return; }

    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!prompt || dismissed) return null;

  async function handleInstall() {
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "dismissed") {
      sessionStorage.setItem("pwa-dismissed", "1");
    }
    setPrompt(null);
  }

  function handleDismiss() {
    sessionStorage.setItem("pwa-dismissed", "1");
    setDismissed(true);
  }

  return (
    <div className="fixed bottom-24 left-4 right-4 z-50 max-w-lg mx-auto">
      <div className="rounded-2xl border bg-card shadow-lg px-4 py-3 flex items-center gap-3">
        <span className="text-2xl shrink-0">🏍️</span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">Instalar ScoutPass</p>
          <p className="text-xs text-muted-foreground">Acesso rápido direto da tela inicial</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={handleInstall}
            className="text-sm font-semibold text-primary"
          >
            Instalar
          </button>
          <button
            onClick={handleDismiss}
            className="text-sm text-muted-foreground"
          >
            Agora não
          </button>
        </div>
      </div>
    </div>
  );
}
