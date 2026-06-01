"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type AtelierCreation = {
  id: string;
  title: string | null;
  category: string | null;
  description: string | null;
  fabric_material: string | null;
  price: number | string | null;
  collection_name: string | null;
  status: string | null;
  is_public: boolean | null;
  cover_image_url?: string | null;
  image_url?: string | null;
  photo_url?: string | null;
  created_at?: string | null;
};

type CreationPhoto = {
    id: string;
    creation_id: string;
    photo_url: string;
    photo_type: string | null;
    caption: string | null;
    created_at: string;
  };

const atelierWhatsapp = "5519988100184";

function formatarValor(valor: number | string | null) {
  if (valor === null || valor === undefined || valor === "") {
    return "Valor sob consulta";
  }

  const numero = Number(valor);

  if (Number.isNaN(numero)) {
    return "Valor sob consulta";
  }

  return numero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarStatus(status: string | null) {
  const mapa: Record<string, string> = {
    portfolio: "Portfólio",
    disponivel: "Disponível",
    sob_encomenda: "Sob encomenda",
    vendida: "Vendida",
  };

  if (!status) return "Não informado";

  return mapa[status] || status;
}

function photoTypeLabel(value: string | null) {
    const labels: Record<string, string> = {
      frente: "Frente",
      costas: "Costas",
      detalhe: "Detalhe",
      acabamento: "Acabamento",
      tecido: "Tecido",
      prova: "Prova",
      outro: "Outro",
    };
  
    if (!value) return "Detalhe";
  
    return labels[value] || value;
  }

function montarMensagemInteresse(creation: AtelierCreation) {
  const titulo = creation.title || "Peça autoral";
  const colecao = creation.collection_name || "Sem coleção";
  const categoria = creation.category || "Não informada";
  const status = formatarStatus(creation.status);
  const valor = formatarValor(creation.price);

  return encodeURIComponent(
    `Olá! Tenho interesse nesta peça da Maison Soph & Nick.\n\n` +
      `Peça: ${titulo}\n` +
      `Coleção: ${colecao}\n` +
      `Categoria: ${categoria}\n` +
      `Status: ${status}\n` +
      `Valor: ${valor}\n\n` +
      `Gostaria de saber mais detalhes.`
  );
}

export default function MaisonCreationDetailPage() {
  const params = useParams();
  const idParam = params?.id;
  const creationId = Array.isArray(idParam) ? idParam[0] : idParam;

  const [creation, setCreation] = useState<AtelierCreation | null>(null);
  const [creationPhotos, setCreationPhotos] = useState<CreationPhoto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregarCriacao() {
      if (!creationId) {
        setErro("Peça não encontrada.");
        setCarregando(false);
        return;
      }

      setCarregando(true);
      setErro("");

      const { data, error } = await supabase
        .from("atelier_creations")
        .select("*")
        .eq("id", creationId)
        .eq("is_public", true)
        .single();

      if (error || !data) {
        setErro("Não foi possível encontrar esta peça na Maison.");
        setCreation(null);
        setCarregando(false);
        return;
      }

      setCreation(data as AtelierCreation);

      const { data: photosData, error: photosError } = await supabase
        .from("atelier_creation_photos")
        .select("id, creation_id, photo_url, photo_type, caption, created_at")
        .eq("creation_id", creationId)
        .order("created_at", { ascending: true });
      
      if (photosError) {
        console.error("ERRO AO CARREGAR FOTOS DA CRIAÇÃO:", photosError);
        setCreationPhotos([]);
      } else {
        setCreationPhotos((photosData || []) as CreationPhoto[]);
      }
      
      setCarregando(false); 
    }

    carregarCriacao();
  }, [creationId]);

  const fotoPrincipal = useMemo(() => {
    if (!creation) return "";
    return (
      creation.cover_image_url ||
      creation.image_url ||
      creation.photo_url ||
      ""
    );
  }, [creation]);

  const linkWhatsApp = useMemo(() => {
    if (!creation) return "#";

    return `https://wa.me/${atelierWhatsapp}?text=${montarMensagemInteresse(
      creation
    )}`;
  }, [creation]);

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-[#F4EADF] px-4 py-6 text-[#2E2723] sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="flex w-full flex-col gap-4 rounded-3xl border border-[#E6D8C8] bg-white/80 p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7D3F46]">
                Maison Soph & Nick
              </p>

              <h1 className="mt-2 break-words text-2xl font-semibold text-[#2E2723] sm:text-3xl">
                {creation?.title || "Detalhes da peça"}
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#7A6A5D]">
                Criação autoral por Nília Diniz, com detalhes pensados para
                apresentar a peça com clareza, elegância e cuidado.
              </p>
            </div>

            <Link
              href="/maison"
              className="inline-flex w-full items-center justify-center rounded-full border border-[#D8C7B1] bg-white px-4 py-2 text-sm font-medium text-[#7A6A5D] transition hover:bg-[#F4EADF] sm:w-auto"
            >
              Voltar para Maison
            </Link>
          </div>
        </header>

        {carregando ? (
          <section className="rounded-3xl border border-[#E6D8C8] bg-white p-6 text-sm text-[#7A6A5D] shadow-sm">
            Carregando detalhes da peça...
          </section>
        ) : erro ? (
          <section className="rounded-3xl border border-[#E8C7C0] bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-[#9A4A3F]">{erro}</p>

            <Link
              href="/maison"
              className="mt-4 inline-flex rounded-full bg-[#7D3F46] px-5 py-2 text-sm font-medium text-white transition hover:bg-[#6B343B]"
            >
              Voltar para Maison
            </Link>
          </section>
        ) : creation ? (
          <section className="grid w-full gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="min-w-0 rounded-3xl border border-[#E6D8C8] bg-white p-4 shadow-sm sm:p-5">
              <div className="flex min-h-[320px] w-full items-center justify-center overflow-hidden rounded-3xl bg-[#F4EADF] sm:min-h-[480px]">
                {fotoPrincipal ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={fotoPrincipal}
                    alt={creation.title || "Criação autoral Soph & Nick"}
                    className="h-full max-h-[680px] w-full object-contain"
                  />
                ) : (
                  <div className="flex min-h-[320px] w-full items-center justify-center px-6 text-center text-sm text-[#7A6A5D]">
                    Esta peça ainda não possui foto cadastrada.
                  </div>
                )}
              </div>
            </div>

            <div className="min-w-0 rounded-3xl border border-[#E6D8C8] bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-col gap-5">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7D3F46]">
                    Criação por Nília Diniz
                  </p>

                  <h2 className="mt-2 break-words text-2xl font-semibold text-[#2E2723]">
                    {creation.title || "Peça autoral"}
                  </h2>

                  {creation.description ? (
                    <p className="mt-3 whitespace-pre-line break-words text-sm leading-relaxed text-[#7A6A5D] [overflow-wrap:anywhere]">
                      {creation.description}
                    </p>
                  ) : (
                    <p className="mt-3 text-sm leading-relaxed text-[#7A6A5D]">
                      Esta criação ainda não possui descrição detalhada.
                    </p>
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-[#E6D8C8] bg-[#F4EADF] p-4">
                    <p className="text-xs font-medium text-[#7A6A5D]">
                      Categoria
                    </p>
                    <p className="mt-1 break-words text-sm font-semibold text-[#2E2723]">
                      {creation.category || "Não informada"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[#E6D8C8] bg-[#F4EADF] p-4">
                    <p className="text-xs font-medium text-[#7A6A5D]">
                      Coleção
                    </p>
                    <p className="mt-1 break-words text-sm font-semibold text-[#2E2723]">
                      {creation.collection_name || "Sem coleção"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[#E6D8C8] bg-[#F4EADF] p-4">
                    <p className="text-xs font-medium text-[#7A6A5D]">
                      Tecido / material
                    </p>
                    <p className="mt-1 break-words text-sm font-semibold text-[#2E2723]">
                      {creation.fabric_material || "Não informado"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[#E6D8C8] bg-[#F4EADF] p-4">
                    <p className="text-xs font-medium text-[#7A6A5D]">
                      Status
                    </p>
                    <p className="mt-1 break-words text-sm font-semibold text-[#2E2723]">
                      {formatarStatus(creation.status)}
                    </p>
                  </div>
                </div>

                <div className="rounded-3xl border border-[#D8C7B1] bg-[#FFF8F0] p-5">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#7D3F46]">
                    Valor
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-[#2E2723]">
                    {formatarValor(creation.price)}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-[#7A6A5D]">
                    Valores, ajustes e disponibilidade podem ser confirmados
                    diretamente com o ateliê.
                  </p>
                </div>
                {creationPhotos.length > 0 ? (
  <div className="rounded-3xl border border-[#E6D8C8] bg-[#F4EADF] p-4">
    <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7D3F46]">
          Galeria da peça
        </p>

        <h3 className="mt-2 break-words text-lg font-semibold text-[#2E2723]">
          Detalhes da criação
        </h3>
      </div>

      <span className="rounded-full border border-[#D8C7B1] bg-white px-3 py-1 text-xs text-[#7A6A5D]">
        {creationPhotos.length} foto(s)
      </span>
    </div>

    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      {creationPhotos.map((photo) => (
        <div
          key={photo.id}
          className="overflow-hidden rounded-3xl border border-[#E6D8C8] bg-white"
        >
          <img
            src={photo.photo_url}
            alt={photo.caption || photoTypeLabel(photo.photo_type)}
            className="h-56 w-full bg-[#F4EADF] object-contain"
          />

          <div className="p-3">
            <span className="inline-flex rounded-full border border-[#E6D8C8] bg-[#F4EADF] px-3 py-1 text-xs text-[#7A6A5D]">
              {photoTypeLabel(photo.photo_type)}
            </span>

            {photo.caption ? (
              <p className="mt-2 break-words text-xs leading-5 text-[#7A6A5D] [overflow-wrap:anywhere]">
                {photo.caption}
              </p>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  </div>
) : null}
                <div className="flex flex-col gap-3 sm:flex-row">
                  <a
                    href={linkWhatsApp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center rounded-full bg-[#7D3F46] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#6B343B]"
                  >
                    Tenho interesse
                  </a>

                  <Link
                    href="/maison"
                    className="inline-flex w-full items-center justify-center rounded-full border border-[#D8C7B1] bg-white px-5 py-3 text-sm font-semibold text-[#7A6A5D] transition hover:bg-[#F4EADF]"
                  >
                    Ver outras peças
                  </Link>
                </div>
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}