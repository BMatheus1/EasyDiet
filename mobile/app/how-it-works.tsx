import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { AppLogo, BottomMenu, PremiumCard, PrimaryButton, colors } from "../src/ui";

const steps = [
  ["restaurant-outline", "Monte seu plano", "Escolha semanas, refeicoes, quantidades e ingredientes."],
  ["calculator-outline", "Veja o preco na hora", "O valor e calculado com base nas suas escolhas e no endereco de entrega."],
  ["shield-checkmark-outline", "Pague com seguranca", "A producao comeca somente apos o pagamento aprovado."],
  ["cube-outline", "Receba sua semana pronta", "Tudo pesado, organizado, congelado e etiquetado."]
] as const;

export default function HowItWorks() {
  return (
    <LinearGradient colors={["#FFFDF8", "#F4F7F2"]} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <AppLogo compact />
        <View style={styles.header}>
          <Text style={styles.title}>Como funciona</Text>
          <Text style={styles.subtitle}>Quatro passos simples para deixar sua rotina alimentar organizada.</Text>
        </View>
        <View style={styles.steps}>
          {steps.map(([icon, title, text], index) => (
            <PremiumCard key={title} style={styles.stepCard}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{index + 1}</Text>
              </View>
              <View style={styles.stepIcon}>
                <Ionicons name={icon} size={22} color={colors.forest} />
              </View>
              <Text style={styles.stepTitle}>{title}</Text>
              <Text style={styles.stepText}>{text}</Text>
            </PremiumCard>
          ))}
        </View>
        <PrimaryButton onPress={() => router.push("/builder")}>Comecar agora</PrimaryButton>
      </ScrollView>
      <BottomMenu />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 104, gap: 22 },
  header: { gap: 8 },
  title: { color: colors.ink, fontSize: 36, lineHeight: 42, fontWeight: "900" },
  subtitle: { color: colors.muted, fontSize: 16, lineHeight: 24 },
  steps: { gap: 12 },
  stepCard: { gap: 9 },
  stepNumber: { position: "absolute", right: 16, top: 16, width: 30, height: 30, borderRadius: 15, backgroundColor: colors.forest, alignItems: "center", justifyContent: "center" },
  stepNumberText: { color: colors.paper, fontWeight: "900" },
  stepIcon: { width: 44, height: 44, borderRadius: 16, backgroundColor: colors.mint, alignItems: "center", justifyContent: "center" },
  stepTitle: { color: colors.ink, fontSize: 18, fontWeight: "900" },
  stepText: { color: colors.muted, fontSize: 14, lineHeight: 21 }
});
