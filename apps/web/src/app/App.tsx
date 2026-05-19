import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { AppShell } from "./layout/AppShell";
import { AtualizarMeusDadosPage } from "../features/atualizar-meus-dados/pages/AtualizarMeusDadosPage";
import { ForgotPasswordPage } from "../features/auth/pages/ForgotPasswordPage";
import { LoginPage } from "../features/auth/pages/LoginPage";
import { RegisterPage } from "../features/auth/pages/RegisterPage";
import { ResetPasswordPage } from "../features/auth/pages/ResetPasswordPage";
import { SessionDebugPage } from "../features/auth/pages/SessionDebugPage";
import { AUTH_SESSION_CHANGED_EVENT, clearAuthSession, hasAuthSession } from "../features/auth/services/authSession";
import { ConveniosPage } from "../features/convenios/pages/ConveniosPage";
import { CarteiraPage } from "../features/carteira/pages/CarteiraPage";
import { CarteiraLayoutConfigPage } from "../features/carteira/pages/CarteiraLayoutConfigPage";
import { FichaCadastralPage } from "../features/ficha-cadastral/pages/FichaCadastralPage";
import { JogoCorujinhaPage } from "../features/jogo-corujinha/pages/JogoCorujinhaPage";
import { LgpdOnlinePage } from "../features/lgpd/pages/LgpdOnlinePage";
import { MainMenuPage } from "../features/menu/pages/MainMenuPage";
import { MinhasFiliacoesPage } from "../features/minhas-filiacoes/pages/MinhasFiliacoesPage";
import { ParceirosPage } from "../features/parceiros/pages/ParceirosPage";
import { ProtocolosPage } from "../features/protocolos/pages/ProtocolosPage";
import { ProtocoloRelatorioPage } from "../features/protocolos/pages/ProtocoloRelatorioPage";
import { RegenciaClassePage } from "../features/regencia-classe/pages/RegenciaClassePage";
import { SolicitarFiliacaoPage } from "../features/solicitar-filiacao/pages/SolicitarFiliacaoPage";

const IDLE_TIMEOUT_MS = 30 * 60 * 1000;

export function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => hasAuthSession());
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    function syncAuthState() {
      setIsAuthenticated(hasAuthSession());
    }

    function onStorage(event: StorageEvent) {
      if (event.key === "portal_sintese_auth_session") {
        syncAuthState();
      }
    }

    window.addEventListener(AUTH_SESSION_CHANGED_EVENT, syncAuthState);
    window.addEventListener("storage", onStorage);
    syncAuthState();

    return () => {
      window.removeEventListener(AUTH_SESSION_CHANGED_EVENT, syncAuthState);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const publicPaths = new Set(["/login", "/cadastro", "/recuperar-senha", "/jogo-corujinha"]);
    if (publicPaths.has(location.pathname)) {
      return;
    }

    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const doLogoutByInactivity = () => {
      clearAuthSession();
      setIsAuthenticated(false);
      navigate("/login", { replace: true });
    };

    const resetIdleTimer = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(doLogoutByInactivity, IDLE_TIMEOUT_MS);
    };

    const activityEvents: Array<keyof WindowEventMap> = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "click"
    ];

    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, resetIdleTimer, { passive: true });
    });

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        resetIdleTimer();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    resetIdleTimer();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, resetIdleTimer);
      });
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [isAuthenticated, location.pathname, navigate]);

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Navigate to={isAuthenticated ? "/menu-principal" : "/login"} replace />} />
        <Route path="/login" element={isAuthenticated ? <Navigate to="/menu-principal" replace /> : <LoginPage />} />
        <Route
          path="/menu-principal"
          element={isAuthenticated ? <MainMenuPage /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/redefinir-senha"
          element={isAuthenticated ? <ResetPasswordPage /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/atualizar-meus-dados"
          element={isAuthenticated ? <AtualizarMeusDadosPage /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/minhas-filiacoes"
          element={isAuthenticated ? <MinhasFiliacoesPage /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/protocolos"
          element={isAuthenticated ? <ProtocolosPage /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/consulta-regencia-classe"
          element={isAuthenticated ? <RegenciaClassePage /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/solicitar-filiacao"
          element={isAuthenticated ? <SolicitarFiliacaoPage /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/protocolo-relatorio"
          element={isAuthenticated ? <ProtocoloRelatorioPage /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/ficha-cadastral"
          element={isAuthenticated ? <FichaCadastralPage /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/carteira"
          element={isAuthenticated ? <CarteiraPage /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/configurar-layout-carteira"
          element={isAuthenticated ? <CarteiraLayoutConfigPage /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/debug-sessao"
          element={isAuthenticated ? <SessionDebugPage /> : <Navigate to="/login" replace />}
        />
        <Route path="/lgpd-online" element={isAuthenticated ? <LgpdOnlinePage /> : <Navigate to="/login" replace />} />
        <Route path="/cadastro" element={<RegisterPage />} />
        <Route path="/recuperar-senha" element={<ForgotPasswordPage />} />
        <Route path="/jogo-corujinha" element={<JogoCorujinhaPage />} />
        <Route path="/convenios" element={<ConveniosPage />} />
        <Route path="/parceiros" element={<ParceirosPage />} />
      </Routes>
    </AppShell>
  );
}
