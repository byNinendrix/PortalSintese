type PortalEmailTone = "success" | "info";

interface PortalEmailTemplateParams {
  title: string;
  subtitle?: string;
  tone?: PortalEmailTone;
  identificationLabel: string;
  identificationValue: string;
  contentHtml: string;
  footerText?: string;
}

function toneColors(tone: PortalEmailTone) {
  if (tone === "success") {
    return {
      headerBg: "#16a34a",
      accentBg: "#ecfdf3",
      accentBorder: "#86efac",
      accentText: "#14532d"
    };
  }

  return {
    headerBg: "#0284c7",
    accentBg: "#eff6ff",
    accentBorder: "#93c5fd",
    accentText: "#0c4a6e"
  };
}

export function renderPortalEmailTemplate(params: PortalEmailTemplateParams): string {
  const palette = toneColors(params.tone ?? "info");

  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0;padding:0;background:#eef2f7;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e2e8f0;">
          <tr>
            <td style="background:${palette.headerBg};padding:28px 24px;text-align:center;">
              <div style="font-family:Arial,sans-serif;color:#ffffff;font-size:36px;line-height:1;margin-bottom:8px;">✓</div>
              <div style="font-family:Arial,sans-serif;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:0.5px;">SINTESE</div>
              <div style="font-family:Arial,sans-serif;color:#f0fdf4;font-size:22px;font-weight:700;margin-top:10px;">${params.title}</div>
              ${
                params.subtitle
                  ? `<div style="font-family:Arial,sans-serif;color:#ecfeff;font-size:14px;margin-top:6px;">${params.subtitle}</div>`
                  : ""
              }
            </td>
          </tr>
          <tr>
            <td style="padding:24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${palette.accentBg};border:1px solid ${palette.accentBorder};border-radius:10px;">
                <tr>
                  <td style="padding:14px 16px;">
                    <div style="font-family:Arial,sans-serif;font-size:12px;letter-spacing:0.08em;color:#64748b;text-transform:uppercase;margin-bottom:6px;">${params.identificationLabel}</div>
                    <div style="font-family:Arial,sans-serif;font-size:21px;font-weight:700;color:${palette.accentText};">${params.identificationValue}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 24px 24px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-left:4px solid ${palette.headerBg};border-radius:8px;">
                <tr>
                  <td style="padding:16px;">
                    <div style="font-family:Arial,sans-serif;font-size:16px;line-height:1.65;color:#0f172a;">
                      ${params.contentHtml}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="border-top:1px solid #e2e8f0;padding:14px 24px;text-align:center;">
              <div style="font-family:Arial,sans-serif;font-size:12px;color:#64748b;">
                ${params.footerText ?? "Portal do Filiad@ | SINTESE"}
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
  `;
}
