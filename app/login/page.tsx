"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErro("");

    if (!email.trim() || !senha.trim()) {
      setErro("Preencha e-mail e senha para entrar.");
      return;
    }

    setCarregando(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: senha,
    });

    setCarregando(false);

    if (error) {
      setErro("Não foi possível entrar. Confira o e-mail e a senha.");
      return;
    }

    router.push("/dashboard");
  }

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-[#F4EADF] px-4 py-6 text-[#2E2723] sm:px-6">
      <section className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-5xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[2rem] border border-[#E6D8C8] bg-white shadow-xl lg:grid-cols-[0.95fr_1.05fr]">
          <aside className="hidden bg-[#7D3F46] p-8 text-white lg:flex lg:flex-col lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-[#E8D8CB]">
                Soph & Nick Atelier
              </p>

              <h1 className="mt-4 text-4xl font-semibold leading-tight">
                Gestão do ateliê com cuidado em cada detalhe.
              </h1>

              <p className="mt-5 max-w-sm text-sm leading-7 text-[#F7EDE4]">
                Organize clientes, peças, valores, prazos, fotos de entrada,
                avarias, pagamentos e criações autorais em um painel simples.
              </p>
            </div>

            <div className="rounded-3xl border border-white/20 bg-white/10 p-4">
              <p className="text-sm font-medium">Maison Soph & Nick</p>
              <p className="mt-2 text-sm leading-6 text-[#F7EDE4]">
                Criações por Nília Diniz, registradas com elegância e
                identidade própria.
              </p>
            </div>
          </aside>

          <section className="w-full min-w-0 p-5 sm:p-8 lg:p-10">
            <a
              href="/"
              className="inline-flex min-h-10 items-center rounded-full border border-[#E6D8C8] bg-[#F4EADF] px-4 text-sm text-[#7A6A5D] transition hover:bg-white"
            >
              ← Voltar
            </a>

            <div className="mt-8">
              <p className="text-xs uppercase tracking-[0.28em] text-[#9B5C5F]">
                Soph & Nick Gestão
              </p>

              <h2 className="mt-3 break-words text-3xl font-semibold tracking-tight text-[#2E2723] [overflow-wrap:anywhere] sm:text-4xl">
                Entrar no ateliê
              </h2>

              <p className="mt-3 max-w-md break-words text-sm leading-7 text-[#7A6A5D] [overflow-wrap:anywhere]">
                Acesse o painel privado para acompanhar pedidos, clientes,
                financeiro e vitrine autoral.
              </p>
            </div>

            <form onSubmit={handleLogin} className="mt-8 space-y-4">
              <div>
                <label className="text-sm font-medium text-[#2E2723]">
                  E-mail
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Digite seu e-mail"
                  autoComplete="email"
                  disabled={carregando}
                  className="mt-2 min-h-12 w-full rounded-2xl border border-[#E6D8C8] bg-[#FFFDFC] px-4 text-sm outline-none transition placeholder:text-[#B09B8A] focus:border-[#9B5C5F] disabled:cursor-not-allowed disabled:opacity-70"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-[#2E2723]">
                  Senha
                </label>

                <div className="mt-2 flex min-h-12 w-full overflow-hidden rounded-2xl border border-[#E6D8C8] bg-[#FFFDFC] focus-within:border-[#9B5C5F]">
                  <input
                    type={mostrarSenha ? "text" : "password"}
                    value={senha}
                    onChange={(event) => setSenha(event.target.value)}
                    placeholder="Digite sua senha"
                    autoComplete="current-password"
                    disabled={carregando}
                    className="min-h-12 min-w-0 flex-1 bg-transparent px-4 text-sm outline-none placeholder:text-[#B09B8A] disabled:cursor-not-allowed disabled:opacity-70"
                  />

                  <button
                    type="button"
                    onClick={() => setMostrarSenha((atual) => !atual)}
                    disabled={carregando}
                    className="min-h-12 shrink-0 px-4 text-xs font-medium text-[#7A4A4F] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {mostrarSenha ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
              </div>

              {erro ? (
                <div className="rounded-2xl border border-[#E8C7C0] bg-red-50 px-4 py-3 text-sm leading-6 text-[#9A4A3F]">
                  {erro}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={carregando}
                className="mt-2 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#7D3F46] px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-[#6B343B] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {carregando ? "Entrando..." : "Entrar"}
              </button>
            </form>

            <p className="mt-6 text-center text-xs leading-6 text-[#7A6A5D]">
              Acesso privado do Soph & Nick Atelier.
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}