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
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

const PURPLE = '#7C3AED';
const PURPLE_LIGHT = '#EDE9FE';
const WHITE = '#FFFFFF';
const BG = '#F8F7FF';
const BG_DARK = '#0D0B1A';
const TEXT_DARK = '#1C1028';
const TEXT_DARK_D = '#F0EEFF';
const TEXT_MUTED = '#6B7280';
const RED = '#EF4444';
const BORDER = '#F0EEFF';
const BORDER_DARK = '#2D2550';

function formatPrice(amount: number, currency: string) {
  if (currency === 'NGN') return `₦${amount.toLocaleString()}`;
  return `${currency} ${amount.toLocaleString()}`;
}

export default function CartScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';

  const { data: cart, isLoading } = useGetCart();
  const { mutateAsync: removeItem } = useRemoveCartItem();
  const { mutateAsync: addItem } = useAddCartItem();
  const { mutateAsync: clearCart } = useClearCart();

  const [removingId, setRemovingId] = useState<number | null>(null);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = insets.bottom + 16;

  const items = cart?.items ?? [];
  const subtotal = cart?.subtotal ?? 0;
  const currency = cart?.currency ?? 'NGN';

  const bg = isDark ? BG_DARK : BG;
  const cardBg = isDark ? '#1A1528' : WHITE;
  const textDark = isDark ? TEXT_DARK_D : TEXT_DARK;
  const border = isDark ? BORDER_DARK : BORDER;

  const handleRemove = async (productId: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setRemovingId(productId);
    try { await removeItem({ productId }); } finally { setRemovingId(null); }
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
      <View style={[st.centered, { backgroundColor: bg }]}>
        <ActivityIndicator size="large" color={PURPLE} />
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={[st.centered, { backgroundColor: bg, paddingTop: topPad, paddingBottom: bottomPad }]}>
        <View style={[st.emptyIconWrap, { backgroundColor: isDark ? '#2D1F5E' : PURPLE_LIGHT }]}>
          <Feather name="shopping-cart" size={32} color={isDark ? '#A78BFA' : PURPLE} />
        </View>
        <Text style={[st.emptyTitle, { color: textDark }]}>Your cart is empty</Text>
        <Text style={[st.emptySub, { color: TEXT_MUTED }]}>Browse products and add something you love</Text>
        <TouchableOpacity
          style={st.shopBtn}
          onPress={() => router.push('/(tabs)/search')}
          activeOpacity={0.85}
        >
          <Feather name="search" size={16} color={WHITE} />
          <Text style={st.shopBtnText}>Start Shopping</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[st.root, { backgroundColor: bg }]}>
      {/* Header */}
      <View style={[st.header, { paddingTop: topPad + 12, backgroundColor: isDark ? '#1A1528' : WHITE, borderBottomColor: border }]}>
        <TouchableOpacity onPress={() => router.back()} style={st.backBtn}>
          <Feather name="arrow-left" size={20} color={isDark ? '#A78BFA' : PURPLE} />
        </TouchableOpacity>
        <Text style={[st.headerTitle, { color: textDark }]}>My Cart</Text>
        <TouchableOpacity onPress={handleClear} style={st.clearBtn}>
          <Feather name="trash-2" size={15} color={RED} />
          <Text style={st.clearText}>Clear</Text>
        </TouchableOpacity>
      </View>

      {/* Items list */}
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.productId)}
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: bottomPad + 120 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={[st.card, { backgroundColor: cardBg, borderColor: border }]}>
            <Image
              source={{ uri: item.product.imageUrl }}
              style={st.img}
              resizeMode="cover"
            />
            <View style={st.info}>
              <Text style={[st.itemName, { color: textDark }]} numberOfLines={2}>{item.product.name}</Text>
              <Text style={st.itemPrice}>
                {formatPrice(item.product.price, item.product.currency)}
              </Text>
              <View style={st.qtyRow}>
                <TouchableOpacity
                  style={[st.qtyBtn, { borderColor: border, backgroundColor: bg }, item.quantity === 1 && st.qtyBtnDestructive]}
                  onPress={() => handleRemove(item.productId)}
                  disabled={removingId === item.productId}
                >
                  {removingId === item.productId ? (
                    <ActivityIndicator size="small" color={TEXT_MUTED} />
                  ) : (
                    <Feather
                      name={item.quantity === 1 ? 'trash-2' : 'minus'}
                      size={14}
                      color={item.quantity === 1 ? RED : textDark}
                    />
                  )}
                </TouchableOpacity>
                <Text style={[st.qtyNum, { color: textDark }]}>{item.quantity}</Text>
                <TouchableOpacity
                  style={[st.qtyBtn, { borderColor: border, backgroundColor: bg }]}
                  onPress={() => handleIncrement(item.productId)}
                >
                  <Feather name="plus" size={14} color={textDark} />
                </TouchableOpacity>
                <Text style={st.lineTotal}>
                  {formatPrice(item.product.price * item.quantity, item.product.currency)}
                </Text>
              </View>
            </View>
          </View>
        )}
      />

      {/* Sticky footer */}
      <View style={[st.footer, { paddingBottom: (Platform.OS === 'ios' ? insets.bottom : 16) + 8, backgroundColor: isDark ? '#1A1528' : WHITE, borderTopColor: border }]}>
        <View style={st.totalRow}>
          <Text style={[st.totalLabel, { color: TEXT_MUTED }]}>Subtotal</Text>
          <Text style={[st.totalAmount, { color: textDark }]}>{formatPrice(subtotal, currency)}</Text>
        </View>
        <Text style={[st.totalHint, { color: TEXT_MUTED }]}>Shipping & taxes calculated at checkout</Text>
        <TouchableOpacity
          style={st.checkoutBtn}
          activeOpacity={0.88}
          onPress={() => {
            if (!user) {
              router.push('/(tabs)/account');
            } else {
              router.push('/checkout');
            }
          }}
        >
          <Feather name="lock" size={16} color={WHITE} />
          <Text style={st.checkoutText}>
            {user ? 'Proceed to Checkout' : 'Sign in to Checkout'}
          </Text>
          <Feather name="arrow-right" size={16} color={WHITE} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', flex: 1, textAlign: 'center' },
  clearBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  clearText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: RED },

  card: {
    flexDirection: 'row',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  img: { width: 96, height: 96 },
  info: { flex: 1, padding: 12, gap: 4, justifyContent: 'center' },
  itemName: { fontSize: 13, fontFamily: 'Inter_500Medium', lineHeight: 18 },
  itemPrice: { fontSize: 15, fontFamily: 'Inter_700Bold', color: PURPLE },

  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  qtyBtn: { width: 30, height: 30, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  qtyBtnDestructive: { borderColor: '#FEE2E2', backgroundColor: '#FFF5F5' },
  qtyNum: { fontSize: 15, fontFamily: 'Inter_600SemiBold', minWidth: 24, textAlign: 'center' },
  lineTotal: { marginLeft: 'auto' as any, fontSize: 13, fontFamily: 'Inter_600SemiBold', color: TEXT_MUTED },

  footer: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 8,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  totalLabel: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  totalAmount: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  totalHint: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: -4 },
  checkoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: PURPLE, borderRadius: 16, paddingVertical: 16,
    shadowColor: PURPLE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  checkoutText: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: WHITE, flex: 1, textAlign: 'center' },

  emptyIconWrap: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  emptyTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  emptySub: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 20 },
  shopBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: PURPLE, paddingHorizontal: 28, paddingVertical: 14,
    borderRadius: 100, marginTop: 8,
  },
  shopBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: WHITE },
});
