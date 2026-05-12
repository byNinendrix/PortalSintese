import { Link } from "react-router-dom";
import { Button } from "@sintese/ui";
import { digitsOnly, formatCpf } from "../../../shared/utils/masks";
import { useSessionDebugQuery } from "../hooks/useSessionDebugQuery";
import { readAuthSession } from "../services/authSession";

export function SessionDebugPage() {
  const session = readAuthSession();
  const cpfDigits = digitsOnly(session?.cpf ?? "");
  const sessionDebugQuery = useSessionDebugQuery(cpfDigits, Boolean(cpfDigits));

  return (
    <section className="auth-card-modern mx-auto w-full max-w-[720px]">
      <h1 className="section-title mb-4">Debug de Sessao</h1>

      {!cpfDigits ? <div className="alert-error mb-3">Sessao invalida. Faca login novamente.</div> : null}
      {sessionDebugQuery.isError ? (
        <div className="alert-error mb-3">Falha ao consultar /auth/me/session.</div>
      ) : null}

      <div className="space-y-4">
        <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h2 className="mb-2 text-base font-extrabold text-slate-900">Sessao Local (Frontend)</h2>
          <pre className="overflow-x-auto rounded-lg bg-white p-3 text-xs text-slate-700">
            {JSON.stringify(
              {
                ...session,
                cpfFormatado: session?.cpf ? formatCpf(session.cpf) : null
              },
              null,
              2
            )}
          </pre>
        </article>

        <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h2 className="mb-2 text-base font-extrabold text-slate-900">Snapshot Backend (/auth/me/session)</h2>
          {sessionDebugQuery.isLoading ? (
            <p className="text-sm text-slate-600">Consultando backend...</p>
          ) : (
            <pre className="overflow-x-auto rounded-lg bg-white p-3 text-xs text-slate-700">
              {JSON.stringify(sessionDebugQuery.data ?? null, null, 2)}
            </pre>
          )}
        </article>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Button
          type="button"
          className="btn-modern-primary w-full"
          onClick={() => {
            void sessionDebugQuery.refetch();
          }}
          isLoading={sessionDebugQuery.isFetching}
        >
          Atualizar debug
        </Button>
        <Link to="/menu-principal" className="block">
          <Button type="button" className="btn-modern-danger w-full">
            Voltar ao menu
          </Button>
        </Link>
      </div>
    </section>
  );
}

