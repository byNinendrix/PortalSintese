import { useEffect, useState, type ReactNode } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@sintese/ui";

interface AppShellProps {
  children: ReactNode;
}

const navItems = [
  { to: "/menu-principal", label: "Menu Principal" },
  { to: "/login", label: "Login" },
  { to: "/cadastro", label: "Cadastro" },
  { to: "/recuperar-senha", label: "Recuperar Senha" },
  { to: "/convenios", label: "Convênios" },
  { to: "/parceiros", label: "Parceiros" }
];

export function AppShell({ children }: AppShellProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isLegacyLoginView =
    pathname === "/login" ||
    pathname === "/menu-principal" ||
    pathname === "/consulta-regencia-classe" ||
    pathname === "/protocolos" ||
    pathname === "/protocolo-relatorio" ||
    pathname === "/redefinir-senha" ||
    pathname === "/atualizar-meus-dados" ||
    pathname === "/minhas-filiacoes" ||
    pathname === "/ficha-cadastral" ||
    pathname === "/carteira" ||
    pathname === "/debug-sessao" ||
    pathname === "/lgpd-online" ||
    pathname === "/cadastro" ||
    pathname === "/recuperar-senha" ||
    pathname === "/convenios";
  const isWideLegacyView = pathname === "/protocolo-relatorio";

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (pathname !== "/menu-principal") {
        return;
      }
      const key = event.key.toLowerCase();
      if (!event.ctrlKey || !event.shiftKey || key !== "q") {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      navigate("/configurar-layout-carteira");
    }

    window.addEventListener("keydown", onKeyDown, true);
    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
    };
  }, [navigate, pathname]);

  if (isLegacyLoginView) {
    return (
      <div className="auth-page-bg px-4 py-6 sm:px-6">
        <main className={`mx-auto w-full pt-8 sm:pt-10 ${isWideLegacyView ? "max-w-[980px]" : "max-w-md"}`}>{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc,#eef2ff)]">
      <aside className="fixed left-0 top-0 hidden h-screen w-72 border-r border-slate-200/80 bg-white/90 p-4 backdrop-blur lg:block">
        <Link to="/menu-principal" className="block text-lg font-extrabold text-slate-900">
          Portal SINTESE
        </Link>
        <p className="mt-1 text-xs uppercase tracking-wider text-slate-500">Plataforma modernizada</p>
        <nav className="mt-6 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `block rounded-xl px-3 py-2 text-sm font-semibold transition duration-200 ${
                  isActive ? "bg-sky-100 text-sky-900" : "text-slate-600 hover:bg-slate-100"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 p-4 backdrop-blur lg:hidden">
        <Button variant="secondary" onClick={() => setIsMobileMenuOpen(true)}>
          Menu
        </Button>
      </header>

      {isMobileMenuOpen ? (
        <div className="fixed inset-0 z-30 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/40"
            aria-label="Fechar menu"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <aside className="relative h-full w-72 bg-white p-4">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-lg font-extrabold text-slate-900">Navegação</span>
              <Button variant="ghost" onClick={() => setIsMobileMenuOpen(false)}>
                Fechar
              </Button>
            </div>
            <nav className="space-y-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `block rounded-xl px-3 py-2 text-sm font-semibold transition duration-200 ${
                      isActive ? "bg-sky-100 text-sky-900" : "text-slate-600 hover:bg-slate-100"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </aside>
        </div>
      ) : null}

      <main className="lg:pl-72">
        <div className="page-container">{children}</div>
      </main>
    </div>
  );
}
