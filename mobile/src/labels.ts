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

export function proteinDescription(name: string, tier: string) {
  const normalized = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (normalized.includes("file mignon")) return "Corte macio e nobre para planos especiais.";
  if (normalized.includes("picanha")) return "Corte marcante para uma experiencia mais premium.";
  if (normalized.includes("alcatra")) return "Corte versatil, macio e muito pedido.";
  if (normalized.includes("patinho")) return "Opcao magra, pratica e equilibrada.";
  if (normalized.includes("frango") || normalized.includes("sassami")) return "Leve, versatil e facil de combinar na rotina.";
  if (normalized.includes("peru")) return "Opcao leve com perfil mais refinado.";
  if (normalized.includes("ovo")) return "Alternativa simples, proteica e vegetariana.";
  if (normalized.includes("tilapia") || normalized.includes("salmao") || normalized.includes("atum")) return "Proteina leve com preparo delicado.";
  if (normalized.includes("camarao") || normalized.includes("lula")) return "Opcao especial que pode alterar valor e prazo.";
  if (normalized.includes("tofu") || normalized.includes("lentilha") || normalized.includes("grao") || normalized.includes("soja")) return "Alternativa vegetal para variar o plano.";
  return ingredientDescription(tier);
}
