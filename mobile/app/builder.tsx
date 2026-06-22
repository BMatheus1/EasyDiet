import { Ionicons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ReactNode, useMemo, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { approveOrder, createOrder, getCatalog, getQuote, Ingredient, QuotePayload } from "../src/api";
import { useBuilderStore } from "../src/store";
import { Accordion, BottomMenu, ChoiceCard, InfoBanner, IngredientCard, PriceSummaryBar, PrimaryButton, SecondaryButton, StepHeader, StepProgress, brl, colors } from "../src/ui";
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

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.body}>
        <View style={styles.topbar}>
          <Pressable onPress={() => setStep((value) => Math.max(value - 1, 1))} style={styles.iconButton}>
            <Ionicons name="arrow-back" size={20} color="#17211D" />
          </Pressable>
          <StepProgress current={step} total={8} />
        </View>

        {step === 5 ? (
          <ProteinStep
            items={catalog.data?.filter((item) => item.category === "protein") ?? []}
            selected={store.proteins}
            onToggle={(id) => store.toggleIn("proteins", id)}
            onContinue={() => setStep((value) => Math.min(value + 1, 8))}
          />
        ) : step === 6 ? (
          <IngredientTabbedStep
            step={6}
            title="Carboidratos"
            subtitle="Escolha opcoes para variar sua semana sem deixar a montagem pesada."
            items={catalog.data?.filter((item) => item.category === "carb") ?? []}
            categories={carbCategories}
            selected={store.carbs}
            onToggle={(id) => store.toggleIn("carbs", id)}
            onContinue={() => setStep((value) => Math.min(value + 1, 8))}
            getCategory={carbCategoryFor}
            searchLabel="Buscar carboidrato"
            infoText="Todas as opcoes aparecem em listas rolaveis completas, com espaco para o resumo fixo no rodape."
          />
        ) : step === 7 ? (
          <IngredientTabbedStep
            step={7}
            title="Legumes e verduras"
            subtitle="Monte a base de micronutrientes do plano e salve suas restricoes."
            items={catalog.data?.filter((item) => item.category === "vegetable") ?? []}
            categories={vegetableCategories}
            selected={store.vegetables}
            onToggle={(id) => store.toggleIn("vegetables", id)}
            onContinue={() => setStep((value) => Math.min(value + 1, 8))}
            getCategory={vegetableCategoryFor}
            searchLabel="Buscar legume ou verdura"
            infoText="Role ate o ultimo item da categoria e selecione quantas opcoes quiser."
            footer={<RestrictionsEditor selected={store.restrictions} onToggle={(id) => store.toggleIn("restrictions", id)} />}
          />
        ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {step === 1 ? (
            <>
              <StepHeader step={1} title="Por quantas semanas quer se organizar?" subtitle="Voce pode montar um plano de 1 a 4 semanas." />
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
        )}
      </View>
      <PriceSummaryBar quote={quote.data} loading={quote.isFetching} error={quote.error?.message} onPress={() => setStep(8)} />
      <BottomMenu />
    </SafeAreaView>
  );
}

const proteinCategories = ["Bovino", "Suino", "Aves", "Ovos", "Peixes", "Frutos do mar", "Vegetarianas"] as const;
const carbCategories = ["Arroz e grãos", "Tubérculos", "Massas", "Purês", "Opções especiais"] as const;
const vegetableCategories = ["Legumes", "Verduras", "Mix cadastrados", "Opções Premium"] as const;

function ProteinStep({ items, selected, onToggle, onContinue }: { items: Ingredient[]; selected: string[]; onToggle: (id: string) => void; onContinue: () => void }) {
  const [activeCategory, setActiveCategory] = useState<(typeof proteinCategories)[number]>("Bovino");
  const [search, setSearch] = useState("");
  const grouped = useMemo(() => groupProteins(items), [items]);
  const visible = grouped[activeCategory] ?? [];
  const filtered = visible.filter((item) => normalizeText(item.name).includes(normalizeText(search)));

  return (
    <View style={styles.proteinListShell}>
      <FlashList
        data={filtered}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.proteinListContent}
        ListHeaderComponent={
          <View style={styles.proteinHeader}>
            <StepHeader
              step={5}
              title="Escolha suas proteinas"
              subtitle="Marque as opcoes que voce gostaria de receber no seu plano. O preco sera atualizado conforme suas escolhas."
            />
            <InfoBanner text="O nivel aparece apenas como selo no alimento. A categoria sempre segue o tipo real da proteina." />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryTabs}>
              {proteinCategories.map((category) => {
                const count = (grouped[category] ?? []).filter((item) => selected.includes(item.id)).length;
                const active = activeCategory === category;
                return (
                  <Pressable
                    key={category}
                    onPress={() => {
                      setActiveCategory(category);
                      setSearch("");
                    }}
                    style={[styles.categoryTab, active && styles.categoryTabActive]}
                  >
                    <Text style={[styles.categoryTabTitle, active && styles.categoryTabTitleActive]}>{category}</Text>
                    <Text style={[styles.categoryTabMeta, active && styles.categoryTabMetaActive]}>
                      {count} selecionado{count === 1 ? "" : "s"}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <View style={styles.categoryPanelHeader}>
              <Text style={styles.categoryPanelTitle}>{activeCategory}</Text>
              <Text style={styles.categoryPanelMeta}>{visible.length} opcoes disponiveis</Text>
            </View>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder={`Buscar corte ${activeCategory.toLowerCase()}`}
              style={styles.proteinSearch}
              placeholderTextColor="rgba(23,33,29,0.45)"
            />
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyProteinState}>
            <Text style={styles.emptyProteinTitle}>Nenhuma proteina {activeCategory.toLowerCase()} disponivel no momento.</Text>
            <Text style={styles.emptyProteinText}>Voce pode escolher outra categoria ou tentar novamente mais tarde.</Text>
          </View>
        }
        ListFooterComponent={
          <View style={styles.proteinFooter}>
            <PrimaryButton onPress={onContinue}>Continuar</PrimaryButton>
          </View>
        }
        renderItem={({ item }) => (
          <IngredientCard item={item} selected={selected.includes(item.id)} onPress={() => onToggle(item.id)} />
        )}
      />
    </View>
  );
}

function IngredientTabbedStep({
  step,
  title,
  subtitle,
  items,
  categories,
  selected,
  onToggle,
  onContinue,
  getCategory,
  searchLabel,
  infoText,
  footer
}: {
  step: number;
  title: string;
  subtitle: string;
  items: Ingredient[];
  categories: readonly string[];
  selected: string[];
  onToggle: (id: string) => void;
  onContinue: () => void;
  getCategory: (item: Ingredient) => string;
  searchLabel: string;
  infoText: string;
  footer?: ReactNode;
}) {
  const [activeCategory, setActiveCategory] = useState(categories[0] ?? "");
  const [search, setSearch] = useState("");
  const grouped = useMemo(() => groupIngredientCategories(items, categories, getCategory), [items, categories, getCategory]);
  const visible = grouped[activeCategory] ?? [];
  const filtered = visible.filter((item) => normalizeText(item.name).includes(normalizeText(search)));

  return (
    <View style={styles.proteinListShell}>
      <FlashList
        data={filtered}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.proteinListContent}
        ListHeaderComponent={
          <View style={styles.proteinHeader}>
            <StepHeader step={step} title={title} subtitle={subtitle} />
            <InfoBanner text={infoText} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryTabs}>
              {categories.map((category) => {
                const count = (grouped[category] ?? []).filter((item) => selected.includes(item.id)).length;
                const active = activeCategory === category;
                return (
                  <Pressable
                    key={category}
                    onPress={() => {
                      setActiveCategory(category);
                      setSearch("");
                    }}
                    style={[styles.categoryTab, active && styles.categoryTabActive]}
                  >
                    <Text style={[styles.categoryTabTitle, active && styles.categoryTabTitleActive]}>{category}</Text>
                    <Text style={[styles.categoryTabMeta, active && styles.categoryTabMetaActive]}>
                      {count} selecionado{count === 1 ? "" : "s"}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <View style={styles.categoryPanelHeader}>
              <Text style={styles.categoryPanelTitle}>{activeCategory}</Text>
              <Text style={styles.categoryPanelMeta}>{visible.length} opcoes disponiveis</Text>
            </View>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder={searchLabel}
              style={styles.proteinSearch}
              placeholderTextColor="rgba(23,33,29,0.45)"
            />
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyProteinState}>
            <Text style={styles.emptyProteinTitle}>Nenhum item disponivel em {activeCategory} no momento.</Text>
            <Text style={styles.emptyProteinText}>Voce pode escolher outra categoria ou tentar novamente mais tarde.</Text>
          </View>
        }
        ListFooterComponent={
          <View style={styles.proteinFooter}>
            {footer}
            <PrimaryButton onPress={onContinue}>Continuar</PrimaryButton>
          </View>
        }
        renderItem={({ item }) => (
          <IngredientCard item={item} selected={selected.includes(item.id)} onPress={() => onToggle(item.id)} />
        )}
      />
    </View>
  );
}

function RestrictionsEditor({ selected, onToggle }: { selected: string[]; onToggle: (id: string) => void }) {
  return (
    <View style={styles.restrictionsCard}>
      <Text style={styles.restrictionsTitle}>Restricoes</Text>
      <Text style={styles.restrictionsSubtitle}>Ingredientes incompativeis serao bloqueados no calculo.</Text>
      <View style={styles.wrap}>
        {restrictions.map(([id, label]) => {
          const active = selected.includes(id);
          return (
            <Pressable key={id} onPress={() => onToggle(id)} style={[styles.pill, active && styles.pillActive]}>
              <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
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

function groupProteins(items: Ingredient[]) {
  const grouped = Object.fromEntries(proteinCategories.map((category) => [category, [] as Ingredient[]])) as Record<(typeof proteinCategories)[number], Ingredient[]>;
  for (const item of items) {
    grouped[proteinCategoryFor(item)]?.push(item);
  }
  return grouped;
}

function groupIngredientCategories(items: Ingredient[], categories: readonly string[], getCategory: (item: Ingredient) => string) {
  const grouped = Object.fromEntries(categories.map((category) => [category, [] as Ingredient[]])) as Record<string, Ingredient[]>;
  for (const item of items) {
    const category = getCategory(item);
    if (!grouped[category]) grouped[category] = [];
    grouped[category].push(item);
  }
  return grouped;
}

function carbCategoryFor(item: Ingredient) {
  const value = normalizeText(`${item.subcategory} ${item.name}`);
  if (value.includes("arroz") || value.includes("grao")) return "Arroz e grãos";
  if (value.includes("tuberculo") || value.includes("batata") || value.includes("mandioca") || value.includes("mandioquinha") || value.includes("inhame") || value.includes("cara") || value.includes("abobora")) return "Tubérculos";
  if (value.includes("massa") || value.includes("macarrao")) return "Massas";
  if (value.includes("pure")) return "Purês";
  return "Opções especiais";
}

function vegetableCategoryFor(item: Ingredient) {
  const value = normalizeText(`${item.subcategory} ${item.name}`);
  if (value.includes("verdura") || value.includes("couve") || value.includes("espinafre")) return "Verduras";
  if (value.includes("mix")) return "Mix cadastrados";
  if (value.includes("premium") || value.includes("aspargo") || value.includes("cogumelo") || value.includes("vagem") || value.includes("ervilha")) return "Opções Premium";
  return "Legumes";
}

function proteinCategoryFor(item: Ingredient): (typeof proteinCategories)[number] {
  const value = normalizeText(`${item.subcategory} ${item.name}`);
  if (value.includes("suin")) return "Suino";
  if (value.includes("ave") || value.includes("frango") || value.includes("peru") || value.includes("coxa sem pele") || value.includes("sobrecoxa")) return "Aves";
  if (value.includes("ovo")) return "Ovos";
  if (value.includes("peix") || value.includes("tilapia") || value.includes("merluza") || value.includes("pescada") || value.includes("atum") || value.includes("salmao")) return "Peixes";
  if (value.includes("frutos") || value.includes("camarao") || value.includes("lula")) return "Frutos do mar";
  if (value.includes("vegetarian") || value.includes("tofu") || value.includes("grao") || value.includes("lentilha") || value.includes("feijao") || value.includes("soja")) return "Vegetarianas";
  return "Bovino";
}

function same(a: string[], b: string[]) {
  return a.length === b.length && a.every((value) => b.includes(value));
}

function sumGrams(values: { protein: number; carb: number; vegetable: number }) {
  return values.protein + values.carb + values.vegetable;
}

function normalizeText(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function accordionIcon(name: string) {
  const normalized = name.toLowerCase();
  if (normalized.includes("ave")) return "leaf-outline" as const;
  if (normalized.includes("bovin")) return "medal-outline" as const;
  if (normalized.includes("peix")) return "fish-outline" as const;
  if (normalized.includes("arroz") || normalized.includes("graos")) return "nutrition-outline" as const;
  if (normalized.includes("tub")) return "earth-outline" as const;
  if (normalized.includes("verd")) return "flower-outline" as const;
  return "albums-outline" as const;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F4F7F2" },
  body: { flex: 1, paddingBottom: 172 },
  topbar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 14 },
  iconButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" },
  content: { gap: 18, paddingHorizontal: 20, paddingBottom: 32 },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  proteinListShell: { flex: 1 },
  proteinListContent: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 190 },
  proteinHeader: { gap: 16, marginBottom: 12 },
  proteinSearch: { minHeight: 48, borderRadius: 16, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.paper, paddingHorizontal: 14, color: colors.ink, fontWeight: "700" },
  proteinFooter: { paddingTop: 10, paddingBottom: 12 },
  restrictionsCard: { gap: 10, borderRadius: 22, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.paper, padding: 16, marginBottom: 14 },
  restrictionsTitle: { color: colors.ink, fontSize: 19, fontWeight: "900" },
  restrictionsSubtitle: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  emptyProteinState: { borderRadius: 22, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.paper, padding: 18, gap: 8 },
  emptyProteinTitle: { color: colors.ink, fontSize: 17, fontWeight: "900" },
  emptyProteinText: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  categoryTabs: { gap: 10, paddingRight: 20 },
  categoryTab: { minWidth: 122, borderRadius: 20, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.paper, paddingHorizontal: 14, paddingVertical: 12 },
  categoryTabActive: { borderColor: colors.forest, backgroundColor: colors.mint },
  categoryTabTitle: { color: colors.ink, fontSize: 15, fontWeight: "900" },
  categoryTabTitleActive: { color: colors.forest },
  categoryTabMeta: { color: colors.muted, fontSize: 12, fontWeight: "800", marginTop: 4 },
  categoryTabMetaActive: { color: colors.forest },
  categoryPanel: { borderRadius: 24, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.paper, padding: 14 },
  categoryPanelHeader: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginBottom: 12 },
  categoryPanelTitle: { color: colors.ink, fontSize: 22, fontWeight: "900" },
  categoryPanelMeta: { color: colors.muted, fontSize: 12, fontWeight: "800" },
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
