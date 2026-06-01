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
  general_notes: string | null;
  client_notes: string | null;
  internal_notes: string | null;
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
  general_notes: string | null;
  client_notes: string | null;
  internal_notes: string | null;
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
  order_type: string;
  clothing_type: string | null;
  service_name: string;
  service_description: string | null;
  manual_service: boolean;
  price: number;
  status: string;
  due_date: string | null;
  fitting_date: string | null;
  damage_notes: string | null;
  client_notes: string | null;
  internal_notes: string | null;
  created_at: string;
};

type OrderPhoto = {
    id: string;
    service_order_id: string | null;
    order_item_id: string | null;
    photo_url: string;
    photo_type: string;
    caption: string | null;
    created_at: string;
  };

const statusOptions = [
  { value: "recebido", label: "Recebido" },
  { value: "em_andamento", label: "Em andamento" },
  { value: "pronto", label: "Pronto" },
  { value: "entregue", label: "Entregue" },
  { value: "cancelado", label: "Cancelado" },
];

const photoTypeOptions = [
    { value: "entrada", label: "Entrada" },
    { value: "avaria", label: "Avaria" },
    { value: "processo", label: "Processo" },
    { value: "pronto", label: "Pronto" },
    { value: "entrega", label: "Entrega" },
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
    general_notes: order.general_notes,
    client_notes: order.client_notes,
    internal_notes: order.internal_notes,
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

function parseMoney(value: string) {
    const normalized = value.replace(/\./g, "").replace(",", ".");
    const number = Number(normalized);
  
    if (Number.isNaN(number)) return 0;
  
    return number;
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

function statusLabel(status: string) {
  return (
    statusOptions.find((option) => option.value === status)?.label || status
  );
}

function onlyNumbers(value: string) {
  return value.replace(/\D/g, "");
}

function whatsappLink(phone: string | null) {
  const numbers = onlyNumbers(phone || "");

  if (!numbers) return "";

  const withCountryCode = numbers.startsWith("55") ? numbers : `55${numbers}`;

  return `https://wa.me/${withCountryCode}`;
}

function buildWhatsAppMessage(order: ServiceOrder, items: OrderItem[]) {
    const total = Number(order.total_amount || 0);
    const paid = Number(order.paid_amount || 0);
    const balance = total - paid;
  
    const itemsText = items
      .map((item, index) => {
        const lines = [
          `${index + 1}. ${item.clothing_type || "Peça"} — ${item.service_name} — ${formatCurrency(Number(item.price || 0))}`,
        ];
  
        if (item.damage_notes) {
          lines.push(`   Avarias registradas: ${item.damage_notes}`);
        }
  
        if (item.client_notes) {
          lines.push(`   Observação: ${item.client_notes}`);
        }
  
        return lines.join("\n");
      })
      .join("\n\n");
  
    const messageParts = [
      `Olá, ${order.customer_name || "tudo bem"}! Seu atendimento foi registrado no Soph & Nick Atelier.`,
      "",
      `Atendimento #${order.order_number}`,
      "",
      "Itens:",
      itemsText || "Nenhum item listado.",
      "",
      `Total: ${formatCurrency(total)}`,
      `Valor pago: ${formatCurrency(paid)}`,
      `Saldo: ${formatCurrency(balance)}`,
      `Prazo previsto: ${formatDate(order.due_date)}`,
    ];
  
    if (order.client_notes) {
      messageParts.push("", `Observação: ${order.client_notes}`);
    }
  
    messageParts.push(
      "",
      "Também registramos as condições iniciais das peças e avarias informadas no atendimento.",
      "Obrigada pela confiança!"
    );
  
    return messageParts.join("\n");
  }
  
  function buildReadyWhatsAppMessage(order: ServiceOrder, items: OrderItem[]) {
    const total = Number(order.total_amount || 0);
    const paid = Number(order.paid_amount || 0);
    const balance = total - paid;
  
    const itemsText = items
      .map((item, index) => {
        return `${index + 1}. ${item.clothing_type || "Peça"} — ${item.service_name}`;
      })
      .join("\n");
  
    const messageParts = [
      `Olá, ${order.customer_name || "tudo bem"}! Seu atendimento #${order.order_number} no Soph & Nick Atelier está pronto.`,
      "",
      "Itens prontos:",
      itemsText || "Nenhum item listado.",
      "",
      `Total: ${formatCurrency(total)}`,
      `Valor pago: ${formatCurrency(paid)}`,
      `Saldo para retirada: ${formatCurrency(balance)}`,
      "",
      "Você já pode combinar a retirada.",
      "Obrigada pela confiança!",
    ];
  
    return messageParts.join("\n");
  }

  function whatsappMessageLink(phone: string | null, message: string) {
    const numbers = onlyNumbers(phone || "");
  
    if (!numbers) return "";
  
    const withCountryCode = numbers.startsWith("55") ? numbers : `55${numbers}`;
  
    return `https://wa.me/${withCountryCode}?text=${encodeURIComponent(message)}`;
  }

export default function PedidoDetalhePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const orderId = params.id;

  const [userId, setUserId] = useState("");
  const [order, setOrder] = useState<ServiceOrder | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [photos, setPhotos] = useState<OrderPhoto[]>([]);
const [uploadingItemId, setUploadingItemId] = useState("");
const [photoTypesByItem, setPhotoTypesByItem] = useState<Record<string, string>>(
  {}
);
const [captionsByItem, setCaptionsByItem] = useState<Record<string, string>>(
  {}
);
const [loading, setLoading] = useState(true);
const [updatingStatus, setUpdatingStatus] = useState(false);
const [updatingPayment, setUpdatingPayment] = useState(false);
const [paidAmountInput, setPaidAmountInput] = useState("");
const [depositAmountInput, setDepositAmountInput] = useState("");
const [error, setError] = useState("");
const [message, setMessage] = useState("");


  const balanceAmount = useMemo(() => {
    if (!order) return 0;
  
    return Number(order.total_amount || 0) - Number(order.paid_amount || 0);
  }, [order]);

  const whatsappMessage = useMemo(() => {
    if (!order) return "";
  
    return buildWhatsAppMessage(order, items);
  }, [order, items]);
  
  const whatsappSummaryLink = useMemo(() => {
    if (!order || !order.customer_phone || !whatsappMessage) return "";
  
    return whatsappMessageLink(order.customer_phone, whatsappMessage);
  }, [order, whatsappMessage]);

  const readyWhatsAppMessage = useMemo(() => {
    if (!order) return "";
  
    return buildReadyWhatsAppMessage(order, items);
  }, [order, items]);
  
  const whatsappReadyLink = useMemo(() => {
    if (!order || !order.customer_phone || !readyWhatsAppMessage) return "";
  
    return whatsappMessageLink(order.customer_phone, readyWhatsAppMessage);
  }, [order, readyWhatsAppMessage]);

  const photosByItem = useMemo(() => {
    const grouped: Record<string, OrderPhoto[]> = {};
  
    photos.forEach((photo) => {
      if (!photo.order_item_id) return;
  
      grouped[photo.order_item_id] = grouped[photo.order_item_id] || [];
      grouped[photo.order_item_id].push(photo);
    });
  
    return grouped;
  }, [photos]);

  function photoTypeLabel(type: string) {
    return (
      photoTypeOptions.find((option) => option.value === type)?.label || type
    );
  }
  
  function getStoragePathFromPublicUrl(url: string) {
    const marker = "/storage/v1/object/public/order-photos/";
    const index = url.indexOf(marker);
  
    if (index === -1) return "";
  
    return url.slice(index + marker.length);
  }

  useEffect(() => {
    async function loadPage() {
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        router.push("/login");
        return;
      }

      setUserId(data.user.id);
      await loadOrder(data.user.id);
      setLoading(false);
    }

    loadPage();
  }, [router, orderId]);

  async function loadOrder(currentUserId = userId) {
    if (!currentUserId || !orderId) return;

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
        general_notes,
        client_notes,
        internal_notes,
        customer_id,
        created_at,
        customers (
          name,
          phone
        )
      `
      )
      .eq("id", orderId)
      .eq("user_id", currentUserId)
      .single();

    if (orderError || !orderData) {
      setError("Não foi possível carregar este atendimento.");
      return;
    }

    const { data: itemsData, error: itemsError } = await supabase
      .from("order_items")
      .select(
        `
        id,
        service_order_id,
        order_type,
        clothing_type,
        service_name,
        service_description,
        manual_service,
        price,
        status,
        due_date,
        fitting_date,
        damage_notes,
        client_notes,
        internal_notes,
        created_at
      `
      )
      .eq("service_order_id", orderId)
      .eq("user_id", currentUserId)
      .order("created_at", { ascending: true });

    if (itemsError) {
      setError("O atendimento carregou, mas não foi possível carregar os itens.");
      setOrder(normalizeOrder(orderData as RawServiceOrder));
      return;
    }

    const { data: photosData, error: photosError } = await supabase
    .from("order_photos")
    .select(
      `
      id,
      service_order_id,
      order_item_id,
      photo_url,
      photo_type,
      caption,
      created_at
    `
    )
    .eq("service_order_id", orderId)
    .eq("user_id", currentUserId)
    .order("created_at", { ascending: false });
  
  if (photosError) {
    setError("O atendimento carregou, mas não foi possível carregar as fotos.");
  }
  
  const normalizedOrder = normalizeOrder(orderData as RawServiceOrder);

  setOrder(normalizedOrder);
  setPaidAmountInput(String(normalizedOrder.paid_amount || ""));
  setDepositAmountInput(String(normalizedOrder.deposit_amount || ""));
  setItems((itemsData || []) as OrderItem[]);
  setPhotos((photosData || []) as OrderPhoto[]);
  }

  async function updateStatus(newStatus: string) {
    if (!order || !userId) return;

    setError("");
    setMessage("");
    setUpdatingStatus(true);

    const { error: updateError } = await supabase
      .from("service_orders")
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id)
      .eq("user_id", userId);

    setUpdatingStatus(false);

    if (updateError) {
      setError("Não foi possível atualizar o status.");
      return;
    }

    setOrder((current) =>
      current
        ? {
            ...current,
            status: newStatus,
          }
        : current
    );

    setMessage("Status atualizado com sucesso.");
  }

  async function updatePayment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
  
    if (!order || !userId) return;
  
    setError("");
    setMessage("");
  
    const paidAmount = parseMoney(paidAmountInput);
    const depositAmount = parseMoney(depositAmountInput);
  
    if (paidAmount < 0 || depositAmount < 0) {
      setError("Os valores de pagamento não podem ser negativos.");
      return;
    }
  
    if (paidAmount > Number(order.total_amount || 0)) {
      const confirmed = window.confirm(
        "O valor pago está maior que o total do atendimento. Deseja salvar mesmo assim?"
      );
  
      if (!confirmed) return;
    }
  
    setUpdatingPayment(true);
  
    const { error: updateError } = await supabase
      .from("service_orders")
      .update({
        paid_amount: paidAmount,
        deposit_amount: depositAmount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id)
      .eq("user_id", userId);
  
    setUpdatingPayment(false);
  
    if (updateError) {
      setError("Não foi possível atualizar os valores do pagamento.");
      return;
    }
  
    setOrder((current) =>
      current
        ? {
            ...current,
            paid_amount: paidAmount,
            deposit_amount: depositAmount,
          }
        : current
    );
  
    setMessage("Pagamento atualizado com sucesso.");
  }

  async function uploadItemPhoto(
    itemId: string,
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];
  
    event.target.value = "";
  
    if (!file || !order || !userId) return;
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

if (!allowedTypes.includes(file.type)) {
  setError("Use uma imagem em JPG, PNG ou WEBP. Fotos em HEIC podem não aparecer corretamente no navegador.");
  return;
}
    setError("");
    setMessage("");
    setUploadingItemId(itemId);
  
    const photoType = photoTypesByItem[itemId] || "entrada";
    const caption = captionsByItem[itemId]?.trim() || null;
    const fileExtension = file.name.split(".").pop() || "jpg";
    const filePath = `${userId}/${order.id}/${itemId}/${Date.now()}.${fileExtension}`;
  
    const { error: uploadError } = await supabase.storage
      .from("order-photos")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });
  
    if (uploadError) {
      setError("Não foi possível enviar a foto.");
      setUploadingItemId("");
      return;
    }
  
    const { data: publicUrlData } = supabase.storage
      .from("order-photos")
      .getPublicUrl(filePath);
  
    const publicUrl = publicUrlData.publicUrl;
  
    const { error: insertError } = await supabase.from("order_photos").insert({
      user_id: userId,
      service_order_id: order.id,
      order_item_id: itemId,
      photo_url: publicUrl,
      photo_type: photoType,
      caption,
    });
  
    if (insertError) {
      setError("A foto foi enviada, mas não foi registrada no atendimento.");
      setUploadingItemId("");
      return;
    }
  
    await loadOrder(userId);
  
    setCaptionsByItem((current) => ({
      ...current,
      [itemId]: "",
    }));
  
    setMessage("Foto adicionada com sucesso.");
    setUploadingItemId("");
  }
  
  async function deletePhoto(photo: OrderPhoto) {
    const confirmed = window.confirm("Deseja excluir esta foto do atendimento?");
  
    if (!confirmed || !userId) return;
  
    setError("");
    setMessage("");
  
    const storagePath = getStoragePathFromPublicUrl(photo.photo_url);
  
    if (storagePath) {
      await supabase.storage.from("order-photos").remove([storagePath]);
    }
  
    const { error: deleteError } = await supabase
      .from("order_photos")
      .delete()
      .eq("id", photo.id)
      .eq("user_id", userId);
  
    if (deleteError) {
      setError("Não foi possível excluir a foto.");
      return;
    }
  
    setPhotos((current) => current.filter((item) => item.id !== photo.id));
    setMessage("Foto excluída com sucesso.");
  }

  if (loading) {

    async function uploadItemPhoto(
        itemId: string,
        event: React.ChangeEvent<HTMLInputElement>
      ) {
        const file = event.target.files?.[0];
      
        event.target.value = "";
      
        if (!file || !order || !userId) return;
      
        setError("");
        setMessage("");
        setUploadingItemId(itemId);
      
        const photoType = photoTypesByItem[itemId] || "entrada";
        const caption = captionsByItem[itemId]?.trim() || null;
        const fileExtension = file.name.split(".").pop() || "jpg";
        const filePath = `${userId}/${order.id}/${itemId}/${Date.now()}.${fileExtension}`;
      
        const { error: uploadError } = await supabase.storage
          .from("order-photos")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
          });
      
        if (uploadError) {
          setError("Não foi possível enviar a foto.");
          setUploadingItemId("");
          return;
        }
      
        const { data: publicUrlData } = supabase.storage
          .from("order-photos")
          .getPublicUrl(filePath);
      
        const publicUrl = publicUrlData.publicUrl;
      
        const { error: insertError } = await supabase.from("order_photos").insert({
          user_id: userId,
          service_order_id: order.id,
          order_item_id: itemId,
          photo_url: publicUrl,
          photo_type: photoType,
          caption,
        });
      
        if (insertError) {
          setError("A foto foi enviada, mas não foi registrada no atendimento.");
          setUploadingItemId("");
          return;
        }
      
        await loadOrder(userId);
      
        setCaptionsByItem((current) => ({
          ...current,
          [itemId]: "",
        }));
      
        setMessage("Foto adicionada com sucesso.");
        setUploadingItemId("");
      }
      
      async function deletePhoto(photo: OrderPhoto) {
        const confirmed = window.confirm("Deseja excluir esta foto do atendimento?");
      
        if (!confirmed || !userId) return;
      
        setError("");
        setMessage("");
      
        const storagePath = getStoragePathFromPublicUrl(photo.photo_url);
      
        if (storagePath) {
          await supabase.storage.from("order-photos").remove([storagePath]);
        }
      
        const { error: deleteError } = await supabase
          .from("order_photos")
          .delete()
          .eq("id", photo.id)
          .eq("user_id", userId);
      
        if (deleteError) {
          setError("Não foi possível excluir a foto.");
          return;
        }
      
        setPhotos((current) => current.filter((item) => item.id !== photo.id));
        setMessage("Foto excluída com sucesso.");
      }

    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F4EADF] px-4 text-[#2E2723]">
        <div className="rounded-3xl border border-[#E6D8C8] bg-white px-6 py-5 text-sm text-[#7A6A5D] shadow-sm">
          Carregando atendimento...
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="min-h-screen w-full overflow-x-hidden bg-[#F4EADF] px-4 py-6 text-[#2E2723]">
        <section className="mx-auto w-full max-w-3xl rounded-[2rem] border border-[#E6D8C8] bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.25em] text-[#9B5C5F]">
            Atendimento
          </p>

          <h1 className="mt-3 text-2xl font-semibold text-[#2E2723]">
            Atendimento não encontrado
          </h1>

          <p className="mt-3 text-sm leading-7 text-[#7A6A5D]">
            Não foi possível encontrar este atendimento para a conta logada.
          </p>

          {error ? (
            <div className="mt-5 rounded-2xl border border-[#E8C7C0] bg-red-50 px-4 py-3 text-sm leading-6 text-[#9A4A3F]">
              {error}
            </div>
          ) : null}

          <a
            href="/pedidos"
            className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[#7D3F46] px-5 text-sm font-medium text-white shadow-sm transition hover:bg-[#6B343B] sm:w-auto"
          >
            Voltar aos atendimentos
          </a>
        </section>
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
              Atendimento #{order.order_number}
            </h1>

            <p className="mt-2 max-w-2xl break-words text-sm leading-7 text-[#7A6A5D] [overflow-wrap:anywhere]">
              Veja os itens, valores, avarias, observações e status deste
              atendimento.
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <a
              href="/pedidos"
              className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-[#D8C7B1] bg-white px-5 text-sm font-medium text-[#7A4A4F] shadow-sm transition hover:bg-[#FFFDFC] sm:w-auto"
            >
              Voltar aos atendimentos
            </a>

            {whatsappSummaryLink ? (
  <>
    <a
      href={whatsappSummaryLink}
      target="_blank"
      rel="noreferrer"
      className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-[#D8C7B1] bg-white px-5 text-sm font-medium text-[#7A4A4F] shadow-sm transition hover:bg-[#FFFDFC] sm:w-auto"
    >
      Enviar resumo
    </a>

    <a
      href={whatsappReadyLink}
      target="_blank"
      rel="noreferrer"
      className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[#7D3F46] px-5 text-sm font-medium text-white shadow-sm transition hover:bg-[#6B343B] sm:w-auto"
    >
      Avisar pronto
    </a>

    <a
  href={`/pedidos/${order.id}/recibo`}
  className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-[#D8C7B1] bg-white px-5 text-sm font-medium text-[#7A4A4F] shadow-sm transition hover:bg-[#FFFDFC] sm:w-auto"
>
  Gerar recibo
</a>

  </>
) : order.customer_phone ? (        
  <a
    href={whatsappLink(order.customer_phone)}
    target="_blank"
    rel="noreferrer"
    className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[#7D3F46] px-5 text-sm font-medium text-white shadow-sm transition hover:bg-[#6B343B] sm:w-auto"
  >
    Abrir WhatsApp
  </a>
) : null} 
          </div>
        </header>

        <section className="grid gap-4 py-6 lg:grid-cols-[0.8fr_1.2fr]">
          <aside className="space-y-4">
            <div className="rounded-[2rem] border border-[#E6D8C8] bg-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.25em] text-[#9B5C5F]">
                Cliente
              </p>

              <h2 className="mt-3 break-words text-2xl font-semibold text-[#2E2723] [overflow-wrap:anywhere]">
                {order.customer_name || "Cliente removida"}
              </h2>

              {order.customer_phone ? (
                <p className="mt-2 break-words text-sm text-[#7A6A5D] [overflow-wrap:anywhere]">
                  WhatsApp: {order.customer_phone}
                </p>
              ) : (
                <p className="mt-2 text-sm text-[#7A6A5D]">
                  WhatsApp não informado.
                </p>
              )}

              <div className="mt-5 grid gap-3 text-sm">
                <div className="rounded-3xl bg-[#F4EADF] p-4">
                  <p className="font-medium text-[#2E2723]">Entrada</p>
                  <p className="mt-1 text-[#7A6A5D]">
                    {formatDate(order.entry_date)}
                  </p>
                </div>

                <div className="rounded-3xl bg-[#F4EADF] p-4">
                  <p className="font-medium text-[#2E2723]">Prazo</p>
                  <p className="mt-1 text-[#7A6A5D]">
                    {formatDate(order.due_date)}
                  </p>
                </div>

                <div className="rounded-3xl bg-[#F4EADF] p-4">
                  <p className="font-medium text-[#2E2723]">Status atual</p>
                  <p className="mt-1 text-[#7A6A5D]">
                    {statusLabel(order.status)}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-[#E6D8C8] bg-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.25em] text-[#9B5C5F]">
                Status
              </p>

              <h2 className="mt-3 text-2xl font-semibold text-[#2E2723]">
                Atualizar atendimento
              </h2>

              <div className="mt-5 grid gap-2">
                {statusOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => updateStatus(option.value)}
                    disabled={updatingStatus || order.status === option.value}
                    className={`inline-flex min-h-11 w-full items-center justify-center rounded-full px-5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-70 ${
                      order.status === option.value
                        ? "bg-[#7D3F46] text-white shadow-sm"
                        : "border border-[#D8C7B1] bg-[#F4EADF] text-[#7A4A4F] hover:bg-white"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
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
            </div>

            <div className="rounded-[2rem] border border-[#E6D8C8] bg-white p-5 shadow-sm">
  <p className="text-xs uppercase tracking-[0.25em] text-[#9B5C5F]">
    Valores
  </p>

  <h2 className="mt-3 text-2xl font-semibold text-[#2E2723]">
    Resumo financeiro
  </h2>

  <div className="mt-5 grid gap-3 text-sm">
    <div className="rounded-3xl bg-[#F4EADF] p-4">
      <p className="text-[#7A6A5D]">Total</p>
      <p className="mt-1 text-xl font-semibold text-[#2E2723]">
        {formatCurrency(order.total_amount)}
      </p>
    </div>

    <div className="rounded-3xl bg-[#F4EADF] p-4">
      <p className="text-[#7A6A5D]">Sinal</p>
      <p className="mt-1 font-semibold text-[#2E2723]">
        {formatCurrency(order.deposit_amount)}
      </p>
    </div>

    <div className="rounded-3xl bg-[#F4EADF] p-4">
      <p className="text-[#7A6A5D]">Pago</p>
      <p className="mt-1 font-semibold text-[#2E2723]">
        {formatCurrency(order.paid_amount)}
      </p>
    </div>

    <div className="rounded-3xl bg-[#F4EADF] p-4">
      <p className="text-[#7A6A5D]">Saldo</p>
      <p className="mt-1 text-xl font-semibold text-[#2E2723]">
        {formatCurrency(balanceAmount)}
      </p>
    </div>
  </div>

  <form onSubmit={updatePayment} className="mt-5 space-y-4">
    <div>
      <label className="text-sm font-medium text-[#2E2723]">
        Sinal combinado
      </label>

      <input
        value={depositAmountInput}
        onChange={(event) => setDepositAmountInput(event.target.value)}
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
        value={paidAmountInput}
        onChange={(event) => setPaidAmountInput(event.target.value)}
        inputMode="decimal"
        placeholder="Ex: 80"
        className="mt-2 min-h-12 w-full rounded-2xl border border-[#E6D8C8] bg-[#FFFDFC] px-4 text-sm outline-none transition placeholder:text-[#B09B8A] focus:border-[#9B5C5F]"
      />
    </div>

    <button
      type="submit"
      disabled={updatingPayment}
      className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-[#D8C7B1] bg-[#F4EADF] px-5 text-sm font-medium text-[#7A4A4F] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
    >
      {updatingPayment ? "Atualizando..." : "Atualizar pagamento"}
    </button>
  </form>
</div> 
            <div className="rounded-[2rem] border border-[#E6D8C8] bg-white p-5 shadow-sm">
  <p className="text-xs uppercase tracking-[0.25em] text-[#9B5C5F]">
    WhatsApp
  </p>

  <h2 className="mt-3 text-2xl font-semibold text-[#2E2723]">
    Mensagem pronta
  </h2>

  <p className="mt-3 text-sm leading-7 text-[#7A6A5D]">
    Envie para a cliente um resumo com itens, valores, prazo e avarias
    registradas.
  </p>

  {order.customer_phone ? (
    <>
      <div className="mt-4 max-h-72 overflow-y-auto rounded-3xl border border-[#E6D8C8] bg-[#F4EADF] p-4 pr-2 text-sm leading-6 text-[#5F564C] whitespace-pre-wrap">
        {whatsappMessage}
      </div>
      <div className="rounded-[2rem] border border-[#E6D8C8] bg-white p-5 shadow-sm">
  <p className="text-xs uppercase tracking-[0.25em] text-[#9B5C5F]">
    Peça pronta
  </p>

  <h2 className="mt-3 text-2xl font-semibold text-[#2E2723]">
    Aviso de retirada
  </h2>

  <p className="mt-3 text-sm leading-7 text-[#7A6A5D]">
    Envie para a cliente quando as peças estiverem prontas, com total, valor
    pago e saldo para retirada.
  </p>

  {order.status !== "pronto" ? (
    <div className="mt-4 rounded-3xl border border-[#E6D8C8] bg-[#F4EADF] p-4 text-sm leading-7 text-[#7A6A5D]">
      Dica: marque o atendimento como <strong>Pronto</strong> antes de enviar
      esta mensagem, para manter o controle do ateliê organizado.
    </div>
  ) : null}

  {order.customer_phone ? (
    <>
      <div className="mt-4 max-h-72 overflow-y-auto whitespace-pre-wrap rounded-3xl border border-[#E6D8C8] bg-[#F4EADF] p-4 pr-2 text-sm leading-6 text-[#5F564C]">
        {readyWhatsAppMessage}
      </div>

      <a
        href={whatsappReadyLink}
        target="_blank"
        rel="noreferrer"
        className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#7D3F46] px-5 text-sm font-medium text-white shadow-sm transition hover:bg-[#6B343B]"
      >
        Avisar que está pronto
      </a>
    </>
  ) : (
    <div className="mt-4 rounded-3xl border border-dashed border-[#D8C7B1] bg-[#F4EADF] p-4 text-sm leading-7 text-[#7A6A5D]">
      Esta cliente não tem WhatsApp cadastrado.
    </div>
  )}
</div>
      <a
        href={whatsappSummaryLink}
        target="_blank"
        rel="noreferrer"
        className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#7D3F46] px-5 text-sm font-medium text-white shadow-sm transition hover:bg-[#6B343B]"
      >
        Enviar resumo pelo WhatsApp
      </a>
    </>
  ) : (
    <div className="mt-4 rounded-3xl border border-dashed border-[#D8C7B1] bg-[#F4EADF] p-4 text-sm leading-7 text-[#7A6A5D]">
      Esta cliente não tem WhatsApp cadastrado.
    </div>
  )}
</div>
          </aside>

          <section className="min-w-0 space-y-4">
            <div className="rounded-[2rem] border border-[#E6D8C8] bg-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.25em] text-[#9B5C5F]">
                Itens
              </p>

              <h2 className="mt-3 text-2xl font-semibold text-[#2E2723]">
                Peças e serviços
              </h2>

              <div className="mt-5 space-y-3">
                {items.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-[#D8C7B1] bg-[#F4EADF] p-5 text-sm leading-7 text-[#7A6A5D]">
                    Nenhum item encontrado neste atendimento.
                  </div>
                ) : (
                  items.map((item, index) => (
                    <article
                      key={item.id}
                      className="min-w-0 rounded-3xl border border-[#E6D8C8] bg-[#FFFDFC] p-4"
                    >
                      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap gap-2">
                            <span className="rounded-full border border-[#E6D8C8] bg-[#F4EADF] px-3 py-1 text-xs text-[#7A6A5D]">
                              Item {index + 1}
                            </span>

                            <span className="rounded-full border border-[#D8C7B1] bg-white px-3 py-1 text-xs text-[#7A4A4F]">
                              {item.clothing_type || "Peça não informada"}
                            </span>

                            {item.manual_service ? (
                              <span className="rounded-full border border-[#E6D8C8] bg-[#F4EADF] px-3 py-1 text-xs text-[#7A6A5D]">
                                Serviço manual
                              </span>
                            ) : null}
                          </div>

                          <h3 className="mt-3 break-words text-xl font-semibold text-[#2E2723] [overflow-wrap:anywhere]">
                            {item.service_name}
                          </h3>

                          {item.service_description ? (
                            <p className="mt-2 break-words text-sm leading-6 text-[#7A6A5D] [overflow-wrap:anywhere]">
                              {item.service_description}
                            </p>
                          ) : null}
                        </div>

                        <div className="shrink-0 rounded-2xl bg-[#F4EADF] p-3 text-sm">
                          <p className="text-[#7A6A5D]">Valor</p>
                          <p className="mt-1 font-semibold text-[#2E2723]">
                            {formatCurrency(Number(item.price || 0))}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl bg-[#F4EADF] p-3 text-sm">
                          <p className="font-medium text-[#2E2723]">
                            Prazo do item
                          </p>
                          <p className="mt-1 text-[#7A6A5D]">
                            {formatDate(item.due_date)}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-[#F4EADF] p-3 text-sm">
                          <p className="font-medium text-[#2E2723]">
                            Prova
                          </p>
                          <p className="mt-1 text-[#7A6A5D]">
                            {formatDateTime(item.fitting_date)}
                          </p>
                        </div>
                      </div>

                      {item.damage_notes ? (
                        <div className="mt-4 rounded-2xl border border-[#E6D8C8] bg-[#F4EADF] p-3">
                          <p className="text-sm font-medium text-[#2E2723]">
                            Avarias registradas
                          </p>
                          <p className="mt-2 break-words text-sm leading-6 text-[#7A6A5D] [overflow-wrap:anywhere]">
                            {item.damage_notes}
                          </p>
                        </div>
                      ) : null}

                      {item.client_notes ? (
                        <div className="mt-4 rounded-2xl border border-[#E6D8C8] bg-white p-3">
                          <p className="text-sm font-medium text-[#2E2723]">
                            Observação para cliente
                          </p>
                          <p className="mt-2 break-words text-sm leading-6 text-[#7A6A5D] [overflow-wrap:anywhere]">
                            {item.client_notes}
                          </p>
                        </div>
                      ) : null}

                      {item.internal_notes ? (
                        <div className="mt-4 rounded-2xl border border-[#E6D8C8] bg-white p-3">
                          <p className="text-sm font-medium text-[#2E2723]">
                            Observação interna
                          </p>
                          <p className="mt-2 break-words text-sm leading-6 text-[#7A6A5D] [overflow-wrap:anywhere]">
                            {item.internal_notes}
                          </p>
                        </div>
                      ) : null}
<div className="mt-4 rounded-2xl border border-[#E6D8C8] bg-[#F4EADF] p-3">
  <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
    <div className="min-w-0">
      <p className="text-sm font-medium text-[#2E2723]">
        Fotos do item
      </p>
      <p className="mt-1 break-words text-xs leading-5 text-[#7A6A5D] [overflow-wrap:anywhere]">
        Registre foto de entrada, avaria, processo, peça pronta ou entrega.
      </p>
    </div>
  </div>

  <div className="mt-3 grid gap-3 sm:grid-cols-[160px_1fr]">
    <select
      value={photoTypesByItem[item.id] || "entrada"}
      onChange={(event) =>
        setPhotoTypesByItem((current) => ({
          ...current,
          [item.id]: event.target.value,
        }))
      }
      className="min-h-11 w-full rounded-2xl border border-[#E6D8C8] bg-white px-3 text-sm outline-none transition focus:border-[#9B5C5F]"
    >
      {photoTypeOptions.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>

    <input
      value={captionsByItem[item.id] || ""}
      onChange={(event) =>
        setCaptionsByItem((current) => ({
          ...current,
          [item.id]: event.target.value,
        }))
      }
      placeholder="Legenda opcional. Ex: mancha na lateral"
      className="min-h-11 w-full rounded-2xl border border-[#E6D8C8] bg-white px-3 text-sm outline-none transition placeholder:text-[#B09B8A] focus:border-[#9B5C5F]"
    />
  </div>

  <label className="mt-3 inline-flex min-h-11 w-full cursor-pointer items-center justify-center rounded-full bg-[#7D3F46] px-5 text-sm font-medium text-white shadow-sm transition hover:bg-[#6B343B] sm:w-auto">
    {uploadingItemId === item.id ? "Enviando foto..." : "Adicionar foto"}
    <input
  type="file"
  accept="image/jpeg,image/png,image/webp"
  className="hidden"
  disabled={uploadingItemId === item.id}
  onChange={(event) => uploadItemPhoto(item.id, event)}
/>
  </label>

  {(photosByItem[item.id] || []).length > 0 ? (
    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {(photosByItem[item.id] || []).map((photo) => (
        <div
          key={photo.id}
          className="min-w-0 overflow-hidden rounded-2xl border border-[#E6D8C8] bg-white"
        >
          <a href={photo.photo_url} target="_blank" rel="noreferrer">
            <img
              src={photo.photo_url}
              alt={photo.caption || photoTypeLabel(photo.photo_type)}
              className="h-40 w-full object-cover"
            />
          </a>

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
              onClick={() => deletePhoto(photo)}
              className="mt-3 inline-flex min-h-9 w-full items-center justify-center rounded-full border border-[#E8C7C0] bg-red-50 px-3 text-xs font-medium text-[#9A4A3F] transition hover:bg-red-100"
            >
              Excluir foto
            </button>
          </div>
        </div>
      ))}
    </div>
  ) : (
    <div className="mt-4 rounded-2xl border border-dashed border-[#D8C7B1] bg-white p-4 text-sm leading-6 text-[#7A6A5D]">
      Nenhuma foto adicionada neste item ainda.
    </div>
  )}
</div>

                    </article>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-[2rem] border border-[#E6D8C8] bg-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.25em] text-[#9B5C5F]">
                Observações
              </p>

              <h2 className="mt-3 text-2xl font-semibold text-[#2E2723]">
                Anotações do atendimento
              </h2>

              <div className="mt-5 space-y-3">
                {order.general_notes ? (
                  <div className="rounded-3xl bg-[#F4EADF] p-4">
                    <p className="text-sm font-medium text-[#2E2723]">
                      Observação geral
                    </p>
                    <p className="mt-2 break-words text-sm leading-6 text-[#7A6A5D] [overflow-wrap:anywhere]">
                      {order.general_notes}
                    </p>
                  </div>
                ) : null}

                {order.client_notes ? (
                  <div className="rounded-3xl bg-[#F4EADF] p-4">
                    <p className="text-sm font-medium text-[#2E2723]">
                      Observação para cliente
                    </p>
                    <p className="mt-2 break-words text-sm leading-6 text-[#7A6A5D] [overflow-wrap:anywhere]">
                      {order.client_notes}
                    </p>
                  </div>
                ) : null}

                {order.internal_notes ? (
                  <div className="rounded-3xl bg-[#F4EADF] p-4">
                    <p className="text-sm font-medium text-[#2E2723]">
                      Observação interna
                    </p>
                    <p className="mt-2 break-words text-sm leading-6 text-[#7A6A5D] [overflow-wrap:anywhere]">
                      {order.internal_notes}
                    </p>
                  </div>
                ) : null}

                {!order.general_notes &&
                !order.client_notes &&
                !order.internal_notes ? (
                  <div className="rounded-3xl border border-dashed border-[#D8C7B1] bg-[#F4EADF] p-5 text-sm leading-7 text-[#7A6A5D]">
                    Nenhuma observação geral registrada.
                  </div>
                ) : null}
              </div>
            </div>
          </section>
        </section>
      </section>
    </main>
  );
}