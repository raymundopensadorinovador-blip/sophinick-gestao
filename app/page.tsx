"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

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
  collection_name: string | null;
  created_at: string;
};

function normalizeCollectionName(value: string | null) {
  const name = value?.trim();

  if (!name) return "Peças autorais";

  return name;
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    portfolio: "Portfólio",
    disponivel: "Disponível",
    sob_encomenda: "Sob encomenda",
    vendida: "Vendida",
  };

  return labels[status] || status;
}

export default function Home() {
  const [creations, setCreations] = useState<Creation[]>([]);

  useEffect(() => {
    async function loadPublicCreations() {
      const { data, error } = await supabase
        .from("atelier_creations")
        .select(
          "id, title, category, description, fabric, price, status, cover_image_url, is_public, collection_name, created_at"
        )
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .limit(6);

      if (error) {
        console.error("ERRO AO CARREGAR CRIAÇÕES DA ENTRADA:", error);
        return;
      }

      setCreations((data || []) as Creation[]);
    }

    loadPublicCreations();
  }, []);

  const collections = useMemo(() => {
    const grouped: Record<string, Creation[]> = {};

    creations.forEach((creation) => {
      const collectionName = normalizeCollectionName(creation.collection_name);

      grouped[collectionName] = grouped[collectionName] || [];
      grouped[collectionName].push(creation);
    });

    return Object.entries(grouped).map(([name, items]) => ({
      name,
      items,
    }));
  }, [creations]);

  const featuredCollection = collections[0] || null;
  const featuredCreation = featuredCollection?.items[0] || creations[0] || null;

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-[#F4EADF] text-[#2E2723]">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-5 sm:px-6 lg:px-10">
      <header className="flex w-full min-w-0 flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
  <div className="flex min-w-0 items-center gap-4 sm:gap-5">
    <img
      src="/logo-sophinick.png"
      alt="Soph & Nick"
      className="h-24 w-auto shrink-0 object-contain sm:h-28 lg:h-32"
    />

<div className="min-w-0 leading-tight">
    <p className="mb-1 break-words text-sm uppercase leading-tight tracking-[0.22em] text-[#9B5C5F] [overflow-wrap:anywhere] sm:text-base sm:tracking-[0.28em]">
  Soph & Nick Atelier
</p>  

      <h1 className="break-words text-3xl font-semibold leading-none tracking-tight text-[#2E2723] [overflow-wrap:anywhere] sm:text-4xl lg:text-5xl">
  Soph & Nick
</h1>

<p className="mt-0.5 break-words text-sm font-medium leading-tight text-[#7A6A5D] [overflow-wrap:anywhere] sm:text-base">
  Gestão do ateliê
</p> 
    </div>
  </div>

  <div className="w-fit max-w-full rounded-full border border-[#E6D8C8] bg-white/80 px-4 py-2 text-sm text-[#7A6A5D] shadow-sm">
    Criações por Nília Diniz
  </div>
</header> 

        <div className="grid w-full flex-1 items-center gap-8 py-8 sm:py-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10">
        <section className="w-full min-w-0 space-y-5 sm:space-y-6">


            <div className="min-w-0 space-y-4 sm:space-y-5">
            <h2 className="max-w-2xl break-words text-3xl font-semibold leading-tight tracking-tight text-[#2E2723] [overflow-wrap:anywhere] sm:text-4xl lg:text-5xl">
  Cada detalhe importa.
</h2> 

              <p className="max-w-2xl break-words text-base leading-7 text-[#7A6A5D] [overflow-wrap:anywhere] sm:text-lg sm:leading-8">
                Um painel privado para organizar clientes, atendimentos, fotos
                de entrada, avarias, valores, prazos, pagamentos e criações
                autorais do Soph & Nick Atelier.
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row">
              <a
                href="/login"
                className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#7D3F46] px-6 py-3 text-center text-sm font-medium text-white shadow-sm transition hover:bg-[#6B343B] sm:w-auto"
              >
                Entrar no ateliê
              </a>

              <a
                href="/maison"
                className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-[#D8C7B1] bg-white px-6 py-3 text-center text-sm font-medium text-[#7A4A4F] shadow-sm transition hover:bg-[#FFFDFC] sm:w-auto"
              >
                Ver Vitrine Soph & Nick
              </a>
            </div>

            <div className="grid w-full gap-3 pt-2 sm:grid-cols-3 sm:pt-4">
              <div className="min-w-0 rounded-3xl border border-[#E6D8C8] bg-white/80 p-4 shadow-sm">
                <p className="break-words text-sm font-semibold text-[#2E2723] [overflow-wrap:anywhere]">
                  Atendimentos com fotos
                </p>
                <p className="mt-2 break-words text-sm leading-6 text-[#7A6A5D] [overflow-wrap:anywhere]">
                  Registre entrada, avarias e evolução de cada peça.
                </p>
              </div>

              <div className="min-w-0 rounded-3xl border border-[#E6D8C8] bg-white/80 p-4 shadow-sm">
                <p className="break-words text-sm font-semibold text-[#2E2723] [overflow-wrap:anywhere]">
                  Preço automático
                </p>
                <p className="mt-2 break-words text-sm leading-6 text-[#7A6A5D] [overflow-wrap:anywhere]">
                  Serviços puxados da tabela definida por Nília.
                </p>
              </div>

              <div className="min-w-0 rounded-3xl border border-[#E6D8C8] bg-white/80 p-4 shadow-sm">
                <p className="break-words text-sm font-semibold text-[#2E2723] [overflow-wrap:anywhere]">
                  Vitrine autoral
                </p>
                <p className="mt-2 break-words text-sm leading-6 text-[#7A6A5D] [overflow-wrap:anywhere]">
                  Criações, coleções e detalhes reunidos em uma página pública.
                </p>
              </div>
            </div>
          </section>

          <section className="relative w-full min-w-0">
            <div className="absolute -left-4 -top-4 hidden h-28 w-28 rounded-full border border-[#E6D8C8] bg-[#F1E4D8] sm:block" />
            <div className="absolute -bottom-5 -right-4 hidden h-32 w-32 rounded-full border border-[#D8C7B1] bg-[#EFE0D3] sm:block" />

            <div className="relative w-full min-w-0 overflow-hidden rounded-[1.75rem] border border-[#E6D8C8] bg-[#FFFDFC] p-4 shadow-xl sm:rounded-[2rem] sm:p-5">
              <div className="min-w-0 rounded-[1.35rem] border border-dashed border-[#D8C7B1] bg-[#F4EADF] p-4 sm:rounded-[1.5rem] sm:p-5">
                <div className="flex min-w-0 items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="break-words text-[11px] uppercase tracking-[0.22em] text-[#9B5C5F] [overflow-wrap:anywhere] sm:text-xs sm:tracking-[0.28em]">
                      Vitrine Soph & Nick
                    </p>

                    <h3 className="mt-2 break-words text-2xl font-semibold text-[#2E2723] [overflow-wrap:anywhere]">
                      Destaque de coleções
                    </h3>
                  </div>

                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-[#C8A96A] bg-white text-[#9B5C5F] shadow-sm sm:h-14 sm:w-14">
                    ✺
                  </div>
                </div>

                <div className="mt-6 w-full min-w-0 space-y-4 sm:mt-8">
                  <div className="min-w-0 rounded-3xl bg-white p-4 shadow-sm">
                    <div className="overflow-hidden rounded-2xl border border-[#E6D8C8] bg-[#F4EADF]">
                      {featuredCreation?.cover_image_url ? (
                        <img
                          src={featuredCreation.cover_image_url}
                          alt={featuredCreation.title}
                          className="h-40 w-full object-contain sm:h-44"
                        />
                      ) : (
                        <div className="flex h-40 w-full items-center justify-center bg-gradient-to-br from-[#E8D8CB] via-[#F4EADF] to-[#C8A96A]/40 px-4 text-center text-sm text-[#7A6A5D] sm:h-44">
                          As coleções publicadas aparecerão aqui.
                        </div>
                      )}
                    </div>

                    <div className="mt-4 min-w-0">
                      <p className="break-words text-sm font-semibold text-[#2E2723] [overflow-wrap:anywhere]">
                        {featuredCollection?.name || "Criações Soph & Nick"}
                      </p>

                      <p className="mt-1 break-words text-sm text-[#7A6A5D] [overflow-wrap:anywhere]">
                        {featuredCreation
                          ? `${featuredCreation.title} · ${statusLabel(
                              featuredCreation.status
                            )}`
                          : "Peças autorais por Nília Diniz."}
                      </p>
                    </div>
                  </div>

                  <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="min-w-0 rounded-3xl border border-[#E6D8C8] bg-white p-4">
                      <p className="break-words text-[11px] uppercase tracking-[0.18em] text-[#9B5C5F] [overflow-wrap:anywhere] sm:text-xs sm:tracking-[0.2em]">
                        Coleções
                      </p>

                      <p className="mt-2 break-words text-sm font-medium text-[#2E2723] [overflow-wrap:anywhere]">
                        {collections.length > 0
                          ? `${collections.length} coleção(ões) publicada(s)`
                          : "Em preparação"}
                      </p>
                    </div>

                    <div className="min-w-0 rounded-3xl border border-[#E6D8C8] bg-white p-4">
                      <p className="break-words text-[11px] uppercase tracking-[0.18em] text-[#9B5C5F] [overflow-wrap:anywhere] sm:text-xs sm:tracking-[0.2em]">
                        Assinatura
                      </p>

                      <p className="mt-2 break-words text-sm font-medium text-[#2E2723] [overflow-wrap:anywhere]">
                        Nília Diniz
                      </p>
                    </div>
                  </div>

                  {collections.length > 0 ? (
                    <div className="grid gap-2">
                      {collections.slice(0, 3).map((collection) => (
                        <a
                          key={collection.name}
                          href="/maison"
                          className="flex min-w-0 items-center justify-between gap-3 rounded-2xl border border-[#E6D8C8] bg-white px-4 py-3 text-sm transition hover:bg-[#FFFDFC]"
                        >
                          <span className="min-w-0 break-words font-medium text-[#2E2723] [overflow-wrap:anywhere]">
                            {collection.name}
                          </span>

                          <span className="shrink-0 rounded-full border border-[#D8C7B1] bg-[#F4EADF] px-3 py-1 text-xs text-[#7A6A5D]">
                            {collection.items.length} peça(s)
                          </span>
                        </a>
                      ))}
                    </div>
                  ) : null}

                  <a
                    href="/maison"
                    className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[#7D3F46] px-5 text-sm font-medium text-white shadow-sm transition hover:bg-[#6B343B]"
                  >
                    Abrir vitrine
                  </a>
                </div>
              </div>
            </div>
          </section>
        </div>

        <footer className="border-t border-[#E6D8C8] py-5 text-center text-xs text-[#7A6A5D]">
          <span className="break-words [overflow-wrap:anywhere]">
            Soph & Nick Gestão · Costura, criação e cuidado em cada detalhe.
          </span>
        </footer>
      </section>
    </main>
  );
}