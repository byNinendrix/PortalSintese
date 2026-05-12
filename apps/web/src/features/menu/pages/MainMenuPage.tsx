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
};

const actions: MenuAction[] = [
  { label: "Solicitar Filiação", to: "/cadastro" },
  { label: "Consulta de Cálculo de Regência de Classe", requiresFiliacaoAtiva: true },
  { label: "Protocolo(s)" },
  { label: "Carteira", requiresFiliacaoAtiva: true },
  { label: "Ficha Cadastral", to: "/ficha-cadastral?autoPrint=1", requiresFiliacaoAtiva: true, openInNewTab: true },
  { label: "Atualizar Meus Dados", to: "/atualizar-meus-dados", requiresFiliacaoAtiva: true },
  { label: "Minhas Filiações", to: "/minhas-filiacoes", requiresFiliacaoAtiva: true },
  { label: "Termo L.G.P.D. Online", to: "/lgpd-online", requiresFiliacaoAtiva: true },
  { label: "Debug Sessão", to: "/debug-sessao" },
  { label: "Redefinir senha", to: "/redefinir-senha" }
];

export function MainMenuPage() {
  const session = readAuthSession();
  const [notice, setNotice] = useState<string | null>(null);
  const navigate = useNavigate();

  const clearNotice = useCallback(() => {
    setNotice(null);
  }, []);

  function onUnavailableClick(label: string) {
    setNotice(`"${label}" estará disponível em breve.`);
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
          >
            {action.label}
          </Button>
        ))}

        <Button type="button" className="btn-modern-danger w-full" onClick={onLogout}>
          Sair
        </Button>
      </div>

      <div className="mt-10 flex justify-center">
        <img src="/Logo%20Rodape.gif" alt="Logo rodapé" className="h-auto w-full max-w-[220px] object-contain" />
      </div>
    </section>
  );
}
