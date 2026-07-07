import React, { useState } from 'react';
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
import * as Haptics from 'expo-haptics';
import {
  useGetCart,
  useRemoveCartItem,
  useAddCartItem,
  useClearCart,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';

function formatPrice(amount: number, currency: string) {
  if (currency === 'NGN') return `₦${amount.toLocaleString()}`;
  return `${currency} ${amount.toLocaleString()}`;
}

export default function CartScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: cart, isLoading } = useGetCart();
  const { mutateAsync: removeItem } = useRemoveCartItem();
  const { mutateAsync: addItem } = useAddCartItem();
  const { mutateAsync: clearCart } = useClearCart();

  const [removingId, setRemovingId] = useState<number | null>(null);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const items = cart?.items ?? [];
  const subtotal = cart?.subtotal ?? 0;
  const currency = cart?.currency ?? 'NGN';

  const handleRemove = async (productId: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setRemovingId(productId);
    try {
      await removeItem({ productId });
    } finally {
      setRemovingId(null);
    }
  };

  const handleIncrement = async (productId: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await addItem({ data: { productId, quantity: 1 } });
  };

  const handleClear = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    await clearCart({});
  };

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View
        style={[
          styles.centered,
          {
            backgroundColor: colors.background,
            paddingTop: topPad,
            paddingBottom: bottomPad,
          },
        ]}
      >
        <View style={[styles.emptyIcon, { backgroundColor: colors.accent }]}>
          <Feather name="shopping-cart" size={32} color={colors.primary} />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
          Your cart is empty
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
          Browse products and add something you love
        </Text>
        <TouchableOpacity
          style={[styles.shopBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/(tabs)/search')}
        >
          <Text style={[styles.shopBtnText, { color: colors.primaryForeground }]}>
            Start Shopping
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.headerBar,
          {
            paddingTop: topPad + 12,
            borderBottomColor: colors.border,
            backgroundColor: colors.background,
          },
        ]}
      >
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          My Cart
        </Text>
        <TouchableOpacity onPress={handleClear}>
          <Text style={[styles.clearText, { color: colors.destructive }]}>Clear</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => String(item.productId)}
        contentContainerStyle={[styles.list, { paddingBottom: 16 }]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={[styles.itemCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Image
              source={{ uri: item.product.imageUrl }}
              style={[styles.itemImage, { backgroundColor: colors.secondary }]}
              resizeMode="cover"
            />
            <View style={styles.itemInfo}>
              <Text style={[styles.itemName, { color: colors.foreground }]} numberOfLines={2}>
                {item.product.name}
              </Text>
              <Text style={[styles.itemPrice, { color: colors.primary }]}>
                {formatPrice(item.product.price, item.product.currency)}
              </Text>
              <View style={styles.qtyRow}>
                <TouchableOpacity
                  style={[styles.qtyBtn, { borderColor: colors.border }]}
                  onPress={() => handleRemove(item.productId)}
                  disabled={removingId === item.productId}
                >
                  {removingId === item.productId ? (
                    <ActivityIndicator size="small" color={colors.mutedForeground} />
                  ) : (
                    <Feather
                      name={item.quantity === 1 ? 'trash-2' : 'minus'}
                      size={14}
                      color={item.quantity === 1 ? colors.destructive : colors.foreground}
                    />
                  )}
                </TouchableOpacity>
                <Text style={[styles.qtyText, { color: colors.foreground }]}>
                  {item.quantity}
                </Text>
                <TouchableOpacity
                  style={[styles.qtyBtn, { borderColor: colors.border }]}
                  onPress={() => handleIncrement(item.productId)}
                >
                  <Feather name="plus" size={14} color={colors.foreground} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      />

      {/* Checkout footer */}
      <View
        style={[
          styles.footer,
          {
            borderTopColor: colors.border,
            backgroundColor: colors.background,
            paddingBottom: bottomPad + 16,
          },
        ]}
      >
        <View style={styles.subtotalRow}>
          <Text style={[styles.subtotalLabel, { color: colors.mutedForeground }]}>
            Subtotal
          </Text>
          <Text style={[styles.subtotalAmount, { color: colors.foreground }]}>
            {formatPrice(subtotal, currency)}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.checkoutBtn, { backgroundColor: colors.primary }]}
          onPress={() => {
            if (!user) {
              router.push('/(tabs)/account');
            } else {
              router.push('/checkout');
            }
          }}
        >
          <Text style={[styles.checkoutBtnText, { color: colors.primaryForeground }]}>
            {user ? 'Proceed to Checkout' : 'Sign in to Checkout'}
          </Text>
          <Feather name="arrow-right" size={18} color={colors.primaryForeground} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  clearText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  list: { padding: 16, gap: 12 },
  itemCard: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    gap: 0,
  },
  itemImage: { width: 90, height: 90 },
  itemInfo: { flex: 1, padding: 12, gap: 5, justifyContent: 'center' },
  itemName: { fontSize: 13, fontFamily: 'Inter_500Medium', lineHeight: 18 },
  itemPrice: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 2 },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', minWidth: 20, textAlign: 'center' },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    gap: 14,
  },
  subtotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  subtotalLabel: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  subtotalAmount: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  checkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
  },
  checkoutBtnText: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  emptyTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  emptySubtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 20 },
  shopBtn: { paddingHorizontal: 28, paddingVertical: 14, borderRadius: 100, marginTop: 4 },
  shopBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
});
