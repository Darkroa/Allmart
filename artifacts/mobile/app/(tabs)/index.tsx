import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Platform,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import {
  useGetStorefrontSummary,
  useAddCartItem,
} from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import ProductCard from '@/components/ProductCard';
import SearchBar from '@/components/SearchBar';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = 12;
const H_PAD = 16;
const CARD_WIDTH = (SCREEN_WIDTH - H_PAD * 2 - CARD_GAP) / 2;

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const [addingId, setAddingId] = useState<number | null>(null);

  const {
    data: summary,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useGetStorefrontSummary();

  const { mutateAsync: addToCart } = useAddCartItem();

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const handleAddToCart = async (productId: number) => {
    setAddingId(productId);
    try {
      await addToCart({ data: { productId, quantity: 1 } });
    } catch {
      // silent
    } finally {
      setAddingId(null);
    }
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Feather name="wifi-off" size={36} color={colors.mutedForeground} />
        <Text style={[styles.errorText, { color: colors.mutedForeground }]}>
          Couldn't load products
        </Text>
        <TouchableOpacity
          style={[styles.retryBtn, { backgroundColor: colors.primary }]}
          onPress={() => refetch()}
        >
          <Text style={[styles.retryBtnText, { color: colors.primaryForeground }]}>
            Retry
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const featured = summary?.featured ?? [];
  const categories = summary?.topCategories ?? [];
  const trending = summary?.trendingSearches ?? [];

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.scroll,
        {
          paddingTop: topPad + 16,
          paddingBottom: Platform.OS === 'web' ? 34 : insets.bottom + 16,
        },
      ]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetch}
          tintColor={colors.primary}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
            {greeting()}{user ? `, ${user.name.split(' ')[0]}` : ''}
          </Text>
          <Text style={[styles.title, { color: colors.foreground }]}>
            What are you{'\n'}shopping for?
          </Text>
        </View>
        <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
          <Feather name="user" size={22} color={colors.primary} />
        </View>
      </View>

      {/* Search bar */}
      <View style={styles.searchWrap}>
        <SearchBar
          value=""
          onChangeText={() => {}}
          onPress={() => router.push('/(tabs)/search')}
          editable={false}
        />
      </View>

      {/* Categories */}
      {categories.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Categories
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.catScroll}
          >
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.slug}
                style={[styles.catChip, { backgroundColor: colors.secondary, borderColor: colors.border }]}
                onPress={() =>
                  router.push({ pathname: '/(tabs)/search', params: { category: cat.slug } })
                }
                activeOpacity={0.75}
              >
                <Text style={[styles.catText, { color: colors.foreground }]}>
                  {cat.name}
                </Text>
                <Text style={[styles.catCount, { color: colors.mutedForeground }]}>
                  {cat.productCount}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Featured products */}
      {featured.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Featured
            </Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/search')}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.grid}>
            {featured.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
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
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Trending
          </Text>
          <View style={styles.trendingWrap}>
            {trending.map((term) => (
              <TouchableOpacity
                key={term}
                style={[styles.trendingChip, { backgroundColor: colors.accent, borderColor: colors.border }]}
                onPress={() =>
                  router.push({ pathname: '/(tabs)/search', params: { q: term } })
                }
                activeOpacity={0.75}
              >
                <Feather name="trending-up" size={12} color={colors.primary} />
                <Text style={[styles.trendingText, { color: colors.accentForeground }]}>
                  {term}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  scroll: { paddingHorizontal: H_PAD },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  greeting: { fontSize: 13, fontFamily: 'Inter_400Regular', marginBottom: 4 },
  title: { fontSize: 26, fontFamily: 'Inter_700Bold', lineHeight: 32 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  searchWrap: { marginBottom: 24 },
  section: { marginBottom: 28 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', marginBottom: 14 },
  seeAll: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  catScroll: { gap: 10, paddingRight: 16 },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 100,
    borderWidth: 1,
  },
  catText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  catCount: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
  },
  trendingWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  trendingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 100,
    borderWidth: 1,
  },
  trendingText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  errorText: { fontSize: 15, fontFamily: 'Inter_400Regular' },
  retryBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 100, marginTop: 4 },
  retryBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
});
