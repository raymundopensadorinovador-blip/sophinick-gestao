"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Customer = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
};

type CustomerDraft = {
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
};

const emptyDraft: CustomerDraft = {
  name: "",
  phone: "",
  email: "",
  address: "",
  notes: "",
};

function onlyNumbers(value: string) {
  return value.replace(/\D/g, "");
}

function whatsappLink(phone: string | null) {
  const numbers = onlyNumbers(phone || "");

  if (!numbers) return "";

  const withCountryCode = numbers.startsWith("55") ? numbers : `55${numbers}`;

  return `https://wa.me/${withCountryCode}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR").format(new Date(value));
}

export default function ClientesPage() {
  const router = useRouter();

  const [userId, setUserId] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [draft, setDraft] = useState<CustomerDraft>(emptyDraft);
const [editingCustomerId, setEditingCustomerId] = useState("");
const [search, setSearch] = useState("");
const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const filteredCustomers = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return customers;

    return customers.filter((customer) => {
      const text = [
        customer.name,
        customer.phone,
        customer.email,
        customer.address,
        customer.notes,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return text.includes(term);
    });
  }, [customers, search]);

  useEffect(() => {
    async function loadPage() {
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        router.push("/login");
        return;
      }

      setUserId(data.user.id);
      await loadCustomers(data.user.id);
      setLoading(false);
    }

    loadPage();
  }, [router]);

  async function loadCustomers(currentUserId = userId) {
    if (!currentUserId) return;

    const { data, error: loadError } = await supabase
      .from("customers")
      .select("id, name, phone, email, address, notes, created_at")
      .eq("user_id", currentUserId)
      .order("created_at", { ascending: false });

    if (loadError) {
      setError("Não foi possível carregar os clientes.");
      return;
    }

    setCustomers((data || []) as Customer[]);
  }

  async function saveCustomer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
  
    if (!userId) return;
  
    setError("");
    setMessage("");
  
    if (!draft.name.trim()) {
      setError("Informe o nome da cliente.");
      return;
    }
  
    setSaving(true);
  
    if (editingCustomerId) {
      const { error: updateError } = await supabase
        .from("customers")
        .update({
          name: draft.name.trim(),
          phone: draft.phone.trim() || null,
          email: draft.email.trim() || null,
          address: draft.address.trim() || null,
          notes: draft.notes.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingCustomerId)
        .eq("user_id", userId);
  
      if (updateError) {
        setError("Não foi possível atualizar a cliente.");
        setSaving(false);
        return;
      }
  
      setDraft(emptyDraft);
      setEditingCustomerId("");
      await loadCustomers(userId);
      setMessage("Cliente atualizada com sucesso.");
      setSaving(false);
      return;
    }
  
    const { error: insertError } = await supabase.from("customers").insert({
      user_id: userId,
      name: draft.name.trim(),
      phone: draft.phone.trim() || null,
      email: draft.email.trim() || null,
      address: draft.address.trim() || null,
      notes: draft.notes.trim() || null,
    });
  
    if (insertError) {
      setError("Não foi possível cadastrar a cliente.");
      setSaving(false);
      return;
    }
  
    setDraft(emptyDraft);
    await loadCustomers(userId);
    setMessage("Cliente cadastrada com sucesso.");
    setSaving(false);
  } 
  function startEditCustomer(customer: Customer) {
    setError("");
    setMessage("");
  
    setEditingCustomerId(customer.id);
  
    setDraft({
      name: customer.name || "",
      phone: customer.phone || "",
      email: customer.email || "",
      address: customer.address || "",
      notes: customer.notes || "",
    });
  
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }
  
  function cancelEditCustomer() {
    setEditingCustomerId("");
    setDraft(emptyDraft);
    setError("");
    setMessage("");
  }
  async function deleteCustomer(customerId: string) {
    const confirmed = window.confirm(
      "Tem certeza que deseja excluir esta cliente? Os pedidos vinculados não serão apagados, mas podem ficar sem cliente associada."
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    const { error: deleteError } = await supabase
      .from("customers")
      .delete()
      .eq("id", customerId)
      .eq("user_id", userId);

    if (deleteError) {
      setError("Não foi possível excluir a cliente.");
      return;
    }

    await loadCustomers(userId);
    setMessage("Cliente excluída com sucesso.");
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F4EADF] px-4 text-[#2E2723]">
        <div className="rounded-3xl border border-[#E6D8C8] bg-white px-6 py-5 text-sm text-[#7A6A5D] shadow-sm">
          Carregando clientes...
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
              Clientes
            </h1>

            <p className="mt-2 max-w-2xl break-words text-sm leading-7 text-[#7A6A5D] [overflow-wrap:anywhere]">
              Cadastre clientes do ateliê para vincular pedidos, medidas,
              pagamentos, mensagens e indicações.
            </p>
          </div>

          <a
            href="/dashboard"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-[#D8C7B1] bg-white px-5 text-sm font-medium text-[#7A4A4F] shadow-sm transition hover:bg-[#FFFDFC] sm:w-auto"
          >
            Voltar ao painel
          </a>
        </header>

        <section className="grid gap-4 py-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="min-w-0 rounded-[2rem] border border-[#E6D8C8] bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.25em] text-[#9B5C5F]">
              Cadastro
            </p>

            <h2 className="mt-3 text-2xl font-semibold text-[#2E2723]">
  {editingCustomerId ? "Editar cliente" : "Nova cliente"}
</h2>  

            <form onSubmit={saveCustomer} className="mt-5 space-y-4">
              <div>
                <label className="text-sm font-medium text-[#2E2723]">
                  Nome da cliente
                </label>
                <input
                  value={draft.name}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Ex: Maria Oliveira"
                  className="mt-2 min-h-12 w-full rounded-2xl border border-[#E6D8C8] bg-[#FFFDFC] px-4 text-sm outline-none transition placeholder:text-[#B09B8A] focus:border-[#9B5C5F]"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-[#2E2723]">
                  WhatsApp / telefone
                </label>
                <input
                  value={draft.phone}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      phone: event.target.value,
                    }))
                  }
                  placeholder="Ex: 11999998888"
                  inputMode="tel"
                  className="mt-2 min-h-12 w-full rounded-2xl border border-[#E6D8C8] bg-[#FFFDFC] px-4 text-sm outline-none transition placeholder:text-[#B09B8A] focus:border-[#9B5C5F]"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-[#2E2723]">
                  E-mail
                </label>
                <input
                  type="email"
                  value={draft.email}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                  placeholder="cliente@email.com"
                  className="mt-2 min-h-12 w-full rounded-2xl border border-[#E6D8C8] bg-[#FFFDFC] px-4 text-sm outline-none transition placeholder:text-[#B09B8A] focus:border-[#9B5C5F]"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-[#2E2723]">
                  Endereço
                </label>
                <input
                  value={draft.address}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      address: event.target.value,
                    }))
                  }
                  placeholder="Endereço, bairro ou referência"
                  className="mt-2 min-h-12 w-full rounded-2xl border border-[#E6D8C8] bg-[#FFFDFC] px-4 text-sm outline-none transition placeholder:text-[#B09B8A] focus:border-[#9B5C5F]"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-[#2E2723]">
                  Observações
                </label>
                <textarea
                  value={draft.notes}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                  placeholder="Preferências, informações importantes ou detalhes do atendimento."
                  className="mt-2 min-h-28 w-full resize-none rounded-2xl border border-[#E6D8C8] bg-[#FFFDFC] px-4 py-3 text-sm leading-6 outline-none transition placeholder:text-[#B09B8A] focus:border-[#9B5C5F]"
                />
              </div>

              {error ? (
                <div className="rounded-2xl border border-[#E8C7C0] bg-red-50 px-4 py-3 text-sm leading-6 text-[#9A4A3F]">
                  {error}
                </div>
              ) : null}

              {message ? (
                <div className="rounded-2xl border border-[#D8C7B1] bg-[#F4EADF] px-4 py-3 text-sm leading-6 text-[#5F564C]">
                  {message}
                </div>
              ) : null}

<div className="flex flex-col gap-3 sm:flex-row">
  <button
    type="submit"
    disabled={saving}
    className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#7D3F46] px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-[#6B343B] disabled:cursor-not-allowed disabled:opacity-70"
  >
    {saving
      ? "Salvando..."
      : editingCustomerId
        ? "Salvar alterações"
        : "Cadastrar cliente"}
  </button>

  {editingCustomerId ? (
    <button
      type="button"
      onClick={cancelEditCustomer}
      disabled={saving}
      className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-[#D8C7B1] bg-[#F4EADF] px-6 py-3 text-sm font-medium text-[#7A4A4F] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
    >
      Cancelar edição
    </button>
  ) : null}
</div> 
            </form>
          </div>

          <div className="min-w-0 rounded-[2rem] border border-[#E6D8C8] bg-white p-5 shadow-sm">
            <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.25em] text-[#9B5C5F]">
                  Lista
                </p>

                <h2 className="mt-3 text-2xl font-semibold text-[#2E2723]">
                  Clientes cadastradas
                </h2>

                <p className="mt-2 break-words text-sm leading-7 text-[#7A6A5D] [overflow-wrap:anywhere]">
                  Use a busca para encontrar cliente por nome, telefone, e-mail
                  ou observação.
                </p>
              </div>

              <div className="rounded-full border border-[#E6D8C8] bg-[#F4EADF] px-4 py-2 text-sm text-[#7A6A5D]">
                {customers.length} cliente(s)
              </div>
            </div>

            <div className="mt-5">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar cliente..."
                className="min-h-12 w-full rounded-2xl border border-[#E6D8C8] bg-[#FFFDFC] px-4 text-sm outline-none transition placeholder:text-[#B09B8A] focus:border-[#9B5C5F]"
              />
            </div>

            <div className="mt-5 max-h-[560px] space-y-3 overflow-y-auto pr-1">
              {filteredCustomers.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-[#D8C7B1] bg-[#F4EADF] p-5 text-sm leading-7 text-[#7A6A5D]">
                  Nenhuma cliente encontrada.
                </div>
              ) : (
                filteredCustomers.map((customer) => (
                  <article
                    key={customer.id}
                    className="min-w-0 rounded-3xl border border-[#E6D8C8] bg-[#FFFDFC] p-4"
                  >
                    <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="break-words text-lg font-semibold text-[#2E2723] [overflow-wrap:anywhere]">
                          {customer.name}
                        </p>

                        <div className="mt-3 space-y-1 text-sm leading-6 text-[#7A6A5D]">
                          {customer.phone ? (
                            <p className="break-words [overflow-wrap:anywhere]">
                              WhatsApp: {customer.phone}
                            </p>
                          ) : null}

                          {customer.email ? (
                            <p className="break-words [overflow-wrap:anywhere]">
                              E-mail: {customer.email}
                            </p>
                          ) : null}

                          {customer.address ? (
                            <p className="break-words [overflow-wrap:anywhere]">
                              Endereço: {customer.address}
                            </p>
                          ) : null}

                          <p>Cadastrada em {formatDate(customer.created_at)}</p>
                        </div>

                        {customer.notes ? (
                          <p className="mt-3 break-words rounded-2xl bg-[#F4EADF] p-3 text-sm leading-6 text-[#7A6A5D] [overflow-wrap:anywhere]">
                            {customer.notes}
                          </p>
                        ) : null}
                      </div>

                      <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                      <button
  type="button"
  onClick={() => startEditCustomer(customer)}
  className="inline-flex min-h-10 items-center justify-center rounded-full border border-[#D8C7B1] bg-white px-4 text-xs font-medium text-[#7A4A4F] transition hover:bg-[#F4EADF]"
>
  Editar
</button>
                       {customer.phone ? (
                          <a
                            href={whatsappLink(customer.phone)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex min-h-10 items-center justify-center rounded-full border border-[#D8C7B1] bg-white px-4 text-xs font-medium text-[#7A4A4F] transition hover:bg-[#F4EADF]"
                          >
                            WhatsApp
                          </a>
                        ) : null}

                        <button
                          type="button"
                          onClick={() => deleteCustomer(customer.id)}
                          className="inline-flex min-h-10 items-center justify-center rounded-full border border-[#E8C7C0] bg-red-50 px-4 text-xs font-medium text-[#9A4A3F] transition hover:bg-red-100"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}