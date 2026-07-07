import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useListOrders } from '@workspace/api-client-react';
import { useTheme } from '@/context/ThemeContext';
import { format } from 'date-fns';

const PURPLE = '#7C3AED';
const PURPLE_DARK = '#5B21B6';
const PURPLE_LIGHT = '#EDE9FE';
const WHITE = '#FFFFFF';
const BG = '#F8F7FF';
const BG_DARK = '#0D0B1A';
const TEXT_DARK = '#1C1028';
const TEXT_DARK_D = '#F0EEFF';
const TEXT_MUTED = '#6B7280';
const BORDER = '#F0EEFF';
const BORDER_DARK = '#2D2550';
const TAB_BAR_H = 84;

type OrderItem = { productId: number; productName: string; quantity: number; imageUrl?: string };
type Order = {
  id: number;
  status: string;
  total: number;
  currency: string;
  trackingCode: string;
  createdAt: string;
  items: OrderItem[];
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  delivered:  { bg: '#D1FAE5', text: '#065F46' },
  dispatched: { bg: '#EDE9FE', text: '#5B21B6' },
  confirmed:  { bg: '#DBEAFE', text: '#1E40AF' },
  cancelled:  { bg: '#FEE2E2', text: '#991B1B' },
};

function formatCurrency(amount: number, currency: string) {
  if (currency === 'NGN') return `₦${amount.toLocaleString()}`;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

export default function MyOrdersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';

  const { data: orders, isLoading } = useListOrders();

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = TAB_BAR_H + (Platform.OS === 'ios' ? insets.bottom : 16);

  const bg = isDark ? BG_DARK : BG;
  const cardBg = isDark ? '#1A1528' : WHITE;
  const textDark = isDark ? TEXT_DARK_D : TEXT_DARK;
  const border = isDark ? BORDER_DARK : BORDER;
  const headerBg = isDark ? '#1A1528' : WHITE;

  /* ── Loading ── */
  if (isLoading) {
    return (
      <View style={[st.centered, { backgroundColor: bg }]}>
        <ActivityIndicator size="large" color={PURPLE} />
      </View>
    );
  }

  /* ── Empty ── */
  if (!orders || orders.length === 0) {
    return (
      <View style={[st.centered, { backgroundColor: bg, paddingTop: topPad, paddingBottom: bottomPad }]}>
        <View style={[st.emptyIcon, { backgroundColor: isDark ? '#2D1F5E' : PURPLE_LIGHT }]}>
          <Feather name="package" size={32} color={isDark ? '#A78BFA' : PURPLE} />
        </View>
        <Text style={[st.emptyTitle, { color: textDark }]}>No orders yet</Text>
        <Text style={[st.emptySub, { color: TEXT_MUTED }]}>Your placed orders will appear here</Text>
        <TouchableOpacity style={st.shopBtn} onPress={() => router.push('/(tabs)/search')} activeOpacity={0.85}>
          <Feather name="search" size={16} color={WHITE} />
          <Text style={st.shopBtnText}>Start Shopping</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[st.root, { backgroundColor: bg }]}>
      {/* Header */}
      <View style={[st.header, { paddingTop: topPad + 12, backgroundColor: PURPLE }]}>
        <Text style={st.headerTitle}>My Orders</Text>
        <Text style={st.headerSub}>{orders.length} order{orders.length !== 1 ? 's' : ''}</Text>
      </View>

      {/* Orders list */}
      <FlatList
        data={orders as unknown as Order[]}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: bottomPad + 40 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const statusStyle = STATUS_COLORS[item.status] ?? { bg: '#EDE9FE', text: PURPLE };
          return (
            <TouchableOpacity
              style={[st.card, { backgroundColor: cardBg, borderColor: border }]}
              onPress={() => router.push(`/order/${item.id}` as any)}
              activeOpacity={0.85}
            >
              {/* Top row: date + status */}
              <View style={st.cardTop}>
                <View>
                  <Text style={[st.orderDate, { color: TEXT_MUTED }]}>
                    {format(new Date(item.createdAt), 'MMM d, yyyy')}
                  </Text>
                  <Text style={[st.trackCode, { color: textDark }]} numberOfLines={1}>#{item.trackingCode}</Text>
                </View>
                <View style={[st.statusBadge, { backgroundColor: statusStyle.bg }]}>
                  <Text style={[st.statusText, { color: statusStyle.text }]}>{item.status}</Text>
                </View>
              </View>

              {/* Product thumbnails */}
              <View style={st.thumbsRow}>
                {item.items.slice(0, 4).map((oi, i) => (
                  <View key={i} style={[st.thumb, { borderColor: border }]}>
                    {oi.imageUrl ? (
                      <Image source={{ uri: oi.imageUrl }} style={st.thumbImg} resizeMode="cover" />
                    ) : (
                      <Feather name="box" size={20} color={TEXT_MUTED} />
                    )}
                    {oi.quantity > 1 && (
                      <View style={st.qtyBadge}>
                        <Text style={st.qtyBadgeText}>×{oi.quantity}</Text>
                      </View>
                    )}
                  </View>
                ))}
                {item.items.length > 4 && (
                  <View style={[st.thumb, st.moreBadge, { backgroundColor: isDark ? '#2D2550' : '#F3F0FF', borderColor: border }]}>
                    <Text style={[st.moreText, { color: isDark ? '#A78BFA' : PURPLE }]}>+{item.items.length - 4}</Text>
                  </View>
                )}
              </View>

              {/* Footer: total + arrow */}
              <View style={[st.cardFooter, { borderTopColor: border }]}>
                <Text style={[st.totalLabel, { color: TEXT_MUTED }]}>Total</Text>
                <Text style={[st.totalAmount, { color: isDark ? '#A78BFA' : PURPLE }]}>{formatCurrency(item.total, item.currency)}</Text>
                <View style={{ flex: 1 }} />
                <View style={[st.viewBtn, { backgroundColor: isDark ? '#2D1F5E' : PURPLE_LIGHT }]}>
                  <Text style={[st.viewBtnText, { color: isDark ? '#A78BFA' : PURPLE_DARK }]}>View</Text>
                  <Feather name="chevron-right" size={14} color={isDark ? '#A78BFA' : PURPLE_DARK} />
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 },

  header: {
    paddingHorizontal: 16,
    paddingBottom: 18,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 4,
  },
  headerTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', color: WHITE },
  headerSub: { fontSize: 12, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.7)', marginTop: 2 },

  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: PURPLE,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    padding: 14, paddingBottom: 10,
  },
  orderDate: { fontSize: 11, fontFamily: 'Inter_400Regular', marginBottom: 3 },
  trackCode: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  statusBadge: { borderRadius: 100, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', textTransform: 'capitalize' },

  thumbsRow: { flexDirection: 'row', paddingHorizontal: 14, paddingBottom: 12, gap: 8 },
  thumb: {
    width: 56, height: 56, borderRadius: 12,
    borderWidth: 1, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#F8F7FF',
    position: 'relative',
  },
  thumbImg: { width: '100%', height: '100%' },
  qtyBadge: {
    position: 'absolute', bottom: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.55)', borderTopLeftRadius: 6,
    paddingHorizontal: 4, paddingVertical: 2,
  },
  qtyBadgeText: { fontSize: 9, fontFamily: 'Inter_700Bold', color: WHITE },
  moreBadge: { alignItems: 'center', justifyContent: 'center' },
  moreText: { fontSize: 13, fontFamily: 'Inter_700Bold' },

  cardFooter: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  totalLabel: { fontSize: 12, fontFamily: 'Inter_400Regular', marginRight: 4 },
  totalAmount: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  viewBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100,
  },
  viewBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },

  emptyIcon: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  emptyTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  emptySub: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 20 },
  shopBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: PURPLE, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 100, marginTop: 8 },
  shopBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: WHITE },
});
