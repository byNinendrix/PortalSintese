import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@sintese/ui";
import { useAceitarLgpdMutation } from "../hooks/useAceitarLgpdMutation";
import { useLgpdTermoQuery } from "../hooks/useLgpdTermoQuery";
import { readAuthSession } from "../../auth/services/authSession";
import { digitsOnly, formatCpf } from "../../../shared/utils/masks";

const LGPD_SUCCESS_MESSAGE =
  "A aceitação dos termos da L.G.P.D já foi registrada com sucesso! Obrigado por sua conformidade!";

function sanitizeLgpdHtml(rawHtml: string): string {
  if (typeof window === "undefined") {
    return rawHtml;
  }

  const parser = new DOMParser();
  const documentNode = parser.parseFromString(rawHtml, "text/html");

  documentNode.querySelectorAll("script, style, iframe, object, embed, link, meta").forEach((node) => node.remove());

  const allowedTags = new Set([
    "P",
    "BR",
    "B",
    "STRONG",
    "I",
    "EM",
    "U",
    "UL",
    "OL",
    "LI",
    "SPAN",
    "DIV",
    "H1",
    "H2",
    "H3",
    "H4",
    "H5",
    "H6",
    "A"
  ]);

  documentNode.body.querySelectorAll("*").forEach((element) => {
    if (!allowedTags.has(element.tagName)) {
      element.replaceWith(...Array.from(element.childNodes));
      return;
    }

    Array.from(element.attributes).forEach((attribute) => {
      const attributeName = attribute.name.toLowerCase();
      const isSafeAnchorHref =
        element.tagName === "A" &&
        attributeName === "href" &&
        /^(https?:|mailto:|tel:|#)/i.test(attribute.value.trim());

      if (!isSafeAnchorHref) {
        element.removeAttribute(attribute.name);
      }
    });

    if (element.tagName === "A") {
      element.setAttribute("target", "_blank");
      element.setAttribute("rel", "noopener noreferrer");
    }
  });

  return documentNode.body.innerHTML.trim();
}

export function LgpdOnlinePage() {
  const session = readAuthSession();
  const cpf = useMemo(() => digitsOnly(session?.cpf ?? ""), [session?.cpf]);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [showInfoMessage, setShowInfoMessage] = useState(false);
  const [infoCountdownPercent, setInfoCountdownPercent] = useState(100);

  const termoQuery = useLgpdTermoQuery(cpf, Boolean(cpf));
  const aceitarMutation = useAceitarLgpdMutation(cpf);

  const termoData = termoQuery.data;
  const termoRaw = termoData?.termo?.trim() ?? "";
  const termoHasHtml = /<\/?[a-z][\s\S]*>/i.test(termoRaw);
  const termoHtml = useMemo(() => (termoHasHtml ? sanitizeLgpdHtml(termoRaw) : ""), [termoHasHtml, termoRaw]);
  const jaAssinado = Boolean(termoData?.autorizaLgpd);
  const infoMessage = jaAssinado ? feedbackMessage ?? LGPD_SUCCESS_MESSAGE : null;

  useEffect(() => {
    if (!infoMessage) {
      setShowInfoMessage(false);
      setInfoCountdownPercent(100);
      return;
    }

    setShowInfoMessage(true);
    setInfoCountdownPercent(100);

    const frameId = window.requestAnimationFrame(() => {
      setInfoCountdownPercent(0);
    });

    const timeoutId = window.setTimeout(() => {
      setShowInfoMessage(false);
    }, 5000);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(timeoutId);
    };
  }, [infoMessage]);

  function onAceitarTermos() {
    if (!cpf || jaAssinado) {
      return;
    }

    aceitarMutation.mutate(undefined, {
      onSuccess: (response) => {
        setFeedbackMessage(response.message);
      }
    });
  }

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

      <h1 className="section-title mb-4">L.G.P.D</h1>

      {!cpf ? <div className="alert-error mb-3">Sessão inválida. Faça login novamente.</div> : null}
      {termoQuery.isError ? <div className="alert-error mb-3">Não foi possível carregar o termo da L.G.P.D.</div> : null}
      {aceitarMutation.isError ? (
        <div className="alert-error mb-3">Não foi possível registrar a aceitação do termo.</div>
      ) : null}
      {infoMessage && showInfoMessage ? (
        <div className="alert-success relative mb-3 overflow-hidden">
          <span>{infoMessage}</span>
          <span
            aria-hidden="true"
            className="absolute bottom-0 left-0 h-1 bg-emerald-500"
            style={{
              width: `${infoCountdownPercent}%`,
              transition: "width 5000ms linear"
            }}
          />
        </div>
      ) : null}

      <div className="space-y-3">
        <div>
          <label htmlFor="lgpd-cpf" className="mb-1 block text-sm text-slate-900">
            CPF
          </label>
          <input
            id="lgpd-cpf"
            value={termoData?.cpf ? formatCpf(termoData.cpf) : formatCpf(cpf)}
            readOnly
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-base font-medium text-slate-700 outline-none"
          />
        </div>

        <div>
          <label htmlFor="lgpd-nome" className="mb-1 block text-sm text-slate-900">
            Nome
          </label>
          <input
            id="lgpd-nome"
            value={termoData?.nome ?? ""}
            readOnly
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-base font-semibold text-slate-700 outline-none"
          />
        </div>

        <Button
          type="button"
          className="btn-modern-danger w-full"
          disabled={!cpf || termoQuery.isLoading || aceitarMutation.isPending || jaAssinado}
          isLoading={aceitarMutation.isPending}
          onClick={onAceitarTermos}
        >
          {jaAssinado ? "Termo já assinado!" : "Aceitar os termos"}
        </Button>

        <Link to="/menu-principal" className="block">
          <Button type="button" className="btn-modern-danger w-full">
            Sair
          </Button>
        </Link>
      </div>

      <article className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-center text-xl font-extrabold tracking-wide text-slate-900">TERMO</h2>
        {termoQuery.isLoading ? (
          <p className="text-sm text-slate-600">Carregando termo...</p>
        ) : !termoRaw ? (
          <p className="text-justify text-[17px] font-semibold leading-8 text-slate-900">Termo da L.G.P.D não encontrado.</p>
        ) : termoHasHtml ? (
          <div
            className="whitespace-normal text-[17px] leading-8 text-slate-900 [&_a]:text-sky-700 [&_a]:underline [&_h1]:mb-3 [&_h1]:text-center [&_h1]:text-2xl [&_h1]:font-extrabold [&_h2]:mb-3 [&_h2]:text-center [&_h2]:text-xl [&_h2]:font-extrabold [&_h3]:mb-2 [&_h3]:text-lg [&_h3]:font-bold [&_li]:mb-1 [&_li]:ml-5 [&_li]:list-disc [&_ol]:mb-4 [&_ol]:ml-5 [&_ol]:list-decimal [&_p]:mb-4 [&_p]:text-justify [&_strong]:font-extrabold [&_ul]:mb-4"
            dangerouslySetInnerHTML={{ __html: termoHtml }}
          />
        ) : (
          <p className="whitespace-pre-line text-justify text-[17px] font-semibold leading-8 text-slate-900">{termoRaw}</p>
        )}
      </article>

      <div className="mt-10 flex justify-center">
        <img src="/Logo%20Rodape.gif" alt="Logo rodapé" className="h-auto w-full max-w-[220px] object-contain" />
      </div>
    </section>
  );
}
