import { useState } from "react";
import { Link } from "react-router-dom";
import { MensagensAniversarioPage } from "../../configuracoes/mensagens-aniversario/MensagensAniversarioPage";
import { ConfiguracaoApiWhatsAppPage } from "../../configuracoes/api-whatsapp/ConfiguracaoApiWhatsAppPage";
import { ConsultaAniversariantesPage } from "../../configuracoes/consulta-aniversariantes/ConsultaAniversariantesPage";
import { CarteiraLayoutConfigPage } from "../../carteira/pages/CarteiraLayoutConfigPage";
import { CertificadoLayoutConfigPage } from "../../congressista/pages/CertificadoLayoutConfigPage";

type TabId =
  | "carteira"
  | "certificado"
  | "api-whatsapp"
  | "cadastro-mensagem"
  | "consulta-aniversariantes";

interface TabMeta {
  id: TabId;
  icon: string;
  label: string;
}

const TAB_META: Record<TabId, TabMeta> = {
  carteira: { id: "carteira", icon: "\uD83C\uDFAB", label: "Layout da carteira" },
  certificado: { id: "certificado", icon: "\uD83D\uDCC4", label: "Layout do certificado" },
  "api-whatsapp": { id: "api-whatsapp", icon: "\uD83D\uDCF1", label: "Configuração API WhatsApp" },
  "cadastro-mensagem": { id: "cadastro-mensagem", icon: "\u2709\uFE0F", label: "Cadastro de mensagem de aniversário" },
  "consulta-aniversariantes": { id: "consulta-aniversariantes", icon: "\uD83C\uDF82", label: "Consulta aniversariantes do dia" },
};

const ANIVERSARIO_CHILDREN: TabId[] = ["api-whatsapp", "cadastro-mensagem", "consulta-aniversariantes"];

interface WelcomeCard {
  tabId: TabId;
  icon: string;
  label: string;
  description: string;
}

const WELCOME_CARDS: WelcomeCard[] = [
  { tabId: "carteira", icon: "\uD83C\uDFAB", label: "Layout da carteira", description: "Campos e estilo da carteira" },
  { tabId: "certificado", icon: "\uD83D\uDCC4", label: "Layout do certificado", description: "Layout do certificado do congresso" },
  { tabId: "api-whatsapp", icon: "\uD83D\uDCF1", label: "API WhatsApp", description: "Configurar integração WhatsApp" },
  { tabId: "cadastro-mensagem", icon: "\u2709\uFE0F", label: "Cadastro de mensagens", description: "Mensagens de aniversário" },
  { tabId: "consulta-aniversariantes", icon: "\uD83C\uDF82", label: "Aniversariantes do dia", description: "Consultar aniversariantes" },
];

export function LayoutSettingsPage() {
  const [openTabs, setOpenTabs] = useState<TabId[]>([]);
  const [activeTab, setActiveTab] = useState<TabId | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAniversarioMenuOpen, setIsAniversarioMenuOpen] = useState(false);

  function openTab(id: TabId) {
    if (!openTabs.includes(id)) {
      setOpenTabs((prev) => [...prev, id]);
    }
    setActiveTab(id);
    setMobileOpen(false);
  }

  function closeTab(id: TabId) {
    const nextTabs = openTabs.filter((t) => t !== id);
    setOpenTabs(nextTabs);
    if (activeTab === id) {
      setActiveTab(nextTabs.length > 0 ? nextTabs[nextTabs.length - 1] : null);
    }
  }

  function renderTabContent(tabId: TabId) {
    switch (tabId) {
      case "carteira":
        return <CarteiraLayoutConfigPage embedded onBack={() => closeTab("carteira")} />;
      case "certificado":
        return <CertificadoLayoutConfigPage embedded onBack={() => closeTab("certificado")} />;
      case "api-whatsapp":
        return <ConfiguracaoApiWhatsAppPage />;
      case "cadastro-mensagem":
        return <MensagensAniversarioPage />;
      case "consulta-aniversariantes":
        return <ConsultaAniversariantesPage />;
      default:
        return null;
    }
  }

  const isAniversarioGroupActive = activeTab !== null && ANIVERSARIO_CHILDREN.includes(activeTab);
  const isAniversarioGroupHighlighted = isAniversarioMenuOpen || isAniversarioGroupActive;
  const showWelcome = activeTab === null;

  function renderSidebarItem(tabId: TabId, icon: string, label: string, description: string, indented?: boolean) {
    const isActive = activeTab === tabId;
    return (
      <button
        key={tabId}
        type="button"
        onClick={() => openTab(tabId)}
        className={`group flex w-full items-start gap-3 rounded-lg text-left transition duration-150 ${
          indented ? "py-2 pl-8 pr-3" : "px-3 py-2.5"
        } ${
          isActive
            ? "bg-rose-600/20 text-rose-300"
            : "text-slate-300 hover:bg-slate-800 hover:text-white"
        }`}
      >
        <span className={`${indented ? "text-sm" : "text-base"} mt-0.5 leading-none`}>{icon}</span>
        <div className="min-w-0 flex-1">
          <span className={`block font-semibold leading-tight ${indented ? "text-[12px]" : "text-[13px]"}`}>
            {label}
          </span>
          {!indented && (
            <span className="mt-0.5 block text-[10px] leading-tight text-slate-500 group-hover:text-slate-400">
              {description}
            </span>
          )}
        </div>
        {isActive && (
          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />
        )}
      </button>
    );
  }

  function renderMobileSidebarItem(tabId: TabId, icon: string, label: string, indented?: boolean) {
    const isActive = activeTab === tabId;
    return (
      <button
        key={tabId}
        type="button"
        onClick={() => openTab(tabId)}
        className={`flex w-full items-center gap-3 rounded-lg text-left transition ${
          indented ? "py-2 pl-8 pr-3" : "px-3 py-2.5"
        } ${
          isActive
            ? "bg-rose-600/20 text-rose-300"
            : "text-slate-300 hover:bg-slate-800"
        }`}
      >
        <span className={indented ? "text-sm" : "text-base"}>{icon}</span>
        <span className={`font-semibold ${indented ? "text-[12px]" : "text-[13px]"}`}>{label}</span>
      </button>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      {/* ─── Desktop sidebar ─── */}
      <aside className="hidden w-[280px] shrink-0 flex-col border-r border-slate-700/30 bg-slate-900 lg:flex">
        <div className="border-b border-slate-700/40 px-5 py-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-rose-600 to-red-500 text-sm font-black text-white shadow">
              S
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-wide text-white">
                Configurações
              </h1>
              <p className="text-[10px] font-medium uppercase tracking-widest text-slate-400">
                Portal SINTESE
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Layouts
          </p>
          <div className="space-y-1">
            {renderSidebarItem("carteira", "\uD83C\uDFAB", "Layout da carteira", "Campos e estilo da carteira")}
            {renderSidebarItem("certificado", "\uD83D\uDCC4", "Layout do certificado", "Layout do certificado do congresso")}
          </div>

          <div className="mt-5">
            <button
              type="button"
              onClick={() => setIsAniversarioMenuOpen((v) => !v)}
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left transition duration-150 ${
                isAniversarioGroupHighlighted
                  ? "bg-slate-800/60 text-slate-300"
                  : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-300"
              }`}
            >
              <span className="text-base leading-none">{"\uD83C\uDF82"}</span>
              <div className="min-w-0 flex-1">
                <span className="block text-[12px] font-bold leading-tight">
                  Configuração de mensagens de aniversário do filiado
                </span>
              </div>
              <span className={`shrink-0 text-[10px] text-slate-500 transition-transform duration-200 ${
                isAniversarioMenuOpen ? "rotate-90" : ""
              }`}>
                {"\u25B6"}
              </span>
            </button>
            {isAniversarioMenuOpen && (
              <div className="mt-1 space-y-0.5">
                {renderSidebarItem("api-whatsapp", "\uD83D\uDCF1", "Configuração API WhatsApp", "", true)}
                {renderSidebarItem("cadastro-mensagem", "\u2709\uFE0F", "Cadastro de mensagem de aniversário", "", true)}
                {renderSidebarItem("consulta-aniversariantes", "\uD83C\uDF82", "Consulta aniversariantes do dia", "", true)}
              </div>
            )}
          </div>
        </nav>

        <div className="border-t border-slate-700/40 px-3 py-3">
          <Link
            to="/menu-principal"
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-semibold text-slate-400 transition duration-150 hover:bg-slate-800 hover:text-white"
          >
            <span className="text-base">{"\u2190"}</span>
            Voltar ao menu principal
          </Link>
        </div>
      </aside>

      {/* ─── Mobile header + overlay ─── */}
      <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-rose-600 to-red-500 text-xs font-black text-white">
              S
            </div>
            <span className="text-sm font-bold text-slate-800">Configurações</span>
          </div>
          <button
            type="button"
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
            onClick={() => setMobileOpen(true)}
          >
            Menu
          </button>
        </header>

        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-slate-900/50"
              aria-label="Fechar menu"
              onClick={() => setMobileOpen(false)}
            />
            <aside className="relative flex h-full w-72 flex-col bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-700/40 px-5 py-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-rose-600 to-red-500 text-xs font-black text-white">
                    S
                  </div>
                  <span className="text-sm font-bold text-white">Configurações</span>
                </div>
                <button
                  type="button"
                  className="rounded-md px-2 py-1 text-xs font-semibold text-slate-400 hover:text-white"
                  onClick={() => setMobileOpen(false)}
                >
                  Fechar
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
                {renderMobileSidebarItem("carteira", "\uD83C\uDFAB", "Layout da carteira")}
                {renderMobileSidebarItem("certificado", "\uD83D\uDCC4", "Layout do certificado")}

                <div className="pt-3">
                  <button
                    type="button"
                    onClick={() => setIsAniversarioMenuOpen((v) => !v)}
                    className={`flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-left transition ${
                      isAniversarioGroupHighlighted
                        ? "text-slate-300"
                        : "text-slate-500 hover:text-slate-400"
                    }`}
                  >
                    <span className="text-sm">{"\uD83C\uDF82"}</span>
                    <span className="flex-1 text-[11px] font-bold">
                      Mensagens de aniversário
                    </span>
                    <span className={`text-[10px] transition-transform duration-200 ${
                      isAniversarioMenuOpen ? "rotate-90" : ""
                    }`}>
                      {"\u25B6"}
                    </span>
                  </button>
                  {isAniversarioMenuOpen && (
                    <>
                      {renderMobileSidebarItem("api-whatsapp", "\uD83D\uDCF1", "API WhatsApp", true)}
                      {renderMobileSidebarItem("cadastro-mensagem", "\u2709\uFE0F", "Cadastro de mensagem", true)}
                      {renderMobileSidebarItem("consulta-aniversariantes", "\uD83C\uDF82", "Aniversariantes do dia", true)}
                    </>
                  )}
                </div>
              </nav>
              <div className="border-t border-slate-700/40 px-3 py-3">
                <Link
                  to="/menu-principal"
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-semibold text-slate-400 hover:bg-slate-800 hover:text-white"
                >
                  <span>{"\u2190"}</span> Voltar ao menu principal
                </Link>
              </div>
            </aside>
          </div>
        )}

        {/* ─── Main area ─── */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* ─── Tab bar ─── */}
          {openTabs.length > 0 && (
            <div className="flex shrink-0 items-end gap-0 overflow-x-auto border-b border-slate-200 bg-white px-2 pt-1">
              {openTabs.map((tabId) => {
                const meta = TAB_META[tabId];
                if (!meta) return null;
                return (
                  <div
                    key={tabId}
                    className={`group relative flex shrink-0 cursor-pointer items-center gap-1.5 rounded-t-lg border border-b-0 px-4 py-2 text-[13px] font-semibold transition ${
                      activeTab === tabId
                        ? "border-slate-200 bg-slate-50 text-slate-800"
                        : "border-transparent text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                    }`}
                    onClick={() => setActiveTab(tabId)}
                  >
                    <span className="text-xs">{meta.icon}</span>
                    <span className="max-w-[200px] truncate">{meta.label}</span>
                    <button
                      type="button"
                      className="ml-1 flex h-4 w-4 items-center justify-center rounded text-slate-400 opacity-0 transition hover:bg-slate-200 hover:text-slate-700 group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        closeTab(tabId);
                      }}
                      aria-label={`Fechar aba ${meta.label}`}
                    >
                      {"\u00D7"}
                    </button>
                    {activeTab === tabId && (
                      <span className="absolute -bottom-[1px] left-0 right-0 h-[2px] bg-rose-500" />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ─── Content ─── */}
          <div className="flex flex-1 flex-col overflow-hidden bg-slate-50">
            {showWelcome ? (
              <div className="flex flex-1 flex-col items-center justify-center p-6">
                <img
                  src="/logo-sintese-oficial.png"
                  alt="Logo SINTESE"
                  className="mb-6 block h-auto object-contain"
                  style={{ width: "220px", maxWidth: "100%" }}
                />
                <h2 className="text-xl font-bold text-slate-800">
                  Painel de configurações
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Selecione uma opção no menu lateral para começar.
                </p>

                <div className="mx-auto mt-8 grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                  {WELCOME_CARDS.map((card) => (
                    <button
                      key={card.tabId}
                      type="button"
                      onClick={() => openTab(card.tabId)}
                      className="group flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:border-rose-300 hover:shadow-md"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-rose-50 to-red-50 text-2xl transition group-hover:from-rose-100 group-hover:to-red-100">
                        {card.icon}
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-slate-700 group-hover:text-rose-700">
                          {card.label}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-400">
                          {card.description}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto">
                {activeTab && renderTabContent(activeTab)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
