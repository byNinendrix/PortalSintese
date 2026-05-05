import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Button } from "@sintese/ui";
import { digitsOnly, formatCpf } from "../../../shared/utils/masks";
import { useLoginMutation } from "../hooks/useAuthMutations";

export function LoginPage() {
  const [cpf, setCpf] = useState("");
  const [password, setPassword] = useState("");
  const loginMutation = useLoginMutation();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    loginMutation.mutate({ cpf: digitsOnly(cpf), password });
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

      <form className="space-y-3" onSubmit={onSubmit}>
        <div>
          <label htmlFor="cpf" className="mb-1 block text-sm text-slate-900">
            Por favor digite seu CPF
          </label>
          <input
            id="cpf"
            value={cpf}
            onChange={(event) => setCpf(formatCpf(event.target.value))}
            inputMode="numeric"
            placeholder="CPF"
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-lg text-slate-700 outline-none transition focus:border-sky-600 focus:ring-2 focus:ring-sky-100 sm:text-xl"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm text-slate-900">
            Por favor digite sua senha
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Senha"
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-lg text-slate-700 outline-none transition focus:border-sky-600 focus:ring-2 focus:ring-sky-100 sm:text-xl"
          />
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
            Convênios/Ramo de Atividade
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
    </section>
  );
}
