import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./layout/AppShell";
import { ForgotPasswordPage } from "../features/auth/pages/ForgotPasswordPage";
import { LoginPage } from "../features/auth/pages/LoginPage";
import { RegisterPage } from "../features/auth/pages/RegisterPage";
import { ConveniosPage } from "../features/convenios/pages/ConveniosPage";
import { ParceirosPage } from "../features/parceiros/pages/ParceirosPage";

export function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/cadastro" element={<RegisterPage />} />
        <Route path="/recuperar-senha" element={<ForgotPasswordPage />} />
        <Route path="/convenios" element={<ConveniosPage />} />
        <Route path="/parceiros" element={<ParceirosPage />} />
      </Routes>
    </AppShell>
  );
}
