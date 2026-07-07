import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Platform,
  ActivityIndicator,
  Dimensions,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import {
  useGetStorefrontSummary,
  useAddCartItem,
} from '@workspace/api-client-react';
import type { Product } from '@workspace/api-client-react';
import { useAuth } from '@/context/AuthContext';
import ProductCard from '@/components/ProductCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const H_PAD = 16;
const CARD_GAP = 12;
const CARD_WIDTH = (SCREEN_WIDTH - H_PAD * 2 - CARD_GAP) / 2;
const FLASH_W = 148;

// Purple color system
const PURPLE = '#7C3AED';
const PURPLE_DARK = '#5B21B6';
const PURPLE_MID = '#8B5CF6';
const PURPLE_LIGHT = '#EDE9FE';
const WHITE = '#FFFFFF';
const BG = '#F8F7FF';
const TEXT_DARK = '#1C1028';
const TEXT_MUTED = '#6B7280';
const RED_SALE = '#EF4444';
const ORANGE = '#F97316';
const CARD_BG = '#FFFFFF';

function formatPrice(amount: number, currency: string) {
  if (currency === 'NGN') return `₦${amount.toLocaleString()}`;
  return `${currency} ${amount.toLocaleString()}`;
}

// Countdown timer — counts down from a 2-hour window
function CountdownTimer() {
  const [end] = useState(() => Date.now() + 2 * 60 * 60 * 1000);
  const [remaining, setRemaining] = useState(end - Date.now());

  useEffect(() => {
    const id = setInterval(() => setRemaining(Math.max(0, end - Date.now())), 1000);
    return () => clearInterval(id);
  }, [end]);

  const h = Math.floor(remaining / 3_600_000);
  const m = Math.floor((remaining % 3_600_000) / 60_000);
  const s = Math.floor((remaining % 60_000) / 1_000);
  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <View style={timerSt.row}>
      <Text style={timerSt.label}>Ends in</Text>
      {[pad(h), pad(m), pad(s)].map((unit, i) => (
        <React.Fragment key={i}>
          <View style={timerSt.block}>
            <Text style={timerSt.unit}>{unit}</Text>
          </View>
          {i < 2 && <Text style={timerSt.colon}>:</Text>}
        </React.Fragment>
      ))}
    </View>
  );
}

const timerSt = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  label: { fontSize: 11, fontFamily: 'Inter_400Regular', color: TEXT_MUTED, marginRight: 4 },
  block: {
    backgroundColor: PURPLE,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    minWidth: 28,
    alignItems: 'center',
  },
  unit: { fontSize: 12, fontFamily: 'Inter_700Bold', color: WHITE },
  colon: { fontSize: 14, fontFamily: 'Inter_700Bold', color: PURPLE, marginBottom: 1 },
});

// Category color tiles (fallback when no image)
const CAT_COLORS = ['#7C3AED', '#EC4899', '#F97316', '#10B981', '#3B82F6', '#F59E0B'];
const QUICK_ACTIONS = [
  { icon: 'grid' as const, label: 'Categories', tab: '/(tabs)/search' },
  { icon: 'zap' as const, label: 'Flash Sale', tab: '/(tabs)/search' },
  { icon: 'truck' as const, label: 'Free Ship', tab: '/(tabs)/search' },
  { icon: 'tag' as const, label: 'Vouchers', tab: '/(tabs)/search' },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const [addingId, setAddingId] = useState<number | null>(null);

  const { data: summary, isLoading, isError, refetch, isRefetching } = useGetStorefrontSummary();
  const { mutateAsync: addToCart } = useAddCartItem();

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const handleAddToCart = async (productId: number) => {
    setAddingId(productId);
    try { await addToCart({ data: { productId, quantity: 1 } }); } catch { /* silent */ }
    finally { setAddingId(null); }
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (isLoading) {
    return (
      <View style={[st.centered, { backgroundColor: BG }]}>
        <ActivityIndicator size="large" color={PURPLE} />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={[st.centered, { backgroundColor: BG }]}>
        <Feather name="wifi-off" size={36} color={TEXT_MUTED} />
        <Text style={[st.errorText]}>Couldn't load products</Text>
        <TouchableOpacity style={st.retryBtn} onPress={() => refetch()}>
          <Text style={st.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const featured: Product[] = (summary?.featured ?? []) as Product[];
  const categories = summary?.topCategories ?? [];
  const trending = summary?.trendingSearches ?? [];

  // Products with discount = flash sale items
  const saleProducts = featured.filter(
    (p: any) => p.originalPrice && p.originalPrice > p.price
  );
  const showFlash = saleProducts.length > 0 ? saleProducts : featured.slice(0, 6);

  // Recommended = remaining products
  const recommended = featured;

  return (
    <ScrollView
      style={{ backgroundColor: BG }}
      contentContainerStyle={{ paddingBottom: bottomPad + 16 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={PURPLE} />
      }
    >
      {/* ── Purple header ── */}
      <View style={[st.header, { paddingTop: topPad + 8 }]}>
        <View style={st.headerRow}>
          <View>
            <Text style={st.greeting}>{greeting()}{user ? `, ${user.name.split(' ')[0]}` : ''} 👋</Text>
            <Text style={st.headerTitle}>Find your perfect{'\n'}product</Text>
          </View>
          <TouchableOpacity style={st.bellBtn} onPress={() => router.push('/(tabs)/account')}>
            <Feather name="bell" size={20} color={WHITE} />
          </TouchableOpacity>
        </View>

        {/* Search bar */}
        <TouchableOpacity
          style={st.searchBar}
          activeOpacity={0.85}
          onPress={() => router.push('/(tabs)/search')}
        >
          <Feather name="search" size={16} color={TEXT_MUTED} />
          <Text style={st.searchPlaceholder}>Search for products...</Text>
          <View style={st.cartBadge}>
            <Feather name="shopping-bag" size={16} color={WHITE} />
          </View>
        </TouchableOpacity>
      </View>

      <View style={{ paddingHorizontal: H_PAD }}>

        {/* ── Hero banner ── */}
        <View style={st.heroBanner}>
          <View style={{ flex: 1 }}>
            <View style={st.saleBadge}>
              <Text style={st.saleBadgeText}>🔥 Limited Time</Text>
            </View>
            <Text style={st.heroTitle}>Mega Sale</Text>
            <Text style={st.heroSub}>Up to 60% Off</Text>
            <TouchableOpacity
              style={st.shopNowBtn}
              onPress={() => router.push('/(tabs)/search')}
              activeOpacity={0.85}
            >
              <Text style={st.shopNowText}>Shop Now</Text>
              <Feather name="arrow-right" size={14} color={PURPLE} />
            </TouchableOpacity>
          </View>
          <View style={st.heroIcon}>
            <Text style={{ fontSize: 60 }}>🛍️</Text>
            <View style={st.percentBadge}>
              <Text style={st.percentText}>%</Text>
            </View>
          </View>
        </View>

        {/* ── Quick actions ── */}
        <View style={st.quickRow}>
          {QUICK_ACTIONS.map((action) => (
            <TouchableOpacity
              key={action.label}
              style={st.quickItem}
              onPress={() => router.push(action.tab as any)}
              activeOpacity={0.8}
            >
              <View style={st.quickIcon}>
                <Feather name={action.icon} size={20} color={PURPLE} />
              </View>
              <Text style={st.quickLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Popular Categories ── */}
        {categories.length > 0 && (
          <View style={st.section}>
            <View style={st.sectionHeader}>
              <Text style={st.sectionTitle}>Popular Categories</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/search')}>
                <Text style={st.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12, paddingRight: 4 }}
            >
              {categories.map((cat, i) => (
                <TouchableOpacity
                  key={cat.slug}
                  style={st.catTile}
                  onPress={() => router.push({ pathname: '/(tabs)/search', params: { category: cat.slug } })}
                  activeOpacity={0.8}
                >
                  <View style={[st.catImg, { backgroundColor: CAT_COLORS[i % CAT_COLORS.length] }]}>
                    <Text style={st.catInitial}>{cat.name.charAt(0).toUpperCase()}</Text>
                  </View>
                  <Text style={st.catName} numberOfLines={1}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── Flash Sale ── */}
        {showFlash.length > 0 && (
          <View style={st.section}>
            <View style={st.sectionHeader}>
              <Text style={[st.sectionTitle, { color: RED_SALE }]}>⚡ Flash Sale</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/search')}>
                <Text style={st.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            <CountdownTimer />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12, paddingRight: 4, marginTop: 14 }}
            >
              {showFlash.map((product: any) => {
                const origPrice = product.originalPrice ?? product.compareAtPrice;
                const discount = origPrice && origPrice > product.price
                  ? Math.round((1 - product.price / origPrice) * 100)
                  : null;
                return (
                  <TouchableOpacity
                    key={product.id}
                    style={st.flashCard}
                    onPress={() => router.push(`/product/${product.id}`)}
                    activeOpacity={0.85}
                  >
                    <View style={st.flashImgWrap}>
                      <Image
                        source={{ uri: product.imageUrl }}
                        style={st.flashImg}
                        resizeMode="cover"
                      />
                      {discount && (
                        <View style={st.discountBadge}>
                          <Text style={st.discountText}>-{discount}%</Text>
                        </View>
                      )}
                    </View>
                    <View style={st.flashInfo}>
                      <Text style={st.flashName} numberOfLines={2}>{product.name}</Text>
                      <Text style={st.flashPrice}>{formatPrice(product.price, product.currency)}</Text>
                      {origPrice && (
                        <Text style={st.flashOrig}>{formatPrice(origPrice, product.currency)}</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* ── Recommended for You ── */}
        {recommended.length > 0 && (
          <View style={st.section}>
            <View style={st.sectionHeader}>
              <Text style={st.sectionTitle}>Recommended for You</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/search')}>
                <Text style={st.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            <View style={st.grid}>
              {recommended.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product as any}
                  width={CARD_WIDTH}
                  onPress={() => router.push(`/product/${product.id}`)}
                  onAddToCart={() => handleAddToCart(product.id)}
                  addingToCart={addingId === product.id}
                />
              ))}
            </View>
          </View>
        )}

        {/* Trending searches */}
        {trending.length > 0 && (
          <View style={[st.section, { marginBottom: 8 }]}>
            <Text style={st.sectionTitle}>🔥 Trending Searches</Text>
            <View style={st.trendWrap}>
              {trending.map((term) => (
                <TouchableOpacity
                  key={term}
                  style={st.trendChip}
                  onPress={() => router.push({ pathname: '/(tabs)/search', params: { q: term } })}
                  activeOpacity={0.75}
                >
                  <Feather name="trending-up" size={11} color={PURPLE} />
                  <Text style={st.trendText}>{term}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  errorText: { fontSize: 15, fontFamily: 'Inter_400Regular', color: TEXT_MUTED },
  retryBtn: { backgroundColor: PURPLE, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 100, marginTop: 4 },
  retryBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: WHITE },

  // Header
  header: {
    backgroundColor: PURPLE,
    paddingHorizontal: H_PAD,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 16,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  greeting: { fontSize: 13, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.75)', marginBottom: 4 },
  headerTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', color: WHITE, lineHeight: 26 },
  bellBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: WHITE, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  searchPlaceholder: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular', color: TEXT_MUTED },
  cartBadge: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: PURPLE, alignItems: 'center', justifyContent: 'center',
  },

  // Hero banner
  heroBanner: {
    backgroundColor: PURPLE_DARK,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: PURPLE,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  saleBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  saleBadgeText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: WHITE },
  heroTitle: { fontSize: 26, fontFamily: 'Inter_700Bold', color: WHITE, marginBottom: 4 },
  heroSub: { fontSize: 14, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.85)', marginBottom: 14 },
  shopNowBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: WHITE, borderRadius: 100,
    paddingHorizontal: 16, paddingVertical: 8, alignSelf: 'flex-start',
  },
  shopNowText: { fontSize: 13, fontFamily: 'Inter_700Bold', color: PURPLE },
  heroIcon: { alignItems: 'center', justifyContent: 'center', position: 'relative' },
  percentBadge: {
    position: 'absolute', top: -4, right: -8,
    backgroundColor: ORANGE, borderRadius: 100,
    width: 28, height: 28, alignItems: 'center', justifyContent: 'center',
  },
  percentText: { fontSize: 12, fontFamily: 'Inter_700Bold', color: WHITE },

  // Quick actions
  quickRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  quickItem: { alignItems: 'center', flex: 1 },
  quickIcon: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: PURPLE_LIGHT,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 6,
    shadowColor: PURPLE,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  quickLabel: { fontSize: 11, fontFamily: 'Inter_500Medium', color: TEXT_DARK, textAlign: 'center' },

  // Sections
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 17, fontFamily: 'Inter_700Bold', color: TEXT_DARK },
  seeAll: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: PURPLE },

  // Categories
  catTile: { alignItems: 'center', width: 72 },
  catImg: {
    width: 68, height: 68, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 4,
    elevation: 2,
  },
  catInitial: { fontSize: 28, fontFamily: 'Inter_700Bold', color: WHITE },
  catName: { fontSize: 11, fontFamily: 'Inter_500Medium', color: TEXT_DARK, textAlign: 'center' },

  // Flash Sale
  flashCard: {
    width: FLASH_W,
    backgroundColor: CARD_BG,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  flashImgWrap: { width: FLASH_W, height: FLASH_W, position: 'relative' },
  flashImg: { width: '100%', height: '100%' },
  discountBadge: {
    position: 'absolute', top: 8, left: 8,
    backgroundColor: RED_SALE, borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 3,
  },
  discountText: { fontSize: 10, fontFamily: 'Inter_700Bold', color: WHITE },
  flashInfo: { padding: 10, gap: 3 },
  flashName: { fontSize: 12, fontFamily: 'Inter_500Medium', color: TEXT_DARK, lineHeight: 16 },
  flashPrice: { fontSize: 14, fontFamily: 'Inter_700Bold', color: PURPLE },
  flashOrig: { fontSize: 11, fontFamily: 'Inter_400Regular', color: TEXT_MUTED, textDecorationLine: 'line-through' },

  // Grid
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: CARD_GAP },

  // Trending
  trendWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  trendChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 100, backgroundColor: PURPLE_LIGHT,
  },
  trendText: { fontSize: 12, fontFamily: 'Inter_500Medium', color: PURPLE },
});
