"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  BadgeDollarSign,
  Boxes,
  CalendarClock,
  ChevronDown,
  ClipboardList,
  Leaf,
  PackageCheck,
  Search,
  Settings,
  ShoppingBasket,
  Tags,
  Truck,
  Utensils
} from "lucide-react";
import {
  approvePayment,
  brl,
  getDashboard,
  getIngredients,
  getOrders,
  IngredientAdmin,
  labelFrom,
  orderStatusLabels,
  Order,
  paymentStatusLabels,
  tierLabels
} from "@/lib/api";

const statusFilters = ["todos", "pending", "approved"] as const;
const menuItems = [
  ["Dashboard", PackageCheck],
  ["Pedidos", ClipboardList],
  ["Lotes", Boxes],
  ["Lista de compras", ShoppingBasket],
  ["Ingredientes", Utensils],
  ["Precos e margens", Settings],
  ["Entregas", Truck],
  ["Etiquetas", Tags]
] as const;

export default function AdminPage() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ingredients, setIngredients] = useState<IngredientAdmin[]>([]);
  const [query, setQuery] = useState("");
  const [ingredientQuery, setIngredientQuery] = useState("");
  const [category, setCategory] = useState("todos");
  const [status, setStatus] = useState<(typeof statusFilters)[number]>("todos");
  const [openId, setOpenId] = useState<number | null>(null);

  async function refresh() {
    const [dash, rows, ingredientRows] = await Promise.all([getDashboard(), getOrders(), getIngredients()]);
    setDashboard(dash);
    setOrders(rows);
    setIngredients(ingredientRows);
  }

  useEffect(() => {
    refresh();
  }, []);

  const filtered = useMemo(() => {
    return orders.filter((order) => {
      const matchesStatus = status === "todos" || order.payment_status === status;
      const matchesQuery = `${order.id} ${order.customer_name} ${order.request?.address?.city ?? ""} ${order.request?.address?.district ?? ""}`
        .toLowerCase()
        .includes(query.toLowerCase());
      return matchesStatus && matchesQuery;
    });
  }, [orders, query, status]);

  const filteredIngredients = useMemo(() => {
    return ingredients.filter((item) => {
      const matchesCategory = category === "todos" || item.category === category;
      const matchesQuery = `${item.name} ${item.subcategory}`.toLowerCase().includes(ingredientQuery.toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [ingredients, category, ingredientQuery]);

  return (
    <main className="min-h-screen bg-[#F4F7F2] text-[#17211D]">
      <AdminSidebar />

      <section className="lg:pl-72">
        <header id="dashboard" className="border-b border-black/10 bg-[#FFFDF8]">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-black uppercase text-[#B88932]">Dashboard</p>
              <h2 className="text-3xl font-black">Operacao mastigada para produzir sem adivinhar</h2>
              <p className="mt-1 text-sm text-black/55">Pedidos, margem, compras, lote e etiquetas em uma visao limpa.</p>
            </div>
            <button onClick={refresh} className="rounded-2xl border border-black/10 bg-white px-5 py-3 font-black text-[#123D2E] shadow-sm">
              Atualizar painel
            </button>
          </div>
        </header>

        <section className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-5 py-6 md:grid-cols-4">
          <AdminMetricCard icon={<PackageCheck />} label="Pedidos pagos" value={dashboard?.paid_orders ?? 0} />
          <AdminMetricCard icon={<Boxes />} label="Marmitas vendidas" value={dashboard?.meals_sold ?? 0} />
          <AdminMetricCard icon={<BadgeDollarSign />} label="Receita confirmada" value={brl(dashboard?.confirmed_revenue ?? 0)} />
          <AdminMetricCard icon={<ShoppingBasket />} label="Custo estimado" value={brl(dashboard?.estimated_cost ?? 0)} />
          <AdminMetricCard icon={<Truck />} label="Lucro estimado" value={brl(dashboard?.estimated_profit ?? 0)} />
          <AdminMetricCard icon={<CalendarClock />} label="Margem media" value={`${Math.round((dashboard?.average_margin ?? 0) * 100)}%`} />
          <AdminMetricCard icon={<Boxes />} label="Lote atual" value={`${dashboard?.current_batch_meals ?? 0} marmitas`} />
          <AdminMetricCard icon={<ClipboardList />} label="Entregas proximas" value="0 alertas" />
        </section>

        <section id="pedidos" className="mx-auto max-w-7xl px-5 pb-8">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-black">Pedidos</h2>
              <p className="text-sm text-black/55">Somente pedidos com pagamento aprovado entram na fila de producao.</p>
            </div>
            <div className="flex flex-col gap-2 md:flex-row">
              <label className="flex h-12 items-center gap-2 rounded-2xl border border-black/10 bg-white px-4 shadow-sm">
                <Search size={18} />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar cliente, pedido ou bairro" className="w-72 bg-transparent outline-none" />
              </label>
              <select value={status} onChange={(event) => setStatus(event.target.value as any)} className="h-12 rounded-2xl border border-black/10 bg-white px-4 font-black shadow-sm">
                {statusFilters.map((item) => (
                  <option key={item} value={item}>
                    {item === "todos" ? "Todos" : labelFrom(paymentStatusLabels, item)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-black/10 bg-[#FFFDF8] shadow-sm">
            <div className="hidden grid-cols-7 gap-3 border-b border-black/10 px-5 py-4 text-xs font-black uppercase text-black/45 md:grid">
              <span>Cliente</span>
              <span>Plano</span>
              <span>Marmitas</span>
              <span>Total pago</span>
              <span>Pagamento</span>
              <span>Prazo</span>
              <span>Acoes</span>
            </div>
            {filtered.map((order) => (
              <div key={order.id} className="border-b border-black/10 last:border-b-0">
                <AdminOrderCard
                  order={order}
                  isOpen={openId === order.id}
                  onToggle={() => setOpenId(openId === order.id ? null : order.id)}
                  onApprove={async () => {
                    await approvePayment(order.id);
                    await refresh();
                  }}
                />
                {openId === order.id ? <OrderDetail order={order} /> : null}
              </div>
            ))}
            {filtered.length === 0 ? <div className="px-4 py-10 text-center text-black/55">Nenhum pedido encontrado.</div> : null}
          </div>
        </section>

        <section id="ingredientes" className="mx-auto max-w-7xl px-5 pb-12">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-black">Ingredientes</h2>
              <p className="text-sm text-black/55">Catalogo editavel do piloto: preco, rendimento, nivel, prazo e disponibilidade.</p>
            </div>
            <div className="flex flex-col gap-2 md:flex-row">
              <input value={ingredientQuery} onChange={(event) => setIngredientQuery(event.target.value)} placeholder="Buscar ingrediente" className="h-12 rounded-2xl border border-black/10 bg-white px-4 outline-none shadow-sm" />
              <select value={category} onChange={(event) => setCategory(event.target.value)} className="h-12 rounded-2xl border border-black/10 bg-white px-4 font-black shadow-sm">
                <option value="todos">Todas categorias</option>
                <option value="protein">Proteinas</option>
                <option value="carb">Carboidratos</option>
                <option value="vegetable">Legumes</option>
              </select>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filteredIngredients.slice(0, 24).map((item) => (
              <IngredientEditor key={item.id} item={item} />
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

function AdminSidebar() {
  return (
    <aside className="fixed bottom-0 left-0 top-0 hidden w-72 border-r border-black/10 bg-[#FFFDF8] p-5 lg:block">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#123D2E] text-white shadow-lg">
          <Leaf size={25} />
        </div>
        <div>
          <h1 className="text-2xl font-black">EasyDiet</h1>
          <p className="text-xs font-bold text-black/45">Painel operacional</p>
        </div>
      </div>
      <nav className="space-y-2">
        {menuItems.map(([label, Icon], index) => (
          <a key={label} href={index === 4 ? "#ingredientes" : index === 1 ? "#pedidos" : "#dashboard"} className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black ${index === 0 ? "bg-[#123D2E] text-white" : "text-black/65 hover:bg-[#EAF4EA]"}`}>
            <Icon size={18} />
            {label}
          </a>
        ))}
      </nav>
    </aside>
  );
}

function AdminMetricCard({ icon, label, value }: { icon: ReactNode; label: string; value: string | number }) {
  return (
    <div className="rounded-3xl border border-black/10 bg-[#FFFDF8] p-5 shadow-sm">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#123D2E] text-white">{icon}</div>
      <p className="text-sm font-bold text-black/55">{label}</p>
      <strong className="mt-1 block text-2xl">{value}</strong>
    </div>
  );
}

function AdminOrderCard({ order, isOpen, onToggle, onApprove }: { order: Order; isOpen: boolean; onToggle: () => void; onApprove: () => void }) {
  return (
    <div className="grid grid-cols-1 gap-3 px-5 py-5 md:grid-cols-7 md:items-center">
      <strong>#{order.id} {order.customer_name}</strong>
      <span>{order.request.weeks} sem. / {order.request.days_per_week} dias</span>
      <span>{order.quote.client.total_meals}</span>
      <span className="font-black">{brl(order.quote.client.final_price)}</span>
      <StatusBadge status={order.payment_status} />
      <span>{order.quote.client.preparation_days} dias uteis</span>
      <div className="flex flex-wrap gap-2">
        {order.payment_status !== "approved" ? (
          <button onClick={onApprove} className="rounded-xl bg-[#123D2E] px-3 py-2 text-sm font-black text-white">
            Aprovar
          </button>
        ) : null}
        <button onClick={onToggle} className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-black">Ver pedido</button>
        <button className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-black">Ver producao</button>
        <button className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-black">Lista de compras</button>
        <button className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-black">Gerar etiquetas</button>
        <button onClick={onToggle} aria-label={isOpen ? "Fechar detalhes" : "Abrir detalhes"} className="rounded-xl border border-black/10 bg-white px-3 py-2">
          <ChevronDown size={18} className={isOpen ? "rotate-180" : ""} />
        </button>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const approved = status === "approved";
  return (
    <span className={`w-fit rounded-full px-3 py-1 text-sm font-black ${approved ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>
      {labelFrom(paymentStatusLabels, status)}
    </span>
  );
}

function OrderDetail({ order }: { order: Order }) {
  const admin = order.quote.admin;
  return (
    <div className="grid gap-4 bg-[#FAFBF7] px-5 py-5 lg:grid-cols-3">
      <section className="rounded-2xl border border-black/10 bg-white p-4">
        <h3 className="mb-3 flex items-center gap-2 font-black"><BadgeDollarSign size={18} /> Pedido mastigado</h3>
        <Line label="Cliente" value={order.customer_name} />
        <Line label="Endereco" value={`${order.request?.address?.district ?? "-"} / ${order.request?.address?.city ?? "-"}`} />
        <Line label="Plano" value={`${order.request.weeks} semana(s), ${order.request.days_per_week} dias`} />
        <Line label="Marmitas" value={`${order.quote.client.total_meals}`} />
        <Line label="Status" value={labelFrom(orderStatusLabels, order.order_status)} />
        <Line label="Pagamento" value={labelFrom(paymentStatusLabels, order.payment_status)} />
        <Line label="Preco pago" value={brl(order.quote.client.final_price)} />
        <Line label="Custo estimado" value={brl(admin.total_cost)} />
        <Line label="Lucro" value={brl(admin.estimated_profit)} />
        <Line label="Margem" value={`${Math.round(admin.estimated_margin * 100)}%`} />
        {admin.batch.alert ? <p className="mt-3 rounded-xl bg-orange-100 p-3 text-sm font-black text-orange-800">{admin.batch.alert}</p> : null}
      </section>

      <section className="rounded-2xl border border-black/10 bg-white p-4">
        <h3 className="mb-3 flex items-center gap-2 font-black"><ShoppingBasket size={18} /> Lista de compras</h3>
        <div className="space-y-2">
          {admin.shopping_list.map((item) => (
            <div key={item.ingredient_id} className="rounded-xl bg-[#F4F7F2] p-3 text-sm">
              <strong>{item.name}</strong>
              <p>{item.raw_kg_needed} kg cru - {item.cooked_kg_expected} kg cozido</p>
              <p>{brl(item.estimated_cost)} - {item.supplier_reference} - {brl(item.price_per_kg_calc)}/kg</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-black/10 bg-white p-4">
        <h3 className="mb-3 flex items-center gap-2 font-black"><PackageCheck size={18} /> Producao e etiquetas</h3>
        <div className="max-h-72 space-y-2 overflow-auto pr-1">
          {admin.production_plan.slice(0, 16).map((item, index) => (
            <div key={`${item.week}-${item.day}-${item.meal}-${index}`} className="rounded-xl bg-[#F4F7F2] p-3 text-sm">
              <strong>Semana {item.week} - {item.day} - {item.meal}</strong>
              <p>{item.protein} + {item.carb} + {item.vegetable}</p>
              <p>{item.grams.protein}g proteina | {item.grams.carb}g carbo | {item.grams.vegetable}g legumes</p>
            </div>
          ))}
        </div>
        <div className="mt-3 rounded-xl border border-dashed border-[#B88932] p-3 text-sm">
          <strong>Etiqueta preview</strong>
          <p>EasyDiet - Cliente: {order.customer_name}</p>
          <p>Pedido #{order.id}</p>
        </div>
      </section>
    </div>
  );
}

function IngredientEditor({ item }: { item: IngredientAdmin }) {
  return (
    <article className="rounded-3xl border border-black/10 bg-[#FFFDF8] p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-black">{item.name}</h3>
          <p className="text-sm text-black/50">{item.subcategory}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-black ${item.is_available ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
          {item.is_available ? "Disponivel" : "Indisponivel"}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <Field label="Preco real" value={item.price_per_kg_real} />
        <Field label="Preco calculo" value={item.price_per_kg_calc} />
        <Field label="Rendimento" value={item.yield_factor} />
        <Field label="Prazo h" value={item.lead_time_hours} />
      </div>
      <div className="mt-3 flex items-center justify-between rounded-2xl bg-[#F4F7F2] px-3 py-2 text-sm">
        <span className="font-bold text-black/55">Nivel</span>
        <strong>{labelFrom(tierLabels, item.tier)}</strong>
      </div>
    </article>
  );
}

function Field({ label, value }: { label: string; value: number }) {
  return (
    <label className="rounded-2xl bg-[#F4F7F2] px-3 py-2">
      <span className="block text-xs font-bold text-black/50">{label}</span>
      <input defaultValue={value} className="mt-1 w-full bg-transparent font-black outline-none" />
    </label>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-black/10 py-2 text-sm last:border-b-0">
      <span className="text-black/55">{label}</span>
      <strong className="text-right">{value}</strong>
    </div>
  );
}
