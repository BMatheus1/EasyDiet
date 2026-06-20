import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { AppLogo, BottomMenu, PremiumCard, PrimaryButton, SecondaryButton, colors } from "../src/ui";

const benefits = [
  {
    icon: "options-outline",
    title: "Personalizado para voce",
    text: "Escolha proteinas, carboidratos, legumes e quantidades."
  },
  {
    icon: "cash-outline",
    title: "Preco na hora",
    text: "Veja o valor do seu plano antes de confirmar."
  },
  {
    icon: "snow-outline",
    title: "Producao sob demanda",
    text: "Seu pedido e preparado apos a confirmacao do pagamento."
  },
  {
    icon: "calendar-outline",
    title: "Entrega programada",
    text: "Receba seu plano com prazo pensado para qualidade."
  }
] as const;

export default function Home() {
  return (
    <LinearGradient colors={["#FFFDF8", "#F4F7F2"]} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.top}>
          <AppLogo />
          <SecondaryButton onPress={() => router.push("/help")}>Ajuda</SecondaryButton>
        </View>

        <View style={styles.hero}>
          <View style={styles.heroBadge}>
            <Ionicons name="sparkles-outline" size={16} color={colors.gold} />
            <Text style={styles.heroBadgeText}>Marmitas premium sob demanda</Text>
          </View>
          <Text style={styles.heroTitle}>Sua semana alimentar pronta, pesada e personalizada.</Text>
          <Text style={styles.heroCopy}>Voce escolhe os ingredientes e quantidades. Nos cuidamos da compra, preparo, congelamento e entrega.</Text>
          <View style={styles.actions}>
            <PrimaryButton onPress={() => router.push("/builder")}>Montar meu plano</PrimaryButton>
            <SecondaryButton onPress={() => router.push("/how-it-works")}>Como funciona</SecondaryButton>
          </View>
        </View>

        <View style={styles.benefitsGrid}>
          {benefits.map((benefit) => (
            <PremiumCard key={benefit.title} style={styles.benefitCard}>
              <View style={styles.benefitIcon}>
                <Ionicons name={benefit.icon} size={20} color={colors.forest} />
              </View>
              <Text style={styles.benefitTitle}>{benefit.title}</Text>
              <Text style={styles.benefitText}>{benefit.text}</Text>
            </PremiumCard>
          ))}
        </View>
      </ScrollView>
      <BottomMenu />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 104, gap: 28 },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  hero: { gap: 16 },
  heroBadge: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 99, backgroundColor: "#FFF8E8", paddingHorizontal: 12, paddingVertical: 8 },
  heroBadgeText: { color: colors.gold, fontSize: 12, fontWeight: "900" },
  heroTitle: { color: colors.ink, fontSize: 40, lineHeight: 46, fontWeight: "900", letterSpacing: 0 },
  heroCopy: { color: colors.muted, fontSize: 17, lineHeight: 26 },
  actions: { gap: 12, marginTop: 4 },
  benefitsGrid: { gap: 12 },
  benefitCard: { gap: 10 },
  benefitIcon: { width: 42, height: 42, borderRadius: 16, backgroundColor: colors.mint, alignItems: "center", justifyContent: "center" },
  benefitTitle: { color: colors.ink, fontSize: 17, fontWeight: "900" },
  benefitText: { color: colors.muted, fontSize: 14, lineHeight: 20 }
});
