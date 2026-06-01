"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type ServiceOrder = {
  id: string;
  status: string;
  total_amount: number;
  paid_amount: number;
};

type Customer = {
  id: string;
};

const shortcuts = [
  {
    title: "Novo atendimento",
    description: "Registrar cliente, peças, serviços e valores.",
    href: "/pedidos/novo",
    primary: true,
  },
  {
    title: "Atendimentos",
    description: "Ver comandas, status, saldo e peças.",
    href: "/pedidos",
    primary: false,
  },
  {
    title: "Clientes",
    description: "Cadastrar e consultar clientes.",
    href: "/clientes",
    primary: false,
  },
  {
    title: "Serviços",
    description: "Editar tabela de preços do ateliê.",
    href: "/servicos",
    primary: false,
  },
  {
    title: "Financeiro",
    description: "Ver saldos, recebidos e pendências.",
    href: "/financeiro",
    primary: false,
  },
  {
    title: "Maison",
    description: "Vitrine autoral da Nília Diniz.",
    href: "/maison",
    primary: false,
  },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value || 0);
}

export default function DashboardPage() {
  const router = useRouter();

  const [carregando, setCarregando] = useState(true);
  const [nomeUsuario, setNomeUsuario] = useState("");
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [erro, setErro] = useState("");
  const [mostrarFinanceiro, setMostrarFinanceiro] = useState(false);
  const resumo = useMemo(() => {
    return orders.reduce(
      (acc, order) => {
        const total = Number(order.total_amount || 0);
        const paid = Number(order.paid_amount || 0);

        if (order.status !== "entregue" && order.status !== "cancelado") {
          acc.openOrders += 1;
          acc.receivable += total - paid;
        }

        if (order.status === "pronto") {
          acc.readyOrders += 1;
        }

        return acc;
      },
      {
        openOrders: 0,
        readyOrders: 0,
        receivable: 0,
      }
    );
  }, [orders]);

  useEffect(() => {
    async function carregarUsuario() {
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        router.push("/login");
        return;
      }

      setNomeUsuario(data.user.email || "Ateliê");

      await carregarResumo(data.user.id);

      setCarregando(false);
    }

    carregarUsuario();
  }, [router]);

  async function carregarResumo(userId: string) {
    setErro("");

    const { data: ordersData, error: ordersError } = await supabase
      .from("service_orders")
      .select("id, status, total_amount, paid_amount")
      .eq("user_id", userId);

    if (ordersError) {
      setErro("Não foi possível carregar o resumo dos atendimentos.");
      return;
    }

    const { data: customersData, error: customersError } = await supabase
      .from("customers")
      .select("id")
      .eq("user_id", userId);

    if (customersError) {
      setErro("Não foi possível carregar o total de clientes.");
      setOrders((ordersData || []) as ServiceOrder[]);
      return;
    }

    setOrders((ordersData || []) as ServiceOrder[]);
    setCustomers((customersData || []) as Customer[]);
  }

  async function sair() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (carregando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F4EADF] px-4 text-[#2E2723]">
        <div className="rounded-3xl border border-[#E6D8C8] bg-white px-6 py-5 text-sm text-[#7A6A5D] shadow-sm">
          Carregando ateliê...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-[#F4EADF] text-[#2E2723]">
      <section className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-10">
        <header className="flex w-full min-w-0 flex-col gap-4 border-b border-[#E6D8C8] pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="break-words text-[11px] uppercase tracking-[0.28em] text-[#9B5C5F] [overflow-wrap:anywhere] sm:text-xs">
              Soph & Nick Gestão
            </p>

            <h1 className="mt-2 break-words text-3xl font-semibold tracking-tight text-[#2E2723] [overflow-wrap:anywhere] sm:text-4xl">
              Painel do ateliê
            </h1>

            <p className="mt-2 break-words text-sm leading-7 text-[#7A6A5D] [overflow-wrap:anywhere]">
              Logado como {nomeUsuario}
            </p>
          </div>

          <button
            onClick={sair}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-[#D8C7B1] bg-white px-5 text-sm font-medium text-[#7A4A4F] shadow-sm transition hover:bg-[#FFFDFC] sm:w-auto"
          >
            Sair
          </button>
        </header>

        {erro ? (
          <div className="mt-5 rounded-2xl border border-[#E8C7C0] bg-red-50 px-4 py-3 text-sm leading-6 text-[#9A4A3F]">
            {erro}
          </div>
        ) : null}

        <section className="grid gap-3 py-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-3xl border border-[#E6D8C8] bg-white p-5 shadow-sm">
            <p className="text-sm text-[#7A6A5D]">Atendimentos em aberto</p>
            <p className="mt-3 text-3xl font-semibold text-[#2E2723]">
              {resumo.openOrders}
            </p>
          </div>

          <div className="rounded-3xl border border-[#E6D8C8] bg-white p-5 shadow-sm">
            <p className="text-sm text-[#7A6A5D]">Peças prontas</p>
            <p className="mt-3 text-3xl font-semibold text-[#2E2723]">
              {resumo.readyOrders}
            </p>
          </div>

          <div className="rounded-3xl border border-[#E6D8C8] bg-white p-5 shadow-sm">
  <div className="flex items-start justify-between gap-3">
    <p className="text-sm text-[#7A6A5D]">A receber</p>

    <button
      type="button"
      onClick={() => setMostrarFinanceiro((current) => !current)}
      className="rounded-full border border-[#E6D8C8] bg-[#F4EADF] px-3 py-1 text-xs font-medium text-[#7A4A4F] transition hover:bg-white"
    >
      {mostrarFinanceiro ? "Esconder" : "Ver"}
    </button>
  </div>

  <p className="mt-3 break-words text-2xl font-semibold text-[#2E2723] [overflow-wrap:anywhere]">
    {mostrarFinanceiro ? formatCurrency(resumo.receivable) : "••••••"}
  </p>
</div> 

          <div className="rounded-3xl border border-[#E6D8C8] bg-white p-5 shadow-sm">
            <p className="text-sm text-[#7A6A5D]">Clientes</p>
            <p className="mt-3 text-3xl font-semibold text-[#2E2723]">
              {customers.length}
            </p>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[2rem] border border-[#E6D8C8] bg-white p-5 shadow-sm">
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.25em] text-[#9B5C5F]">
                  Acesso rápido
                </p>

                <h2 className="mt-3 break-words text-2xl font-semibold text-[#2E2723] [overflow-wrap:anywhere]">
                  Rotina do ateliê
                </h2>

                <p className="mt-2 max-w-xl break-words text-sm leading-7 text-[#7A6A5D] [overflow-wrap:anywhere]">
                  Comece registrando um atendimento. Depois acompanhe status,
                  valores, clientes e tabela de serviços.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {shortcuts.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className={`min-w-0 rounded-3xl border p-4 shadow-sm transition ${
                    item.primary
                      ? "border-[#7D3F46] bg-[#7D3F46] text-white hover:bg-[#6B343B]"
                      : "border-[#E6D8C8] bg-[#F4EADF] text-[#2E2723] hover:bg-white"
                  }`}
                >
                  <p
                    className={`break-words text-sm font-semibold [overflow-wrap:anywhere] ${
                      item.primary ? "text-white" : "text-[#2E2723]"
                    }`}
                  >
                    {item.title}
                  </p>

                  <p
                    className={`mt-2 break-words text-sm leading-6 [overflow-wrap:anywhere] ${
                      item.primary ? "text-[#F7EDE4]" : "text-[#7A6A5D]"
                    }`}
                  >
                    {item.description}
                  </p>
                </a>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-[#E6D8C8] bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.25em] text-[#9B5C5F]">
              Maison Soph & Nick
            </p>

            <h2 className="mt-3 break-words text-2xl font-semibold text-[#2E2723] [overflow-wrap:anywhere]">
              Criações por Nília Diniz
            </h2>

            <p className="mt-3 break-words text-sm leading-7 text-[#7A6A5D] [overflow-wrap:anywhere]">
              A vitrine autoral ficará separada da rotina de consertos e
              atendimentos, valorizando roupas criadas do zero, peças sob
              encomenda e trabalhos especiais.
            </p>

            <div className="mt-5 rounded-3xl border border-dashed border-[#D8C7B1] bg-[#F4EADF] p-4">
              <p className="text-sm font-semibold text-[#2E2723]">
                Próxima etapa da vitrine
              </p>

              <p className="mt-2 text-sm leading-6 text-[#7A6A5D]">
                Depois dos atendimentos, vamos permitir cadastrar criações com
                foto, descrição, status e autorização para aparecer na vitrine.
              </p>
            </div>

            <a
              href="/maison"
              className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-full border border-[#D8C7B1] bg-[#F4EADF] px-5 text-sm font-medium text-[#7A4A4F] transition hover:bg-white"
            >
              Ver Maison Soph & Nick
            </a>
          </div>
        </section>

        <section className="mt-4 rounded-[2rem] border border-[#E6D8C8] bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.25em] text-[#9B5C5F]">
            Próximo passo
          </p>

          <h2 className="mt-3 break-words text-2xl font-semibold text-[#2E2723] [overflow-wrap:anywhere]">
            Fotos e avarias
          </h2>

          <p className="mt-3 break-words text-sm leading-7 text-[#7A6A5D] [overflow-wrap:anywhere]">
            A próxima função importante será anexar fotos aos itens do
            atendimento, separando foto de entrada, foto de avaria, processo e
            peça pronta.
          </p>
        </section>
      </section>
    </main>
  );
}