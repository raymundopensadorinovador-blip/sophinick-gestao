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
    customer_name: string | null;
    customer_phone: string | null;
    created_at: string;
  };

type OrderItem = {
  id: string;
  service_order_id: string;
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
      total_amount: order.total_amount,
      deposit_amount: order.deposit_amount,
      paid_amount: order.paid_amount,
      customer_id: order.customer_id,
      customer_name: customer?.name || null,
      customer_phone: customer?.phone || null,
      created_at: order.created_at,
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

export default function PedidosPage() {
  const router = useRouter();

  const [userId, setUserId] = useState("");
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const itemCountByOrder = useMemo(() => {
    const count: Record<string, number> = {};

    items.forEach((item) => {
      count[item.service_order_id] = (count[item.service_order_id] || 0) + 1;
    });

    return count;
  }, [items]);

  const filteredOrders = useMemo(() => {
    const term = search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesStatus =
        statusFilter === "todos" || order.status === statusFilter;

      const text = [
        order.order_number,
        order.status,
        order.customer_name,
        order.customer_phone,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !term || text.includes(term);

      return matchesStatus && matchesSearch;
    });
  }, [orders, search, statusFilter]);

  const summary = useMemo(() => {
    return orders.reduce(
      (acc, order) => {
        acc.total += Number(order.total_amount || 0);
        acc.paid += Number(order.paid_amount || 0);

        if (order.status === "pronto") acc.ready += 1;
        if (order.status !== "entregue" && order.status !== "cancelado") {
          acc.open += 1;
        }

        return acc;
      },
      {
        total: 0,
        paid: 0,
        ready: 0,
        open: 0,
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

      setUserId(data.user.id);
      await loadOrders(data.user.id);
      setLoading(false);
    }

    loadPage();
  }, [router]);

  async function loadOrders(currentUserId = userId) {
    if (!currentUserId) return;

    setError("");

    const { data: ordersData, error: ordersError } = await supabase
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
      .eq("user_id", currentUserId)
      .order("created_at", { ascending: false });

    if (ordersError) {
      setError("Não foi possível carregar os atendimentos.");
      return;
    }

    const { data: itemsData, error: itemsError } = await supabase
      .from("order_items")
      .select("id, service_order_id")
      .eq("user_id", currentUserId);

      const normalizedOrders = ((ordersData || []) as RawServiceOrder[]).map(
        normalizeOrder
      );
      
      if (itemsError) {
        setError("Os atendimentos carregaram, mas não foi possível contar os itens.");
        setOrders(normalizedOrders);
        return;
      }
      
      setOrders(normalizedOrders);
      setItems((itemsData || []) as OrderItem[]); 
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F4EADF] px-4 text-[#2E2723]">
        <div className="rounded-3xl border border-[#E6D8C8] bg-white px-6 py-5 text-sm text-[#7A6A5D] shadow-sm">
          Carregando atendimentos...
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
              Atendimentos
            </h1>

            <p className="mt-2 max-w-2xl break-words text-sm leading-7 text-[#7A6A5D] [overflow-wrap:anywhere]">
              Acompanhe as comandas do ateliê, com cliente, quantidade de peças,
              total, valores pagos e saldo.
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
              href="/pedidos/novo"
              className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[#7D3F46] px-5 text-sm font-medium text-white shadow-sm transition hover:bg-[#6B343B] sm:w-auto"
            >
              Novo atendimento
            </a>
          </div>
        </header>

        <section className="grid gap-3 py-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-3xl border border-[#E6D8C8] bg-white p-5 shadow-sm">
            <p className="text-sm text-[#7A6A5D]">Em aberto</p>
            <p className="mt-3 text-3xl font-semibold text-[#2E2723]">
              {summary.open}
            </p>
          </div>

          <div className="rounded-3xl border border-[#E6D8C8] bg-white p-5 shadow-sm">
            <p className="text-sm text-[#7A6A5D]">Prontos</p>
            <p className="mt-3 text-3xl font-semibold text-[#2E2723]">
              {summary.ready}
            </p>
          </div>

          <div className="rounded-3xl border border-[#E6D8C8] bg-white p-5 shadow-sm">
            <p className="text-sm text-[#7A6A5D]">Total registrado</p>
            <p className="mt-3 text-2xl font-semibold text-[#2E2723]">
              {formatCurrency(summary.total)}
            </p>
          </div>

          <div className="rounded-3xl border border-[#E6D8C8] bg-white p-5 shadow-sm">
            <p className="text-sm text-[#7A6A5D]">A receber</p>
            <p className="mt-3 text-2xl font-semibold text-[#2E2723]">
              {formatCurrency(summary.total - summary.paid)}
            </p>
          </div>
        </section>

        <section className="rounded-[2rem] border border-[#E6D8C8] bg-white p-5 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-[1fr_220px]">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por cliente, telefone ou número..."
              className="min-h-12 w-full rounded-2xl border border-[#E6D8C8] bg-[#FFFDFC] px-4 text-sm outline-none transition placeholder:text-[#B09B8A] focus:border-[#9B5C5F]"
            />

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="min-h-12 w-full rounded-2xl border border-[#E6D8C8] bg-[#FFFDFC] px-4 text-sm outline-none transition focus:border-[#9B5C5F]"
            >
              <option value="todos">Todos os status</option>
              <option value="recebido">Recebido</option>
              <option value="em_andamento">Em andamento</option>
              <option value="pronto">Pronto</option>
              <option value="entregue">Entregue</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>

          {error ? (
            <div className="mt-5 rounded-2xl border border-[#E8C7C0] bg-red-50 px-4 py-3 text-sm leading-6 text-[#9A4A3F]">
              {error}
            </div>
          ) : null}

          <div className="mt-5 max-h-[620px] space-y-3 overflow-y-auto pr-1">
            {filteredOrders.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-[#D8C7B1] bg-[#F4EADF] p-5 text-sm leading-7 text-[#7A6A5D]">
                Nenhum atendimento encontrado. Crie um novo atendimento para
                registrar peças, serviços e valores.
              </div>
            ) : (
              filteredOrders.map((order) => {
                const total = Number(order.total_amount || 0);
                const paid = Number(order.paid_amount || 0);
                const balance = total - paid;
                const itemCount = itemCountByOrder[order.id] || 0;

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

                          <span className="rounded-full border border-[#E6D8C8] bg-[#F4EADF] px-3 py-1 text-xs text-[#7A6A5D]">
                            {itemCount} item(ns)
                          </span>
                        </div>

                        <h2 className="mt-3 break-words text-xl font-semibold text-[#2E2723] [overflow-wrap:anywhere]">
                          {order.customer_name || "Cliente removida"}
                        </h2>

                        <div className="mt-2 space-y-1 text-sm leading-6 text-[#7A6A5D]">
                        {order.customer_phone ? (
  <p className="break-words [overflow-wrap:anywhere]">
    WhatsApp: {order.customer_phone}
  </p>
) : null}

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

                    <div className="mt-4 flex flex-col gap-2 sm:flex-row">
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
    </main>
  );
}