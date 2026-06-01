"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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

type OrderItem = {
  id: string;
  service_order_id: string;
  clothing_type: string | null;
  service_name: string;
  service_description: string | null;
  price: number;
  created_at: string;
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
  if (!value) return "Não informado";

  return new Intl.DateTimeFormat("pt-BR").format(new Date(`${value}T00:00:00`));
}

function formatDateTime(value: string | null) {
  if (!value) return "Não informado";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function ReciboAtendimentoPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const orderId = params.id;

  const [order, setOrder] = useState<ServiceOrder | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const balanceAmount = useMemo(() => {
    if (!order) return 0;

    return Number(order.total_amount || 0) - Number(order.paid_amount || 0);
  }, [order]);

  useEffect(() => {
    async function loadPage() {
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        router.push("/login");
        return;
      }

      await loadReceipt(data.user.id);
      setLoading(false);
    }

    loadPage();
  }, [router, orderId]);

  async function loadReceipt(userId: string) {
    setError("");

    const { data: orderData, error: orderError } = await supabase
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
      .eq("id", orderId)
      .eq("user_id", userId)
      .single();

    if (orderError || !orderData) {
      setError("Não foi possível carregar os dados do recibo.");
      return;
    }

    const { data: itemsData, error: itemsError } = await supabase
      .from("order_items")
      .select(
        `
        id,
        service_order_id,
        clothing_type,
        service_name,
        service_description,
        price,
        created_at
      `
      )
      .eq("service_order_id", orderId)
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (itemsError) {
      setError("O atendimento carregou, mas não foi possível carregar os itens.");
      setOrder(normalizeOrder(orderData as RawServiceOrder));
      return;
    }

    setOrder(normalizeOrder(orderData as RawServiceOrder));
    setItems((itemsData || []) as OrderItem[]);
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F4EADF] px-4 text-[#2E2723]">
        <div className="rounded-3xl border border-[#E6D8C8] bg-white px-6 py-5 text-sm text-[#7A6A5D] shadow-sm">
          Carregando recibo...
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="min-h-screen bg-[#F4EADF] px-4 py-6 text-[#2E2723]">
        <section className="mx-auto max-w-3xl rounded-[2rem] border border-[#E6D8C8] bg-white p-5 shadow-sm">
          <h1 className="text-2xl font-semibold">Recibo não encontrado</h1>

          {error ? (
            <p className="mt-3 text-sm leading-7 text-[#9A4A3F]">{error}</p>
          ) : null}

          <a
            href="/pedidos"
            className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[#7D3F46] px-5 text-sm font-medium text-white sm:w-auto"
          >
            Voltar aos atendimentos
          </a>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-[#F4EADF] text-[#2E2723] print:bg-white">
      <section className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 lg:px-10 print:max-w-none print:px-0 print:py-0">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between print:hidden">
          <a
            href={`/pedidos/${order.id}`}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-[#D8C7B1] bg-white px-5 text-sm font-medium text-[#7A4A4F] shadow-sm transition hover:bg-[#FFFDFC] sm:w-auto"
          >
            Voltar ao atendimento
          </a>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[#7D3F46] px-5 text-sm font-medium text-white shadow-sm transition hover:bg-[#6B343B] sm:w-auto"
          >
            Imprimir / salvar PDF
          </button>
        </div>

        <article className="rounded-[2rem] border border-[#E6D8C8] bg-white p-5 shadow-sm sm:p-8 print:rounded-none print:border-black print:p-8 print:shadow-none">
          <header className="border-b border-[#E6D8C8] pb-5 print:border-black">
            <p className="text-xs uppercase tracking-[0.28em] text-[#9B5C5F] print:text-black">
              Soph & Nick Atelier
            </p>

            <h1 className="mt-3 text-3xl font-semibold text-[#2E2723] print:text-2xl print:text-black">
              Recibo de pagamento
            </h1>

            <div className="mt-4 grid gap-2 text-sm leading-6 text-[#7A6A5D] sm:grid-cols-2 print:text-black">
              <p>
                <strong className="text-[#2E2723] print:text-black">
                  Responsável:
                </strong>{" "}
                Nília Diniz
              </p>

              <p>
                <strong className="text-[#2E2723] print:text-black">
                  Atendimento:
                </strong>{" "}
                #{order.order_number}
              </p>

              <p>
                <strong className="text-[#2E2723] print:text-black">
                  Data de entrada:
                </strong>{" "}
                {formatDate(order.entry_date)}
              </p>

              <p>
                <strong className="text-[#2E2723] print:text-black">
                  Recibo gerado em:
                </strong>{" "}
                {formatDateTime(new Date().toISOString())}
              </p>
            </div>
          </header>

          <section className="mt-6">
            <p className="text-sm uppercase tracking-[0.2em] text-[#9B5C5F] print:text-black">
              Cliente
            </p>

            <h2 className="mt-2 text-2xl font-semibold text-[#2E2723] print:text-xl print:text-black">
              {order.customer_name || "Cliente não informada"}
            </h2>

            {order.customer_phone ? (
              <p className="mt-1 text-sm text-[#7A6A5D] print:text-black">
                WhatsApp: {order.customer_phone}
              </p>
            ) : null}
          </section>

          <section className="mt-6 rounded-3xl border border-[#E6D8C8] bg-[#F4EADF] p-5 print:rounded-none print:border-black print:bg-white">
            <p className="text-sm leading-7 text-[#2E2723] print:text-black">
              Recebi de{" "}
              <strong>{order.customer_name || "cliente não informada"}</strong>{" "}
              o valor de{" "}
              <strong>{formatCurrency(order.paid_amount)}</strong>, referente
              ao atendimento #{order.order_number} realizado pelo Soph & Nick
              Atelier, conforme os serviços descritos abaixo.
            </p>

            {balanceAmount > 0 ? (
              <p className="mt-3 text-sm leading-7 text-[#7A6A5D] print:text-black">
                Este recibo registra o valor pago até o momento. Ainda consta
                saldo pendente de{" "}
                <strong className="text-[#2E2723] print:text-black">
                  {formatCurrency(balanceAmount)}
                </strong>
                .
              </p>
            ) : (
              <p className="mt-3 text-sm leading-7 text-[#7A6A5D] print:text-black">
                Conforme os valores registrados no sistema, este atendimento
                está quitado.
              </p>
            )}
          </section>

          <section className="mt-6">
            <p className="text-sm uppercase tracking-[0.2em] text-[#9B5C5F] print:text-black">
              Serviços
            </p>

            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-[#E6D8C8] print:border-black">
                    <th className="py-3 pr-3 font-semibold text-[#2E2723] print:text-black">
                      Item
                    </th>
                    <th className="py-3 pr-3 font-semibold text-[#2E2723] print:text-black">
                      Peça
                    </th>
                    <th className="py-3 pr-3 font-semibold text-[#2E2723] print:text-black">
                      Serviço
                    </th>
                    <th className="py-3 font-semibold text-[#2E2723] print:text-black">
                      Valor
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="py-4 text-[#7A6A5D] print:text-black"
                      >
                        Nenhum item listado.
                      </td>
                    </tr>
                  ) : (
                    items.map((item, index) => (
                      <tr
                        key={item.id}
                        className="border-b border-[#E6D8C8] print:border-black"
                      >
                        <td className="py-3 pr-3 text-[#7A6A5D] print:text-black">
                          {index + 1}
                        </td>
                        <td className="py-3 pr-3 text-[#7A6A5D] print:text-black">
                          {item.clothing_type || "Peça"}
                        </td>
                        <td className="py-3 pr-3 text-[#7A6A5D] print:text-black">
                          {item.service_name}
                        </td>
                        <td className="py-3 text-[#7A6A5D] print:text-black">
                          {formatCurrency(Number(item.price || 0))}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-3xl border border-[#E6D8C8] bg-[#F4EADF] p-4 print:rounded-none print:border-black print:bg-white">
              <p className="text-sm text-[#7A6A5D] print:text-black">
                Total
              </p>
              <p className="mt-2 text-xl font-semibold text-[#2E2723] print:text-black">
                {formatCurrency(order.total_amount)}
              </p>
            </div>

            <div className="rounded-3xl border border-[#E6D8C8] bg-[#F4EADF] p-4 print:rounded-none print:border-black print:bg-white">
              <p className="text-sm text-[#7A6A5D] print:text-black">
                Valor pago
              </p>
              <p className="mt-2 text-xl font-semibold text-[#2E2723] print:text-black">
                {formatCurrency(order.paid_amount)}
              </p>
            </div>

            <div className="rounded-3xl border border-[#E6D8C8] bg-[#F4EADF] p-4 print:rounded-none print:border-black print:bg-white">
              <p className="text-sm text-[#7A6A5D] print:text-black">
                Saldo
              </p>
              <p className="mt-2 text-xl font-semibold text-[#2E2723] print:text-black">
                {formatCurrency(balanceAmount)}
              </p>
            </div>
          </section>

          <section className="mt-10 grid gap-6 sm:grid-cols-2">
            <div>
              <p className="border-t border-[#2E2723] pt-3 text-center text-sm text-[#2E2723] print:text-black">
                Soph & Nick Atelier
              </p>
            </div>

            <div>
              <p className="border-t border-[#2E2723] pt-3 text-center text-sm text-[#2E2723] print:text-black">
                Cliente
              </p>
            </div>
          </section>

          <footer className="mt-8 border-t border-[#E6D8C8] pt-4 print:border-black">
            <p className="text-xs leading-6 text-[#7A6A5D] print:text-black">
              Observação: este recibo comprova o pagamento registrado no sistema
              Soph & Nick Gestão. Ele não substitui nota fiscal quando esta for
              exigida pela legislação aplicável.
            </p>
          </footer>
        </article>
      </section>
    </main>
  );
}