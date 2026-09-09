import { useState } from "react";

export function ConfiguracaoApiWhatsAppPage() {
  const [provedor, setProvedor] = useState("evolution-api");

  return (
    <section className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">
          Configuração API WhatsApp
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Configure futuramente as credenciais e parâmetros da API de envio de
          mensagens via WhatsApp.
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
              Esta tela é uma estrutura inicial. A integração real com a API
              WhatsApp será implementada em etapa posterior.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-700">
          Parâmetros da integração
        </h2>

        <div className="space-y-4">
          <label className="block text-sm font-semibold text-slate-700">
            Provedor
            <select
              className="form-input mt-1"
              value={provedor}
              onChange={(e) => setProvedor(e.target.value)}
              disabled
            >
              <option value="evolution-api">Evolution API</option>
              <option value="z-api">Z-API</option>
              <option value="wppconnect">WPPConnect</option>
              <option value="outro">Outro</option>
            </select>
          </label>

          <label className="block text-sm font-semibold text-slate-700">
            URL da API
            <input
              className="form-input mt-1"
              type="url"
              placeholder="https://api.exemplo.com/v1"
              disabled
            />
          </label>

          <label className="block text-sm font-semibold text-slate-700">
            Token / Chave de acesso
            <input
              className="form-input mt-1"
              type="password"
              placeholder="••••••••••••••••"
              disabled
            />
            <span className="mt-1 block text-[11px] text-slate-400">
              O token será armazenado de forma segura no servidor. Nunca será
              exposto no frontend.
            </span>
          </label>

          <label className="block text-sm font-semibold text-slate-700">
            Número / Remetente padrão
            <input
              className="form-input mt-1"
              type="tel"
              placeholder="+55 79 9XXXX-XXXX"
              disabled
            />
          </label>

          <div className="block text-sm font-semibold text-slate-700">
            Status da integração
            <div className="mt-1 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
                <span className="h-2 w-2 rounded-full bg-slate-400" />
                Não configurado
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-2">
          <button
            type="button"
            className="btn-modern-primary opacity-50 cursor-not-allowed"
            disabled
          >
            Salvar configuração
          </button>
          <button
            type="button"
            className="btn-secondary opacity-50 cursor-not-allowed"
            disabled
          >
            Testar conexão
          </button>
        </div>
      </div>
    </section>
  );
}
