import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@sintese/ui";
import { clearAuthSession } from "../../auth/services/authSession";

type MenuAction = {
  label: string;
  to?: string;
};

const actions: MenuAction[] = [
  { label: "Solicitar Filiação", to: "/cadastro" },
  { label: "Consulta de Cálculo de Regência de Classe" },
  { label: "Protocolo(s)" },
  { label: "Carteira" },
  { label: "Ficha Cadastral" },
  { label: "Atualizar Meus Dados", to: "/atualizar-meus-dados" },
  { label: "Minhas Filiações", to: "/minhas-filiacoes" },
  { label: "Termo L.G.P.D. Online", to: "/lgpd-online" },
  { label: "Redefinir senha", to: "/redefinir-senha" }
];

export function MainMenuPage() {
  const [notice, setNotice] = useState<string | null>(null);
  const navigate = useNavigate();

  function onUnavailableClick(label: string) {
    setNotice(`"${label}" estará disponível em breve.`);
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

      {notice ? <div className="alert-info mb-3">{notice}</div> : null}

      <div className="space-y-2">
        {actions.map((action) =>
          action.to ? (
            <Link key={action.label} to={action.to} className="block">
              <Button type="button" className="btn-modern-danger w-full">
                {action.label}
              </Button>
            </Link>
          ) : (
            <Button
              key={action.label}
              type="button"
              className="btn-modern-danger w-full"
              onClick={() => onUnavailableClick(action.label)}
            >
              {action.label}
            </Button>
          )
        )}

        <Button type="button" className="btn-modern-danger w-full" onClick={onLogout}>
          Sair
        </Button>
      </div>

      <div className="mt-10 flex justify-center">
        <img
          src="/Logo%20Rodape.gif"
          alt="Logo rodapé"
          className="h-auto w-full max-w-[220px] object-contain"
        />
      </div>
    </section>
  );
}
