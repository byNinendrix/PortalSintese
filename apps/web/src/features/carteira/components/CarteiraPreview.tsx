import type { CSSProperties, MouseEvent as ReactMouseEvent } from "react";
import type { CarteiraResponse } from "@sintese/types";
import type { CarteiraLayoutConfig, CarteiraLayoutField, CarteiraSide } from "../layout/carteiraLayout";

interface CarteiraPreviewProps {
  carteira: CarteiraResponse;
  layout: CarteiraLayoutConfig;
  className?: string;
  editable?: boolean;
  selectedField?: string | null;
  onFieldMouseDown?: (side: CarteiraSide, fieldId: string, event: ReactMouseEvent<HTMLDivElement>) => void;
  showGuides?: boolean;
}

function fieldToStyle(field: CarteiraLayoutField): CSSProperties {
  return {
    position: "absolute",
    left: field.centerX ? "50%" : `${field.x}%`,
    top: `${field.y}%`,
    width: `${field.w}%`,
    height: `${field.h}%`,
    fontSize: field.fontSize ? `${field.fontSize}cqw` : undefined,
    fontWeight: field.fontWeight,
    textAlign: field.textAlign,
    transform: field.centerX ? "translateX(-50%)" : undefined
  };
}

function renderEditableClass(selectedField: string | null, currentId: string) {
  if (!currentId) {
    return "";
  }
  if (selectedField !== currentId) {
    return "carteira-editor-field";
  }
  return "carteira-editor-field carteira-editor-field-selected";
}

export function CarteiraPreview({
  carteira,
  layout,
  className,
  editable = false,
  selectedField = null,
  onFieldMouseDown,
  showGuides = false
}: CarteiraPreviewProps) {
  const nome = carteira.nome ?? "-";
  const cpfExtenso = carteira.cpfExtenso ?? "-";
  const sangueTpRh = carteira.sangueTpRh ?? "-";
  const cidadeCarteirinha = carteira.cidadeCarteirinha ?? "-";
  const dataImpressao = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  const dataValidade = carteira.dataValidadeCarteira
    ? new Date(carteira.dataValidadeCarteira).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
    : "-";

  const bind = (side: CarteiraSide, fieldId: string) => ({
    onMouseDown: editable ? (event: ReactMouseEvent<HTMLDivElement>) => onFieldMouseDown?.(side, fieldId, event) : undefined
  });

  const cls = (side: CarteiraSide, fieldId: string, extra = "") => {
    const editClass = editable ? renderEditableClass(selectedField, `${side}.${fieldId}`) : "";
    return ["carteira-field-base", editClass, extra].filter((item) => item.trim().length > 0).join(" ");
  };

  return (
    <article className={className ?? "carteira-sheet"}>
      <section className="carteira-face carteira-face-front">
        {carteira.sindicato?.imgCartFrente ? (
          <img className="carteira-face-bg" src={carteira.sindicato.imgCartFrente} alt="Fundo frente da carteira" />
        ) : null}

        <div style={fieldToStyle(layout.front.foto)} {...bind("front", "foto")} className={cls("front", "foto", "carteira-media-box")}>
          {carteira.fotoImg ? <img src={carteira.fotoImg} alt="Foto do filiado" className="carteira-fill-image" /> : <div className="carteira-foto-vazia">Sem foto</div>}
        </div>

        <div style={fieldToStyle(layout.front.rh)} {...bind("front", "rh")} className={cls("front", "rh")}>
          RH: {sangueTpRh}
        </div>

        <div style={fieldToStyle(layout.front.nome)} {...bind("front", "nome")} className={cls("front", "nome", "carteira-front-pill")}>
          {nome}
        </div>

        <div style={fieldToStyle(layout.front.cpf)} {...bind("front", "cpf")} className={cls("front", "cpf", "carteira-front-pill")}>
          {cpfExtenso}
        </div>

        {showGuides ? <div className="carteira-guide-label">Frente</div> : null}
      </section>

      <section className="carteira-face carteira-face-back">
        {carteira.sindicato?.imgCartVerso ? (
          <img className="carteira-face-bg" src={carteira.sindicato.imgCartVerso} alt="Fundo verso da carteira" />
        ) : null}

        <div style={fieldToStyle(layout.back.cidade)} {...bind("back", "cidade")} className={cls("back", "cidade")}>
          {cidadeCarteirinha}
        </div>

        <div style={fieldToStyle(layout.back.impressoData)} {...bind("back", "impressoData")} className={cls("back", "impressoData")}>
          {dataImpressao}
        </div>

        <div style={fieldToStyle(layout.back.validadeData)} {...bind("back", "validadeData")} className={cls("back", "validadeData")}>
          {dataValidade}
        </div>

        <div style={fieldToStyle(layout.back.qrcode)} {...bind("back", "qrcode")} className={cls("back", "qrcode", "carteira-back-qrcode carteira-media-box")}>
          {carteira.qrCodeCarteira ? <img src={carteira.qrCodeCarteira} alt="QR Code de autenticidade" className="carteira-fill-image" /> : null}
        </div>

        {showGuides ? <div className="carteira-guide-label">Verso</div> : null}
      </section>
    </article>
  );
}
