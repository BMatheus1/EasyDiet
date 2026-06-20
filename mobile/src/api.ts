import { z } from "zod";

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000";

export const ingredientSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.enum(["protein", "carb", "vegetable"]),
  subcategory: z.string(),
  tier: z.string(),
  lead_time_hours: z.number(),
  is_available: z.boolean()
});

export type Ingredient = z.infer<typeof ingredientSchema>;

export type MobileOrder = {
  id: number;
  customer_name: string;
  payment_status: string;
  order_status: string;
  quote: {
    client: {
      total_meals: number;
      final_price: number;
      preparation_days: number;
    };
  };
  request: {
    weeks: number;
    days_per_week: number;
    meal_types: ("lunch" | "dinner")[];
  };
  created_at: string;
};

export type QuotePayload = {
  weeks: number;
  days_per_week: number;
  meal_types: ("lunch" | "dinner")[];
  grams: Record<"lunch" | "dinner", { protein: number; carb: number; vegetable: number }>;
  protein_ids: string[];
  carb_ids: string[];
  vegetable_ids: string[];
  restrictions: string[];
  address: {
    zip_code: string;
    street: string;
    number: string;
    district: string;
    city: string;
    complement: string;
    reference: string;
  };
};

export async function getCatalog(): Promise<Ingredient[]> {
  const response = await fetch(`${API_URL}/catalog`);
  const data = await response.json();
  return z.array(ingredientSchema).parse(data.items);
}

export async function getQuote(payload: QuotePayload) {
  const response = await fetch(`${API_URL}/pricing/quote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail?.message ?? "Nao foi possivel calcular o plano.");
  }
  return response.json();
}

export async function createOrder(payload: QuotePayload & { customer_name: string; customer_phone: string }) {
  const response = await fetch(`${API_URL}/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail?.message ?? "Nao foi possivel criar o pedido.");
  }
  return response.json();
}

export async function approveOrder(orderId: number) {
  const response = await fetch(`${API_URL}/orders/${orderId}/simulate-payment-approved`, { method: "POST" });
  if (!response.ok) throw new Error("Nao foi possivel aprovar o pagamento.");
  return response.json();
}

export async function getMyOrders(): Promise<MobileOrder[]> {
  const response = await fetch(`${API_URL}/admin/orders`);
  if (!response.ok) throw new Error("Nao foi possivel carregar seus pedidos.");
  const data = await response.json();
  return data.items ?? [];
}
