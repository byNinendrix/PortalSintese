import { useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { digitsOnly } from "../../../shared/utils/masks";
import { readAuthSession } from "../../auth/services/authSession";
import { useCarteiraQuery } from "../hooks/useCarteiraQuery";
import { loadCarteiraLayout } from "../layout/carteiraLayout";
import { CarteiraPreview } from "../components/CarteiraPreview";

export function CarteiraPage() {
  const hasTriggeredAutoPrint = useRef(false);
  const [searchParams] = useSearchParams();
  const autoPrint = searchParams.get("autoPrint") === "1";
  const embedded = searchParams.get("embedded") === "1";
  const session = readAuthSession();
  const cpfDigits = useMemo(() => digitsOnly(session?.cpf ?? ""), [session?.cpf]);

  const carteiraQuery = useCarteiraQuery(cpfDigits, Boolean(cpfDigits));
  const carteira = carteiraQuery.data;
  const layout = useMemo(() => loadCarteiraLayout(), []);

  useEffect(() => {
    if (!autoPrint || !carteira || carteiraQuery.isLoading || hasTriggeredAutoPrint.current) {
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
  }, [autoPrint, embedded, carteira, carteiraQuery.isLoading]);

  return (
    <section className="carteira-print-root">
      {!cpfDigits ? <div className="alert-error">Sessao invalida. Faca login novamente.</div> : null}
      {carteiraQuery.isError ? <div className="alert-error">Nao foi possivel carregar a carteira.</div> : null}

      {carteiraQuery.isLoading ? <div className="carteira-loading">Carregando carteira para impressao...</div> : null}

      {carteira ? (
        <CarteiraPreview carteira={carteira} layout={layout} />
      ) : null}
    </section>
  );
}
