import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@sintese/ui";
import { digitsOnly } from "../../../shared/utils/masks";
import { readAuthSession } from "../../auth/services/authSession";
import { useCarteiraQuery } from "../hooks/useCarteiraQuery";
import { loadCarteiraLayout, normalizeCarteiraLayout, saveCarteiraLayout, type CarteiraLayoutConfig } from "../layout/carteiraLayout";
import { CarteiraPreview } from "../components/CarteiraPreview";
import { carteiraService } from "../../menu/services/carteira.service";

export function CarteiraPage() {
  const hasTriggeredAutoPrint = useRef(false);
  const [searchParams] = useSearchParams();
  const autoPrint = searchParams.get("autoPrint") === "1";
  const embedded = searchParams.get("embedded") === "1";
  const mobilePrint = searchParams.get("mobilePrint") === "1";
  const session = readAuthSession();
  const cpfDigits = useMemo(() => digitsOnly(session?.cpf ?? ""), [session?.cpf]);

  const carteiraQuery = useCarteiraQuery(cpfDigits, Boolean(cpfDigits));
  const carteira = carteiraQuery.data;
  const [layout, setLayout] = useState<CarteiraLayoutConfig>(() => loadCarteiraLayout());
  const [isLayoutLoading, setIsLayoutLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadGlobalLayout() {
      try {
        const remoteLayout = await carteiraService.getCarteiraLayout();
        if (!mounted || !remoteLayout) {
          return;
        }
        const normalized = normalizeCarteiraLayout(remoteLayout);
        setLayout(normalized);
        saveCarteiraLayout(normalized);
      } catch {
        // Keep local fallback.
      } finally {
        if (mounted) {
          setIsLayoutLoading(false);
        }
      }
    }

    void loadGlobalLayout();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!autoPrint || !carteira || carteiraQuery.isLoading || isLayoutLoading || hasTriggeredAutoPrint.current) {
      return;
    }

    hasTriggeredAutoPrint.current = true;
    const timer = window.setTimeout(() => {
      if (embedded && window.parent && window.parent !== window) {
        window.parent.postMessage({ type: "carteira-print-triggered" }, window.location.origin);
      }
      window.print();
    }, 250);

    return () => {
      window.clearTimeout(timer);
    };
  }, [autoPrint, embedded, carteira, carteiraQuery.isLoading, isLayoutLoading]);

  return (
    <section className={`carteira-print-root${mobilePrint ? " carteira-print-root-mobile" : ""}`}>
      {!cpfDigits ? <div className="alert-error">Sessao invalida. Faca login novamente.</div> : null}
      {carteiraQuery.isError ? <div className="alert-error">Nao foi possivel carregar a carteira.</div> : null}

      {carteiraQuery.isLoading ? <div className="carteira-loading">Carregando carteira para impressao...</div> : null}

      {mobilePrint && carteira ? (
        <div className="ficha-print-hide mb-3 flex w-full max-w-[760px] justify-center gap-2 px-2">
          <Button type="button" className="btn-modern-primary" onClick={() => window.print()}>
            Imprimir
          </Button>
          <Link to="/menu-principal">
            <Button type="button" className="btn-modern-danger">
              Voltar
            </Button>
          </Link>
        </div>
      ) : null}

      {carteira ? (
        <CarteiraPreview carteira={carteira} layout={layout} />
      ) : null}
    </section>
  );
}
