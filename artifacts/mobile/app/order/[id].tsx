import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useGetOrder } from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';

const STATUS_STEPS = ['placed', 'confirmed', 'dispatched', 'delivered'];

function formatPrice(amount: number, currency: string) {
  if (currency === 'NGN') return `₦${amount.toLocaleString()}`;
  return `${currency} ${amount.toLocaleString()}`;
}

function statusColor(status: string, colors: any) {
  switch (status) {
    case 'delivered': return '#10B981';
    case 'cancelled': return colors.destructive;
    case 'dispatched': return '#3B82F6';
    default: return colors.primary;
  }
}

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { data: order, isLoading, isError } = useGetOrder(Number(id));
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isError || !order) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Feather name="alert-circle" size={36} color={colors.mutedForeground} />
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Order not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.backLink, { color: colors.primary }]}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const stepIndex = STATUS_STEPS.indexOf(order.status);
  const isCancelled = order.status === 'cancelled';

  return (
    <>
      <Stack.Screen options={{ title: `Order #${order.trackingCode}`, headerBackTitle: 'Back' }} />
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Status card */}
        <View style={[styles.statusCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.statusTop}>
            <View>
              <Text style={[styles.trackingLabel, { color: colors.mutedForeground }]}>Tracking Code</Text>
              <Text style={[styles.trackingCode, { color: colors.foreground }]}>#{order.trackingCode}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: isCancelled ? '#FEE2E2' : colors.accent }]}>
              <Text style={[styles.statusBadgeText, { color: statusColor(order.status, colors) }]}>
                {order.status}
              </Text>
            </View>
          </View>

          {/* Progress steps */}
          {!isCancelled && (
            <View style={styles.stepsRow}>
              {STATUS_STEPS.map((step, i) => {
                const done = i <= stepIndex;
                return (
                  <React.Fragment key={step}>
                    <View style={styles.stepWrap}>
                      <View
                        style={[
                          styles.stepDot,
                          { backgroundColor: done ? colors.primary : colors.border },
                        ]}
                      >
                        {done && <Feather name="check" size={10} color="#fff" />}
                      </View>
                      <Text
                        style={[
                          styles.stepLabel,
                          { color: done ? colors.primary : colors.mutedForeground },
                        ]}
                      >
                        {step}
                      </Text>
                    </View>
                    {i < STATUS_STEPS.length - 1 && (
                      <View
                        style={[
                          styles.stepLine,
                          { backgroundColor: i < stepIndex ? colors.primary : colors.border },
                        ]}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </View>
          )}
        </View>

        {/* Delivery info */}
        <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Delivery Info</Text>
          <Row label="Address" value={order.shippingAddress} colors={colors} />
          {order.receiverName ? <Row label="Receiver" value={order.receiverName} colors={colors} /> : null}
          {order.receiverPhone ? <Row label="Phone" value={order.receiverPhone} colors={colors} /> : null}
          {order.receiverEmail ? <Row label="Email" value={order.receiverEmail} colors={colors} /> : null}
        </View>

        {/* Items */}
        <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Items</Text>
          {order.items.map((item) => (
            <View key={item.productId} style={styles.itemRow}>
              <Image
                source={{ uri: item.imageUrl }}
                style={[styles.itemImg, { backgroundColor: colors.secondary }]}
                resizeMode="cover"
              />
              <View style={{ flex: 1 }}>
                <Text style={[styles.itemName, { color: colors.foreground }]} numberOfLines={2}>
                  {item.productName}
                </Text>
                <Text style={[styles.itemQty, { color: colors.mutedForeground }]}>
                  ×{item.quantity}
                </Text>
              </View>
              <Text style={[styles.itemPrice, { color: colors.foreground }]}>
                {formatPrice(item.unitPrice * item.quantity, order.currency)}
              </Text>
            </View>
          ))}

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {order.cashbackDiscount ? (
            <View style={styles.totalRow}>
              <Text style={[styles.discountLabel, { color: colors.mutedForeground }]}>Cashback</Text>
              <Text style={[styles.discountAmount, { color: '#10B981' }]}>
                -{formatPrice(order.cashbackDiscount, order.currency)}
              </Text>
            </View>
          ) : null}

          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: colors.foreground }]}>Total</Text>
            <Text style={[styles.totalAmount, { color: colors.primary }]}>
              {formatPrice(order.total, order.currency)}
            </Text>
          </View>
        </View>
      </ScrollView>
    </>
  );
}

function Row({ label, value, colors }: { label: string; value: string; colors: any }) {
  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  scroll: { padding: 16, gap: 14 },
  statusCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 18 },
  statusTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  trackingLabel: { fontSize: 11, fontFamily: 'Inter_400Regular', marginBottom: 2 },
  trackingCode: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 100 },
  statusBadgeText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', textTransform: 'capitalize' },
  stepsRow: { flexDirection: 'row', alignItems: 'center' },
  stepWrap: { alignItems: 'center', gap: 5 },
  stepDot: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  stepLabel: { fontSize: 10, fontFamily: 'Inter_500Medium', textTransform: 'capitalize', textAlign: 'center' },
  stepLine: { flex: 1, height: 2, marginBottom: 14 },
  infoCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  cardTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', marginBottom: 2 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  infoLabel: { fontSize: 13, fontFamily: 'Inter_400Regular', flex: 1 },
  infoValue: { fontSize: 13, fontFamily: 'Inter_500Medium', flex: 2, textAlign: 'right' },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  itemImg: { width: 52, height: 52, borderRadius: 10 },
  itemName: { fontSize: 13, fontFamily: 'Inter_500Medium', lineHeight: 18, flex: 1 },
  itemQty: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  itemPrice: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  divider: { height: 1 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  discountLabel: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  discountAmount: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  totalLabel: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  totalAmount: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  emptyText: { fontSize: 15, fontFamily: 'Inter_400Regular' },
  backLink: { fontSize: 14, fontFamily: 'Inter_500Medium' },
});
