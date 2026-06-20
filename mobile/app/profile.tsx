import { LinearGradient } from "expo-linear-gradient";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { AppLogo, BottomMenu, PremiumCard, SecondaryButton, StatusBadge, colors } from "../src/ui";

export default function Profile() {
  return (
    <LinearGradient colors={["#FFFDF8", "#F4F7F2"]} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <AppLogo compact />
        <View>
          <Text style={styles.title}>Perfil</Text>
          <Text style={styles.subtitle}>Dados simples para agilizar seus proximos pedidos.</Text>
        </View>
        <PremiumCard style={styles.card}>
          <Text style={styles.name}>Cliente EasyDiet</Text>
          <Text style={styles.muted}>Telefone: (11) 99999-9999</Text>
          <Text style={styles.muted}>Endereco padrao: Cooperativa, Sao Bernardo do Campo</Text>
        </PremiumCard>
        <PremiumCard style={styles.card}>
          <Text style={styles.sectionTitle}>Restricoes salvas</Text>
          <View style={styles.tags}>
            <StatusBadge label="Sem lactose" />
            <StatusBadge label="Sem gluten" />
          </View>
        </PremiumCard>
        <SecondaryButton>Sair</SecondaryButton>
      </ScrollView>
      <BottomMenu />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 104, gap: 16 },
  title: { color: colors.ink, fontSize: 34, fontWeight: "900", marginTop: 16 },
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: 6 },
  card: { gap: 8 },
  name: { color: colors.ink, fontSize: 21, fontWeight: "900" },
  muted: { color: colors.muted, fontSize: 14, lineHeight: 21 },
  sectionTitle: { color: colors.ink, fontSize: 17, fontWeight: "900" },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 8 }
});
