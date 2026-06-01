"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type ServiceOrder = {
  id: string;
  order_number: number;
  status: string;
  entry_date: string;
  due_date: string | null;
  total_amount: number;
  deposit_amount: number;
  paid_amount: number;
  customer_id: string | null;
  created_at: string;
  customer_name: string | null;
  customer_phone: string | null;
};

type RawServiceOrder = {
  id: string;
  order_number: number;
  status: string;
  entry_date: string;
  due_date: string | null;
  total_amount: number;
  deposit_amount: number;
  paid_amount: number;
  customer_id: string | null;
  created_at: string;
  customers:
    | {
        name: string;
        phone: string | null;
      }
    | {
        name: string;
        phone: string | null;
      }[]
    | null;
};

function normalizeOrder(order: RawServiceOrder): ServiceOrder {
  const customer = Array.isArray(order.customers)
    ? order.customers[0] || null
    : order.customers;

  return {
    id: order.id,
    order_number: order.order_number,
    status: order.status,
    entry_date: order.entry_date,
    due_date: order.due_date,
    total_amount: Number(order.total_amount || 0),
    deposit_amount: Number(order.deposit_amount || 0),
    paid_amount: Number(order.paid_amount || 0),
    customer_id: order.customer_id,
    created_at: order.created_at,
    customer_name: customer?.name || null,
    customer_phone: customer?.phone || null,
  };
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value || 0);
}

function formatDate(value: string | null) {
  if (!value) return "Sem prazo";

  return new Intl.DateTimeFormat("pt-BR").format(new Date(`${value}T00:00:00`));
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    recebido: "Recebido",
    em_andamento: "Em andamento",
    pronto: "Pronto",
    entregue: "Entregue",
    cancelado: "Cancelado",
  };

  return labels[status] || status;
}

export default function FinanceiroPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");

  const filteredOrders = useMemo(() => {
    if (statusFilter === "todos") return orders;

    if (statusFilter === "pendentes") {
      return orders.filter((order) => {
        const total = Number(order.total_amount || 0);
        const paid = Number(order.paid_amount || 0);
        return total - paid > 0 && order.status !== "cancelado";
      });
    }

    if (statusFilter === "quitados") {
      return orders.filter((order) => {
        const total = Number(order.total_amount || 0);
        const paid = Number(order.paid_amount || 0);
        return total > 0 && paid >= total && order.status !== "cancelado";
      });
    }

    return orders.filter((order) => order.status === statusFilter);
  }, [orders, statusFilter]);

  const summary = useMemo(() => {
    return orders.reduce(
      (acc, order) => {
        if (order.status === "cancelado") return acc;

        const total = Number(order.total_amount || 0);
        const paid = Number(order.paid_amount || 0);
        const balance = total - paid;

        acc.totalRegistered += total;
        acc.totalPaid += paid;

        if (balance > 0) {
          acc.totalReceivable += balance;
          acc.pendingOrders += 1;
        }

        if (order.status === "pronto" && balance > 0) {
          acc.readyWithBalance += 1;
        }

        if (total > 0 && paid >= total) {
          acc.paidOrders += 1;
        }

        return acc;
      },
      {
        totalRegistered: 0,
        totalPaid: 0,
        totalReceivable: 0,
        pendingOrders: 0,
        paidOrders: 0,
        readyWithBalance: 0,
      }
    );
  }, [orders]);

  useEffect(() => {
    async function loadPage() {
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        router.push("/login");
        return;
      }

      await loadOrders(data.user.id);
      setLoading(false);
    }

    loadPage();
  }, [router]);

  async function loadOrders(userId: string) {
    setError("");

    const { data, error: loadError } = await supabase
      .from("service_orders")
      .select(
        `
        id,
        order_number,
        status,
        entry_date,
        due_date,
        total_amount,
        deposit_amount,
        paid_amount,
        customer_id,
        created_at,
        customers (
          name,
          phone
        )
      `
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (loadError) {
      setError("Não foi possível carregar o financeiro.");
      return;
    }

    const normalized = ((data || []) as RawServiceOrder[]).map(normalizeOrder);
    setOrders(normalized);
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F4EADF] px-4 text-[#2E2723]">
        <div className="rounded-3xl border border-[#E6D8C8] bg-white px-6 py-5 text-sm text-[#7A6A5D] shadow-sm">
          Carregando financeiro...
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
              Financeiro
            </h1>

            <p className="mt-2 max-w-2xl break-words text-sm leading-7 text-[#7A6A5D] [overflow-wrap:anywhere]">
              Acompanhe valores recebidos, saldos pendentes e atendimentos que
              ainda precisam de pagamento.
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
  <a
    href="/dashboard"
    className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-[#D8C7B1] bg-white px-5 text-sm font-medium text-[#7A4A4F] shadow-sm transition hover:bg-[#FFFDFC] sm:w-auto"
  >
    Voltar ao painel
  </a>

  <a
    href="/financeiro/anual"
    className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[#7D3F46] px-5 text-sm font-medium text-white shadow-sm transition hover:bg-[#6B343B] sm:w-auto"
  >
    Resumo anual
  </a>
</div>  
        </header>

        {error ? (
          <div className="mt-5 rounded-2xl border border-[#E8C7C0] bg-red-50 px-4 py-3 text-sm leading-6 text-[#9A4A3F]">
            {error}
          </div>
        ) : null}

        <section className="grid gap-3 py-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-3xl border border-[#E6D8C8] bg-white p-5 shadow-sm">
            <p className="text-sm text-[#7A6A5D]">Total registrado</p>
            <p className="mt-3 text-2xl font-semibold text-[#2E2723]">
              {formatCurrency(summary.totalRegistered)}
            </p>
          </div>

          <div className="rounded-3xl border border-[#E6D8C8] bg-white p-5 shadow-sm">
            <p className="text-sm text-[#7A6A5D]">Recebido</p>
            <p className="mt-3 text-2xl font-semibold text-[#2E2723]">
              {formatCurrency(summary.totalPaid)}
            </p>
          </div>

          <div className="rounded-3xl border border-[#E6D8C8] bg-white p-5 shadow-sm">
            <p className="text-sm text-[#7A6A5D]">A receber</p>
            <p className="mt-3 text-2xl font-semibold text-[#2E2723]">
              {formatCurrency(summary.totalReceivable)}
            </p>
          </div>

          <div className="rounded-3xl border border-[#E6D8C8] bg-white p-5 shadow-sm">
            <p className="text-sm text-[#7A6A5D]">Pendentes</p>
            <p className="mt-3 text-3xl font-semibold text-[#2E2723]">
              {summary.pendingOrders}
            </p>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
          <aside className="space-y-4">
            <div className="rounded-[2rem] border border-[#E6D8C8] bg-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.25em] text-[#9B5C5F]">
                Controle
              </p>

              <h2 className="mt-3 text-2xl font-semibold text-[#2E2723]">
                Resumo de pagamentos
              </h2>

              <div className="mt-5 grid gap-3 text-sm">
                <div className="rounded-3xl bg-[#F4EADF] p-4">
                  <p className="text-[#7A6A5D]">Atendimentos quitados</p>
                  <p className="mt-1 text-2xl font-semibold text-[#2E2723]">
                    {summary.paidOrders}
                  </p>
                </div>

                <div className="rounded-3xl bg-[#F4EADF] p-4">
                  <p className="text-[#7A6A5D]">
                    Prontos com saldo pendente
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-[#2E2723]">
                    {summary.readyWithBalance}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-[#E6D8C8] bg-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.25em] text-[#9B5C5F]">
                Filtro
              </p>

              <h2 className="mt-3 text-2xl font-semibold text-[#2E2723]">
                Ver atendimentos
              </h2>

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="mt-5 min-h-12 w-full rounded-2xl border border-[#E6D8C8] bg-[#FFFDFC] px-4 text-sm outline-none transition focus:border-[#9B5C5F]"
              >
                <option value="todos">Todos</option>
                <option value="pendentes">Com saldo pendente</option>
                <option value="quitados">Quitados</option>
                <option value="recebido">Recebidos</option>
                <option value="em_andamento">Em andamento</option>
                <option value="pronto">Prontos</option>
                <option value="entregue">Entregues</option>
                <option value="cancelado">Cancelados</option>
              </select>
            </div>
          </aside>

          <section className="rounded-[2rem] border border-[#E6D8C8] bg-white p-5 shadow-sm">
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.25em] text-[#9B5C5F]">
                  Atendimentos
                </p>

                <h2 className="mt-3 text-2xl font-semibold text-[#2E2723]">
                  Saldos e recebimentos
                </h2>
              </div>

              <div className="rounded-full border border-[#E6D8C8] bg-[#F4EADF] px-4 py-2 text-sm text-[#7A6A5D]">
                {filteredOrders.length} registro(s)
              </div>
            </div>

            <div className="mt-5 max-h-[640px] space-y-3 overflow-y-auto pr-1">
              {filteredOrders.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-[#D8C7B1] bg-[#F4EADF] p-5 text-sm leading-7 text-[#7A6A5D]">
                  Nenhum atendimento encontrado para este filtro.
                </div>
              ) : (
                filteredOrders.map((order) => {
                  const total = Number(order.total_amount || 0);
                  const paid = Number(order.paid_amount || 0);
                  const balance = total - paid;

                  return (
                    <article
                      key={order.id}
                      className="min-w-0 rounded-3xl border border-[#E6D8C8] bg-[#FFFDFC] p-4"
                    >
                      <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap gap-2">
                            <span className="rounded-full border border-[#E6D8C8] bg-[#F4EADF] px-3 py-1 text-xs text-[#7A6A5D]">
                              Atendimento #{order.order_number}
                            </span>

                            <span className="rounded-full border border-[#D8C7B1] bg-white px-3 py-1 text-xs text-[#7A4A4F]">
                              {statusLabel(order.status)}
                            </span>
                          </div>

                          <h3 className="mt-3 break-words text-lg font-semibold text-[#2E2723] [overflow-wrap:anywhere]">
                            {order.customer_name || "Cliente removida"}
                          </h3>

                          <div className="mt-2 text-sm leading-6 text-[#7A6A5D]">
                            <p>Entrada: {formatDate(order.entry_date)}</p>
                            <p>Prazo: {formatDate(order.due_date)}</p>
                          </div>
                        </div>

                        <div className="grid gap-2 text-sm sm:grid-cols-3 lg:min-w-[360px]">
                          <div className="rounded-2xl bg-[#F4EADF] p-3">
                            <p className="text-[#7A6A5D]">Total</p>
                            <p className="mt-1 font-semibold text-[#2E2723]">
                              {formatCurrency(total)}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-[#F4EADF] p-3">
                            <p className="text-[#7A6A5D]">Pago</p>
                            <p className="mt-1 font-semibold text-[#2E2723]">
                              {formatCurrency(paid)}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-[#F4EADF] p-3">
                            <p className="text-[#7A6A5D]">Saldo</p>
                            <p className="mt-1 font-semibold text-[#2E2723]">
                              {formatCurrency(balance)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4">
                        <a
                          href={`/pedidos/${order.id}`}
                          className="inline-flex min-h-10 w-full items-center justify-center rounded-full bg-[#7D3F46] px-4 text-xs font-medium text-white shadow-sm transition hover:bg-[#6B343B] sm:w-auto"
                        >
                          Abrir atendimento
                        </a>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </section>
        </section>
      </section>
    </main>
  );
}