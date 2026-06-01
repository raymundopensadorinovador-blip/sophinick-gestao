"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

const atelierWhatsapp = "5519988100184";
type Creation = {
  id: string;
  title: string;
  category: string | null;
  description: string | null;
  fabric: string | null;
  price: number | null;
  status: string;
  cover_image_url: string | null;
  is_public: boolean;
  can_show_on_instagram: boolean;
  collection_name: string | null;
  created_at: string;
};

const statusLabels: Record<string, string> = {
  portfolio: "Portfólio",
  disponivel: "Disponível",
  sob_encomenda: "Sob encomenda",
  vendida: "Vendida",
};

function statusLabel(status: string) {
  return statusLabels[status] || status;
}

function formatCurrency(value: number | null) {
  if (value === null || value === undefined) return "Valor sob consulta";

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value || 0);
}
function buildInterestMessage(creation: Creation) {
  const parts = [
    `Olá, Nília! Tenho interesse em uma peça da Maison Soph & Nick.`,
    "",
    `Peça: ${creation.title}`,
  ];

  if (creation.collection_name) {
    parts.push(`Coleção: ${creation.collection_name}`);
  }

  if (creation.category) {
    parts.push(`Categoria: ${creation.category}`);
  }

  parts.push(`Status: ${statusLabel(creation.status)}`);
  parts.push(`Valor: ${formatCurrency(creation.price)}`);

  parts.push(
    "",
    "Gostaria de saber mais detalhes sobre essa criação."
  );

  return parts.join("\n");
}

function whatsappInterestLink(creation: Creation) {
  return `https://wa.me/${atelierWhatsapp}?text=${encodeURIComponent(
    buildInterestMessage(creation)
  )}`;
}
function normalizeCollectionName(value: string | null) {
  const name = value?.trim();

  if (!name) return "Sem coleção";

  return name;
}

export default function MaisonPage() {
  const [creations, setCreations] = useState<Creation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const featuredCreation = useMemo(() => {
    return creations[0] || null;
  }, [creations]);

  const collections = useMemo(() => {
    const grouped: Record<string, Creation[]> = {};

    creations.forEach((creation) => {
      const collectionName = normalizeCollectionName(creation.collection_name);

      grouped[collectionName] = grouped[collectionName] || [];
      grouped[collectionName].push(creation);
    });

    return Object.entries(grouped)
      .map(([name, items]) => ({
        name,
        items,
      }))
      .sort((a, b) => {
        if (a.name === "Sem coleção") return 1;
        if (b.name === "Sem coleção") return -1;

        return a.name.localeCompare(b.name);
      });
  }, [creations]);

  useEffect(() => {
    async function loadCreations() {
      setError("");

      const { data, error: loadError } = await supabase
        .from("atelier_creations")
        .select(
          "id, title, category, description, fabric, price, status, cover_image_url, is_public, can_show_on_instagram, collection_name, created_at"
        )
        .eq("is_public", true)
        .order("created_at", { ascending: false });

      if (loadError) {
        setError("Não foi possível carregar a Maison Soph & Nick.");
        setLoading(false);
        return;
      }

      setCreations((data || []) as Creation[]);
      setLoading(false);
    }

    loadCreations();
  }, []);

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-[#F4EADF] text-[#2E2723]">
      <section className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-10">
        <header className="flex w-full min-w-0 flex-col gap-4 border-b border-[#E6D8C8] pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="break-words text-[11px] uppercase tracking-[0.28em] text-[#9B5C5F] [overflow-wrap:anywhere] sm:text-xs">
              Criações por Nília Diniz
            </p>

            <h1 className="mt-2 break-words text-3xl font-semibold tracking-tight text-[#2E2723] [overflow-wrap:anywhere] sm:text-4xl">
              Maison Soph & Nick
            </h1>

            <p className="mt-2 max-w-2xl break-words text-sm leading-7 text-[#7A6A5D] [overflow-wrap:anywhere]">
              Vitrine autoral com peças criadas, reformadas ou desenvolvidas sob
              encomenda no Soph & Nick Atelier.
            </p>
          </div>

          <a
            href="/"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-[#D8C7B1] bg-white px-5 text-sm font-medium text-[#7A4A4F] shadow-sm transition hover:bg-[#FFFDFC] sm:w-auto"
          >
            Voltar ao início
          </a>
        </header>

        {loading ? (
          <section className="mt-6 rounded-[2rem] border border-[#E6D8C8] bg-white p-5 text-sm text-[#7A6A5D] shadow-sm">
            Carregando criações da Maison...
          </section>
        ) : null}

        {error ? (
          <section className="mt-6 rounded-2xl border border-[#E8C7C0] bg-red-50 px-4 py-3 text-sm leading-6 text-[#9A4A3F]">
            {error}
          </section>
        ) : null}

        {!loading && creations.length === 0 ? (
          <section className="mt-6 rounded-[2rem] border border-dashed border-[#D8C7B1] bg-white p-6 shadow-sm">
            <p className="text-xs uppercase tracking-[0.25em] text-[#9B5C5F]">
              Vitrine em preparação
            </p>

            <h2 className="mt-3 text-2xl font-semibold text-[#2E2723]">
              Nenhuma criação publicada ainda
            </h2>

            <p className="mt-3 text-sm leading-7 text-[#7A6A5D]">
              As peças cadastradas por Nília Diniz aparecerão aqui quando forem
              marcadas para exibição na Maison Soph & Nick.
            </p>
          </section>
        ) : null}

        {featuredCreation ? (
          <section className="grid gap-8 py-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div className="min-w-0 space-y-5">
              <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-[#E6D8C8] bg-white/80 px-4 py-2 text-sm text-[#7A6A5D] shadow-sm">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-[#C8A96A] text-xs text-[#9B5C5F]">
                  ✦
                </span>
                <span className="break-words [overflow-wrap:anywhere]">
                  Vitrine autoral do ateliê
                </span>
              </div>

              <h2 className="break-words text-4xl font-semibold leading-tight tracking-tight text-[#2E2723] [overflow-wrap:anywhere] sm:text-5xl">
                Roupas criadas com identidade, cuidado e acabamento artesanal.
              </h2>

              <p className="max-w-2xl break-words text-base leading-8 text-[#7A6A5D] [overflow-wrap:anywhere]">
                A Maison Soph & Nick reúne criações autorais, peças sob
                encomenda, reformas criativas e trabalhos especiais feitos por
                Nília Diniz.
              </p>
            </div>

            <div className="min-w-0 rounded-[2rem] border border-[#E6D8C8] bg-white p-5 shadow-xl">
              <div className="overflow-hidden rounded-[1.5rem] border border-[#E6D8C8] bg-[#F4EADF]">
                {featuredCreation.cover_image_url ? (
                  <img
                    src={featuredCreation.cover_image_url}
                    alt={featuredCreation.title}
                    className="h-72 w-full object-contain"
                  />
                ) : (
                  <div className="grid h-72 place-items-center text-sm text-[#7A6A5D]">
                    Sem foto de capa
                  </div>
                )}
              </div>

              <div className="mt-5">
                <p className="text-sm uppercase tracking-[0.25em] text-[#9B5C5F]">
                  Destaque
                </p>

                <h3 className="mt-2 break-words text-2xl font-semibold text-[#2E2723] [overflow-wrap:anywhere]">
                  {featuredCreation.title}
                </h3>

                <p className="mt-2 text-sm leading-7 text-[#7A6A5D]">
                  {featuredCreation.description ||
                    "Criação autoral assinada por Nília Diniz."}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full border border-[#E6D8C8] bg-[#F4EADF] px-3 py-1 text-xs text-[#7A6A5D]">
                    {statusLabel(featuredCreation.status)}
                  </span>

                  {featuredCreation.collection_name ? (
                    <span className="rounded-full border border-[#D8C7B1] bg-white px-3 py-1 text-xs text-[#7A4A4F]">
                      {featuredCreation.collection_name}
                    </span>
                  ) : null}

                  <span className="rounded-full border border-[#E6D8C8] bg-[#F4EADF] px-3 py-1 text-xs text-[#7A6A5D]">
                    {formatCurrency(featuredCreation.price)}
                  </span>
                  
                </div>
                <div className="mt-5 flex flex-col gap-2 sm:flex-row">
  <a
    href={whatsappInterestLink(featuredCreation)}
    target="_blank"
    rel="noreferrer"
    className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#7D3F46] px-5 text-sm font-medium text-white shadow-sm transition hover:bg-[#6B343B] sm:w-auto"
  >
    Tenho interesse
  </a>

  <Link
    href={`/maison/criacao/${featuredCreation.id}`}
    className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-[#D8C7B1] bg-white px-5 text-sm font-medium text-[#7A6A5D] shadow-sm transition hover:bg-[#F4EADF] sm:w-auto"
  >
    Ver detalhes
  </Link>
</div>
              </div>
            </div>
            
          </section>
        ) : null}

        {collections.length > 0 ? (
          <section className="space-y-6 pb-10">
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.25em] text-[#9B5C5F]">
                  Coleções
                </p>

                <h2 className="mt-3 break-words text-3xl font-semibold text-[#2E2723] [overflow-wrap:anywhere]">
                  Peças por coleção
                </h2>
              </div>

              <div className="rounded-full border border-[#E6D8C8] bg-white px-4 py-2 text-sm text-[#7A6A5D] shadow-sm">
                {creations.length} peça(s)
              </div>
            </div>

            {collections.map((collection) => (
              <section
                key={collection.name}
                className="rounded-[2rem] border border-[#E6D8C8] bg-white p-5 shadow-sm"
              >
                <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[0.25em] text-[#9B5C5F]">
                      {collection.name === "Sem coleção"
                        ? "Peças avulsas"
                        : "Coleção"}
                    </p>

                    <h3 className="mt-2 break-words text-2xl font-semibold text-[#2E2723] [overflow-wrap:anywhere]">
                      {collection.name}
                    </h3>
                  </div>

                  <div className="rounded-full border border-[#E6D8C8] bg-[#F4EADF] px-4 py-2 text-sm text-[#7A6A5D]">
                    {collection.items.length} peça(s)
                  </div>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {collection.items.map((creation) => (
                    <article
                      key={creation.id}
                      className="min-w-0 overflow-hidden rounded-3xl border border-[#E6D8C8] bg-[#FFFDFC] shadow-sm"
                    >
                      <div className="bg-[#F4EADF]">
                        {creation.cover_image_url ? (
                          <img
                            src={creation.cover_image_url}
                            alt={creation.title}
                            className="h-64 w-full object-contain"
                          />
                        ) : (
                          <div className="grid h-64 place-items-center text-sm text-[#7A6A5D]">
                            Sem foto de capa
                          </div>
                        )}
                      </div>

                      <div className="p-4">
                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full border border-[#E6D8C8] bg-[#F4EADF] px-3 py-1 text-xs text-[#7A6A5D]">
                            {statusLabel(creation.status)}
                          </span>

                          {creation.category ? (
                            <span className="rounded-full border border-[#D8C7B1] bg-white px-3 py-1 text-xs text-[#7A4A4F]">
                              {creation.category}
                            </span>
                          ) : null}
                        </div>

                        <h4 className="mt-3 break-words text-xl font-semibold text-[#2E2723] [overflow-wrap:anywhere]">
                          {creation.title}
                        </h4>

                        <div className="mt-2 space-y-1 text-sm leading-6 text-[#7A6A5D]">
                          {creation.fabric ? (
                            <p>Tecido: {creation.fabric}</p>
                          ) : null}

                          <p>{formatCurrency(creation.price)}</p>
                        </div>

                        {creation.description ? (
                          <p className="mt-3 break-words rounded-2xl bg-[#F4EADF] p-3 text-sm leading-6 text-[#7A6A5D] [overflow-wrap:anywhere]">
                            {creation.description}
                          </p>
                        ) : null}
                        <div className="mt-4 flex flex-col gap-2">
  <a
    href={whatsappInterestLink(creation)}
    target="_blank"
    rel="noreferrer"
    className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[#7D3F46] px-5 text-sm font-medium text-white shadow-sm transition hover:bg-[#6B343B]"
  >
    Tenho interesse
  </a>

  <Link
    href={`/maison/criacao/${creation.id}`}
    className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-[#D8C7B1] bg-white px-5 text-sm font-medium text-[#7A6A5D] shadow-sm transition hover:bg-[#F4EADF]"
  >
    Ver detalhes
  </Link>
</div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </section>
        ) : null}
      </section>
    </main>
  );
}