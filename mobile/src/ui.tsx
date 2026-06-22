import { Ionicons } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";
import { PropsWithChildren, ReactNode, memo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ingredientDescription, labelFrom, proteinDescription, tierLabels } from "./labels";
import type { Ingredient } from "./api";

export const colors = {
  forest: "#163D2B",
  leaf: "#CFE7D6",
  mint: "#E8F3EC",
  paper: "#FAF8F3",
  surface: "#FFFFFF",
  mist: "#F4F7F2",
  ink: "#1D1D1F",
  muted: "#6B7280",
  gold: "#C9A86A",
  coral: "#B42318",
  line: "#E5E2DA"
};

export function LeafLogoIcon({ compact = false }: { compact?: boolean }) {
  return (
    <View style={[styles.logoMark, compact && styles.logoMarkCompact]}>
      <Ionicons name="leaf" color={colors.paper} size={compact ? 20 : 26} />
      <View style={styles.logoCheck}>
        <Ionicons name="checkmark" size={9} color={colors.forest} />
      </View>
    </View>
  );
}

export function AppLogo({ compact = false }: { compact?: boolean }) {
  return (
    <View style={styles.logoRow}>
      <LeafLogoIcon compact={compact} />
      <View>
        <Text style={[styles.logoText, compact && styles.logoTextCompact]}>EasyDiet</Text>
        {!compact ? <Text style={styles.logoSub}>Personalizado sob demanda</Text> : null}
      </View>
    </View>
  );
}

export function AppHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <View style={styles.appHeader}>
      <View style={styles.flex}>
        <AppLogo compact />
        <Text style={styles.appHeaderTitle}>{title}</Text>
        {subtitle ? <Text style={styles.appHeaderSubtitle}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

export function PremiumCard({ children, style }: PropsWithChildren<{ style?: object }>) {
  return <View style={[styles.premiumCard, style]}>{children}</View>;
}

export const SelectableCard = memo(function SelectableCard({
  title,
  subtitle,
  selected,
  disabled,
  icon,
  onPress
}: {
  title: string;
  subtitle?: string;
  selected?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={({ pressed }) => [styles.selectable, selected && styles.selectableActive, pressed && styles.selectablePressed, disabled && styles.selectableDisabled]}>
      <View style={styles.selectableContent}>
        {icon ? (
          <View style={[styles.smallIcon, selected && styles.smallIconActive]}>
            <Ionicons name={icon} size={18} color={colors.forest} />
          </View>
        ) : null}
        <View style={styles.flex}>
          <Text style={styles.selectableTitle}>{title}</Text>
          {subtitle ? <Text style={styles.selectableSubtitle}>{subtitle}</Text> : null}
        </View>
        <Ionicons name={selected ? "checkmark-circle" : "ellipse-outline"} size={24} color={selected ? colors.forest : "rgba(23,33,29,0.32)"} />
      </View>
    </Pressable>
  );
});

export const ChoiceCard = SelectableCard;

export const IngredientCard = memo(function IngredientCard({ item, selected, onPress }: { item: Ingredient; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.ingredientCard, selected && styles.ingredientCardActive]}>
      <View style={styles.ingredientTop}>
        <View style={styles.flex}>
          <Text style={styles.ingredientName}>{item.name}</Text>
          <Text style={styles.ingredientDescription}>{item.category === "protein" ? proteinDescription(item.name, item.tier) : ingredientDescription(item.tier)}</Text>
        </View>
        <Ionicons name={selected ? "checkmark-circle" : "add-circle-outline"} size={25} color={selected ? colors.forest : colors.muted} />
      </View>
      <View style={styles.ingredientMeta}>
        <TierBadge tier={item.tier} />
        <Text style={styles.ingredientHint}>{item.tier === "super_premium" ? "Altera valor e prazo" : "Preco atualizado no resumo"}</Text>
      </View>
    </Pressable>
  );
});

export function PriceSummaryBar({ quote, loading, error, onPress }: { quote?: any; loading?: boolean; error?: string; onPress?: () => void }) {
  return (
    <View style={styles.bottom}>
      <View style={styles.bottomGlow} />
      <View style={styles.bottomRow}>
        <View style={styles.flex}>
          <Text style={styles.bottomLabel}>Plano atual</Text>
          <Text style={styles.bottomMeta}>{quote ? `${quote.total_meals} marmitas` : loading ? "Atualizando preco..." : error ?? "Escolha o que combina com sua rotina."}</Text>
        </View>
        <View style={styles.bottomRight}>
          <Text style={styles.bottomPrice}>{quote ? brl(quote.final_price) : "--"}</Text>
          <Pressable onPress={onPress} style={styles.summaryButton}>
            <Text style={styles.summaryButtonText}>Ver resumo</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export const BottomQuote = PriceSummaryBar;

export function SectionAccordion({
  title,
  children,
  defaultOpen = false,
  right,
  icon = "albums-outline",
  selectedCount
}: PropsWithChildren<{ title: string; defaultOpen?: boolean; right?: ReactNode; icon?: keyof typeof Ionicons.glyphMap; selectedCount?: number }>) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <View style={styles.accordion}>
      <Pressable onPress={() => setOpen((value) => !value)} style={styles.accordionHead}>
        <View style={styles.accordionTitleRow}>
          <View style={styles.accordionIcon}>
            <Ionicons name={icon} size={18} color={colors.forest} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.accordionTitle}>{title}</Text>
            {selectedCount !== undefined ? <Text style={styles.accordionCount}>{selectedCount} selecionada{selectedCount === 1 ? "" : "s"}</Text> : right}
          </View>
        </View>
        <Ionicons name={open ? "chevron-up" : "chevron-down"} size={20} color={colors.forest} />
      </Pressable>
      {open ? <View style={styles.accordionBody}>{children}</View> : null}
    </View>
  );
}

export const Accordion = SectionAccordion;

export function StepHeader({ step, title, subtitle }: { step: number; title: string; subtitle: string }) {
  return (
    <View style={styles.header}>
      <Text style={styles.step}>Etapa {step} de 8</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

export function StepProgress({ current, total }: { current: number; total: number }) {
  return (
    <View style={styles.stepProgress}>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${(current / total) * 100}%` }]} />
      </View>
      <Text style={styles.progressText}>{current}/{total}</Text>
    </View>
  );
}

export function PrimaryButton({ children, onPress, disabled }: PropsWithChildren<{ onPress?: () => void; disabled?: boolean }>) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={[styles.primaryButton, disabled && styles.disabled]}>
      <Text style={styles.primaryText}>{children}</Text>
      <Ionicons name="arrow-forward" size={20} color={colors.paper} />
    </Pressable>
  );
}

export function SecondaryButton({ children, onPress }: PropsWithChildren<{ onPress?: () => void }>) {
  return (
    <Pressable onPress={onPress} style={styles.secondaryButton}>
      <Text style={styles.secondaryText}>{children}</Text>
    </Pressable>
  );
}

export function StatusBadge({ label, tone = "soft" }: { label: string; tone?: "soft" | "forest" | "gold" | "danger" }) {
  return (
    <View style={[styles.badge, tone === "forest" && styles.badgeForest, tone === "gold" && styles.badgeGold, tone === "danger" && styles.badgeDanger]}>
      <Text style={[styles.badgeText, tone !== "soft" && styles.badgeTextStrong]}>{label}</Text>
    </View>
  );
}

export function TierBadge({ tier }: { tier: string }) {
  const tone = tier === "super_premium" ? "darkGold" : tier === "premium" ? "gold" : "soft";
  return (
    <View style={[styles.tierBadge, tone === "gold" && styles.tierBadgeGold, tone === "darkGold" && styles.tierBadgeDark]}>
      <Text style={[styles.tierBadgeText, tone === "darkGold" && styles.tierBadgeTextDark]}>{labelFrom(tierLabels, tier)}</Text>
    </View>
  );
}

export function InfoBanner({ text, icon = "sparkles-outline" }: { text: string; icon?: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={styles.infoBanner}>
      <Ionicons name={icon} size={18} color={colors.gold} />
      <Text style={styles.infoText}>{text}</Text>
    </View>
  );
}

export function EmptyState({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <PremiumCard style={styles.empty}>
      <Ionicons name="receipt-outline" size={32} color={colors.forest} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySubtitle}>{subtitle}</Text>
    </PremiumCard>
  );
}

export function LoadingSkeleton() {
  return (
    <View style={styles.skeletonWrap}>
      <View style={styles.skeletonLineWide} />
      <View style={styles.skeletonLine} />
      <View style={styles.skeletonCard} />
    </View>
  );
}

export function BottomMenu() {
  const pathname = usePathname();
  const items = [
    { href: "/", label: "Inicio", icon: "home-outline" },
    { href: "/builder", label: "Plano", icon: "restaurant-outline" },
    { href: "/orders", label: "Pedidos", icon: "receipt-outline" },
    { href: "/profile", label: "Perfil", icon: "person-outline" },
    { href: "/help", label: "Ajuda", icon: "help-circle-outline" }
  ] as const;
  return (
    <View style={styles.menu}>
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Pressable key={item.href} onPress={() => router.push(item.href)} style={styles.menuItem}>
            <Ionicons name={active ? item.icon.replace("-outline", "") as any : item.icon} size={21} color={active ? colors.forest : colors.muted} />
            <Text style={[styles.menuText, active && styles.menuTextActive]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export const BottomNavigation = BottomMenu;

export function brl(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  textWhite: { color: colors.paper },
  textWhiteMuted: { color: "rgba(255,253,248,0.74)" },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  logoMark: { width: 54, height: 54, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: colors.forest, shadowColor: colors.forest, shadowOpacity: 0.24, shadowRadius: 14, elevation: 5 },
  logoMarkCompact: { width: 40, height: 40, borderRadius: 14 },
  logoCheck: { position: "absolute", right: -3, bottom: -3, width: 18, height: 18, borderRadius: 9, backgroundColor: colors.gold, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: colors.paper },
  logoText: { color: colors.ink, fontSize: 28, fontWeight: "900", letterSpacing: 0 },
  logoTextCompact: { fontSize: 21 },
  logoSub: { color: colors.muted, fontSize: 12, fontWeight: "700", marginTop: 1 },
  appHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
  appHeaderTitle: { color: colors.ink, fontSize: 32, fontWeight: "900", lineHeight: 38, marginTop: 18 },
  appHeaderSubtitle: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: 6 },
  premiumCard: { borderRadius: 24, borderWidth: 1, borderColor: "rgba(18,61,46,0.08)", backgroundColor: colors.paper, padding: 18, shadowColor: "#102019", shadowOpacity: 0.08, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 4 },
  selectable: { minHeight: 84, borderRadius: 22, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.paper, padding: 16 },
  selectableActive: { borderColor: colors.forest, backgroundColor: colors.mint },
  selectablePressed: { transform: [{ scale: 0.99 }], opacity: 0.92 },
  selectableDisabled: { opacity: 0.42 },
  selectableContent: { flexDirection: "row", alignItems: "center", gap: 12 },
  selectableTitle: { color: colors.ink, fontSize: 17, fontWeight: "900" },
  selectableSubtitle: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 3 },
  smallIcon: { width: 36, height: 36, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: colors.mint },
  smallIconActive: { backgroundColor: colors.leaf },
  ingredientCard: { minHeight: 108, marginBottom: 10, borderRadius: 18, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.paper, padding: 14 },
  ingredientCardActive: { borderColor: colors.forest, backgroundColor: "#F9FCF7" },
  ingredientTop: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  ingredientName: { color: colors.ink, fontSize: 16, fontWeight: "900" },
  ingredientDescription: { color: colors.muted, fontSize: 13, lineHeight: 18, marginTop: 3 },
  ingredientMeta: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 12 },
  ingredientHint: { color: colors.muted, fontSize: 12, fontWeight: "700" },
  header: { gap: 8 },
  step: { color: colors.gold, fontSize: 13, fontWeight: "900", textTransform: "uppercase" },
  title: { color: colors.ink, fontSize: 30, fontWeight: "900", lineHeight: 36 },
  subtitle: { color: colors.muted, fontSize: 16, lineHeight: 24 },
  accordion: { overflow: "hidden", borderRadius: 22, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.paper },
  accordionHead: { minHeight: 62, paddingHorizontal: 16, paddingVertical: 15, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 14 },
  accordionTitleRow: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  accordionIcon: { width: 36, height: 36, borderRadius: 14, backgroundColor: colors.mint, alignItems: "center", justifyContent: "center" },
  accordionTitle: { color: colors.ink, fontSize: 17, fontWeight: "900" },
  accordionCount: { color: colors.muted, fontSize: 12, fontWeight: "800", marginTop: 2 },
  accordionBody: { borderTopWidth: 1, borderTopColor: colors.line, paddingHorizontal: 14, paddingVertical: 14, backgroundColor: "#FBFCF8" },
  stepProgress: { flexDirection: "row", alignItems: "center", flex: 1, gap: 12 },
  progressTrack: { flex: 1, height: 8, overflow: "hidden", borderRadius: 99, backgroundColor: "rgba(23,33,29,0.1)" },
  progressFill: { height: "100%", borderRadius: 99, backgroundColor: colors.gold },
  progressText: { color: colors.forest, fontWeight: "900" },
  bottom: { position: "absolute", left: 12, right: 12, bottom: 88, borderRadius: 24, borderWidth: 1, borderColor: "rgba(18,61,46,0.12)", backgroundColor: colors.paper, paddingHorizontal: 16, paddingVertical: 14, shadowColor: "#102019", shadowOpacity: 0.14, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 8 },
  bottomGlow: { position: "absolute", left: 18, top: -2, width: 74, height: 3, borderRadius: 99, backgroundColor: colors.gold },
  bottomRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  bottomRight: { alignItems: "flex-end", gap: 7 },
  bottomLabel: { color: colors.forest, fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  bottomMeta: { color: colors.muted, fontSize: 13, lineHeight: 18, marginTop: 2 },
  bottomPrice: { color: colors.ink, fontSize: 22, fontWeight: "900" },
  summaryButton: { borderRadius: 99, backgroundColor: colors.mint, paddingHorizontal: 12, paddingVertical: 7 },
  summaryButtonText: { color: colors.forest, fontWeight: "900", fontSize: 12 },
  primaryButton: { minHeight: 58, borderRadius: 20, backgroundColor: colors.forest, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 14, shadowColor: colors.forest, shadowOpacity: 0.18, shadowRadius: 16, elevation: 4 },
  primaryText: { color: colors.paper, fontSize: 17, fontWeight: "900" },
  secondaryButton: { minHeight: 54, borderRadius: 20, borderWidth: 1, borderColor: "rgba(184,137,50,0.35)", backgroundColor: colors.paper, alignItems: "center", justifyContent: "center", paddingVertical: 12 },
  secondaryText: { color: colors.gold, fontWeight: "900", fontSize: 16 },
  disabled: { opacity: 0.46 },
  badge: { borderRadius: 99, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: colors.mint },
  badgeForest: { backgroundColor: colors.forest },
  badgeGold: { backgroundColor: "#F4E6C9" },
  badgeDanger: { backgroundColor: "#FBE5DE" },
  badgeText: { color: colors.forest, fontSize: 12, fontWeight: "900" },
  badgeTextStrong: { color: colors.paper },
  tierBadge: { borderRadius: 99, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: colors.mint },
  tierBadgeGold: { backgroundColor: "#F4E6C9" },
  tierBadgeDark: { backgroundColor: colors.forest, borderWidth: 1, borderColor: colors.gold },
  tierBadgeText: { color: colors.forest, fontSize: 12, fontWeight: "900" },
  tierBadgeTextDark: { color: colors.paper },
  infoBanner: { flexDirection: "row", gap: 10, borderRadius: 18, borderWidth: 1, borderColor: "rgba(184,137,50,0.22)", backgroundColor: "#FFF8E8", padding: 14 },
  infoText: { flex: 1, color: colors.ink, fontSize: 13, lineHeight: 19, fontWeight: "700" },
  empty: { alignItems: "center", gap: 8 },
  emptyTitle: { color: colors.ink, fontSize: 18, fontWeight: "900", textAlign: "center" },
  emptySubtitle: { color: colors.muted, fontSize: 14, lineHeight: 20, textAlign: "center" },
  skeletonWrap: { gap: 12 },
  skeletonLineWide: { width: "70%", height: 18, borderRadius: 99, backgroundColor: "#E5ECE4" },
  skeletonLine: { width: "45%", height: 14, borderRadius: 99, backgroundColor: "#E5ECE4" },
  skeletonCard: { height: 92, borderRadius: 20, backgroundColor: "#E5ECE4" },
  menu: { position: "absolute", left: 12, right: 12, bottom: 12, height: 66, borderRadius: 26, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.paper, flexDirection: "row", alignItems: "center", justifyContent: "space-around", shadowColor: "#102019", shadowOpacity: 0.12, shadowRadius: 22, shadowOffset: { width: 0, height: 12 }, elevation: 8 },
  menuItem: { minWidth: 56, alignItems: "center", justifyContent: "center", gap: 3 },
  menuText: { color: colors.muted, fontSize: 11, fontWeight: "800" },
  menuTextActive: { color: colors.forest }
});
