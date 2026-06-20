import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { getMyOrders } from "../src/api";
import { labelFrom, orderStatusLabels, paymentStatusLabels } from "../src/labels";
import { AppLogo, BottomMenu, EmptyState, LoadingSkeleton, PremiumCard, StatusBadge, brl, colors } from "../src/ui";

export default function Orders() {
  const orders = useQuery({ queryKey: ["my-orders"], queryFn: getMyOrders, refetchInterval: 8000 });
  return (
    <LinearGradient colors={["#FFFDF8", "#F4F7F2"]} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <AppLogo compact />
        <View>
          <Text style={styles.title}>Meus pedidos</Text>
          <Text style={styles.subtitle}>Acompanhe seus planos e pagamentos em portugues, sem termos tecnicos.</Text>
        </View>
        {orders.isLoading ? <LoadingSkeleton /> : null}
        {!orders.isLoading && (orders.data ?? []).length === 0 ? <EmptyState title="Nenhum pedido ainda" subtitle="Monte seu primeiro plano para acompanhar tudo por aqui." /> : null}
        {(orders.data ?? []).map((order) => (
          <PremiumCard key={order.id} style={styles.orderCard}>
            <View style={styles.orderTop}>
              <View>
                <Text style={styles.orderTitle}>Pedido #{order.id}</Text>
                <Text style={styles.orderMeta}>Plano de {order.request.weeks} semana(s) - {order.quote.client.total_meals} marmitas</Text>
              </View>
              <StatusBadge label={labelFrom(paymentStatusLabels, order.payment_status)} tone={order.payment_status === "approved" ? "forest" : "gold"} />
            </View>
            <View style={styles.orderLines}>
              <Line label="Status" value={labelFrom(orderStatusLabels, order.order_status)} />
              <Line label="Prazo" value={`${order.quote.client.preparation_days} dias uteis apos pagamento`} />
              <Line label="Total" value={brl(order.quote.client.final_price)} />
            </View>
          </PremiumCard>
        ))}
      </ScrollView>
      <BottomMenu />
    </LinearGradient>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.line}>
      <Text style={styles.lineLabel}>{label}</Text>
      <Text style={styles.lineValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 104, gap: 16 },
  title: { color: colors.ink, fontSize: 34, fontWeight: "900", marginTop: 16 },
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: 6 },
  orderCard: { gap: 14 },
  orderTop: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  orderTitle: { color: colors.ink, fontSize: 19, fontWeight: "900" },
  orderMeta: { color: colors.muted, fontSize: 13, marginTop: 4 },
  orderLines: { gap: 8 },
  line: { flexDirection: "row", justifyContent: "space-between", gap: 16, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 9 },
  lineLabel: { color: colors.muted, fontSize: 13, fontWeight: "700" },
  lineValue: { color: colors.ink, fontSize: 13, fontWeight: "900", textAlign: "right", flex: 1 }
});
