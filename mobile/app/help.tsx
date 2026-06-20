import { LinearGradient } from "expo-linear-gradient";
import { ScrollView, StyleSheet, Text } from "react-native";
import { Accordion, AppLogo, BottomMenu, InfoBanner, colors } from "../src/ui";

const faqs = [
  ["Como funciona?", "Voce monta o plano, ve o preco na hora, confirma o pagamento e recebe tudo pesado, congelado e etiquetado."],
  ["Quando meu pedido comeca a ser preparado?", "A producao comeca somente apos o pagamento aprovado."],
  ["Posso escolher os ingredientes?", "Sim. Voce escolhe proteinas, carboidratos, legumes e restricoes alimentares."],
  ["Como o preco e calculado?", "O valor acompanha suas escolhas, quantidades, ingredientes, prazo e endereco de entrega."],
  ["Como funciona o prazo?", "O prazo considera compra dos ingredientes, preparo, pesagem, congelamento, embalagem e entrega."],
  ["Quais regioes sao atendidas?", "Neste piloto atendemos regioes do ABC dentro do raio operacional cadastrado."]
];

export default function Help() {
  return (
    <LinearGradient colors={["#FFFDF8", "#F4F7F2"]} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <AppLogo compact />
        <Text style={styles.title}>Ajuda</Text>
        <InfoBanner text="Produzimos sob demanda para garantir organizacao e qualidade." />
        {faqs.map(([question, answer]) => (
          <Accordion key={question} title={question}>
            <Text style={styles.answer}>{answer}</Text>
          </Accordion>
        ))}
      </ScrollView>
      <BottomMenu />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 104, gap: 14 },
  title: { color: colors.ink, fontSize: 34, fontWeight: "900", marginTop: 16 },
  answer: { color: colors.muted, fontSize: 15, lineHeight: 23 }
});
