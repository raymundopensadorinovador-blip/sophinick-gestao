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

const monthNames = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

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
  if (!value) return "Sem data";

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

function getOrderYear(order: ServiceOrder) {
  return new Date(`${order.entry_date}T00:00:00`).getFullYear();
}

function getOrderMonth(order: ServiceOrder) {
  return new Date(`${order.entry_date}T00:00:00`).getMonth();
}

export default function FinanceiroAnualPage() {
  const router = useRouter();

  const currentYear = new Date().getFullYear();

  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [selectedYear, setSelectedYear] = useState(String(currentYear));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const availableYears = useMemo(() => {
    const years = new Set<number>();

    orders.forEach((order) => {
      years.add(getOrderYear(order));
    });

    years.add(currentYear);

    return Array.from(years).sort((a, b) => b - a);
  }, [orders, currentYear]);

  const yearlyOrders = useMemo(() => {
    return orders.filter((order) => getOrderYear(order) === Number(selectedYear));
  }, [orders, selectedYear]);

  const yearlySummary = useMemo(() => {
    return yearlyOrders.reduce(
      (acc, order) => {
        if (order.status === "cancelado") {
          acc.canceled += 1;
          return acc;
        }

        const total = Number(order.total_amount || 0);
        const paid = Number(order.paid_amount || 0);
        const balance = total - paid;

        acc.totalRegistered += total;
        acc.totalReceived += paid;

        if (balance > 0) {
          acc.totalReceivable += balance;
          acc.pending += 1;
        }

        if (total > 0 && paid >= total) {
          acc.paidOrders += 1;
        }

        acc.validOrders += 1;

        return acc;
      },
      {
        totalRegistered: 0,
        totalReceived: 0,
        totalReceivable: 0,
        validOrders: 0,
        pending: 0,
        paidOrders: 0,
        canceled: 0,
      }
    );
  }, [yearlyOrders]);

  const monthlySummary = useMemo(() => {
    const months = monthNames.map((month, index) => ({
      index,
      month,
      totalRegistered: 0,
      totalReceived: 0,
      totalReceivable: 0,
      ordersCount: 0,
      pendingCount: 0,
    }));

    yearlyOrders.forEach((order) => {
      if (order.status === "cancelado") return;

      const monthIndex = getOrderMonth(order);
      const total = Number(order.total_amount || 0);
      const paid = Number(order.paid_amount || 0);
      const balance = total - paid;

      months[monthIndex].totalRegistered += total;
      months[monthIndex].totalReceived += paid;
      months[monthIndex].totalReceivable += balance > 0 ? balance : 0;
      months[monthIndex].ordersCount += 1;

      if (balance > 0) {
        months[monthIndex].pendingCount += 1;
      }
    });

    return months;
  }, [yearlyOrders]);

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
      .order("entry_date", { ascending: false });

    if (loadError) {
      setError("Não foi possível carregar o resumo anual.");
      return;
    }

    const normalized = ((data || []) as RawServiceOrder[]).map(normalizeOrder);
    setOrders(normalized);
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F4EADF] px-4 text-[#2E2723]">
        <div className="rounded-3xl border border-[#E6D8C8] bg-white px-6 py-5 text-sm text-[#7A6A5D] shadow-sm">
          Carregando resumo anual...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-[#F4EADF] text-[#2E2723]">
      <section className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-10 print:max-w-none print:px-0 print:py-0">
        <header className="flex w-full min-w-0 flex-col gap-4 border-b border-[#E6D8C8] pb-6 sm:flex-row sm:items-center sm:justify-between print:border-b print:border-black">
          <div className="min-w-0">
            <p className="break-words text-[11px] uppercase tracking-[0.28em] text-[#9B5C5F] [overflow-wrap:anywhere] sm:text-xs print:text-black">
              Soph & Nick Atelier
            </p>

            <h1 className="mt-2 break-words text-3xl font-semibold tracking-tight text-[#2E2723] [overflow-wrap:anywhere] sm:text-4xl print:text-2xl print:text-black">
              Resumo financeiro anual
            </h1>

            <p className="mt-2 max-w-2xl break-words text-sm leading-7 text-[#7A6A5D] [overflow-wrap:anywhere] print:text-black">
              Relatório organizado para conferência interna, contador ou
              preparação de declaração. Não substitui orientação contábil.
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row print:hidden">
            <a
              href="/financeiro"
              className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-[#D8C7B1] bg-white px-5 text-sm font-medium text-[#7A4A4F] shadow-sm transition hover:bg-[#FFFDFC] sm:w-auto"
            >
              Voltar ao financeiro
            </a>

            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[#7D3F46] px-5 text-sm font-medium text-white shadow-sm transition hover:bg-[#6B343B] sm:w-auto"
            >
              Imprimir / salvar PDF
            </button>
          </div>
        </header>

        {error ? (
          <div className="mt-5 rounded-2xl border border-[#E8C7C0] bg-red-50 px-4 py-3 text-sm leading-6 text-[#9A4A3F] print:border-black print:bg-white print:text-black">
            {error}
          </div>
        ) : null}

        <section className="mt-6 rounded-[2rem] border border-[#E6D8C8] bg-white p-5 shadow-sm print:rounded-none print:border-black print:shadow-none">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-[#9B5C5F] print:text-black">
                Ano de referência
              </p>

              <h2 className="mt-3 text-2xl font-semibold text-[#2E2723] print:text-black">
                {selectedYear}
              </h2>
            </div>

            <div className="print:hidden">
              <label className="text-sm font-medium text-[#2E2723]">
                Selecionar ano
              </label>

              <select
                value={selectedYear}
                onChange={(event) => setSelectedYear(event.target.value)}
                className="mt-2 min-h-12 w-full rounded-2xl border border-[#E6D8C8] bg-[#FFFDFC] px-4 text-sm outline-none transition focus:border-[#9B5C5F] sm:w-48"
              >
                {availableYears.map((year) => (
                  <option key={year} value={String(year)}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-3xl border border-[#E6D8C8] bg-[#F4EADF] p-4 print:rounded-none print:border-black print:bg-white">
              <p className="text-sm text-[#7A6A5D] print:text-black">
                Total registrado
              </p>
              <p className="mt-2 text-xl font-semibold text-[#2E2723] print:text-black">
                {formatCurrency(yearlySummary.totalRegistered)}
              </p>
            </div>

            <div className="rounded-3xl border border-[#E6D8C8] bg-[#F4EADF] p-4 print:rounded-none print:border-black print:bg-white">
              <p className="text-sm text-[#7A6A5D] print:text-black">
                Total recebido
              </p>
              <p className="mt-2 text-xl font-semibold text-[#2E2723] print:text-black">
                {formatCurrency(yearlySummary.totalReceived)}
              </p>
            </div>

            <div className="rounded-3xl border border-[#E6D8C8] bg-[#F4EADF] p-4 print:rounded-none print:border-black print:bg-white">
              <p className="text-sm text-[#7A6A5D] print:text-black">
                A receber
              </p>
              <p className="mt-2 text-xl font-semibold text-[#2E2723] print:text-black">
                {formatCurrency(yearlySummary.totalReceivable)}
              </p>
            </div>

            <div className="rounded-3xl border border-[#E6D8C8] bg-[#F4EADF] p-4 print:rounded-none print:border-black print:bg-white">
              <p className="text-sm text-[#7A6A5D] print:text-black">
                Atendimentos válidos
              </p>
              <p className="mt-2 text-xl font-semibold text-[#2E2723] print:text-black">
                {yearlySummary.validOrders}
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-3xl border border-[#E6D8C8] bg-white p-4 print:rounded-none print:border-black">
              <p className="text-sm text-[#7A6A5D] print:text-black">
                Quitados
              </p>
              <p className="mt-2 text-2xl font-semibold text-[#2E2723] print:text-black">
                {yearlySummary.paidOrders}
              </p>
            </div>

            <div className="rounded-3xl border border-[#E6D8C8] bg-white p-4 print:rounded-none print:border-black">
              <p className="text-sm text-[#7A6A5D] print:text-black">
                Pendentes
              </p>
              <p className="mt-2 text-2xl font-semibold text-[#2E2723] print:text-black">
                {yearlySummary.pending}
              </p>
            </div>

            <div className="rounded-3xl border border-[#E6D8C8] bg-white p-4 print:rounded-none print:border-black">
              <p className="text-sm text-[#7A6A5D] print:text-black">
                Cancelados
              </p>
              <p className="mt-2 text-2xl font-semibold text-[#2E2723] print:text-black">
                {yearlySummary.canceled}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-5 rounded-[2rem] border border-[#E6D8C8] bg-white p-5 shadow-sm print:rounded-none print:border-black print:shadow-none">
          <p className="text-xs uppercase tracking-[0.25em] text-[#9B5C5F] print:text-black">
            Resumo mensal
          </p>

          <h2 className="mt-3 text-2xl font-semibold text-[#2E2723] print:text-black">
            Recebimentos por mês
          </h2>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[#E6D8C8] print:border-black">
                  <th className="py-3 pr-3 font-semibold text-[#2E2723] print:text-black">
                    Mês
                  </th>
                  <th className="py-3 pr-3 font-semibold text-[#2E2723] print:text-black">
                    Atendimentos
                  </th>
                  <th className="py-3 pr-3 font-semibold text-[#2E2723] print:text-black">
                    Registrado
                  </th>
                  <th className="py-3 pr-3 font-semibold text-[#2E2723] print:text-black">
                    Recebido
                  </th>
                  <th className="py-3 pr-3 font-semibold text-[#2E2723] print:text-black">
                    A receber
                  </th>
                  <th className="py-3 font-semibold text-[#2E2723] print:text-black">
                    Pendentes
                  </th>
                </tr>
              </thead>

              <tbody>
                {monthlySummary.map((month) => (
                  <tr
                    key={month.month}
                    className="border-b border-[#E6D8C8] print:border-black"
                  >
                    <td className="py-3 pr-3 text-[#2E2723] print:text-black">
                      {month.month}
                    </td>
                    <td className="py-3 pr-3 text-[#7A6A5D] print:text-black">
                      {month.ordersCount}
                    </td>
                    <td className="py-3 pr-3 text-[#7A6A5D] print:text-black">
                      {formatCurrency(month.totalRegistered)}
                    </td>
                    <td className="py-3 pr-3 text-[#7A6A5D] print:text-black">
                      {formatCurrency(month.totalReceived)}
                    </td>
                    <td className="py-3 pr-3 text-[#7A6A5D] print:text-black">
                      {formatCurrency(month.totalReceivable)}
                    </td>
                    <td className="py-3 text-[#7A6A5D] print:text-black">
                      {month.pendingCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-5 rounded-[2rem] border border-[#E6D8C8] bg-white p-5 shadow-sm print:rounded-none print:border-black print:shadow-none">
          <p className="text-xs uppercase tracking-[0.25em] text-[#9B5C5F] print:text-black">
            Atendimentos do ano
          </p>

          <h2 className="mt-3 text-2xl font-semibold text-[#2E2723] print:text-black">
            Lista detalhada
          </h2>

          <div className="mt-5 max-h-[680px] space-y-3 overflow-y-auto pr-1 print:max-h-none print:overflow-visible">
            {yearlyOrders.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-[#D8C7B1] bg-[#F4EADF] p-5 text-sm leading-7 text-[#7A6A5D] print:rounded-none print:border-black print:bg-white print:text-black">
                Nenhum atendimento registrado neste ano.
              </div>
            ) : (
              yearlyOrders.map((order) => {
                const total = Number(order.total_amount || 0);
                const paid = Number(order.paid_amount || 0);
                const balance = total - paid;

                return (
                  <article
                    key={order.id}
                    className="min-w-0 rounded-3xl border border-[#E6D8C8] bg-[#FFFDFC] p-4 print:break-inside-avoid print:rounded-none print:border-black print:bg-white"
                  >
                    <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-xs uppercase tracking-[0.2em] text-[#9B5C5F] print:text-black">
                          Atendimento #{order.order_number}
                        </p>

                        <h3 className="mt-2 break-words text-lg font-semibold text-[#2E2723] [overflow-wrap:anywhere] print:text-black">
                          {order.customer_name || "Cliente removida"}
                        </h3>

                        <div className="mt-2 text-sm leading-6 text-[#7A6A5D] print:text-black">
                          <p>Entrada: {formatDate(order.entry_date)}</p>
                          <p>Prazo: {formatDate(order.due_date)}</p>
                          <p>Status: {statusLabel(order.status)}</p>
                        </div>
                      </div>

                      <div className="grid gap-2 text-sm sm:grid-cols-3 sm:min-w-[360px]">
                        <div className="rounded-2xl bg-[#F4EADF] p-3 print:rounded-none print:border print:border-black print:bg-white">
                          <p className="text-[#7A6A5D] print:text-black">
                            Total
                          </p>
                          <p className="mt-1 font-semibold text-[#2E2723] print:text-black">
                            {formatCurrency(total)}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-[#F4EADF] p-3 print:rounded-none print:border print:border-black print:bg-white">
                          <p className="text-[#7A6A5D] print:text-black">
                            Pago
                          </p>
                          <p className="mt-1 font-semibold text-[#2E2723] print:text-black">
                            {formatCurrency(paid)}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-[#F4EADF] p-3 print:rounded-none print:border print:border-black print:bg-white">
                          <p className="text-[#7A6A5D] print:text-black">
                            Saldo
                          </p>
                          <p className="mt-1 font-semibold text-[#2E2723] print:text-black">
                            {formatCurrency(balance)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>

          <p className="mt-6 text-xs leading-6 text-[#7A6A5D] print:text-black">
            Observação: este relatório organiza informações registradas no
            sistema Soph & Nick Gestão. Ele não substitui nota fiscal, apuração
            oficial, Carnê-Leão, declaração de imposto de renda ou orientação de
            contador.
          </p>
        </section>
      </section>
    </main>
  );
}