"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

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

type ServiceDraft = {
  name: string;
  category: string;
  description: string;
  base_price: string;
  estimated_days: string;
  requires_fitting: boolean;
};

const initialServices = [
  {
    name: "Barra simples",
    category: "Ajustes",
    description: "Ajuste de comprimento com acabamento simples.",
    base_price: 25,
    estimated_days: 2,
    requires_fitting: false,
  },
  {
    name: "Barra original jeans",
    category: "Ajustes",
    description: "Ajuste de barra preservando o acabamento original da peça jeans.",
    base_price: 40,
    estimated_days: 3,
    requires_fitting: false,
  },
  {
    name: "Ajuste lateral",
    category: "Ajustes",
    description: "Ajuste nas laterais para melhorar o caimento da peça.",
    base_price: 45,
    estimated_days: 4,
    requires_fitting: true,
  },
  {
    name: "Ajuste de cintura",
    category: "Ajustes",
    description: "Ajuste na cintura de calça, saia, short ou peça semelhante.",
    base_price: 45,
    estimated_days: 4,
    requires_fitting: true,
  },
  {
    name: "Ajuste de manga",
    category: "Ajustes",
    description: "Ajuste no comprimento ou largura da manga.",
    base_price: 35,
    estimated_days: 3,
    requires_fitting: true,
  },
  {
    name: "Ajuste de ombro",
    category: "Ajustes",
    description: "Ajuste na região dos ombros para melhorar encaixe e caimento.",
    base_price: 55,
    estimated_days: 5,
    requires_fitting: true,
  },
  {
    name: "Ajuste de vestido",
    category: "Ajustes",
    description: "Ajuste geral em vestido, conforme estrutura e necessidade da peça.",
    base_price: 80,
    estimated_days: 5,
    requires_fitting: true,
  },
  {
    name: "Ajuste de blazer",
    category: "Ajustes",
    description: "Ajuste em blazer, paletó ou peça estruturada.",
    base_price: 90,
    estimated_days: 7,
    requires_fitting: true,
  },
  {
    name: "Troca de zíper comum",
    category: "Consertos",
    description: "Substituição de zíper comum com acabamento adequado à peça.",
    base_price: 45,
    estimated_days: 3,
    requires_fitting: false,
  },
  {
    name: "Troca de zíper invisível",
    category: "Consertos",
    description: "Substituição de zíper invisível em vestido, saia ou peça delicada.",
    base_price: 60,
    estimated_days: 4,
    requires_fitting: false,
  },
  {
    name: "Troca de zíper jeans",
    category: "Consertos",
    description: "Substituição de zíper em calça, bermuda ou peça jeans.",
    base_price: 55,
    estimated_days: 4,
    requires_fitting: false,
  },
  {
    name: "Troca de botão",
    category: "Consertos",
    description: "Aplicação ou substituição de botão.",
    base_price: 10,
    estimated_days: 1,
    requires_fitting: false,
  },
  {
    name: "Aplicação de colchete ou pressão",
    category: "Consertos",
    description: "Aplicação de colchete, botão de pressão ou fechamento simples.",
    base_price: 20,
    estimated_days: 2,
    requires_fitting: false,
  },
  {
    name: "Costura aberta",
    category: "Consertos",
    description: "Fechamento de costura descosturada ou aberta.",
    base_price: 25,
    estimated_days: 2,
    requires_fitting: false,
  },
  {
    name: "Remendo simples",
    category: "Consertos",
    description: "Reparo simples em rasgo, furo ou desgaste da peça.",
    base_price: 30,
    estimated_days: 3,
    requires_fitting: false,
  },
  {
    name: "Remendo reforçado",
    category: "Consertos",
    description: "Reparo com reforço em área de maior desgaste.",
    base_price: 45,
    estimated_days: 4,
    requires_fitting: false,
  },
  {
    name: "Ajuste de elástico",
    category: "Consertos",
    description: "Troca ou ajuste de elástico em cintura, punho ou barra.",
    base_price: 35,
    estimated_days: 3,
    requires_fitting: false,
  },
  {
    name: "Ajuste de alça",
    category: "Ajustes",
    description: "Encurtar, ajustar ou reforçar alças.",
    base_price: 30,
    estimated_days: 2,
    requires_fitting: true,
  },
  {
    name: "Reforma simples de peça",
    category: "Reformas",
    description: "Pequena reforma para melhorar uso, caimento ou acabamento.",
    base_price: 80,
    estimated_days: 7,
    requires_fitting: true,
  },
  {
    name: "Customização",
    category: "Reformas",
    description: "Alteração criativa na peça conforme combinado com a cliente.",
    base_price: 100,
    estimated_days: 10,
    requires_fitting: true,
  },
  {
    name: "Ajuste de roupa de festa",
    category: "Festa",
    description: "Ajuste em peça de festa, com cuidado especial no acabamento.",
    base_price: 120,
    estimated_days: 7,
    requires_fitting: true,
  },
  {
    name: "Vestido sob medida",
    category: "Criação autoral",
    description: "Criação e confecção de vestido sob medida conforme modelo combinado.",
    base_price: 300,
    estimated_days: 20,
    requires_fitting: true,
  },
  {
    name: "Saia sob medida",
    category: "Criação autoral",
    description: "Criação e confecção de saia sob medida.",
    base_price: 160,
    estimated_days: 12,
    requires_fitting: true,
  },
  {
    name: "Blusa sob medida",
    category: "Criação autoral",
    description: "Criação e confecção de blusa sob medida.",
    base_price: 150,
    estimated_days: 12,
    requires_fitting: true,
  },
  {
    name: "Conjunto sob medida",
    category: "Criação autoral",
    description: "Criação e confecção de conjunto sob medida.",
    base_price: 350,
    estimated_days: 20,
    requires_fitting: true,
  },
];

const emptyDraft: ServiceDraft = {
  name: "",
  category: "Ajustes",
  description: "",
  base_price: "",
  estimated_days: "",
  requires_fitting: false,
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value || 0);
}

export default function ServicosPage() {
  const router = useRouter();

  const [userId, setUserId] = useState("");
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [draft, setDraft] = useState<ServiceDraft>(emptyDraft);

  const categories = useMemo(() => {
    const values = new Set<string>();

    services.forEach((service) => values.add(service.category));
    initialServices.forEach((service) => values.add(service.category));

    return Array.from(values);
  }, [services]);

  useEffect(() => {
    async function loadPage() {
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        router.push("/login");
        return;
      }

      setUserId(data.user.id);
      await loadServices(data.user.id);
      setLoading(false);
    }

    loadPage();
  }, [router]);

  async function loadServices(currentUserId = userId) {
    if (!currentUserId) return;

    const { data, error: loadError } = await supabase
      .from("service_catalog")
      .select(
        "id, name, category, description, base_price, estimated_days, requires_fitting, is_active"
      )
      .eq("user_id", currentUserId)
      .order("category", { ascending: true })
      .order("name", { ascending: true });

    if (loadError) {
      setError("Não foi possível carregar os serviços.");
      return;
    }

    setServices((data || []) as ServiceItem[]);
  }

  async function seedInitialServices() {
    if (!userId) return;

    setError("");
    setMessage("");
    setSeeding(true);

    const existingNames = new Set(
      services.map((service) => service.name.trim().toLowerCase())
    );

    const servicesToInsert = initialServices
      .filter((service) => !existingNames.has(service.name.trim().toLowerCase()))
      .map((service) => ({
        user_id: userId,
        name: service.name,
        category: service.category,
        description: service.description,
        base_price: service.base_price,
        estimated_days: service.estimated_days,
        requires_fitting: service.requires_fitting,
        is_active: true,
      }));

    if (servicesToInsert.length === 0) {
      setMessage("A lista inicial já foi inserida.");
      setSeeding(false);
      return;
    }

    const { error: insertError } = await supabase
      .from("service_catalog")
      .insert(servicesToInsert);

    if (insertError) {
      setError("Não foi possível inserir a lista inicial de serviços.");
      setSeeding(false);
      return;
    }

    await loadServices(userId);

    setMessage("Lista inicial de serviços inserida com sucesso.");
    setSeeding(false);
  }

  async function createService(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!userId) return;

    setError("");
    setMessage("");

    if (!draft.name.trim()) {
      setError("Informe o nome do serviço.");
      return;
    }

    const price = Number(draft.base_price.replace(",", "."));

    if (Number.isNaN(price) || price < 0) {
      setError("Informe um preço válido.");
      return;
    }

    const days = draft.estimated_days
      ? Number(draft.estimated_days.replace(",", "."))
      : null;

    if (days !== null && (Number.isNaN(days) || days < 0)) {
      setError("Informe um prazo válido.");
      return;
    }

    setSaving(true);

    const { error: insertError } = await supabase.from("service_catalog").insert({
      user_id: userId,
      name: draft.name.trim(),
      category: draft.category.trim() || "Outros",
      description: draft.description.trim() || null,
      base_price: price,
      estimated_days: days,
      requires_fitting: draft.requires_fitting,
      is_active: true,
    });

    if (insertError) {
      setError("Não foi possível cadastrar o serviço.");
      setSaving(false);
      return;
    }

    setDraft(emptyDraft);
    await loadServices(userId);
    setMessage("Serviço cadastrado com sucesso.");
    setSaving(false);
  }

  async function toggleActive(service: ServiceItem) {
    const { error: updateError } = await supabase
      .from("service_catalog")
      .update({ is_active: !service.is_active })
      .eq("id", service.id)
      .eq("user_id", userId);

    if (updateError) {
      setError("Não foi possível atualizar o serviço.");
      return;
    }

    await loadServices(userId);
  }

  async function deleteService(serviceId: string) {
    const confirmed = window.confirm(
      "Tem certeza que deseja excluir este serviço da tabela?"
    );

    if (!confirmed) return;

    const { error: deleteError } = await supabase
      .from("service_catalog")
      .delete()
      .eq("id", serviceId)
      .eq("user_id", userId);

    if (deleteError) {
      setError("Não foi possível excluir o serviço.");
      return;
    }

    await loadServices(userId);
    setMessage("Serviço excluído com sucesso.");
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F4EADF] px-4 text-[#2E2723]">
        <div className="rounded-3xl border border-[#E6D8C8] bg-white px-6 py-5 text-sm text-[#7A6A5D] shadow-sm">
          Carregando tabela de serviços...
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
              Tabela de serviços
            </h1>

            <p className="mt-2 max-w-2xl break-words text-sm leading-7 text-[#7A6A5D] [overflow-wrap:anywhere]">
              Cadastre os serviços do ateliê com valores definidos por Nília.
              Esses preços serão puxados automaticamente nos pedidos.
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
              Cadastro rápido
            </p>

            <h2 className="mt-3 text-2xl font-semibold text-[#2E2723]">
              Novo serviço
            </h2>

            <form onSubmit={createService} className="mt-5 space-y-4">
              <div>
                <label className="text-sm font-medium text-[#2E2723]">
                  Nome do serviço
                </label>
                <input
                  value={draft.name}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Ex: Barra simples"
                  className="mt-2 min-h-12 w-full rounded-2xl border border-[#E6D8C8] bg-[#FFFDFC] px-4 text-sm outline-none transition placeholder:text-[#B09B8A] focus:border-[#9B5C5F]"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-[#2E2723]">
                  Categoria
                </label>
                <select
                  value={draft.category}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      category: event.target.value,
                    }))
                  }
                  className="mt-2 min-h-12 w-full rounded-2xl border border-[#E6D8C8] bg-[#FFFDFC] px-4 text-sm outline-none transition focus:border-[#9B5C5F]"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                  <option value="Outros">Outros</option>
                </select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-[#2E2723]">
                    Preço base
                  </label>
                  <input
                    value={draft.base_price}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        base_price: event.target.value,
                      }))
                    }
                    placeholder="Ex: 45"
                    inputMode="decimal"
                    className="mt-2 min-h-12 w-full rounded-2xl border border-[#E6D8C8] bg-[#FFFDFC] px-4 text-sm outline-none transition placeholder:text-[#B09B8A] focus:border-[#9B5C5F]"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-[#2E2723]">
                    Prazo médio em dias
                  </label>
                  <input
                    value={draft.estimated_days}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        estimated_days: event.target.value,
                      }))
                    }
                    placeholder="Ex: 3"
                    inputMode="numeric"
                    className="mt-2 min-h-12 w-full rounded-2xl border border-[#E6D8C8] bg-[#FFFDFC] px-4 text-sm outline-none transition placeholder:text-[#B09B8A] focus:border-[#9B5C5F]"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-[#2E2723]">
                  Descrição padrão
                </label>
                <textarea
                  value={draft.description}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  placeholder="Descreva o que está incluído neste serviço."
                  className="mt-2 min-h-28 w-full resize-none rounded-2xl border border-[#E6D8C8] bg-[#FFFDFC] px-4 py-3 text-sm leading-6 outline-none transition placeholder:text-[#B09B8A] focus:border-[#9B5C5F]"
                />
              </div>

              <label className="flex items-start gap-3 rounded-2xl border border-[#E6D8C8] bg-[#F4EADF] p-4 text-sm text-[#7A6A5D]">
                <input
                  type="checkbox"
                  checked={draft.requires_fitting}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      requires_fitting: event.target.checked,
                    }))
                  }
                  className="mt-1"
                />
                <span>
                  Este serviço geralmente exige prova ou ajuste presencial.
                </span>
              </label>

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

              <button
                type="submit"
                disabled={saving}
                className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#7D3F46] px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-[#6B343B] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saving ? "Salvando..." : "Cadastrar serviço"}
              </button>
            </form>
          </div>

          <div className="min-w-0 rounded-[2rem] border border-[#E6D8C8] bg-white p-5 shadow-sm">
            <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.25em] text-[#9B5C5F]">
                  Lista inicial
                </p>

                <h2 className="mt-3 text-2xl font-semibold text-[#2E2723]">
                  Serviços comuns
                </h2>

                <p className="mt-2 break-words text-sm leading-7 text-[#7A6A5D] [overflow-wrap:anywhere]">
                  Insira uma base pronta com ajustes, consertos, reformas e
                  criações autorais. Depois a Nília pode alterar valores e
                  prazos.
                </p>
              </div>

              <button
                type="button"
                onClick={seedInitialServices}
                disabled={seeding}
                className="inline-flex min-h-11 w-full shrink-0 items-center justify-center rounded-full border border-[#D8C7B1] bg-[#F4EADF] px-5 text-sm font-medium text-[#7A4A4F] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
              >
                {seeding ? "Inserindo..." : "Inserir lista inicial"}
              </button>
            </div>

            <div className="mt-5 max-h-[560px] space-y-3 overflow-y-auto pr-1">
              {services.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-[#D8C7B1] bg-[#F4EADF] p-5 text-sm leading-7 text-[#7A6A5D]">
                  Nenhum serviço cadastrado ainda. Insira a lista inicial para
                  começar com uma base pronta.
                </div>
              ) : (
                services.map((service) => (
                  <article
                    key={service.id}
                    className="min-w-0 rounded-3xl border border-[#E6D8C8] bg-[#FFFDFC] p-4"
                  >
                    <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full border border-[#E6D8C8] bg-[#F4EADF] px-3 py-1 text-xs text-[#7A6A5D]">
                            {service.category}
                          </span>

                          {!service.is_active ? (
                            <span className="rounded-full border border-[#E8C7C0] bg-red-50 px-3 py-1 text-xs text-[#9A4A3F]">
                              Inativo
                            </span>
                          ) : null}

                          {service.requires_fitting ? (
                            <span className="rounded-full border border-[#D8C7B1] bg-white px-3 py-1 text-xs text-[#7A4A4F]">
                              Exige prova
                            </span>
                          ) : null}
                        </div>

                        <h3 className="mt-3 break-words text-lg font-semibold text-[#2E2723] [overflow-wrap:anywhere]">
                          {service.name}
                        </h3>

                        {service.description ? (
                          <p className="mt-2 break-words text-sm leading-6 text-[#7A6A5D] [overflow-wrap:anywhere]">
                            {service.description}
                          </p>
                        ) : null}

                        <p className="mt-3 text-sm font-medium text-[#2E2723]">
                          {formatCurrency(Number(service.base_price))}
                          {service.estimated_days
                            ? ` · prazo médio: ${service.estimated_days} dia(s)`
                            : ""}
                        </p>
                      </div>

                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() => toggleActive(service)}
                          className="rounded-full border border-[#D8C7B1] bg-white px-3 py-2 text-xs font-medium text-[#7A4A4F] transition hover:bg-[#F4EADF]"
                        >
                          {service.is_active ? "Desativar" : "Ativar"}
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteService(service.id)}
                          className="rounded-full border border-[#E8C7C0] bg-red-50 px-3 py-2 text-xs font-medium text-[#9A4A3F] transition hover:bg-red-100"
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