export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type Order = {
  id: number;
  customer_name: string;
  customer_phone: string;
  payment_status: string;
  order_status: string;
  quote: {
    client: {
      total_meals: number;
      meal_subtotal: number;
      delivery_fee: number;
      final_price: number;
      preparation_days: number;
      quote_expires_at: string;
    };
    admin: {
      ingredient_cost: number;
      operational_cost: number;
      delivery_internal_cost: number;
      total_cost: number;
      price_final: number;
      estimated_profit: number;
      estimated_margin: number;
      tier_margin_used: string;
      shopping_list: ShoppingItem[];
      production_plan: ProductionItem[];
      labels: LabelItem[];
      batch: { status: string; alert: string | null };
    };
  };
  request: Record<string, any>;
  created_at: string;
};

export type ShoppingItem = {
  ingredient_id: string;
  name: string;
  category: string;
  subcategory: string;
  raw_kg_needed: number;
  cooked_kg_expected: number;
  estimated_cost: number;
  supplier_reference: string;
  price_per_kg_calc: number;
};

export type ProductionItem = {
  week: number;
  day: string;
  meal: string;
  protein: string;
  carb: string;
  vegetable: string;
  grams: { protein: number; carb: number; vegetable: number };
};

export type LabelItem = ProductionItem & {
  brand: string;
  customer: string;
  order_id: string;
  ingredients: string;
  restrictions: string[];
};

export type IngredientAdmin = {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  price_per_kg_real: number;
  price_per_kg_calc: number;
  yield_factor: number;
  tier: string;
  lead_time_hours: number;
  is_available: boolean;
};

export const tierLabels: Record<string, string> = {
  common: "Essencial",
  premium: "Premium",
  super_premium: "Super Premium"
};

export const paymentStatusLabels: Record<string, string> = {
  pending: "Aguardando pagamento",
  approved: "Pagamento aprovado",
  rejected: "Pagamento recusado",
  expired: "Pagamento expirado",
  refunded: "Reembolsado"
};

export const orderStatusLabels: Record<string, string> = {
  draft: "Rascunho",
  awaiting_payment: "Aguardando pagamento",
  payment_approved: "Pagamento aprovado",
  assigned_to_batch: "Na fila de producao",
  shopping_pending: "Compras pendentes",
  in_production: "Em producao",
  freezing: "Em congelamento",
  ready_for_delivery: "Pronto para entrega",
  out_for_delivery: "Saiu para entrega",
  delivered: "Entregue",
  canceled: "Cancelado"
};

export function labelFrom(map: Record<string, string>, value: string) {
  return map[value] ?? value;
}

export async function getDashboard() {
  const response = await fetch(`${API_URL}/admin/dashboard`, { cache: "no-store" });
  return response.json();
}

export async function getOrders(): Promise<Order[]> {
  const response = await fetch(`${API_URL}/admin/orders`, { cache: "no-store" });
  const data = await response.json();
  return data.items ?? [];
}

export async function getIngredients(): Promise<IngredientAdmin[]> {
  const response = await fetch(`${API_URL}/admin/ingredients`, { cache: "no-store" });
  const data = await response.json();
  return data.items ?? [];
}

export async function approvePayment(orderId: number) {
  const response = await fetch(`${API_URL}/orders/${orderId}/simulate-payment-approved`, { method: "POST" });
  if (!response.ok) throw new Error("Falha ao aprovar pagamento");
  return response.json();
}

export function brl(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}
