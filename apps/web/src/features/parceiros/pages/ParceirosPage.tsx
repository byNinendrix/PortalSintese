import { useState } from "react";
import { Badge, Card, EmptyState, Input, LoadingSpinner, ResponsiveTable } from "@sintese/ui";
import { useParceirosQuery } from "../hooks/useParceirosQuery";

export function ParceirosPage() {
  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState("");
  const parceirosQuery = useParceirosQuery({ nome, categoria });

  if (parceirosQuery.isPending) {
    return <LoadingSpinner label="Carregando parceiros..." />;
  }

  if (parceirosQuery.isError) {
    return <div className="alert-error">Falha ao carregar parceiros. Verifique mock/API e tente novamente.</div>;
  }

  const rows = parceirosQuery.data ?? [];

  return (
    <section className="space-y-4">
      <div className="surface-card p-4 sm:p-5">
        <h1 className="text-2xl font-extrabold text-slate-900">Parceiros</h1>
        <p className="mt-1 text-sm text-slate-600">
          Listagem via camada de serviço com fallback de mock controlado por feature flag.
        </p>
      </div>

      <Card
        header={<h2 className="text-sm font-semibold uppercase tracking-wider text-slate-600">Filtros</h2>}
        className="surface-card p-1"
        body={
          <div className="form-grid">
            <Input
              id="filtroNomeParceiro"
              label="Nome do Parceiro"
              placeholder="Ex.: Parceiro A"
              value={nome}
              onChange={(event) => setNome(event.target.value)}
            />
            <Input
              id="filtroCategoria"
              label="Categoria"
              placeholder="Ex.: Saude"
              value={categoria}
              onChange={(event) => setCategoria(event.target.value)}
            />
          </div>
        }
      />

      {rows.length === 0 ? (
        <EmptyState title="Nenhum parceiro encontrado" description="Não há resultados para os filtros informados." />
      ) : (
        <div className="surface-card overflow-hidden p-3 sm:p-4">
          <ResponsiveTable
            rows={rows}
            rowKey={(row) => row.id}
            columns={[
              { key: "nome", header: "Parceiro", render: (row) => row.name },
              { key: "categoria", header: "Categoria", render: (row) => row.category },
              { key: "beneficio", header: "Benefício", render: (row) => <span className="font-mono">{row.benefit}</span> },
              { key: "contato", header: "Contato", render: (row) => row.contact },
              {
                key: "situacao",
                header: "Situação",
                render: (row) => <Badge variant={row.status === "ativo" ? "success" : "error"}>{row.status}</Badge>
              }
            ]}
            mobileCard={(row) => (
              <Card
                className="rounded-2xl border border-slate-200 shadow-sm"
                header={
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-slate-900">{row.name}</h3>
                    <Badge variant={row.status === "ativo" ? "success" : "error"}>{row.status}</Badge>
                  </div>
                }
                body={
                  <div className="space-y-2 text-sm text-slate-600">
                    <p>
                      <strong>Categoria:</strong> {row.category}
                    </p>
                    <p className="font-mono">
                      <strong>Beneficio:</strong> {row.benefit}
                    </p>
                    <p>
                      <strong>Contato:</strong> {row.contact}
                    </p>
                  </div>
                }
              />
            )}
          />
        </div>
      )}
    </section>
  );
}
