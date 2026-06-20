import { Ionicons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { approveOrder, createOrder, getCatalog, getQuote, Ingredient, QuotePayload } from "../src/api";
import { useBuilderStore } from "../src/store";
import { Accordion, BottomMenu, ChoiceCard, InfoBanner, IngredientCard, PriceSummaryBar, PrimaryButton, SecondaryButton, StepHeader, brl, colors } from "../src/ui";
import { useDebouncedValue } from "../src/useDebouncedValue";

const restrictions = [
  ["no_lactose", "Sem lactose"],
  ["no_gluten", "Sem gluten"],
  ["no_egg", "Sem ovo"],
  ["no_fish", "Sem peixe"],
  ["no_seafood", "Sem frutos do mar"],
  ["no_red_meat", "Sem carne vermelha"],
  ["no_pork", "Sem carne suina"],
  ["vegetarian", "Vegetariano"],
  ["vegan", "Vegano"]
] as const;

export default function Builder() {
  const [step, setStep] = useState(1);
  const store = useBuilderStore();
  const catalog = useQuery({ queryKey: ["catalog"], queryFn: getCatalog, staleTime: 1000 * 60 * 10 });
  const payload = useMemo<QuotePayload>(() => toPayload(store), [store]);
  const debouncedPayload = useDebouncedValue(payload, 500);
  const quote = useQuery({
    queryKey: ["quote", debouncedPayload],
    queryFn: () => getQuote(debouncedPayload),
    enabled: step > 1,
    retry: false
  });
  const order = useMutation({
    mutationFn: () => createOrder({ ...payload, customer_name: "Cliente EasyDiet", customer_phone: "11999999999" })
  });
  const approve = useMutation({ mutationFn: (id: number) => approveOrder(id) });
  const grouped = useMemo(() => groupCatalog(catalog.data ?? []), [catalog.data]);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.body}>
        <View style={styles.topbar}>
          <Pressable onPress={() => setStep((value) => Math.max(value - 1, 1))} style={styles.iconButton}>
            <Ionicons name="arrow-back" size={20} color="#17211D" />
          </Pressable>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${(step / 8) * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>{step}/8</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {step === 1 ? (
            <>
              <StepHeader step={1} title="Duracao do plano" subtitle="Escolha por quantas semanas deseja deixar sua rotina organizada." />
              {[1, 2, 3, 4].map((weeks) => (
                <ChoiceCard key={weeks} icon="calendar-outline" title={`${weeks} semana${weeks > 1 ? "s" : ""}`} subtitle="Organize sua rotina com previsibilidade." selected={store.weeks === weeks} onPress={() => store.set("weeks", weeks)} />
              ))}
            </>
          ) : null}

          {step === 2 ? (
            <>
              <StepHeader step={2} title="Frequencia semanal" subtitle="Defina quantos dias por semana voce quer cobrir." />
              {[3, 5, 7].map((days) => (
                <ChoiceCard key={days} icon="repeat-outline" title={`${days} dias`} subtitle="Seu preco sera atualizado conforme suas escolhas." selected={store.daysPerWeek === days} onPress={() => store.set("daysPerWeek", days)} />
              ))}
            </>
          ) : null}

          {step === 3 ? (
            <>
              <StepHeader step={3} title="Refeicoes" subtitle={`Seu plano tera ${store.daysPerWeek * store.mealTypes.length} marmitas por semana.`} />
              <ChoiceCard icon="sunny-outline" title="So almoco" subtitle="Ideal para organizar os dias uteis." selected={same(store.mealTypes, ["lunch"])} onPress={() => store.set("mealTypes", ["lunch"])} />
              <ChoiceCard icon="moon-outline" title="So jantar" subtitle="Praticidade para fechar o dia sem improviso." selected={same(store.mealTypes, ["dinner"])} onPress={() => store.set("mealTypes", ["dinner"])} />
              <ChoiceCard icon="restaurant-outline" title="Almoco e jantar" subtitle="Rotina completa, pesada e congelada." selected={same(store.mealTypes, ["lunch", "dinner"])} onPress={() => store.set("mealTypes", ["lunch", "dinner"])} />
            </>
          ) : null}

          {step === 4 ? (
            <>
              <StepHeader step={4} title="Quantidades" subtitle="Ajuste a gramagem final de cada refeicao." />
              <InfoBanner text="Seu preco sera atualizado conforme as quantidades escolhidas, sem travar a montagem." />
              {store.mealTypes.map((meal) => (
                <Accordion key={meal} title={meal === "lunch" ? "Almoco" : "Jantar"} right={<Text style={styles.mutedSmall}>{sumGrams(store.grams[meal])}g</Text>} defaultOpen>
                  {(["protein", "carb", "vegetable"] as const).map((field) => (
                    <GramRow key={field} label={field === "protein" ? "Proteina" : field === "carb" ? "Carboidrato" : "Legumes"} value={store.grams[meal][field]} onChange={(value) => store.set("grams", { ...store.grams, [meal]: { ...store.grams[meal], [field]: value } })} />
                  ))}
                </Accordion>
              ))}
            </>
          ) : null}

          {step === 5 ? <IngredientStep step={5} title="Proteinas" subtitle="Marque as proteinas que aceita no plano." groups={grouped.protein} selected={store.proteins} onToggle={(id) => store.toggleIn("proteins", id)} /> : null}
          {step === 6 ? <IngredientStep step={6} title="Carboidratos" subtitle="Escolha opcoes para variar sua semana." groups={grouped.carb} selected={store.carbs} onToggle={(id) => store.toggleIn("carbs", id)} /> : null}

          {step === 7 ? (
            <>
              <IngredientStep step={7} title="Legumes e verduras" subtitle="Monte a base de micronutrientes do plano." groups={grouped.vegetable} selected={store.vegetables} onToggle={(id) => store.toggleIn("vegetables", id)} />
              <StepHeader step={7} title="Restricoes" subtitle="Ingredientes incompativeis serao bloqueados no calculo." />
              <View style={styles.wrap}>
                {restrictions.map(([id, label]) => {
                  const active = store.restrictions.includes(id);
                  return (
                    <Pressable key={id} onPress={() => store.toggleIn("restrictions", id)} style={[styles.pill, active && styles.pillActive]}>
                      <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          ) : null}

          {step === 8 ? (
            <>
              <StepHeader step={8} title="Seu plano EasyDiet" subtitle="Confira prazo, frete e total final antes de pagar." />
              <View style={styles.card}>
                {(["zip_code", "street", "number", "district", "city", "complement", "reference"] as const).map((field) => (
                  <TextInput key={field} value={store.address[field]} onChangeText={(text) => store.set("address", { ...store.address, [field]: text })} placeholder={field} style={styles.input} placeholderTextColor="rgba(23,33,29,0.45)" />
                ))}
              </View>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Checkout</Text>
                {quote.data ? (
                  <>
                    <Text style={styles.muted}>{store.weeks} semana(s) - {store.daysPerWeek} dias - {store.mealTypes.length === 2 ? "Almoco e jantar" : store.mealTypes[0] === "lunch" ? "So almoco" : "So jantar"}</Text>
                    <Text style={styles.muted}>{quote.data.total_meals} marmitas</Text>
                    <Text style={styles.muted}>Marmitas: {brl(quote.data.meal_subtotal)}</Text>
                    <Text style={styles.muted}>Entrega: {brl(quote.data.delivery_fee)}</Text>
                    <Text style={styles.total}>Total: {brl(quote.data.final_price)}</Text>
                    <Text style={styles.mutedSmall}>Entrega a partir de {quote.data.preparation_days} dias uteis apos pagamento aprovado.</Text>
                    <InfoBanner text="Seu pedido sera produzido sob demanda. O prazo considera compra dos ingredientes, preparo, pesagem, congelamento e entrega." />
                  </>
                ) : (
                  <Text style={styles.error}>{quote.error?.message ?? "Preencha os dados para calcular."}</Text>
                )}
              </View>
              <PrimaryButton disabled={!quote.data || order.isPending} onPress={() => order.mutate()}>Confirmar e pagar</PrimaryButton>
              {order.data ? (
                <SecondaryButton onPress={() => approve.mutate(order.data.id)}>Simular pagamento aprovado #{order.data.id}</SecondaryButton>
              ) : null}
            </>
          ) : null}

          {step < 8 ? (
            <PrimaryButton onPress={() => setStep((value) => Math.min(value + 1, 8))}>Continuar</PrimaryButton>
          ) : null}
        </ScrollView>
      </View>
      <PriceSummaryBar quote={quote.data} loading={quote.isFetching} error={quote.error?.message} onPress={() => setStep(8)} />
      <BottomMenu />
    </SafeAreaView>
  );
}

function IngredientStep({ step, title, subtitle, groups, selected, onToggle }: { step: number; title: string; subtitle: string; groups: Record<string, Ingredient[]>; selected: string[]; onToggle: (id: string) => void }) {
  return (
    <>
      <StepHeader step={step} title={title} subtitle={subtitle} />
      <InfoBanner text="Ingredientes Premium podem alterar o valor e o prazo. Tudo aparece no resumo antes de confirmar." />
      {Object.entries(groups).map(([name, items]) => (
        <Accordion key={name} title={name} defaultOpen={items.length <= 6}>
          <View style={{ height: Math.min(360, Math.max(96, items.length * 76)) }}>
            <FlashList
              data={items}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <IngredientCard item={item} selected={selected.includes(item.id)} onPress={() => onToggle(item.id)} />
              )}
            />
          </View>
        </Accordion>
      ))}
    </>
  );
}

function GramRow({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  const options = label === "Proteina" ? [100, 120, 150, 180, 200, 250] : label === "Carboidrato" ? [0, 50, 80, 100, 120, 150, 200] : [50, 80, 100, 120, 150, 200];
  return (
    <View style={styles.gramBlock}>
      <Text style={styles.gramLabel}>{label}</Text>
      <View style={styles.wrap}>
        {options.map((item) => {
          const active = value === item;
          return (
            <Pressable key={item} onPress={() => onChange(item)} style={[styles.gramPill, active && styles.pillActive]}>
              <Text style={[styles.pillText, active && styles.pillTextActive]}>{item}g</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function toPayload(store: ReturnType<typeof useBuilderStore.getState>): QuotePayload {
  return {
    weeks: store.weeks,
    days_per_week: store.daysPerWeek,
    meal_types: store.mealTypes,
    grams: store.grams,
    protein_ids: store.proteins,
    carb_ids: store.carbs,
    vegetable_ids: store.vegetables,
    restrictions: store.restrictions,
    address: store.address
  };
}

function groupCatalog(items: Ingredient[]) {
  const base: Record<"protein" | "carb" | "vegetable", Record<string, Ingredient[]>> = { protein: {}, carb: {}, vegetable: {} };
  for (const item of items) {
    const group = base[item.category];
    group[item.subcategory] = [...(group[item.subcategory] ?? []), item];
  }
  return base;
}

function same(a: string[], b: string[]) {
  return a.length === b.length && a.every((value) => b.includes(value));
}

function sumGrams(values: { protein: number; carb: number; vegetable: number }) {
  return values.protein + values.carb + values.vegetable;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F4F7F2" },
  body: { flex: 1, paddingBottom: 172 },
  topbar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 14 },
  iconButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" },
  progressTrack: { flex: 1, height: 8, marginHorizontal: 16, overflow: "hidden", borderRadius: 99, backgroundColor: "rgba(23,33,29,0.1)" },
  progressFill: { height: "100%", borderRadius: 99, backgroundColor: colors.gold },
  progressText: { color: colors.forest, fontWeight: "900" },
  content: { gap: 18, paddingHorizontal: 20, paddingBottom: 32 },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  card: { gap: 12, borderRadius: 24, borderWidth: 1, borderColor: "rgba(18,61,46,0.08)", backgroundColor: "#FFFDF8", padding: 18 },
  cardTitle: { color: colors.ink, fontSize: 21, fontWeight: "900" },
  input: { minHeight: 48, borderRadius: 12, borderWidth: 1, borderColor: "rgba(23,33,29,0.1)", paddingHorizontal: 12, color: "#17211D", backgroundColor: "#FFFFFF" },
  muted: { color: "rgba(23,33,29,0.7)", fontSize: 15, lineHeight: 22 },
  mutedSmall: { color: "rgba(23,33,29,0.58)", fontSize: 13, lineHeight: 18 },
  total: { color: colors.forest, fontSize: 24, fontWeight: "900" },
  error: { color: "#D86F4A", fontWeight: "700" },
  pill: { borderRadius: 99, borderWidth: 1, borderColor: "rgba(23,33,29,0.1)", backgroundColor: "#FFFFFF", paddingHorizontal: 14, paddingVertical: 10 },
  pillActive: { borderColor: "#123D2E", backgroundColor: "#123D2E" },
  pillText: { color: "#17211D", fontWeight: "800" },
  pillTextActive: { color: "#FFFFFF" },
  gramBlock: { marginBottom: 16 },
  gramLabel: { marginBottom: 8, color: "#17211D", fontWeight: "800" },
  gramPill: { borderRadius: 99, backgroundColor: "#F4F7F2", paddingHorizontal: 12, paddingVertical: 9 }
});
