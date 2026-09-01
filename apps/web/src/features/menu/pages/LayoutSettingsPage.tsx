import { Link } from "react-router-dom";
import { Button } from "@sintese/ui";

export function LayoutSettingsPage() {
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

      <h1 className="section-title mb-4">Configuracoes de layout</h1>

      <div className="space-y-2">
        <Link to="/configurar-layout-carteira" className="block">
          <Button type="button" className="btn-modern-primary w-full">
            Configurar layout da carteira
          </Button>
        </Link>

        <Link to="/configurar-layout-certificado-congresso" className="block">
          <Button type="button" className="btn-modern-primary w-full">
            Configurar layout do certificado do congresso
          </Button>
        </Link>

        <Link to="/menu-principal" className="block">
          <Button type="button" className="btn-modern-danger w-full">
            Voltar
          </Button>
        </Link>
      </div>
    </section>
  );
}
