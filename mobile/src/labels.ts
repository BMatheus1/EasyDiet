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

export const mealLabels: Record<string, string> = {
  lunch: "Almoco",
  dinner: "Jantar"
};

export function labelFrom(map: Record<string, string>, value: string) {
  return map[value] ?? value;
}

export function ingredientDescription(tier: string) {
  if (tier === "super_premium") return "Opcao nobre para planos especiais.";
  if (tier === "premium") return "Escolha refinada, com impacto no prazo e valor.";
  return "Base equilibrada para a rotina.";
}
