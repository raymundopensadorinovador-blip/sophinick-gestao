"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  can_show_on_instagram: boolean;
  collection_name: string | null;
  created_at: string;
};

type CreationPhoto = {
  id: string;
  user_id: string;
  creation_id: string;
  photo_url: string;
  photo_type: string | null;
  caption: string | null;
  created_at: string;
};

type CreationDraft = {
  title: string;
  category: string;
  description: string;
  fabric: string;
  price: string;
  status: string;
  collection_name: string;
  is_public: boolean;
  can_show_on_instagram: boolean;
};

const emptyDraft: CreationDraft = {
  title: "",
  category: "Criação autoral",
  description: "",
  fabric: "",
  price: "",
  status: "portfolio",
  collection_name: "",
  is_public: false,
  can_show_on_instagram: false,
};

const statusOptions = [
  { value: "portfolio", label: "Portfólio" },
  { value: "disponivel", label: "Disponível" },
  { value: "sob_encomenda", label: "Sob encomenda" },
  { value: "vendida", label: "Vendida" },
];

const categoryOptions = [
  "Criação autoral",
  "Vestido",
  "Conjunto",
  "Saia",
  "Blusa",
  "Roupa infantil",
  "Roupa de festa",
  "Sob medida",
  "Reforma criativa",
  "Antes e depois",
];

const photoTypeOptions = [
  { value: "frente", label: "Frente" },
  { value: "costas", label: "Costas" },
  { value: "detalhe", label: "Detalhe" },
  { value: "acabamento", label: "Acabamento" },
  { value: "tecido", label: "Tecido" },
  { value: "prova", label: "Prova" },
  { value: "outro", label: "Outro" },
];

function photoTypeLabel(value: string | null) {
  return (
    photoTypeOptions.find((option) => option.value === value)?.label ||
    "Detalhe"
  );
}

function parseMoney(value: string) {
  const normalized = value.replace(/\./g, "").replace(",", ".");
  const number = Number(normalized);

  if (Number.isNaN(number)) return null;

  return number;
}

function formatCurrency(value: number | null) {
  if (value === null || value === undefined) return "Valor não informado";

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value || 0);
}

function statusLabel(status: string) {
  return statusOptions.find((option) => option.value === status)?.label || status;
}

function getStoragePathFromPublicUrl(url: string) {
  const marker = "/storage/v1/object/public/maison-creations/";
  const index = url.indexOf(marker);

  if (index === -1) return "";

  return url.slice(index + marker.length);
}

export default function CriacoesPage() {
  const router = useRouter();

  const [userId, setUserId] = useState("");
  const [creations, setCreations] = useState<Creation[]>([]);
  const [creationPhotos, setCreationPhotos] = useState<CreationPhoto[]>([]);
  const [draft, setDraft] = useState<CreationDraft>(emptyDraft);
  const [editingCreationId, setEditingCreationId] = useState("");
  const [editingCoverUrl, setEditingCoverUrl] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [extraPhotoType, setExtraPhotoType] = useState("detalhe");
  const [extraPhotoCaption, setExtraPhotoCaption] = useState("");
  const [uploadingPhotoForCreationId, setUploadingPhotoForCreationId] =
  useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadPage() {
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        router.push("/login");
        return;
      }

      setUserId(data.user.id);
      await loadCreations(data.user.id);
      setLoading(false);
    }

    loadPage();
  }, [router]);

  async function loadCreations(currentUserId = userId) {
    if (!currentUserId) return;
  
    const { data, error: loadError } = await supabase
      .from("atelier_creations")
      .select(
        "id, title, category, description, fabric, price, status, cover_image_url, is_public, can_show_on_instagram, collection_name, created_at"
      )
      .eq("user_id", currentUserId)
      .order("created_at", { ascending: false });
  
    if (loadError) {
      setError("Não foi possível carregar as criações.");
      return;
    }
  
    const loadedCreations = (data || []) as Creation[];
  
    setCreations(loadedCreations);
    await loadCreationPhotosByCreations(loadedCreations);
  }

  async function loadCreationPhotosByCreations(loadedCreations: Creation[]) {
    const creationIds = loadedCreations.map((creation) => creation.id);
  
    if (creationIds.length === 0) {
      setCreationPhotos([]);
      return;
    }
  
    const { data, error: loadError } = await supabase
      .from("atelier_creation_photos")
      .select("id, user_id, creation_id, photo_url, photo_type, caption, created_at")
      .in("creation_id", creationIds)
      .order("created_at", { ascending: false });
  
    if (loadError) {
      console.error("ERRO AO CARREGAR FOTOS EXTRAS:", loadError);
      setError(`Não foi possível carregar as fotos extras: ${loadError.message}`);
      return;
    }
  
    console.log("FOTOS EXTRAS CARREGADAS:", data);
  
    setCreationPhotos((data || []) as CreationPhoto[]);
  }
  function handleCoverChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] || null;

    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setError("Use uma imagem em JPG, PNG ou WEBP.");
      event.target.value = "";
      return;
    }

    setError("");
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
    event.target.value = "";
  }

  async function handleExtraPhotoUpload(
    creation: Creation,
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0] || null;
    event.target.value = "";
  
    if (!file || !userId) return;
  
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  
    if (!allowedTypes.includes(file.type)) {
      setError("Use uma imagem em JPG, PNG ou WEBP.");
      return;
    }
  
    setError("");
    setMessage("");
    setUploadingPhotoForCreationId(creation.id);
  
    const fileExtension = file.name.split(".").pop() || "jpg";
    const filePath = `${userId}/creation-${creation.id}/${Date.now()}.${fileExtension}`;
  
    const { error: uploadError } = await supabase.storage
      .from("maison-creations")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });
  
    if (uploadError) {
      setError("Não foi possível enviar a foto extra da criação.");
      setUploadingPhotoForCreationId("");
      return;
    }
  
    const { data: publicUrlData } = supabase.storage
      .from("maison-creations")
      .getPublicUrl(filePath);
  
    const { error: insertError } = await supabase
      .from("atelier_creation_photos")
      .insert({
        user_id: userId,
        creation_id: creation.id,
        photo_url: publicUrlData.publicUrl,
        photo_type: extraPhotoType,
        caption: extraPhotoCaption.trim() || null,
      });
  
    if (insertError) {
      await supabase.storage.from("maison-creations").remove([filePath]);
      setError("Não foi possível salvar a foto extra da criação.");
      setUploadingPhotoForCreationId("");
      return;
    }
  
    setExtraPhotoType("detalhe");
    setExtraPhotoCaption("");
    await loadCreations(userId);
    setMessage("Foto extra adicionada com sucesso.");
    setUploadingPhotoForCreationId("");
  } 

  async function saveCreation(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
  
    if (!userId) return;
  
    setError("");
    setMessage("");
  
    if (!draft.title.trim()) {
      setError("Informe o nome da criação.");
      return;
    }
  
    setSaving(true);
  
    let coverImageUrl: string | null = editingCoverUrl || null;
  
    if (coverFile) {
      const fileExtension = coverFile.name.split(".").pop() || "jpg";
      const filePath = `${userId}/${Date.now()}.${fileExtension}`;
  
      const { error: uploadError } = await supabase.storage
        .from("maison-creations")
        .upload(filePath, coverFile, {
          cacheControl: "3600",
          upsert: false,
        });
  
      if (uploadError) {
        setError("Não foi possível enviar a foto da criação.");
        setSaving(false);
        return;
      }
  
      const { data: publicUrlData } = supabase.storage
        .from("maison-creations")
        .getPublicUrl(filePath);
  
      coverImageUrl = publicUrlData.publicUrl;
  
      if (editingCoverUrl) {
        const oldPath = getStoragePathFromPublicUrl(editingCoverUrl);
  
        if (oldPath) {
          await supabase.storage.from("maison-creations").remove([oldPath]);
        }
      }
    }
  
    const parsedPrice = draft.price.trim() ? parseMoney(draft.price) : null;
  
    if (draft.price.trim() && parsedPrice === null) {
      setError("Informe um preço válido.");
      setSaving(false);
      return;
    }
  
    if (editingCreationId) {
      const { error: updateError } = await supabase
        .from("atelier_creations")
        .update({
          title: draft.title.trim(),
          category: draft.category.trim() || null,
          description: draft.description.trim() || null,
          fabric: draft.fabric.trim() || null,
          price: parsedPrice,
          status: draft.status,
          cover_image_url: coverImageUrl,
          is_public: draft.is_public,
          can_show_on_instagram: draft.can_show_on_instagram,
          collection_name: draft.collection_name.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingCreationId)
        .eq("user_id", userId);
  
      if (updateError) {
        setError("Não foi possível atualizar a criação.");
        setSaving(false);
        return;
      }
  
      setDraft(emptyDraft);
      setEditingCreationId("");
      setEditingCoverUrl("");
      setCoverFile(null);
      setCoverPreview("");
      await loadCreations(userId);
      setMessage("Criação atualizada com sucesso.");
      setSaving(false);
      return;
    }
  
    const { error: insertError } = await supabase.from("atelier_creations").insert({
      user_id: userId,
      title: draft.title.trim(),
      category: draft.category.trim() || null,
      description: draft.description.trim() || null,
      fabric: draft.fabric.trim() || null,
      price: parsedPrice,
      status: draft.status,
      cover_image_url: coverImageUrl,
      is_public: draft.is_public,
      can_show_on_instagram: draft.can_show_on_instagram,
      collection_name: draft.collection_name.trim() || null,
    });
  
    if (insertError) {
      setError("Não foi possível cadastrar a criação.");
      setSaving(false);
      return;
    }
  
    setDraft(emptyDraft);
    setEditingCreationId("");
    setEditingCoverUrl("");
    setCoverFile(null);
    setCoverPreview("");
    await loadCreations(userId);
    setMessage("Criação cadastrada com sucesso.");
    setSaving(false);
  }
  function startEditCreation(creation: Creation) {
    setError("");
    setMessage("");
  
    setEditingCreationId(creation.id);
    setEditingCoverUrl(creation.cover_image_url || "");
    setCoverFile(null);
    setCoverPreview(creation.cover_image_url || "");
  
    setDraft({
      title: creation.title || "",
      category: creation.category || "Criação autoral",
      description: creation.description || "",
      fabric: creation.fabric || "",
      price:
        creation.price === null || creation.price === undefined
          ? ""
          : String(creation.price),
      status: creation.status || "portfolio",
      collection_name: creation.collection_name || "",
      is_public: creation.is_public,
      can_show_on_instagram: creation.can_show_on_instagram,
    });
  
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }
  
  function cancelEditCreation() {
    setDraft(emptyDraft);
    setEditingCreationId("");
    setEditingCoverUrl("");
    setCoverFile(null);
    setCoverPreview("");
    setError("");
    setMessage("");
  }

  async function deleteCreation(creation: Creation) {
    const confirmed = window.confirm("Deseja excluir esta criação da Maison?");

    if (!confirmed || !userId) return;

    setError("");
    setMessage("");

    if (creation.cover_image_url) {
      const storagePath = getStoragePathFromPublicUrl(creation.cover_image_url);

      if (storagePath) {
        await supabase.storage.from("maison-creations").remove([storagePath]);
      }
    }

    const photosToRemove = creationPhotos.filter(
      (photo) => photo.creation_id === creation.id
    );
    
    const extraPhotoPaths = photosToRemove
      .map((photo) => getStoragePathFromPublicUrl(photo.photo_url))
      .filter(Boolean);
    
    if (extraPhotoPaths.length > 0) {
      await supabase.storage.from("maison-creations").remove(extraPhotoPaths);
    }

    const { error: deleteError } = await supabase
      .from("atelier_creations")
      .delete()
      .eq("id", creation.id)
      .eq("user_id", userId);

    if (deleteError) {
      setError("Não foi possível excluir a criação.");
      return;
    }

    await loadCreations(userId);
    setMessage("Criação excluída com sucesso.");
  }

  async function deleteCreationPhoto(photo: CreationPhoto) {
    const confirmed = window.confirm("Deseja excluir esta foto da criação?");
  
    if (!confirmed || !userId) return;
  
    setError("");
    setMessage("");
  
    const storagePath = getStoragePathFromPublicUrl(photo.photo_url);
  
    if (storagePath) {
      await supabase.storage.from("maison-creations").remove([storagePath]);
    }
  
    const { error: deleteError } = await supabase
      .from("atelier_creation_photos")
      .delete()
      .eq("id", photo.id)
      .eq("user_id", userId);
  
    if (deleteError) {
      setError("Não foi possível excluir a foto da criação.");
      return;
    }
  
    await loadCreations(userId);
    setMessage("Foto excluída com sucesso.");
  } 

  async function togglePublic(creation: Creation) {
    const { error: updateError } = await supabase
      .from("atelier_creations")
      .update({
        is_public: !creation.is_public,
        updated_at: new Date().toISOString(),
      })
      .eq("id", creation.id)
      .eq("user_id", userId);

    if (updateError) {
      setError("Não foi possível atualizar a publicação da criação.");
      return;
    }

    await loadCreations(userId);
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F4EADF] px-4 text-[#2E2723]">
        <div className="rounded-3xl border border-[#E6D8C8] bg-white px-6 py-5 text-sm text-[#7A6A5D] shadow-sm">
          Carregando criações...
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
              Maison Soph & Nick
            </p>

            <h1 className="mt-2 break-words text-3xl font-semibold tracking-tight text-[#2E2723] [overflow-wrap:anywhere] sm:text-4xl">
              Criações autorais
            </h1>

            <p className="mt-2 max-w-2xl break-words text-sm leading-7 text-[#7A6A5D] [overflow-wrap:anywhere]">
              Cadastre as peças criadas por Nília Diniz e escolha quais aparecem
              na vitrine Maison Soph & Nick.
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
              href="/maison"
              className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[#7D3F46] px-5 text-sm font-medium text-white shadow-sm transition hover:bg-[#6B343B] sm:w-auto"
            >
              Ver vitrine
            </a>
          </div>
        </header>

        <section className="grid gap-4 py-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[2rem] border border-[#E6D8C8] bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.25em] text-[#9B5C5F]">
              Cadastro
            </p>

            <h2 className="mt-3 text-2xl font-semibold text-[#2E2723]">
  {editingCreationId ? "Editar criação" : "Nova criação"}
</h2>

            <form onSubmit={saveCreation} className="mt-5 space-y-4">
              <div>
                <label className="text-sm font-medium text-[#2E2723]">
                  Nome da peça
                </label>

                <input
                  value={draft.title}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  placeholder="Ex: Vestido Aurora"
                  className="mt-2 min-h-12 w-full rounded-2xl border border-[#E6D8C8] bg-[#FFFDFC] px-4 text-sm outline-none transition placeholder:text-[#B09B8A] focus:border-[#9B5C5F]"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
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
                    {categoryOptions.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-[#2E2723]">
                    Status
                  </label>

                  <select
                    value={draft.status}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        status: event.target.value,
                      }))
                    }
                    className="mt-2 min-h-12 w-full rounded-2xl border border-[#E6D8C8] bg-[#FFFDFC] px-4 text-sm outline-none transition focus:border-[#9B5C5F]"
                  >
                    {statusOptions.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-[#2E2723]">
                    Tecido/material
                  </label>

                  <input
                    value={draft.fabric}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        fabric: event.target.value,
                      }))
                    }
                    placeholder="Ex: viscose, linho, tricoline..."
                    className="mt-2 min-h-12 w-full rounded-2xl border border-[#E6D8C8] bg-[#FFFDFC] px-4 text-sm outline-none transition placeholder:text-[#B09B8A] focus:border-[#9B5C5F]"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-[#2E2723]">
                    Preço, se houver
                  </label>

                  <input
                    value={draft.price}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        price: event.target.value,
                      }))
                    }
                    inputMode="decimal"
                    placeholder="Ex: 320"
                    className="mt-2 min-h-12 w-full rounded-2xl border border-[#E6D8C8] bg-[#FFFDFC] px-4 text-sm outline-none transition placeholder:text-[#B09B8A] focus:border-[#9B5C5F]"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-[#2E2723]">
                  Coleção
                </label>

                <input
                  value={draft.collection_name}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      collection_name: event.target.value,
                    }))
                  }
                  placeholder="Ex: Luz & Linha"
                  className="mt-2 min-h-12 w-full rounded-2xl border border-[#E6D8C8] bg-[#FFFDFC] px-4 text-sm outline-none transition placeholder:text-[#B09B8A] focus:border-[#9B5C5F]"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-[#2E2723]">
                  Descrição da criação
                </label>

                <textarea
                  value={draft.description}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  placeholder="Descreva a peça, inspiração, caimento, detalhes e proposta."
                  className="mt-2 min-h-32 w-full resize-none rounded-2xl border border-[#E6D8C8] bg-[#FFFDFC] px-4 py-3 text-sm leading-6 outline-none transition placeholder:text-[#B09B8A] focus:border-[#9B5C5F]"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-[#2E2723]">
                  Foto de capa
                </label>

                <label className="mt-2 flex min-h-12 cursor-pointer items-center justify-center rounded-full border border-[#D8C7B1] bg-[#F4EADF] px-5 text-sm font-medium text-[#7A4A4F] transition hover:bg-white">
                  Escolher foto
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleCoverChange}
                  />
                </label>

                {coverPreview ? (
                  <div className="mt-3 overflow-hidden rounded-3xl border border-[#E6D8C8] bg-[#F4EADF]">
                 <img
  src={coverPreview}
  alt="Prévia da criação"
  className="h-60 w-full bg-[#F4EADF] object-contain"
/>   
                  </div>
                ) : null}
              </div>

              <label className="flex items-start gap-3 rounded-2xl border border-[#E6D8C8] bg-[#F4EADF] p-4 text-sm text-[#7A6A5D]">
                <input
                  type="checkbox"
                  checked={draft.is_public}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      is_public: event.target.checked,
                    }))
                  }
                  className="mt-1"
                />
                <span>Mostrar esta criação na Maison Soph & Nick.</span>
              </label>

              <label className="flex items-start gap-3 rounded-2xl border border-[#E6D8C8] bg-[#F4EADF] p-4 text-sm text-[#7A6A5D]">
                <input
                  type="checkbox"
                  checked={draft.can_show_on_instagram}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      can_show_on_instagram: event.target.checked,
                    }))
                  }
                  className="mt-1"
                />
                <span>Autorizado para usar em conteúdo do Instagram.</span>
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

<div className="flex flex-col gap-3 sm:flex-row">
  <button
    type="submit"
    disabled={saving}
    className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#7D3F46] px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-[#6B343B] disabled:cursor-not-allowed disabled:opacity-70"
  >
    {saving
      ? "Salvando..."
      : editingCreationId
        ? "Salvar alterações"
        : "Cadastrar criação"}
  </button>

  {editingCreationId ? (
    <button
      type="button"
      onClick={cancelEditCreation}
      disabled={saving}
      className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-[#D8C7B1] bg-[#F4EADF] px-6 py-3 text-sm font-medium text-[#7A4A4F] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
    >
      Cancelar edição
    </button>
  ) : null}
</div> 
            </form>
          </div>

          <div className="rounded-[2rem] border border-[#E6D8C8] bg-white p-5 shadow-sm">
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-[#9B5C5F]">
                  Portfólio
                </p>

                <h2 className="mt-3 text-2xl font-semibold text-[#2E2723]">
                  Criações cadastradas
                </h2>
              </div>

              <div className="rounded-full border border-[#E6D8C8] bg-[#F4EADF] px-4 py-2 text-sm text-[#7A6A5D]">
                {creations.length} criação(ões)
              </div>
            </div>

            <div className="mt-5 max-h-[760px] space-y-3 overflow-y-auto pr-1">
              {creations.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-[#D8C7B1] bg-[#F4EADF] p-5 text-sm leading-7 text-[#7A6A5D]">
                  Nenhuma criação cadastrada ainda.
                </div>
              ) : (
                creations.map((creation) => (
                  <article
                    key={creation.id}
                    className="min-w-0 overflow-hidden rounded-3xl border border-[#E6D8C8] bg-[#FFFDFC]"
                  >
                    {creation.cover_image_url ? (
                     <img
                     src={creation.cover_image_url}
                     alt={creation.title}
                     className="h-56 w-full bg-[#F4EADF] object-contain"
                   /> 
                    ) : (
                      <div className="grid h-40 place-items-center bg-[#F4EADF] text-sm text-[#7A6A5D]">
                        Sem foto de capa
                      </div>
                    )}

                    <div className="p-4">
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full border border-[#E6D8C8] bg-[#F4EADF] px-3 py-1 text-xs text-[#7A6A5D]">
                          {statusLabel(creation.status)}
                        </span>

                        {creation.is_public ? (
                          <span className="rounded-full border border-[#D8C7B1] bg-white px-3 py-1 text-xs text-[#7A4A4F]">
                            Na Maison
                          </span>
                        ) : (
                          <span className="rounded-full border border-[#E6D8C8] bg-[#F4EADF] px-3 py-1 text-xs text-[#7A6A5D]">
                            Privada
                          </span>
                        )}

                        {creation.can_show_on_instagram ? (
                          <span className="rounded-full border border-[#D8C7B1] bg-white px-3 py-1 text-xs text-[#7A4A4F]">
                            Instagram ok
                          </span>
                        ) : null}
                      </div>

                      <h3 className="mt-3 break-words text-xl font-semibold text-[#2E2723] [overflow-wrap:anywhere]">
                        {creation.title}
                      </h3>

                      <div className="mt-2 space-y-1 text-sm leading-6 text-[#7A6A5D]">
                        {creation.category ? <p>{creation.category}</p> : null}
                        {creation.fabric ? <p>Tecido: {creation.fabric}</p> : null}
                        {creation.collection_name ? (
                          <p>Coleção: {creation.collection_name}</p>
                        ) : null}
                        <p>{formatCurrency(Number(creation.price))}</p>
                      </div>

                      {creation.description ? (
                        <p className="mt-3 break-words rounded-2xl bg-[#F4EADF] p-3 text-sm leading-6 text-[#7A6A5D] [overflow-wrap:anywhere]">
                          {creation.description}
                        </p>
                      ) : null}

                      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                      <div className="mt-4 rounded-3xl border border-[#E6D8C8] bg-[#F4EADF] p-4">
  <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
    <div className="min-w-0">
      <p className="text-xs uppercase tracking-[0.22em] text-[#9B5C5F]">
        Fotos da peça
      </p>
      <p className="mt-1 text-sm leading-6 text-[#7A6A5D]">
        Adicione fotos de frente, costas, detalhes, acabamento ou tecido.
      </p>
    </div>

    <span className="rounded-full border border-[#D8C7B1] bg-white px-3 py-1 text-xs text-[#7A4A4F]">
      {
        creationPhotos.filter(
          (photo) => photo.creation_id === creation.id
        ).length
      }{" "}
      foto(s)
    </span>
  </div>

  <div className="mt-3 grid gap-3 sm:grid-cols-[0.8fr_1.2fr]">
    <select
      value={extraPhotoType}
      onChange={(event) => setExtraPhotoType(event.target.value)}
      className="min-h-11 w-full rounded-2xl border border-[#E6D8C8] bg-white px-4 text-sm text-[#2E2723] outline-none transition focus:border-[#9B5C5F]"
    >
      {photoTypeOptions.map((type) => (
        <option key={type.value} value={type.value}>
          {type.label}
        </option>
      ))}
    </select>

    <input
      value={extraPhotoCaption}
      onChange={(event) => setExtraPhotoCaption(event.target.value)}
      placeholder="Legenda opcional"
      className="min-h-11 w-full rounded-2xl border border-[#E6D8C8] bg-white px-4 text-sm outline-none transition placeholder:text-[#B09B8A] focus:border-[#9B5C5F]"
    />
  </div>

  <label className="mt-3 flex min-h-11 cursor-pointer items-center justify-center rounded-full border border-[#D8C7B1] bg-white px-5 text-sm font-medium text-[#7A4A4F] transition hover:bg-[#FFFDFC]">
    {uploadingPhotoForCreationId === creation.id
      ? "Enviando foto..."
      : "Adicionar foto da peça"}
    <input
      type="file"
      accept="image/jpeg,image/png,image/webp"
      className="hidden"
      disabled={uploadingPhotoForCreationId === creation.id}
      onChange={(event) => handleExtraPhotoUpload(creation, event)}
    />
  </label>

  {creationPhotos.filter((photo) => photo.creation_id === creation.id).length >
  0 ? (
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      {creationPhotos
        .filter((photo) => photo.creation_id === creation.id)
        .map((photo) => (
          <div
            key={photo.id}
            className="overflow-hidden rounded-3xl border border-[#E6D8C8] bg-white"
          >
            <img
              src={photo.photo_url}
              alt={photo.caption || photoTypeLabel(photo.photo_type)}
              className="h-44 w-full bg-[#F4EADF] object-contain"
            />

            <div className="p-3">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-[#E6D8C8] bg-[#F4EADF] px-3 py-1 text-xs text-[#7A6A5D]">
                  {photoTypeLabel(photo.photo_type)}
                </span>
              </div>

              {photo.caption ? (
                <p className="mt-2 break-words text-xs leading-5 text-[#7A6A5D] [overflow-wrap:anywhere]">
                  {photo.caption}
                </p>
              ) : null}

              <button
                type="button"
                onClick={() => deleteCreationPhoto(photo)}
                className="mt-3 inline-flex min-h-9 w-full items-center justify-center rounded-full border border-[#E8C7C0] bg-red-50 px-4 text-xs font-medium text-[#9A4A3F] transition hover:bg-red-100"
              >
                Excluir foto
              </button>
            </div>
          </div>
        ))}
    </div>
  ) : null}
</div>
                      <button

  type="button"
  onClick={() => startEditCreation(creation)}
  className="inline-flex min-h-10 w-full items-center justify-center rounded-full border border-[#D8C7B1] bg-white px-4 text-xs font-medium text-[#7A4A4F] transition hover:bg-[#F4EADF] sm:w-auto"
>
  Editar
</button>
                        <button
                          type="button"
                          onClick={() => togglePublic(creation)}
                          className="inline-flex min-h-10 w-full items-center justify-center rounded-full border border-[#D8C7B1] bg-white px-4 text-xs font-medium text-[#7A4A4F] transition hover:bg-[#F4EADF] sm:w-auto"
                        >
                          {creation.is_public
                            ? "Remover da Maison"
                            : "Mostrar na Maison"}
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteCreation(creation)}
                          className="inline-flex min-h-10 w-full items-center justify-center rounded-full border border-[#E8C7C0] bg-red-50 px-4 text-xs font-medium text-[#9A4A3F] transition hover:bg-red-100 sm:w-auto"
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