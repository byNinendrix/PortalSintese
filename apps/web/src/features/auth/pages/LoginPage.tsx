import { useRef, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@sintese/ui";
import { digitsOnly, formatCpf } from "../../../shared/utils/masks";
import { useLoginMutation } from "../hooks/useAuthMutations";
import { saveAuthSession } from "../services/authSession";

type LoginErrors = {
  cpf?: string;
  password?: string;
};

export function LoginPage() {
  const [cpf, setCpf] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [errors, setErrors] = useState<LoginErrors>({});
  const cpfInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const loginMutation = useLoginMutation();
  const appVersionRaw = (import.meta.env.VITE_APP_VERSION as string | undefined)?.trim() || "1.0.0";
  const appVersion = appVersionRaw.toLowerCase().startsWith("v") ? appVersionRaw : `v${appVersionRaw}`;
  const buildDateEnv = (import.meta.env.VITE_BUILD_DATE as string | undefined)?.trim();
  const buildDate = (() => {
    if (!buildDateEnv) {
      return new Intl.DateTimeFormat("pt-BR").format(new Date());
    }
    const parsed = new Date(buildDateEnv);
    if (Number.isNaN(parsed.getTime())) {
      return buildDateEnv;
    }
    return new Intl.DateTimeFormat("pt-BR").format(parsed);
  })();

  function validateForm(): boolean {
    const nextErrors: LoginErrors = {};
    const cpfDigits = digitsOnly(cpf);

    if (!cpfDigits) {
      nextErrors.cpf = "CPF é obrigatório.";
    }

    if (!password.trim()) {
      nextErrors.password = "Senha é obrigatória.";
    }

    setErrors(nextErrors);

    if (nextErrors.cpf) {
      cpfInputRef.current?.focus();
    } else if (nextErrors.password) {
      passwordInputRef.current?.focus();
    }

    return Object.keys(nextErrors).length === 0;
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    loginMutation.mutate(
      { cpf: digitsOnly(cpf), password },
      {
        onSuccess: (session) => {
          saveAuthSession({
            ...session,
            cpf: digitsOnly(cpf)
          });
          navigate("/menu-principal", { replace: true });
        }
      }
    );
  }

  return (
    <section className="auth-card-modern w-full">
      <div className="mb-4 flex justify-center px-3 sm:px-4">
        <img
          src="/logo-sintese-oficial.png"
          alt="Logo SINTESE"
          className="block h-auto object-contain"
          style={{ width: "340px", maxWidth: "100%" }}
        />
      </div>

      {loginMutation.isError ? <div className="alert-error mb-3">Não foi possível acessar.</div> : null}
      {loginMutation.isSuccess ? <div className="alert-success mb-3">Acesso validado (mock/API).</div> : null}
      {errors.cpf || errors.password ? (
        <div className="alert-warning mb-3">Preencha CPF e Senha para acessar.</div>
      ) : null}

      <form className="space-y-3" onSubmit={onSubmit}>
        <div>
          <label htmlFor="cpf" className="mb-1 block text-sm text-slate-900">
            Por favor digite seu CPF
          </label>
          <input
            ref={cpfInputRef}
            id="cpf"
            value={cpf}
            onChange={(event) => {
              setCpf(formatCpf(event.target.value));
              setErrors((prev) => ({ ...prev, cpf: undefined }));
            }}
            inputMode="numeric"
            placeholder="CPF"
            aria-invalid={Boolean(errors.cpf)}
            aria-describedby={errors.cpf ? "cpf-error" : undefined}
            className={`w-full rounded-xl border bg-white px-3 py-2 text-lg text-slate-700 outline-none transition focus:border-sky-600 focus:ring-2 focus:ring-sky-100 sm:text-xl ${
              errors.cpf ? "border-red-500 focus:border-red-500 focus:ring-red-100" : "border-slate-300"
            }`}
          />
          {errors.cpf ? (
            <p id="cpf-error" className="mt-1 text-sm text-red-600">
              {errors.cpf}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm text-slate-900">
            Por favor digite sua senha
          </label>
          <div className="relative">
            <input
              ref={passwordInputRef}
              id="password"
              type={isPasswordVisible ? "text" : "password"}
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setErrors((prev) => ({ ...prev, password: undefined }));
              }}
              placeholder="Senha"
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? "password-error" : undefined}
              className={`w-full rounded-xl border bg-white px-3 py-2 pr-24 text-lg text-slate-700 outline-none transition focus:border-sky-600 focus:ring-2 focus:ring-sky-100 sm:text-xl ${
                errors.password ? "border-red-500 focus:border-red-500 focus:ring-red-100" : "border-slate-300"
              }`}
            />
            <button
              type="button"
              onClick={() => setIsPasswordVisible((prev) => !prev)}
              className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              aria-label={isPasswordVisible ? "Ocultar senha" : "Mostrar senha"}
              title={isPasswordVisible ? "Ocultar senha" : "Mostrar senha"}
            >
              {isPasswordVisible ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <path d="M3 3l18 18" />
                  <path d="M10.58 10.58a2 2 0 002.83 2.83" />
                  <path d="M9.88 4.24A10.94 10.94 0 0112 4c5 0 9.27 3.11 11 7.5a11.76 11.76 0 01-4.37 5.37" />
                  <path d="M6.61 6.61A11.94 11.94 0 001 11.5C2.73 15.89 7 19 12 19a11.05 11.05 0 004.24-.82" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
          {errors.password ? (
            <p id="password-error" className="mt-1 text-sm text-red-600">
              {errors.password}
            </p>
          ) : null}
        </div>

        <Link to="/cadastro" className="block">
          <Button type="button" className="btn-modern-primary w-full">
            Efetuar Cadastro Login
          </Button>
        </Link>

        <Button type="submit" isLoading={loginMutation.isPending} className="btn-modern-danger w-full">
          Acessar
        </Button>
      </form>

      <div className="mt-3 space-y-2">
        <Link to="/recuperar-senha" className="block">
          <Button type="button" className="btn-modern-primary w-full">
            Esqueceu sua senha?
          </Button>
        </Link>
        <Link to="/convenios" className="block">
          <Button type="button" className="btn-modern-primary w-full">
            Convênios/Ramo Atividade
          </Button>
        </Link>
        <a
          href="https://api.whatsapp.com/send/?phone=557921049800&text&type=phone_number&app_absent=0"
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <Button type="button" className="btn-modern-primary w-full">
            Ajuda
          </Button>
        </a>
        <a
          href="https://www.youtube.com/shorts/oIYagEI2qkA"
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <Button type="button" className="btn-modern-primary w-full">
            Tutorial
          </Button>
        </a>
      </div>

      <div className="mt-10 flex justify-center">
        <img
          src="/Logo%20Rodape.gif"
          alt="Logo rodape"
          className="h-auto w-full max-w-[220px] object-contain"
        />
      </div>

      <p className="mt-3 text-center text-xs font-medium tracking-[0.02em] text-slate-500">
        {appVersion} — {buildDate}
      </p>
    </section>
  );
}
