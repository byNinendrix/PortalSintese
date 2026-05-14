import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./layout/AppShell";
import { AtualizarMeusDadosPage } from "../features/atualizar-meus-dados/pages/AtualizarMeusDadosPage";
import { ForgotPasswordPage } from "../features/auth/pages/ForgotPasswordPage";
import { LoginPage } from "../features/auth/pages/LoginPage";
import { RegisterPage } from "../features/auth/pages/RegisterPage";
import { ResetPasswordPage } from "../features/auth/pages/ResetPasswordPage";
import { SessionDebugPage } from "../features/auth/pages/SessionDebugPage";
import { AUTH_SESSION_CHANGED_EVENT, hasAuthSession } from "../features/auth/services/authSession";
import { ConveniosPage } from "../features/convenios/pages/ConveniosPage";
import { CarteiraPage } from "../features/carteira/pages/CarteiraPage";
import { CarteiraLayoutConfigPage } from "../features/carteira/pages/CarteiraLayoutConfigPage";
import { FichaCadastralPage } from "../features/ficha-cadastral/pages/FichaCadastralPage";
import { LgpdOnlinePage } from "../features/lgpd/pages/LgpdOnlinePage";
import { MainMenuPage } from "../features/menu/pages/MainMenuPage";
import { MinhasFiliacoesPage } from "../features/minhas-filiacoes/pages/MinhasFiliacoesPage";
import { ParceirosPage } from "../features/parceiros/pages/ParceirosPage";
import { ProtocolosPage } from "../features/protocolos/pages/ProtocolosPage";
import { ProtocoloRelatorioPage } from "../features/protocolos/pages/ProtocoloRelatorioPage";
import { RegenciaClassePage } from "../features/regencia-classe/pages/RegenciaClassePage";

export function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => hasAuthSession());

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
        <Route path="/convenios" element={<ConveniosPage />} />
        <Route path="/parceiros" element={<ParceirosPage />} />
      </Routes>
    </AppShell>
  );
}
