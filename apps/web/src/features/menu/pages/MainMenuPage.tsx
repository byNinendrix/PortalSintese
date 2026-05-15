import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@sintese/ui";
import { TimedAlert } from "../../../shared/components/TimedAlert";
import { clearAuthSession, readAuthSession } from "../../auth/services/authSession";

type MenuAction = {
  label: string;
  to?: string;
  requiresFiliacaoAtiva?: boolean;
  openInNewTab?: boolean;
  triggerFichaPrint?: boolean;
  triggerCarteira?: boolean;
};

const actions: MenuAction[] = [
  { label: "Solicitar Filiação", to: "/solicitar-filiacao" },
  { label: "Consulta de Cálculo de Regência de Classe", to: "/consulta-regencia-classe", requiresFiliacaoAtiva: true },
  { label: "Protocolo(s)", to: "/protocolos" },
  { label: "Carteira", requiresFiliacaoAtiva: true, triggerCarteira: true },
  { label: "Ficha Cadastral", requiresFiliacaoAtiva: true, triggerFichaPrint: true },
  { label: "Atualizar Meus Dados", to: "/atualizar-meus-dados", requiresFiliacaoAtiva: true },
  { label: "Minhas Filiações", to: "/minhas-filiacoes", requiresFiliacaoAtiva: true },
  { label: "Termo L.G.P.D. Online", to: "/lgpd-online", requiresFiliacaoAtiva: true },
  { label: "Debug Sessão", to: "/debug-sessao" },
  { label: "Redefinir senha", to: "/redefinir-senha" }
];

export function MainMenuPage() {
  const session = readAuthSession();
  const [notice, setNotice] = useState<string | null>(null);
  const [isPreparingPrint, setIsPreparingPrint] = useState(false);
  const [isPreparingCarteira, setIsPreparingCarteira] = useState(false);
  const navigate = useNavigate();

  const clearNotice = useCallback(() => {
    setNotice(null);
  }, []);

  function onUnavailableClick(label: string) {
    setNotice(`"${label}" estará disponível em breve.`);
  }

  function triggerFichaPrint() {
    if (isPreparingPrint) {
      return;
    }

    setIsPreparingPrint(true);
    setNotice("Carregando ficha cadastral para impressão...");

    const iframe = document.createElement("iframe");
    iframe.setAttribute("title", "Impressão da ficha cadastral");
    iframe.style.position = "fixed";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.opacity = "0";
    iframe.style.border = "0";
    iframe.style.pointerEvents = "none";
    iframe.style.left = "-9999px";
    iframe.style.top = "-9999px";

    let finished = false;
    let timeoutId: number | null = null;
    const cleanup = () => {
      if (finished) {
        return;
      }
      finished = true;
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
      setIsPreparingPrint(false);
      window.removeEventListener("message", onMessage);
      iframe.remove();
    };

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) {
        return;
      }
      const payload = event.data as { type?: string } | null;
      if (payload?.type === "ficha-print-triggered") {
        setNotice(null);
        window.setTimeout(() => {
          cleanup();
        }, 1200);
      }
    };

    window.addEventListener("message", onMessage);

    timeoutId = window.setTimeout(() => {
      cleanup();
      setNotice("Não foi possível preparar a impressão da ficha agora. Tente novamente.");
    }, 30000);

    iframe.onload = () => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };

    iframe.src = "/ficha-cadastral?autoPrint=1&embedded=1";
    document.body.appendChild(iframe);
  }

  function triggerCarteira() {
    if (isPreparingCarteira) {
      return;
    }

    setIsPreparingCarteira(true);
    setNotice("Carregando carteira para impressão...");

    const iframe = document.createElement("iframe");
    iframe.setAttribute("title", "Impressão da carteira");
    iframe.style.position = "fixed";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.opacity = "0";
    iframe.style.border = "0";
    iframe.style.pointerEvents = "none";
    iframe.style.left = "-9999px";
    iframe.style.top = "-9999px";

    let finished = false;
    let timeoutId: number | null = null;
    const cleanup = () => {
      if (finished) {
        return;
      }
      finished = true;
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
      setIsPreparingCarteira(false);
      window.removeEventListener("message", onMessage);
      iframe.remove();
    };

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) {
        return;
      }
      const payload = event.data as { type?: string } | null;
      if (payload?.type === "carteira-print-triggered") {
        setNotice(null);
        window.setTimeout(() => {
          cleanup();
        }, 1200);
      }
    };

    window.addEventListener("message", onMessage);

    timeoutId = window.setTimeout(() => {
      cleanup();
      setNotice("Não foi possível preparar a impressão da carteira agora. Tente novamente.");
    }, 30000);

    iframe.onload = () => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };

    iframe.src = "/carteira?autoPrint=1&embedded=1";
    document.body.appendChild(iframe);
  }

  function hasFiliacaoAtiva(): boolean {
    if (!session) {
      setNotice("Sessão inválida. Faça login novamente.");
      return false;
    }

    if (typeof session.isFiliadoAtivo !== "boolean") {
      setNotice("Sua sessão está desatualizada. Faça login novamente.");
      return false;
    }

    if (!session.isFiliadoAtivo) {
      setNotice("O CPF informado não possui filiação ativa.");
      return false;
    }

    return true;
  }

  function onActionClick(action: MenuAction) {
    setNotice(null);

    if (action.requiresFiliacaoAtiva && !hasFiliacaoAtiva()) {
      return;
    }

    if (action.triggerCarteira) {
      void triggerCarteira();
      return;
    }

    if (action.triggerFichaPrint) {
      triggerFichaPrint();
      return;
    }

    if (action.to) {
      if (action.openInNewTab) {
        const reportWindow = window.open(action.to, "_blank");
        if (!reportWindow) {
          setNotice("Não foi possível abrir nova aba. Verifique o bloqueador de pop-up.");
        } else {
          reportWindow.opener = null;
        }
        return;
      }

      navigate(action.to);
      return;
    }

    onUnavailableClick(action.label);
  }

  function onLogout() {
    clearAuthSession();
    navigate("/login", { replace: true });
  }

  return (
    <section className="auth-card-modern mx-auto w-full max-w-[560px]">
      <div className="mb-4 flex justify-center px-3 sm:px-4">
        <img
          src="/logo-sintese-oficial.png"
          alt="Logo SINTESE"
          className="block h-auto object-contain"
          style={{ width: "320px", maxWidth: "100%" }}
        />
      </div>

      <h1 className="section-title mb-4">Menu Principal</h1>

      {notice ? <TimedAlert message={notice} durationMs={5000} onClose={clearNotice} /> : null}

      <div className="space-y-2">
        {actions.map((action) => (
          <Button
            key={action.label}
            type="button"
            className="btn-modern-danger w-full"
            onClick={() => onActionClick(action)}
            disabled={isPreparingPrint || isPreparingCarteira}
          >
            {action.label}
          </Button>
        ))}

        <Button
          type="button"
          className="btn-modern-danger w-full"
          onClick={onLogout}
          disabled={isPreparingPrint || isPreparingCarteira}
        >
          Sair
        </Button>
      </div>

      <div className="mt-10 flex justify-center">
        <img src="/Logo%20Rodape.gif" alt="Logo rodapé" className="h-auto w-full max-w-[220px] object-contain" />
      </div>
    </section>
  );
}
