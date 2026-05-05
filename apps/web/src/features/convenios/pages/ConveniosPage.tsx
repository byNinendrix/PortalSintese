import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Button, LoadingSpinner } from "@sintese/ui";
import { useConveniosQuery } from "../hooks/useConveniosQuery";
import { useConveniosRamoAtividadeQuery } from "../hooks/useConveniosRamoAtividadeQuery";

function normalizePhone(value: string): string {
  return value.replace(/\D/g, "");
}

function buildMapsUrl(parts: Array<string | undefined>): string {
  const query = parts.filter((part) => Boolean(part && part.trim())).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function ConveniosPage() {
  const [ramo, setRamo] = useState("");
  const [ramoAplicado, setRamoAplicado] = useState("");
  const [erroSelecao, setErroSelecao] = useState(false);
  const ramoAtividadeQuery = useConveniosRamoAtividadeQuery();
  const conveniosQuery = useConveniosQuery({ ramo: ramoAplicado }, Boolean(ramoAplicado));

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const selected = ramo.trim();
    if (!selected) {
      setErroSelecao(true);
      setRamoAplicado("");
      return;
    }
    setErroSelecao(false);
    setRamoAplicado(selected);
  }

  return (
    <section className="auth-card-modern mx-auto w-full max-w-[760px]">
      <div className="mb-4 flex justify-center px-3 sm:px-4">
        <img
          src="/logo-sintese-oficial.png"
          alt="Logo SINTESE"
          className="block h-auto object-contain"
          style={{ width: "320px", maxWidth: "100%" }}
        />
      </div>

      <h1 className="section-title mb-4">
        Convênios / Ramo de Atividade
      </h1>

      <form className="surface-card space-y-3 p-4" onSubmit={onSubmit}>
        <label htmlFor="ramo" className="block text-sm text-slate-900">
          Ramo de Atividade
        </label>
        <select
          id="ramo"
          value={ramo}
          onChange={(event) => setRamo(event.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-lg leading-none text-slate-700 outline-none transition focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
        >
          <option value="">Selecione</option>
          {(ramoAtividadeQuery.data ?? []).map((branch) => (
            <option key={branch} value={branch}>
              {branch}
            </option>
          ))}
        </select>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button
            type="submit"
            className="btn-modern-primary w-full"
          >
            Filtrar
          </Button>
          <Link to="/login" className="block">
            <Button
              type="button"
              className="btn-modern-danger w-full"
            >
              Sair
            </Button>
          </Link>
        </div>
      </form>

      <div className="mt-4">
        {ramoAtividadeQuery.isPending ? <LoadingSpinner label="Carregando ramos..." /> : null}
        {ramoAtividadeQuery.isError ? (
          <div className="alert-error">Falha ao carregar ramos de atividade.</div>
        ) : null}
        {erroSelecao ? <div className="alert-warning">Selecione um ramo de atividade para filtrar.</div> : null}
        {ramoAplicado && conveniosQuery.isPending ? <LoadingSpinner label="Carregando convênios..." /> : null}
        {ramoAplicado && conveniosQuery.isError ? (
          <div className="alert-error">Falha ao carregar convênios para o ramo selecionado.</div>
        ) : null}
        {ramoAplicado && !conveniosQuery.isPending && !conveniosQuery.isError && conveniosQuery.data?.length === 0 ? (
          <div className="rounded-md border border-slate-300 bg-white p-3 text-sm text-slate-700">
            Nenhum convênio encontrado para <strong>{ramoAplicado}</strong>.
          </div>
        ) : null}
        {conveniosQuery.data?.length ? (
          <div className="mt-4 space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm">
              {conveniosQuery.data.length} resultado(s) para <strong>{ramoAplicado}</strong>
            </div>
            {conveniosQuery.data.map((item) => {
              const enderecoLinha =
                item.numero && item.endereco && !item.endereco.includes(item.numero)
                  ? `${item.endereco}, ${item.numero}`
                  : item.endereco;
              const cidadeLinha = [item.cidade, item.uf].filter(Boolean).join("/");
              const phones = [item.celular, item.telefone01, item.telefone02].filter(Boolean).join(" ");
              const phoneToCall = [item.celular, item.telefone01, item.telefone02].find(
                (phone) => normalizePhone(phone).length >= 10
              );
              const mapsUrl = buildMapsUrl([enderecoLinha, item.bairro, cidadeLinha, item.cepNormal || item.cep]);

              return (
                <article
                  key={`${item.cnpj}-${item.fantasia}`}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_30px_rgba(15,23,42,0.08)]"
                >
                  <div className="mb-3 h-1 w-20 rounded-full bg-gradient-to-r from-sky-500 to-cyan-400" />

                  <div className="flex items-start gap-3">
                    <img
                      src={item.image ?? "/logo-sintese.svg"}
                      alt={item.fantasia || "Logo do conveniado"}
                      className="h-20 w-20 rounded-xl border border-slate-200 bg-slate-50 object-cover"
                      onError={(event) => {
                        event.currentTarget.src = "/logo-sintese.svg";
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <h2 className="text-lg leading-tight font-extrabold uppercase text-slate-900 sm:text-xl">{item.fantasia}</h2>
                      {item.cnpj ? <p className="mt-1 text-[11px] text-slate-500">{item.cnpj}</p> : null}
                    </div>
                  </div>

                  <div className="mt-3 space-y-1 text-sm text-slate-800">
                    {enderecoLinha ? <p>{enderecoLinha}</p> : null}
                    {item.bairro ? <p>{item.bairro}</p> : null}
                    {cidadeLinha || item.cep ? (
                      <p>
                        {cidadeLinha}
                        {cidadeLinha && item.cep ? " " : ""}
                        {item.cep}
                      </p>
                    ) : null}
                    {phones ? <p className="font-semibold">{phones}</p> : null}
                  </div>

                  {item.desconto ? <p className="mt-3 text-sm font-semibold leading-snug text-slate-900">{item.desconto}</p> : null}

                  <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 21s7-4.35 7-11a7 7 0 1 0-14 0c0 6.65 7 11 7 11Z" />
                        <circle cx="12" cy="10" r="2.5" />
                      </svg>
                      Google Maps
                    </a>
                    {phoneToCall ? (
                      <a
                        href={`tel:${normalizePhone(phoneToCall)}`}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                      >
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.86 19.86 0 0 1 2.1 4.18 2 2 0 0 1 4.09 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.62 2.63a2 2 0 0 1-.45 2.11L8 9.91a16 16 0 0 0 6 6l1.45-1.26a2 2 0 0 1 2.11-.45c.85.29 1.73.5 2.63.62A2 2 0 0 1 22 16.92z" />
                        </svg>
                        Ligar
                      </a>
                    ) : (
                      <span className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-400">
                        Sem telefone
                      </span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}
      </div>
    </section>
  );
}
