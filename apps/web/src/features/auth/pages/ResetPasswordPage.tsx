import { useRef, useState, type ClipboardEvent, type FocusEvent, type FormEvent, type KeyboardEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@sintese/ui";
import { useResetPasswordMutation } from "../hooks/useAuthMutations";
import { readAuthSession } from "../services/authSession";

type ResetPasswordErrors = {
  newPassword?: string;
  confirmPassword?: string;
};

function isPasswordComplex(password: string): boolean {
  return /^(?=.*[A-Z])(?=.*\d).{6,}$/.test(password);
}

export function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isNewPasswordVisible, setIsNewPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [errors, setErrors] = useState<ResetPasswordErrors>({});
  const [successModalMessage, setSuccessModalMessage] = useState<string | null>(null);

  const newPasswordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);
  const newPasswordFieldRef = useRef<HTMLDivElement>(null);
  const confirmPasswordFieldRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();
  const resetPasswordMutation = useResetPasswordMutation();

  function hidePasswordOnFieldBlur(
    event: FocusEvent<HTMLDivElement>,
    fieldRef: { current: HTMLDivElement | null },
    hide: () => void
  ) {
    const nextFocused = event.relatedTarget as Node | null;
    if (!fieldRef.current || (nextFocused && fieldRef.current.contains(nextFocused))) {
      return;
    }
    hide();
  }

  function blockClipboardAndShortcuts(event: ClipboardEvent<HTMLInputElement> | KeyboardEvent<HTMLInputElement>) {
    if ("key" in event) {
      const isCtrlOrMeta = event.ctrlKey || event.metaKey;
      const key = event.key.toLowerCase();
      if (isCtrlOrMeta && (key === "c" || key === "v" || key === "x")) {
        event.preventDefault();
      }
      return;
    }

    event.preventDefault();
  }

  function moveToConfirmPasswordOnTab(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Tab" && !event.shiftKey) {
      event.preventDefault();
      confirmPasswordRef.current?.focus();
    }
  }

  function validateForm(): boolean {
    const nextErrors: ResetPasswordErrors = {};

    if (!newPassword.trim()) {
      nextErrors.newPassword = "Nova senha é obrigatória.";
    } else if (!isPasswordComplex(newPassword)) {
      nextErrors.newPassword =
        "A senha deve ter no mínimo 6 caracteres, com pelo menos 1 letra maiúscula e 1 número.";
    }

    if (!confirmPassword.trim()) {
      nextErrors.confirmPassword = "Confirmação da nova senha é obrigatória.";
    } else if (confirmPassword !== newPassword) {
      nextErrors.confirmPassword = "As senhas não coincidem.";
    }

    setErrors(nextErrors);

    if (nextErrors.newPassword) {
      newPasswordRef.current?.focus();
    } else if (nextErrors.confirmPassword) {
      confirmPasswordRef.current?.focus();
    }

    return Object.keys(nextErrors).length === 0;
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSuccessModalMessage(null);

    if (!validateForm()) {
      return;
    }

    const session = readAuthSession();
    const cpf = session?.cpf?.replace(/\D/g, "") ?? "";

    if (!cpf) {
      setErrors({ newPassword: "Sessão inválida. Faça login novamente para redefinir sua senha." });
      return;
    }

    resetPasswordMutation.mutate(
      {
        cpf,
        newPassword
      },
      {
        onSuccess: (response) => {
          setSuccessModalMessage(response.message);
          setNewPassword("");
          setConfirmPassword("");
          setErrors({});
        }
      }
    );
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

      <h1 className="section-title mb-4">REDEFINIR SENHA</h1>

      {resetPasswordMutation.isError ? (
        <div className="alert-error mb-3">Não foi possível atualizar a senha. Tente novamente.</div>
      ) : null}

      <form className="space-y-3" onSubmit={onSubmit}>
        <div>
          <label htmlFor="newPassword" className="mb-1 block text-sm text-slate-900">
            Por favor digite sua nova senha
          </label>
          <div
            ref={newPasswordFieldRef}
            className="relative"
            onBlur={(event) =>
              hidePasswordOnFieldBlur(event, newPasswordFieldRef, () => setIsNewPasswordVisible(false))
            }
          >
            <input
              ref={newPasswordRef}
              id="newPassword"
              type={isNewPasswordVisible ? "text" : "password"}
              value={newPassword}
              onChange={(event) => {
                setNewPassword(event.target.value);
                setErrors((prev) => ({ ...prev, newPassword: undefined }));
              }}
              onKeyDown={moveToConfirmPasswordOnTab}
              placeholder="Nova senha"
              className={`w-full rounded-xl border bg-white px-3 py-2 pr-12 text-lg text-slate-700 outline-none transition focus:border-sky-600 focus:ring-2 focus:ring-sky-100 ${
                errors.newPassword ? "border-red-500 focus:border-red-500 focus:ring-red-100" : "border-slate-300"
              }`}
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setIsNewPasswordVisible((prev) => !prev)}
              className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              aria-label={isNewPasswordVisible ? "Ocultar nova senha" : "Mostrar nova senha"}
              title={isNewPasswordVisible ? "Ocultar nova senha" : "Mostrar nova senha"}
            >
              {isNewPasswordVisible ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true">
                  <path d="M3 3l18 18" />
                  <path d="M10.58 10.58a2 2 0 002.83 2.83" />
                  <path d="M9.88 4.24A10.94 10.94 0 0112 4c5 0 9.27 3.11 11 7.5a11.76 11.76 0 01-4.37 5.37" />
                  <path d="M6.61 6.61A11.94 11.94 0 001 11.5C2.73 15.89 7 19 12 19a11.05 11.05 0 004.24-.82" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true">
                  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
          {errors.newPassword ? <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p> : null}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="mb-1 block text-sm text-slate-900">
            Por favor confirme sua nova senha
          </label>
          <div
            ref={confirmPasswordFieldRef}
            className="relative"
            onBlur={(event) =>
              hidePasswordOnFieldBlur(event, confirmPasswordFieldRef, () => setIsConfirmPasswordVisible(false))
            }
          >
            <input
              ref={confirmPasswordRef}
              id="confirmPassword"
              type={isConfirmPasswordVisible ? "text" : "password"}
              value={confirmPassword}
              onChange={(event) => {
                setConfirmPassword(event.target.value);
                setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
              }}
              onCopy={blockClipboardAndShortcuts}
              onPaste={blockClipboardAndShortcuts}
              onCut={blockClipboardAndShortcuts}
              onKeyDown={blockClipboardAndShortcuts}
              placeholder="Repita nova senha"
              className={`w-full rounded-xl border bg-white px-3 py-2 pr-12 text-lg text-slate-700 outline-none transition focus:border-sky-600 focus:ring-2 focus:ring-sky-100 ${
                errors.confirmPassword ? "border-red-500 focus:border-red-500 focus:ring-red-100" : "border-slate-300"
              }`}
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setIsConfirmPasswordVisible((prev) => !prev)}
              className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              aria-label={isConfirmPasswordVisible ? "Ocultar confirmação de senha" : "Mostrar confirmação de senha"}
              title={isConfirmPasswordVisible ? "Ocultar confirmação de senha" : "Mostrar confirmação de senha"}
            >
              {isConfirmPasswordVisible ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true">
                  <path d="M3 3l18 18" />
                  <path d="M10.58 10.58a2 2 0 002.83 2.83" />
                  <path d="M9.88 4.24A10.94 10.94 0 0112 4c5 0 9.27 3.11 11 7.5a11.76 11.76 0 01-4.37 5.37" />
                  <path d="M6.61 6.61A11.94 11.94 0 001 11.5C2.73 15.89 7 19 12 19a11.05 11.05 0 004.24-.82" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true">
                  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
          {errors.confirmPassword ? <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p> : null}
        </div>

        <Button type="submit" className="btn-modern-danger w-full" isLoading={resetPasswordMutation.isPending}>
          Confirmar
        </Button>

        <Link to="/menu-principal" className="block">
          <Button type="button" className="btn-modern-danger w-full">
            Sair
          </Button>
        </Link>
      </form>

      <p className="mx-auto mt-4 max-w-[460px] rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-semibold leading-relaxed text-red-700">
        Prezado(a), após confirmar, favor aguardar a mensagem de confirmação de envio de e-mail.
      </p>

      <div className="mt-10 flex justify-center">
        <img src="/Logo%20Rodape.gif" alt="Logo rodapé" className="h-auto w-full max-w-[220px] object-contain" />
      </div>

      {successModalMessage ? (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
          style={{ backdropFilter: "blur(4px)" }}
        >
          <div
            className="auth-card-modern border-0 bg-white p-6 pb-8 sm:p-7 sm:pb-9"
            style={{ width: "min(92vw, 460px)", borderRadius: "20px", boxShadow: "0 25px 60px rgba(2,6,23,0.35)" }}
          >
            <div
              className="mx-auto mb-4 flex h-[88px] w-[88px] items-center justify-center rounded-full border-4 border-emerald-500 bg-emerald-50 text-5xl font-bold text-emerald-600"
              aria-hidden="true"
            >
              ✓
            </div>
            <h2 className="mb-2 text-center text-3xl font-extrabold tracking-tight text-slate-900">Sucesso</h2>
            <p className="text-center text-base leading-relaxed text-slate-700">{successModalMessage}</p>

            <div className="mt-8 flex justify-center">
              <Button
                type="button"
                onClick={() => {
                  setSuccessModalMessage(null);
                  navigate("/menu-principal", { replace: true });
                }}
                className="inline-flex min-w-[170px] items-center justify-center rounded-xl bg-gradient-to-r from-emerald-600 to-green-500 px-8 py-2.5 text-base font-bold text-white transition duration-200 hover:from-emerald-700 hover:to-green-600 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              >
                OK
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
