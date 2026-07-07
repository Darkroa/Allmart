import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { usePlaceOrder, useGetCart } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useColors } from '@/hooks/useColors';

function formatPrice(amount: number, currency: string) {
  if (currency === 'NGN') return `₦${amount.toLocaleString()}`;
  return `${currency} ${amount.toLocaleString()}`;
}

export default function CheckoutScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: cart } = useGetCart();
  const { mutateAsync: placeOrder, isPending } = usePlaceOrder();

  const [address, setAddress] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [receiverEmail, setReceiverEmail] = useState('');
  const [cashbackCode, setCashbackCode] = useState('');
  const [error, setError] = useState('');

  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const handleOrder = async () => {
    setError('');
    if (!address.trim()) { setError('Shipping address is required'); return; }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const order = await placeOrder({
        data: {
          shippingAddress: address,
          receiverName: receiverName || undefined,
          receiverPhone: receiverPhone || undefined,
          receiverEmail: receiverEmail || undefined,
          cashbackCode: cashbackCode || undefined,
        },
      });
      await queryClient.invalidateQueries();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace(`/order/${order.id}`);
    } catch (e: any) {
      const msg = e?.response?.data?.error ?? 'Failed to place order';
      setError(msg);
    }
  };

  const subtotal = cart?.subtotal ?? 0;
  const currency = cart?.currency ?? 'NGN';

  return (
    <>
      <Stack.Screen options={{ title: 'Checkout', headerBackTitle: 'Cart' }} />
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: bottomPad + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Delivery Details
        </Text>

        <View style={styles.fields}>
          <Field label="Shipping Address *" colors={colors}>
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              placeholder="Full address (street, city, state)"
              placeholderTextColor={colors.mutedForeground}
              value={address}
              onChangeText={setAddress}
              multiline
              numberOfLines={2}
            />
          </Field>
          <Field label="Receiver Name" colors={colors}>
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              placeholder="Who should we deliver to?"
              placeholderTextColor={colors.mutedForeground}
              value={receiverName}
              onChangeText={setReceiverName}
              autoCapitalize="words"
            />
          </Field>
          <Field label="Phone Number" colors={colors}>
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              placeholder="+234 800 000 0000"
              placeholderTextColor={colors.mutedForeground}
              value={receiverPhone}
              onChangeText={setReceiverPhone}
              keyboardType="phone-pad"
            />
          </Field>
          <Field label="Email" colors={colors}>
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              placeholder="order confirmation email"
              placeholderTextColor={colors.mutedForeground}
              value={receiverEmail}
              onChangeText={setReceiverEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </Field>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Cashback Code
        </Text>
        <Field label="Code (optional)" colors={colors}>
          <TextInput
            style={[styles.input, { color: colors.foreground }]}
            placeholder="Enter cashback code"
            placeholderTextColor={colors.mutedForeground}
            value={cashbackCode}
            onChangeText={setCashbackCode}
            autoCapitalize="characters"
          />
        </Field>

        {/* Order summary */}
        <View style={[styles.summary, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Order Summary</Text>
          {(cart?.items ?? []).map((item) => (
            <View key={item.productId} style={styles.summaryRow}>
              <Text style={[styles.summaryName, { color: colors.foreground }]} numberOfLines={1}>
                {item.product.name}
              </Text>
              <Text style={[styles.summaryQty, { color: colors.mutedForeground }]}>
                ×{item.quantity}
              </Text>
              <Text style={[styles.summaryPrice, { color: colors.foreground }]}>
                {formatPrice(item.product.price * item.quantity, item.product.currency)}
              </Text>
            </View>
          ))}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.summaryRow}>
            <Text style={[styles.totalLabel, { color: colors.foreground }]}>Total</Text>
            <Text style={[styles.totalAmount, { color: colors.primary }]}>
              {formatPrice(subtotal, currency)}
            </Text>
          </View>
        </View>

        {error ? (
          <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
        ) : null}

        <TouchableOpacity
          style={[styles.orderBtn, { backgroundColor: colors.primary, opacity: isPending ? 0.7 : 1 }]}
          onPress={handleOrder}
          disabled={isPending}
        >
          {isPending ? (
            <ActivityIndicator size="small" color={colors.primaryForeground} />
          ) : (
            <>
              <Text style={[styles.orderBtnText, { color: colors.primaryForeground }]}>
                Place Order
              </Text>
              <Feather name="check-circle" size={18} color={colors.primaryForeground} />
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

function Field({ label, children, colors }: { label: string; children: React.ReactNode; colors: any }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <View style={[styles.fieldBox, { borderColor: colors.input, backgroundColor: colors.card }]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, gap: 16 },
  sectionTitle: { fontSize: 17, fontFamily: 'Inter_700Bold', marginTop: 4 },
  fields: { gap: 12 },
  fieldWrap: { gap: 5 },
  fieldLabel: { fontSize: 12, fontFamily: 'Inter_500Medium', textTransform: 'uppercase', letterSpacing: 0.5 },
  fieldBox: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 },
  input: { fontSize: 15, fontFamily: 'Inter_400Regular', padding: 0, margin: 0 },
  summary: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 10 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  summaryName: { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular' },
  summaryQty: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  summaryPrice: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  divider: { height: 1, marginVertical: 4 },
  totalLabel: { flex: 1, fontSize: 15, fontFamily: 'Inter_700Bold' },
  totalAmount: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  errorText: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  orderBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 14 },
  orderBtnText: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
});
