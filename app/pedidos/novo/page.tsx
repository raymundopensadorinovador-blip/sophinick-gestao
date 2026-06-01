"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Customer = {
  id: string;
  name: string;
  phone: string | null;
};

type ServiceItem = {
  id: string;
  name: string;
  category: string;
  description: string | null;
  base_price: number;
  estimated_days: number | null;
  requires_fitting: boolean;
  is_active: boolean;
};

type OrderItemDraft = {
  local_id: string;
  service_id: string;
  order_type: string;
  clothing_type: string;
  service_name: string;
  service_description: string;
  manual_service: boolean;
  price: string;
  due_date: string;
  fitting_date: string;
  damage_notes: string;
  client_notes: string;
  internal_notes: string;
};

type ServiceOrderDraft = {
  customer_id: string;
  entry_date: string;
  due_date: string;
  deposit_amount: string;
  paid_amount: string;
  general_notes: string;
  client_notes: string;
  internal_notes: string;
};

const clothingTypes = [
  "Calça",
  "Vestido",
  "Saia",
  "Blusa",
  "Camisa",
  "Camiseta",
  "Short",
  "Bermuda",
  "Blazer",
  "Jaqueta",
  "Macacão",
  "Conjunto",
  "Roupa infantil",
  "Roupa de festa",
  "Uniforme",
  "Outra peça",
];

const emptyOrderDraft: ServiceOrderDraft = {
  customer_id: "",
  entry_date: new Date().toISOString().slice(0, 10),
  due_date: "",
  deposit_amount: "",
  paid_amount: "",
  general_notes: "",
  client_notes: "",
  internal_notes: "",
};

function createEmptyItem(): OrderItemDraft {
  return {
    local_id: crypto.randomUUID(),
    service_id: "",
    order_type: "servico",
    clothing_type: "",
    service_name: "",
    service_description: "",
    manual_service: false,
    price: "",
    due_date: "",
    fitting_date: "",
    damage_notes: "",
    client_notes: "",
    internal_notes: "",
  };
}

function parseMoney(value: string) {
  const normalized = value.replace(/\./g, "").replace(",", ".");
  const number = Number(normalized);

  if (Number.isNaN(number)) return 0;

  return number;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value || 0);
}

function getSuggestedDueDate(days: number | null) {
  if (!days || days <= 0) return "";

  const date = new Date();
  date.setDate(date.getDate() + days);

  return date.toISOString().slice(0, 10);
}

export default function NovoPedidoPage() {
  const router = useRouter();

  const [userId, setUserId] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [orderDraft, setOrderDraft] =
    useState<ServiceOrderDraft>(emptyOrderDraft);
  const [items, setItems] = useState<OrderItemDraft[]>([createEmptyItem()]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const selectedCustomer = useMemo(() => {
    return (
      customers.find((customer) => customer.id === orderDraft.customer_id) ||
      null
    );
  }, [customers, orderDraft.customer_id]);

  const totalAmount = useMemo(() => {
    return items.reduce((sum, item) => sum + parseMoney(item.price), 0);
  }, [items]);

  const depositAmount = parseMoney(orderDraft.deposit_amount);
  const paidAmount = parseMoney(orderDraft.paid_amount);
  const balanceAmount = totalAmount - paidAmount;

  useEffect(() => {
    async function loadPage() {
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        router.push("/login");
        return;
      }

      setUserId(data.user.id);

      await Promise.all([
        loadCustomers(data.user.id),
        loadServices(data.user.id),
      ]);

      setLoading(false);
    }

    loadPage();
  }, [router]);

  async function loadCustomers(currentUserId: string) {
    const { data, error: loadError } = await supabase
      .from("customers")
      .select("id, name, phone")
      .eq("user_id", currentUserId)
      .order("name", { ascending: true });

    if (loadError) {
      setError("Não foi possível carregar as clientes.");
      return;
    }

    setCustomers((data || []) as Customer[]);
  }

  async function loadServices(currentUserId: string) {
    const { data, error: loadError } = await supabase
      .from("service_catalog")
      .select(
        "id, name, category, description, base_price, estimated_days, requires_fitting, is_active"
      )
      .eq("user_id", currentUserId)
      .eq("is_active", true)
      .order("category", { ascending: true })
      .order("name", { ascending: true });

    if (loadError) {
      setError("Não foi possível carregar os serviços.");
      return;
    }

    setServices((data || []) as ServiceItem[]);
  }

  function updateItem(localId: string, updates: Partial<OrderItemDraft>) {
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.local_id === localId ? { ...item, ...updates } : item
      )
    );
  }

  function handleServiceChange(localId: string, serviceId: string) {
    if (serviceId === "manual") {
      updateItem(localId, {
        service_id: "",
        manual_service: true,
        service_name: "",
        service_description: "",
        price: "",
        due_date: "",
      });

      return;
    }

    const service = services.find((item) => item.id === serviceId);

    if (!service) {
      updateItem(localId, {
        service_id: "",
        manual_service: false,
        service_name: "",
        service_description: "",
        price: "",
        due_date: "",
      });

      return;
    }

    updateItem(localId, {
      service_id: service.id,
      manual_service: false,
      service_name: service.name,
      service_description: service.description || "",
      price: String(service.base_price || ""),
      due_date: getSuggestedDueDate(service.estimated_days),
    });
  }

  function addItem() {
    setItems((currentItems) => [...currentItems, createEmptyItem()]);
  }

  function removeItem(localId: string) {
    if (items.length === 1) {
      setError("O atendimento precisa ter pelo menos um item.");
      return;
    }

    setItems((currentItems) =>
      currentItems.filter((item) => item.local_id !== localId)
    );
  }

  function getGeneralDueDate() {
    if (orderDraft.due_date) return orderDraft.due_date;

    const itemDates = items
      .map((item) => item.due_date)
      .filter(Boolean)
      .sort();

    return itemDates[itemDates.length - 1] || null;
  }

  async function createServiceOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!userId) return;

    setError("");
    setMessage("");

    if (!orderDraft.customer_id) {
      setError("Selecione a cliente do atendimento.");
      return;
    }

    if (items.length === 0) {
      setError("Adicione pelo menos uma peça ou serviço.");
      return;
    }

    for (const item of items) {
      if (!item.clothing_type.trim()) {
        setError("Todos os itens precisam ter o tipo de peça informado.");
        return;
      }

      if (!item.service_name.trim()) {
        setError("Todos os itens precisam ter o serviço informado.");
        return;
      }

      if (parseMoney(item.price) < 0) {
        setError("Os valores dos itens não podem ser negativos.");
        return;
      }
    }

    if (depositAmount < 0 || paidAmount < 0) {
      setError("Sinal e valor pago não podem ser negativos.");
      return;
    }

    setSaving(true);

    const { data: createdOrder, error: orderError } = await supabase
      .from("service_orders")
      .insert({
        user_id: userId,
        customer_id: orderDraft.customer_id,
        status: "recebido",
        entry_date: orderDraft.entry_date || new Date().toISOString().slice(0, 10),
        due_date: getGeneralDueDate(),
        total_amount: totalAmount,
        deposit_amount: depositAmount,
        paid_amount: paidAmount,
        general_notes: orderDraft.general_notes.trim() || null,
        client_notes: orderDraft.client_notes.trim() || null,
        internal_notes: orderDraft.internal_notes.trim() || null,
      })
      .select("id")
      .single();

    if (orderError || !createdOrder) {
      setError("Não foi possível criar o atendimento.");
      setSaving(false);
      return;
    }

    const itemsToInsert = items.map((item) => ({
      user_id: userId,
      service_order_id: createdOrder.id,
      service_id: item.manual_service ? null : item.service_id || null,
      order_type: item.order_type,
      clothing_type: item.clothing_type.trim(),
      service_name: item.service_name.trim(),
      service_description: item.service_description.trim() || null,
      manual_service: item.manual_service,
      price: parseMoney(item.price),
      status: "recebido",
      due_date: item.due_date || null,
      fitting_date: item.fitting_date
        ? new Date(item.fitting_date).toISOString()
        : null,
      damage_notes: item.damage_notes.trim() || null,
      client_notes: item.client_notes.trim() || null,
      internal_notes: item.internal_notes.trim() || null,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(itemsToInsert);

    if (itemsError) {
      setError(
        "O atendimento foi criado, mas não foi possível salvar os itens. Avise antes de continuar."
      );
      setSaving(false);
      return;
    }

    setMessage("Atendimento criado com sucesso.");
    setOrderDraft(emptyOrderDraft);
    setItems([createEmptyItem()]);
    setSaving(false);

    setTimeout(() => {
      router.push("/dashboard");
    }, 900);
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F4EADF] px-4 text-[#2E2723]">
        <div className="rounded-3xl border border-[#E6D8C8] bg-white px-6 py-5 text-sm text-[#7A6A5D] shadow-sm">
          Preparando novo atendimento...
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
              Novo atendimento
            </h1>

            <p className="mt-2 max-w-2xl break-words text-sm leading-7 text-[#7A6A5D] [overflow-wrap:anywhere]">
              Registre uma cliente e adicione várias peças ou serviços no mesmo
              atendimento. O sistema soma tudo automaticamente.
            </p>
          </div>

          <a
            href="/dashboard"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-[#D8C7B1] bg-white px-5 text-sm font-medium text-[#7A4A4F] shadow-sm transition hover:bg-[#FFFDFC] sm:w-auto"
          >
            Voltar ao painel
          </a>
        </header>

        <form
          onSubmit={createServiceOrder}
          className="grid gap-4 py-6 lg:grid-cols-[1fr_0.75fr]"
        >
          <section className="min-w-0 space-y-4">
            <div className="rounded-[2rem] border border-[#E6D8C8] bg-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.25em] text-[#9B5C5F]">
                Atendimento
              </p>

              <h2 className="mt-3 text-2xl font-semibold text-[#2E2723]">
                Dados gerais
              </h2>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-[#2E2723]">
                    Cliente
                  </label>

                  <select
                    value={orderDraft.customer_id}
                    onChange={(event) =>
                      setOrderDraft((current) => ({
                        ...current,
                        customer_id: event.target.value,
                      }))
                    }
                    className="mt-2 min-h-12 w-full rounded-2xl border border-[#E6D8C8] bg-[#FFFDFC] px-4 text-sm outline-none transition focus:border-[#9B5C5F]"
                  >
                    <option value="">Selecione a cliente</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-[#2E2723]">
                    Data de entrada
                  </label>

                  <input
                    type="date"
                    value={orderDraft.entry_date}
                    onChange={(event) =>
                      setOrderDraft((current) => ({
                        ...current,
                        entry_date: event.target.value,
                      }))
                    }
                    className="mt-2 min-h-12 w-full rounded-2xl border border-[#E6D8C8] bg-[#FFFDFC] px-4 text-sm outline-none transition focus:border-[#9B5C5F]"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-[#2E2723]">
                    Prazo geral, se quiser definir
                  </label>

                  <input
                    type="date"
                    value={orderDraft.due_date}
                    onChange={(event) =>
                      setOrderDraft((current) => ({
                        ...current,
                        due_date: event.target.value,
                      }))
                    }
                    className="mt-2 min-h-12 w-full rounded-2xl border border-[#E6D8C8] bg-[#FFFDFC] px-4 text-sm outline-none transition focus:border-[#9B5C5F]"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-[#2E2723]">
                    Observação geral
                  </label>

                  <input
                    value={orderDraft.general_notes}
                    onChange={(event) =>
                      setOrderDraft((current) => ({
                        ...current,
                        general_notes: event.target.value,
                      }))
                    }
                    placeholder="Ex: cliente trouxe várias peças"
                    className="mt-2 min-h-12 w-full rounded-2xl border border-[#E6D8C8] bg-[#FFFDFC] px-4 text-sm outline-none transition placeholder:text-[#B09B8A] focus:border-[#9B5C5F]"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {items.map((item, index) => (
                <div
                  key={item.local_id}
                  className="rounded-[2rem] border border-[#E6D8C8] bg-white p-5 shadow-sm"
                >
                  <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-[0.25em] text-[#9B5C5F]">
                        Item {index + 1}
                      </p>

                      <h2 className="mt-3 text-2xl font-semibold text-[#2E2723]">
                        Peça ou serviço
                      </h2>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(item.local_id)}
                      className="inline-flex min-h-10 w-full items-center justify-center rounded-full border border-[#E8C7C0] bg-red-50 px-4 text-xs font-medium text-[#9A4A3F] transition hover:bg-red-100 sm:w-auto"
                    >
                      Remover item
                    </button>
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium text-[#2E2723]">
                        Tipo de pedido
                      </label>

                      <select
                        value={item.order_type}
                        onChange={(event) =>
                          updateItem(item.local_id, {
                            order_type: event.target.value,
                          })
                        }
                        className="mt-2 min-h-12 w-full rounded-2xl border border-[#E6D8C8] bg-[#FFFDFC] px-4 text-sm outline-none transition focus:border-[#9B5C5F]"
                      >
                        <option value="servico">Conserto / ajuste</option>
                        <option value="reforma">Reforma</option>
                        <option value="criacao">Criação autoral</option>
                        <option value="sob_medida">Sob medida</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-[#2E2723]">
                        Tipo de peça
                      </label>

                      <select
                        value={item.clothing_type}
                        onChange={(event) =>
                          updateItem(item.local_id, {
                            clothing_type: event.target.value,
                          })
                        }
                        className="mt-2 min-h-12 w-full rounded-2xl border border-[#E6D8C8] bg-[#FFFDFC] px-4 text-sm outline-none transition focus:border-[#9B5C5F]"
                      >
                        <option value="">Selecione a peça</option>
                        {clothingTypes.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-[#2E2723]">
                        Serviço
                      </label>

                      <select
                        value={item.manual_service ? "manual" : item.service_id}
                        onChange={(event) =>
                          handleServiceChange(item.local_id, event.target.value)
                        }
                        className="mt-2 min-h-12 w-full rounded-2xl border border-[#E6D8C8] bg-[#FFFDFC] px-4 text-sm outline-none transition focus:border-[#9B5C5F]"
                      >
                        <option value="">Selecione um serviço</option>
                        {services.map((service) => (
                          <option key={service.id} value={service.id}>
                            {service.category} · {service.name}
                          </option>
                        ))}
                        <option value="manual">
                          Serviço manual / fora da tabela
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-[#2E2723]">
                        Valor
                      </label>

                      <input
                        value={item.price}
                        onChange={(event) =>
                          updateItem(item.local_id, {
                            price: event.target.value,
                          })
                        }
                        inputMode="decimal"
                        placeholder="Ex: 45"
                        className="mt-2 min-h-12 w-full rounded-2xl border border-[#E6D8C8] bg-[#FFFDFC] px-4 text-sm outline-none transition placeholder:text-[#B09B8A] focus:border-[#9B5C5F]"
                      />
                    </div>
                  </div>

                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="text-sm font-medium text-[#2E2723]">
                        Nome do serviço
                      </label>

                      <input
                        value={item.service_name}
                        onChange={(event) =>
                          updateItem(item.local_id, {
                            service_name: event.target.value,
                          })
                        }
                        disabled={!item.manual_service && Boolean(item.service_id)}
                        placeholder="Ex: Barra simples"
                        className="mt-2 min-h-12 w-full rounded-2xl border border-[#E6D8C8] bg-[#FFFDFC] px-4 text-sm outline-none transition placeholder:text-[#B09B8A] focus:border-[#9B5C5F] disabled:cursor-not-allowed disabled:opacity-75"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-[#2E2723]">
                        Descrição do serviço
                      </label>

                      <textarea
                        value={item.service_description}
                        onChange={(event) =>
                          updateItem(item.local_id, {
                            service_description: event.target.value,
                          })
                        }
                        placeholder="Descreva o que será feito nessa peça."
                        className="mt-2 min-h-24 w-full resize-none rounded-2xl border border-[#E6D8C8] bg-[#FFFDFC] px-4 py-3 text-sm leading-6 outline-none transition placeholder:text-[#B09B8A] focus:border-[#9B5C5F]"
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="text-sm font-medium text-[#2E2723]">
                          Prazo deste item
                        </label>

                        <input
                          type="date"
                          value={item.due_date}
                          onChange={(event) =>
                            updateItem(item.local_id, {
                              due_date: event.target.value,
                            })
                          }
                          className="mt-2 min-h-12 w-full rounded-2xl border border-[#E6D8C8] bg-[#FFFDFC] px-4 text-sm outline-none transition focus:border-[#9B5C5F]"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium text-[#2E2723]">
                          Data da prova, se houver
                        </label>

                        <input
                          type="datetime-local"
                          value={item.fitting_date}
                          onChange={(event) =>
                            updateItem(item.local_id, {
                              fitting_date: event.target.value,
                            })
                          }
                          className="mt-2 min-h-12 w-full rounded-2xl border border-[#E6D8C8] bg-[#FFFDFC] px-4 text-sm outline-none transition focus:border-[#9B5C5F]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-[#2E2723]">
                        Avarias identificadas nesta peça
                      </label>

                      <textarea
                        value={item.damage_notes}
                        onChange={(event) =>
                          updateItem(item.local_id, {
                            damage_notes: event.target.value,
                          })
                        }
                        placeholder="Ex: mancha na lateral, zíper danificado, costura aberta..."
                        className="mt-2 min-h-24 w-full resize-none rounded-2xl border border-[#E6D8C8] bg-[#FFFDFC] px-4 py-3 text-sm leading-6 outline-none transition placeholder:text-[#B09B8A] focus:border-[#9B5C5F]"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-[#2E2723]">
                        Observação deste item para cliente
                      </label>

                      <textarea
                        value={item.client_notes}
                        onChange={(event) =>
                          updateItem(item.local_id, {
                            client_notes: event.target.value,
                          })
                        }
                        placeholder="Informação que poderá aparecer na mensagem do atendimento."
                        className="mt-2 min-h-20 w-full resize-none rounded-2xl border border-[#E6D8C8] bg-[#FFFDFC] px-4 py-3 text-sm leading-6 outline-none transition placeholder:text-[#B09B8A] focus:border-[#9B5C5F]"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addItem}
              className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-[#D8C7B1] bg-white px-6 py-3 text-sm font-medium text-[#7A4A4F] shadow-sm transition hover:bg-[#FFFDFC]"
            >
              + Adicionar outra peça/serviço
            </button>

            <div className="rounded-[2rem] border border-[#E6D8C8] bg-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.25em] text-[#9B5C5F]">
                Pagamento
              </p>

              <h2 className="mt-3 text-2xl font-semibold text-[#2E2723]">
                Valores do atendimento
              </h2>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-[#2E2723]">
                    Sinal combinado
                  </label>

                  <input
                    value={orderDraft.deposit_amount}
                    onChange={(event) =>
                      setOrderDraft((current) => ({
                        ...current,
                        deposit_amount: event.target.value,
                      }))
                    }
                    inputMode="decimal"
                    placeholder="Ex: 50"
                    className="mt-2 min-h-12 w-full rounded-2xl border border-[#E6D8C8] bg-[#FFFDFC] px-4 text-sm outline-none transition placeholder:text-[#B09B8A] focus:border-[#9B5C5F]"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-[#2E2723]">
                    Valor já pago
                  </label>

                  <input
                    value={orderDraft.paid_amount}
                    onChange={(event) =>
                      setOrderDraft((current) => ({
                        ...current,
                        paid_amount: event.target.value,
                      }))
                    }
                    inputMode="decimal"
                    placeholder="Ex: 50"
                    className="mt-2 min-h-12 w-full rounded-2xl border border-[#E6D8C8] bg-[#FFFDFC] px-4 text-sm outline-none transition placeholder:text-[#B09B8A] focus:border-[#9B5C5F]"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="text-sm font-medium text-[#2E2723]">
                  Observação interna do atendimento
                </label>

                <textarea
                  value={orderDraft.internal_notes}
                  onChange={(event) =>
                    setOrderDraft((current) => ({
                      ...current,
                      internal_notes: event.target.value,
                    }))
                  }
                  placeholder="Anotação interna do ateliê."
                  className="mt-2 min-h-24 w-full resize-none rounded-2xl border border-[#E6D8C8] bg-[#FFFDFC] px-4 py-3 text-sm leading-6 outline-none transition placeholder:text-[#B09B8A] focus:border-[#9B5C5F]"
                />
              </div>
            </div>
          </section>

          <aside className="min-w-0 space-y-4">
            <div className="sticky top-4 rounded-[2rem] border border-[#E6D8C8] bg-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.25em] text-[#9B5C5F]">
                Resumo
              </p>

              <h2 className="mt-3 text-2xl font-semibold text-[#2E2723]">
                Conferência do atendimento
              </h2>

              <div className="mt-5 space-y-3 text-sm leading-6 text-[#7A6A5D]">
                <div className="rounded-3xl bg-[#F4EADF] p-4">
                  <p className="font-medium text-[#2E2723]">Cliente</p>
                  <p className="mt-1 break-words [overflow-wrap:anywhere]">
                    {selectedCustomer?.name || "Ainda não selecionada"}
                  </p>
                </div>

                <div className="rounded-3xl bg-[#F4EADF] p-4">
                  <p className="font-medium text-[#2E2723]">Itens</p>
                  <div className="mt-2 space-y-2">
                    {items.map((item, index) => (
                      <div
                        key={item.local_id}
                        className="rounded-2xl bg-white p-3"
                      >
                        <p className="break-words font-medium text-[#2E2723] [overflow-wrap:anywhere]">
                          {index + 1}. {item.clothing_type || "Peça"} ·{" "}
                          {item.service_name || "Serviço"}
                        </p>
                        <p className="mt-1 text-[#7A6A5D]">
                          {formatCurrency(parseMoney(item.price))}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl bg-[#F4EADF] p-4">
                  <p className="font-medium text-[#2E2723]">Total</p>
                  <p className="mt-1 text-2xl font-semibold text-[#2E2723]">
                    {formatCurrency(totalAmount)}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                  <div className="rounded-3xl bg-[#F4EADF] p-4">
                    <p className="font-medium text-[#2E2723]">Sinal</p>
                    <p className="mt-1">{formatCurrency(depositAmount)}</p>
                  </div>

                  <div className="rounded-3xl bg-[#F4EADF] p-4">
                    <p className="font-medium text-[#2E2723]">Pago</p>
                    <p className="mt-1">{formatCurrency(paidAmount)}</p>
                  </div>

                  <div className="rounded-3xl bg-[#F4EADF] p-4">
                    <p className="font-medium text-[#2E2723]">Saldo</p>
                    <p className="mt-1 text-lg font-semibold text-[#2E2723]">
                      {formatCurrency(balanceAmount)}
                    </p>
                  </div>
                </div>

                <div className="rounded-3xl bg-[#F4EADF] p-4">
                  <p className="font-medium text-[#2E2723]">Prazo geral</p>
                  <p className="mt-1">
                    {getGeneralDueDate() || "Ainda não informado"}
                  </p>
                </div>
              </div>

              {error ? (
                <div className="mt-5 rounded-2xl border border-[#E8C7C0] bg-red-50 px-4 py-3 text-sm leading-6 text-[#9A4A3F]">
                  {error}
                </div>
              ) : null}

              {message ? (
                <div className="mt-5 rounded-2xl border border-[#D8C7B1] bg-[#F4EADF] px-4 py-3 text-sm leading-6 text-[#5F564C]">
                  {message}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={saving}
                className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#7D3F46] px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-[#6B343B] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saving ? "Salvando atendimento..." : "Criar atendimento"}
              </button>
            </div>
          </aside>
        </form>
      </section>
    </main>
  );
}