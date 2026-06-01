export default function Home() {
  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-[#F4EADF] text-[#2E2723]">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-5 sm:px-6 lg:px-10">
        <header className="flex w-full min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="break-words text-[11px] uppercase tracking-[0.28em] text-[#9B5C5F] [overflow-wrap:anywhere] sm:text-xs sm:tracking-[0.35em]">
              Soph & Nick Atelier
            </p>

            <h1 className="mt-2 break-words text-2xl font-semibold tracking-tight text-[#2E2723] [overflow-wrap:anywhere] sm:text-3xl">
              Soph & Nick Gestão
            </h1>
          </div>

          <div className="w-fit max-w-full rounded-full border border-[#E6D8C8] bg-white/80 px-4 py-2 text-sm text-[#7A6A5D] shadow-sm">
            Criações por Nília Diniz
          </div>
        </header>

        <div className="grid w-full flex-1 items-center gap-8 py-8 sm:py-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10">
          <section className="w-full min-w-0 space-y-6 sm:space-y-7">
            <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-[#E6D8C8] bg-white/80 px-4 py-2 text-sm text-[#7A6A5D] shadow-sm">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-[#C8A96A] text-xs text-[#9B5C5F]">
                ✦
              </span>

              <span className="min-w-0 break-words [overflow-wrap:anywhere]">
                Gestão elegante para ateliê de costura
              </span>
            </div>

            <div className="min-w-0 space-y-4 sm:space-y-5">
              <h2 className="max-w-3xl break-words text-4xl font-semibold leading-[1.08] tracking-tight text-[#2E2723] [overflow-wrap:anywhere] sm:text-5xl lg:text-6xl">
                Cada peça registrada, cada detalhe preservado.
              </h2>

              <p className="max-w-2xl break-words text-base leading-7 text-[#7A6A5D] [overflow-wrap:anywhere] sm:text-lg sm:leading-8">
                Um painel privado para organizar clientes, pedidos, fotos de
                entrada, avarias, valores, prazos, pagamentos e criações
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
                Ver Maison Soph & Nick
              </a>
            </div>

            <div className="grid w-full gap-3 pt-2 sm:grid-cols-3 sm:pt-4">
              <div className="min-w-0 rounded-3xl border border-[#E6D8C8] bg-white/80 p-4 shadow-sm">
                <p className="break-words text-sm font-semibold text-[#2E2723] [overflow-wrap:anywhere]">
                  Pedidos com fotos
                </p>
                <p className="mt-2 break-words text-sm leading-6 text-[#7A6A5D] [overflow-wrap:anywhere]">
                  Registre entrada, avarias e evolução da peça.
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
                  WhatsApp pronto
                </p>
                <p className="mt-2 break-words text-sm leading-6 text-[#7A6A5D] [overflow-wrap:anywhere]">
                  Mensagens com pedido, prazo, preço e observações.
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
                      Maison Soph & Nick
                    </p>

                    <h3 className="mt-2 break-words text-2xl font-semibold text-[#2E2723] [overflow-wrap:anywhere]">
                      Vitrine autoral
                    </h3>
                  </div>

                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-[#C8A96A] bg-white text-[#9B5C5F] shadow-sm sm:h-14 sm:w-14">
                    ✺
                  </div>
                </div>

                <div className="mt-6 w-full min-w-0 space-y-4 sm:mt-8">
                  <div className="min-w-0 rounded-3xl bg-white p-4 shadow-sm">
                    <div className="h-40 w-full rounded-2xl bg-gradient-to-br from-[#E8D8CB] via-[#F4EADF] to-[#C8A96A]/40 sm:h-44" />

                    <div className="mt-4 min-w-0">
                      <p className="break-words text-sm font-semibold text-[#2E2723] [overflow-wrap:anywhere]">
                        Vestido Aurora
                      </p>

                      <p className="mt-1 break-words text-sm text-[#7A6A5D] [overflow-wrap:anywhere]">
                        Peça autoral sob encomenda
                      </p>
                    </div>
                  </div>

                  <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="min-w-0 rounded-3xl border border-[#E6D8C8] bg-white p-4">
                      <p className="break-words text-[11px] uppercase tracking-[0.18em] text-[#9B5C5F] [overflow-wrap:anywhere] sm:text-xs sm:tracking-[0.2em]">
                        Status
                      </p>

                      <p className="mt-2 break-words text-sm font-medium text-[#2E2723] [overflow-wrap:anywhere]">
                        Em criação
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