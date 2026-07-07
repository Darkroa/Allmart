import React, { useState, useEffect, useRef } from 'react';
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
  Animated,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import {
  useGetStorefrontSummary,
  useAddCartItem,
  useGetCart,
} from '@workspace/api-client-react';
import type { Product } from '@workspace/api-client-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useColors } from '@/hooks/useColors';
import ProductCard from '@/components/ProductCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const H_PAD = 16;
const CARD_GAP = 12;
const CARD_WIDTH = (SCREEN_WIDTH - H_PAD * 2 - CARD_GAP) / 2;
const FLASH_W = 148;
const DRAWER_W = SCREEN_WIDTH * 0.72;

// Purple color system
const PURPLE = '#7C3AED';
const PURPLE_DARK = '#5B21B6';
const PURPLE_LIGHT = '#EDE9FE';
const WHITE = '#FFFFFF';
const BG = '#F8F7FF';
const BG_DARK = '#0D0B1A';
const TEXT_DARK = '#1C1028';
const TEXT_DARK_D = '#F0EEFF';
const TEXT_MUTED = '#6B7280';
const RED_SALE = '#EF4444';
const ORANGE = '#F97316';

function formatPrice(amount: number, currency: string) {
  if (currency === 'NGN') return `₦${amount.toLocaleString()}`;
  return `${currency} ${amount.toLocaleString()}`;
}

function CountdownTimer({ isDark }: { isDark: boolean }) {
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
      <Text style={[timerSt.label, isDark && { color: '#9CA3AF' }]}>Ends in</Text>
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
  block: { backgroundColor: PURPLE, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3, minWidth: 28, alignItems: 'center' },
  unit: { fontSize: 12, fontFamily: 'Inter_700Bold', color: WHITE },
  colon: { fontSize: 14, fontFamily: 'Inter_700Bold', color: PURPLE, marginBottom: 1 },
});

const CAT_COLORS = ['#EC4899', '#F97316', '#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4'];

type FeatherName = React.ComponentProps<typeof Feather>['name'];
const CAT_ICONS: Record<string, FeatherName> = {
  accessories:  'watch',
  outdoor:      'navigation',
  shoes:        'package',
  beauty:       'heart',
  electronics:  'cpu',
  fashion:      'tag',
  clothing:     'tag',
  sports:       'activity',
  food:         'coffee',
  books:        'book-open',
  gaming:       'monitor',
  health:       'activity',
  travel:       'map-pin',
  pets:         'home',
  jewelry:      'award',
  home:         'home',
  music:        'music',
  automotive:   'truck',
  cars:         'truck',
  toys:         'gift',
};
function getCatIcon(slug: string): FeatherName {
  const key = slug.toLowerCase().replace(/[^a-z]/g, '');
  return CAT_ICONS[key] ?? 'grid';
}
const QUICK_ACTIONS = [
  { icon: 'grid' as const, label: 'Categories', tab: '/(tabs)/search' },
  { icon: 'zap' as const, label: 'Flash Sale', tab: '/(tabs)/search' },
  { icon: 'truck' as const, label: 'Free Ship', tab: '/(tabs)/search' },
  { icon: 'tag' as const, label: 'Vouchers', tab: '/(tabs)/search' },
];

const DRAWER_ITEMS = [
  { icon: 'home' as const, label: 'Home', route: '/(tabs)/index' },
  { icon: 'search' as const, label: 'Search', route: '/(tabs)/search' },
  { icon: 'cpu' as const, label: 'Ask AI', route: '/(tabs)/ai' },
  { icon: 'package' as const, label: 'My Orders', route: '/(tabs)/cart' },
  { icon: 'user' as const, label: 'Account', route: '/(tabs)/account' },
];

function NavDrawer({
  visible,
  onClose,
  isDark,
}: {
  visible: boolean;
  onClose: () => void;
  isDark: boolean;
}) {
  const slideAnim = useRef(new Animated.Value(-DRAWER_W)).current;
  const router = useRouter();

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? 0 : -DRAWER_W,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  const bg = isDark ? '#1A1528' : WHITE;
  const headerBg = PURPLE;
  const itemText = isDark ? TEXT_DARK_D : TEXT_DARK;
  const divider = isDark ? '#2D2550' : '#F0EEFF';

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={drawerSt.overlay} />
      </TouchableWithoutFeedback>
      <Animated.View style={[drawerSt.drawer, { backgroundColor: bg, transform: [{ translateX: slideAnim }] }]}>
        {/* Header */}
        <View style={[drawerSt.header, { backgroundColor: headerBg }]}>
          <View style={drawerSt.logoRow}>
            <View style={drawerSt.logoCircle}>
              <Text style={drawerSt.logoText}>A</Text>
            </View>
            <View>
              <Text style={drawerSt.brandName}>AllMart</Text>
              <Text style={drawerSt.brandSub}>AI Powered Store</Text>
            </View>
          </View>
        </View>
        {/* Nav items */}
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          {DRAWER_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={[drawerSt.item, { borderBottomColor: divider }]}
              onPress={() => {
                onClose();
                setTimeout(() => router.push(item.route as any), 200);
              }}
              activeOpacity={0.7}
            >
              <View style={drawerSt.itemIcon}>
                <Feather name={item.icon} size={18} color={PURPLE} />
              </View>
              <Text style={[drawerSt.itemLabel, { color: itemText }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

const drawerSt = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  drawer: {
    position: 'absolute', top: 0, left: 0, bottom: 0,
    width: DRAWER_W,
    shadowColor: '#000', shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.18, shadowRadius: 12, elevation: 20,
  },
  header: { paddingTop: 56, paddingBottom: 20, paddingHorizontal: 20 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoCircle: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  logoText: { fontSize: 22, fontFamily: 'Inter_700Bold', color: WHITE },
  brandName: { fontSize: 18, fontFamily: 'Inter_700Bold', color: WHITE },
  brandSub: { fontSize: 11, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.7)' },
  item: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  itemIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: PURPLE_LIGHT,
    alignItems: 'center', justifyContent: 'center',
  },
  itemLabel: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
});

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { colorScheme, toggleTheme } = useTheme();
  const isDark = colorScheme === 'dark';
  const [addingId, setAddingId] = useState<number | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { data: summary, isLoading, isError, refetch, isRefetching } = useGetStorefrontSummary();
  const { mutateAsync: addToCart } = useAddCartItem();
  const { data: cart } = useGetCart();
  const cartCount = cart?.items?.reduce((acc, i) => acc + i.quantity, 0) ?? 0;

  const bg = isDark ? BG_DARK : BG;
  const textDark = isDark ? TEXT_DARK_D : TEXT_DARK;
  const cardBg = isDark ? '#1A1528' : WHITE;
  const sectionTitleColor = textDark;

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
    return <View style={[st.centered, { backgroundColor: bg }]}><ActivityIndicator size="large" color={PURPLE} /></View>;
  }

  if (isError) {
    return (
      <View style={[st.centered, { backgroundColor: bg }]}>
        <Feather name="wifi-off" size={36} color={TEXT_MUTED} />
        <Text style={[st.errorText, { color: TEXT_MUTED }]}>Couldn't load products</Text>
        <TouchableOpacity style={st.retryBtn} onPress={() => refetch()}>
          <Text style={st.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const featured: Product[] = (summary?.featured ?? []) as Product[];
  const categories = summary?.topCategories ?? [];
  const trending = summary?.trendingSearches ?? [];
  const saleProducts = featured.filter((p: any) => p.originalPrice && p.originalPrice > p.price);
  const showFlash = saleProducts.length > 0 ? saleProducts : featured.slice(0, 6);
  const recommended = featured;

  return (
    <>
      <NavDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} isDark={isDark} />
      <ScrollView
        style={{ backgroundColor: bg }}
        contentContainerStyle={{ paddingBottom: bottomPad + 16 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={PURPLE} />}
      >
        {/* ── Purple header ── */}
        <View style={[st.header, { paddingTop: topPad + 8 }]}>
          <View style={st.headerRow}>
            {/* Left: menu button */}
            <TouchableOpacity style={st.iconBtn} onPress={() => setDrawerOpen(true)} activeOpacity={0.8}>
              <Feather name="menu" size={20} color={WHITE} />
            </TouchableOpacity>

            {/* Center: greeting + title */}
            <View style={{ flex: 1, paddingHorizontal: 12 }}>
              <Text style={st.greeting}>{greeting()}{user ? `, ${user.name.split(' ')[0]}` : ''} 👋</Text>
              <Text style={st.headerTitle}>Find your perfect product</Text>
            </View>

            {/* Right: brightness toggle, cart, bell */}
            <View style={st.rightActions}>
              <TouchableOpacity style={st.iconBtn} onPress={toggleTheme} activeOpacity={0.8}>
                <Feather name={isDark ? 'sun' : 'moon'} size={18} color={WHITE} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[st.iconBtn, { position: 'relative' }]}
                onPress={() => router.push('/cart')}
                activeOpacity={0.8}
              >
                <Feather name="shopping-cart" size={18} color={WHITE} />
                {cartCount > 0 && (
                  <View style={st.cartBadgeTop}>
                    <Text style={st.cartBadgeText}>{cartCount > 9 ? '9+' : cartCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={st.iconBtn} onPress={() => router.push('/(tabs)/account')} activeOpacity={0.8}>
                <Feather name="bell" size={18} color={WHITE} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Search bar */}
          <TouchableOpacity
            style={[st.searchBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : WHITE }]}
            activeOpacity={0.85}
            onPress={() => router.push('/(tabs)/search')}
          >
            <Feather name="search" size={15} color={isDark ? 'rgba(255,255,255,0.6)' : TEXT_MUTED} />
            <Text style={[st.searchPlaceholder, { color: isDark ? 'rgba(255,255,255,0.6)' : TEXT_MUTED }]}>Search for products...</Text>
          </TouchableOpacity>
        </View>

        <View style={{ paddingHorizontal: H_PAD, paddingTop: 16 }}>

          {/* ── Hero banner ── */}
          <View style={[st.heroBanner, { backgroundColor: '#1e1150' }]}>
            <View style={{ flex: 1 }}>
              <View style={st.saleBadge}>
                <Text style={st.saleBadgeText}>🔥 Limited Time</Text>
              </View>
              <Text style={st.heroTitle}>Mega Sale</Text>
              <Text style={st.heroSub}>Up to 60% Off</Text>
              <TouchableOpacity style={st.shopNowBtn} onPress={() => router.push('/(tabs)/search')} activeOpacity={0.85}>
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
                <View style={[st.quickIcon, { backgroundColor: '#1e1150' }]}>
                  <Feather name={action.icon} size={20} color={PURPLE} />
                </View>
                <Text style={[st.quickLabel, { color: textDark }]}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Popular Categories ── */}
          {categories.length > 0 && (
            <View style={st.section}>
              <View style={st.sectionHeader}>
                <Text style={[st.sectionTitle, { color: sectionTitleColor }]}>Popular Categories</Text>
                <TouchableOpacity onPress={() => router.push('/(tabs)/search')}>
                  <Text style={st.seeAll}>See all</Text>
                </TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingRight: 4 }}>
                {categories.map((cat, i) => (
                  <TouchableOpacity
                    key={cat.slug}
                    style={st.catTile}
                    onPress={() => router.push({ pathname: '/(tabs)/search', params: { category: cat.slug } })}
                    activeOpacity={0.8}
                  >
                    <View style={[st.catImg, { backgroundColor: CAT_COLORS[i % CAT_COLORS.length] }]}>
                      <Feather name={getCatIcon(cat.slug)} size={22} color="#FFFFFF" />
                    </View>
                    <Text style={[st.catName, { color: textDark }]} numberOfLines={1}>{cat.name}</Text>
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
              <CountdownTimer isDark={isDark} />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 4, marginTop: 14 }}>
                {showFlash.map((product: any) => {
                  const origPrice = product.originalPrice ?? product.compareAtPrice;
                  const discount = origPrice && origPrice > product.price ? Math.round((1 - product.price / origPrice) * 100) : null;
                  return (
                    <TouchableOpacity
                      key={product.id}
                      style={[st.flashCard, { backgroundColor: cardBg }]}
                      onPress={() => router.push(`/product/${product.id}`)}
                      activeOpacity={0.85}
                    >
                      <View style={st.flashImgWrap}>
                        <Image source={{ uri: product.imageUrl }} style={st.flashImg} resizeMode="cover" />
                        {discount && (
                          <View style={st.discountBadge}>
                            <Text style={st.discountText}>-{discount}%</Text>
                          </View>
                        )}
                      </View>
                      <View style={st.flashInfo}>
                        <Text style={[st.flashName, { color: textDark }]} numberOfLines={2}>{product.name}</Text>
                        <Text style={st.flashPrice}>{formatPrice(product.price, product.currency)}</Text>
                        {origPrice && <Text style={st.flashOrig}>{formatPrice(origPrice, product.currency)}</Text>}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* ── Recommended ── */}
          {recommended.length > 0 && (
            <View style={st.section}>
              <View style={st.sectionHeader}>
                <Text style={[st.sectionTitle, { color: sectionTitleColor }]}>Recommended for You</Text>
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
              <Text style={[st.sectionTitle, { color: sectionTitleColor }]}>🔥 Trending Searches</Text>
              <View style={st.trendWrap}>
                {trending.map((term) => (
                  <TouchableOpacity
                    key={term}
                    style={[st.trendChip, { backgroundColor: isDark ? '#2D1F5E' : PURPLE_LIGHT }]}
                    onPress={() => router.push({ pathname: '/(tabs)/search', params: { q: term } })}
                    activeOpacity={0.75}
                  >
                    <Feather name="trending-up" size={11} color={isDark ? '#A78BFA' : PURPLE} />
                    <Text style={[st.trendText, { color: isDark ? '#A78BFA' : PURPLE }]}>{term}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </>
  );
}

const st = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  errorText: { fontSize: 15, fontFamily: 'Inter_400Regular' },
  retryBtn: { backgroundColor: PURPLE, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 100, marginTop: 4 },
  retryBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: WHITE },

  // Header
  header: {
    backgroundColor: PURPLE,
    paddingHorizontal: H_PAD,
    paddingBottom: 14,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  greeting: { fontSize: 11, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.70)', marginBottom: 1 },
  headerTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', color: WHITE },
  rightActions: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  iconBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  cartBadgeTop: {
    position: 'absolute', top: -2, right: -2,
    backgroundColor: RED_SALE, borderRadius: 8,
    minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3,
  },
  cartBadgeText: { color: WHITE, fontSize: 9, fontWeight: '700' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
  },
  searchPlaceholder: { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular' },

  // Hero banner
  heroBanner: {
    borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'center',
    marginBottom: 20, overflow: 'hidden',
    shadowColor: PURPLE, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  saleBadge: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 100, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start', marginBottom: 8 },
  saleBadgeText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: WHITE },
  heroTitle: { fontSize: 26, fontFamily: 'Inter_700Bold', color: WHITE, marginBottom: 4 },
  heroSub: { fontSize: 14, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.85)', marginBottom: 14 },
  shopNowBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: WHITE, borderRadius: 100, paddingHorizontal: 16, paddingVertical: 8, alignSelf: 'flex-start' },
  shopNowText: { fontSize: 13, fontFamily: 'Inter_700Bold', color: PURPLE },
  heroIcon: { alignItems: 'center', justifyContent: 'center', position: 'relative' },
  percentBadge: { position: 'absolute', top: -4, right: -8, backgroundColor: ORANGE, borderRadius: 100, width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  percentText: { fontSize: 12, fontFamily: 'Inter_700Bold', color: WHITE },

  // Quick actions
  quickRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  quickItem: { alignItems: 'center', flex: 1 },
  quickIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 6, shadowColor: PURPLE, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 4, elevation: 2 },
  quickLabel: { fontSize: 11, fontFamily: 'Inter_500Medium', textAlign: 'center' },

  // Sections
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 17, fontFamily: 'Inter_700Bold' },
  seeAll: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: PURPLE },

  // Categories
  catTile: { alignItems: 'center', width: 58 },
  catImg: { width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.10, shadowRadius: 4, elevation: 2 },
  catName: { fontSize: 10, fontFamily: 'Inter_500Medium', textAlign: 'center' },

  // Flash Sale
  flashCard: { width: FLASH_W, borderRadius: 14, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  flashImgWrap: { width: FLASH_W, height: FLASH_W, position: 'relative' },
  flashImg: { width: '100%', height: '100%' },
  discountBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: RED_SALE, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3 },
  discountText: { fontSize: 10, fontFamily: 'Inter_700Bold', color: WHITE },
  flashInfo: { padding: 10, gap: 3 },
  flashName: { fontSize: 12, fontFamily: 'Inter_500Medium', lineHeight: 16 },
  flashPrice: { fontSize: 14, fontFamily: 'Inter_700Bold', color: PURPLE },
  flashOrig: { fontSize: 11, fontFamily: 'Inter_400Regular', color: TEXT_MUTED, textDecorationLine: 'line-through' },

  // Grid
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: CARD_GAP },

  // Trending
  trendWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  trendChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 100 },
  trendText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
});
