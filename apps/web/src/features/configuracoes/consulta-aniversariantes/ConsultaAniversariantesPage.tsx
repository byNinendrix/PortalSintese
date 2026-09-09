import { useState } from "react";

function formatDateBR(date: Date): string {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function toInputDate(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

const COLUNAS = ["Nome", "Data de nascimento", "WhatsApp", "Mensagem", "Status"];

export function ConsultaAniversariantesPage() {
  const [dataRef, setDataRef] = useState(() => toInputDate(new Date()));

  return (
    <section className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">
          Consulta aniversariantes do dia
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Consulte futuramente os filiados aniversariantes do dia para envio das
          mensagens configuradas.
        </p>
      </div>

      <div className="mb-6 rounded-xl border-2 border-amber-300 bg-amber-50 px-5 py-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 text-lg">{"\u26A0\uFE0F"}</span>
          <div>
            <p className="text-sm font-bold text-amber-800">
              Estrutura inicial
            </p>
            <p className="mt-0.5 text-sm text-amber-700">
              A consulta real dos aniversariantes será implementada em etapa
              posterior. Esta tela apresenta apenas a estrutura visual.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="block text-sm font-semibold text-slate-700">
            Data de referência
            <input
              className="form-input mt-1"
              type="date"
              value={dataRef}
              onChange={(e) => setDataRef(e.target.value)}
            />
          </label>
          <button
            type="button"
            className="btn-modern-primary opacity-50 cursor-not-allowed"
            disabled
          >
            Consultar aniversariantes
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {COLUNAS.map((col) => (
                  <th
                    key={col}
                    className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-600"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td
                  colSpan={COLUNAS.length}
                  className="px-4 py-12 text-center"
                >
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-3xl">{"\uD83C\uDF82"}</span>
                    <p className="text-sm font-semibold text-slate-500">
                      Nenhum aniversariante encontrado
                    </p>
                    <p className="max-w-sm text-xs text-slate-400">
                      A consulta real dos aniversariantes será implementada em
                      etapa posterior. Por enquanto esta tabela permanece vazia.
                    </p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-xs text-slate-400">
          Data selecionada:{" "}
          <span className="font-semibold">
            {dataRef ? formatDateBR(new Date(dataRef + "T00:00:00")) : "—"}
          </span>
        </p>
      </div>
    </section>
  );
}
