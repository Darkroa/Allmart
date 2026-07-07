import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useListProducts, useListCategories, useAddCartItem } from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import ProductCard from '@/components/ProductCard';
import SearchBar from '@/components/SearchBar';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const H_PAD = 16;
const CARD_GAP = 12;
const CARD_WIDTH = (SCREEN_WIDTH - H_PAD * 2 - CARD_GAP) / 2;

export default function SearchScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ q?: string; category?: string }>();

  const [query, setQuery] = useState(params.q ?? '');
  const [selectedCat, setSelectedCat] = useState<string | null>(params.category ?? null);
  const [addingId, setAddingId] = useState<number | null>(null);

  useEffect(() => {
    if (params.q) setQuery(params.q);
    if (params.category) setSelectedCat(params.category);
  }, [params.q, params.category]);

  const { data: categories } = useListCategories();
  const { data: products, isLoading, isError, refetch } = useListProducts({
    ...(query ? { q: query } : {}),
    ...(selectedCat ? { category: selectedCat } : {}),
    limit: 50,
  });

  const { mutateAsync: addToCart } = useAddCartItem();

  const handleAddToCart = async (productId: number) => {
    setAddingId(productId);
    try {
      await addToCart({ data: { productId, quantity: 1 } });
    } catch {
    } finally {
      setAddingId(null);
    }
  };

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Fixed header */}
      <View
        style={[
          styles.topBar,
          { paddingTop: topPad + 12, borderBottomColor: colors.border, backgroundColor: colors.background },
        ]}
      >
        <SearchBar
          value={query}
          onChangeText={setQuery}
          autoFocus={!params.category}
        />

        {/* Category chips */}
        {(categories?.length ?? 0) > 0 && (
          <FlatList
            horizontal
            data={[{ slug: null, name: 'All' }, ...(categories ?? [])] as any[]}
            keyExtractor={(item) => item.slug ?? 'all'}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.catList}
            renderItem={({ item }) => {
              const active = selectedCat === item.slug;
              return (
                <TouchableOpacity
                  style={[
                    styles.catChip,
                    {
                      backgroundColor: active ? colors.primary : colors.secondary,
                      borderColor: active ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setSelectedCat(item.slug)}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.catText,
                      { color: active ? colors.primaryForeground : colors.foreground },
                    ]}
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>

      {/* Products */}
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : isError ? (
        <View style={styles.centered}>
          <Feather name="wifi-off" size={36} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Couldn't load products
          </Text>
          <TouchableOpacity
            style={[styles.retryBtn, { backgroundColor: colors.primary }]}
            onPress={() => refetch()}
          >
            <Text style={[styles.retryText, { color: colors.primaryForeground }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (products?.length ?? 0) === 0 ? (
        <View style={styles.centered}>
          <Feather name="package" size={36} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            No products found
          </Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: Platform.OS === 'web' ? 34 : insets.bottom + 16 },
          ]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              width={CARD_WIDTH}
              onPress={() => router.push(`/product/${item.id}`)}
              onAddToCart={() => handleAddToCart(item.id)}
              addingToCart={addingId === item.id}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    paddingHorizontal: H_PAD,
    paddingBottom: 10,
    borderBottomWidth: 1,
    gap: 12,
  },
  catList: { gap: 8, paddingRight: 16 },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 100,
    borderWidth: 1,
  },
  catText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyText: { fontSize: 15, fontFamily: 'Inter_400Regular' },
  retryBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 100 },
  retryText: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  list: { paddingHorizontal: H_PAD, paddingTop: 16 },
  row: { gap: CARD_GAP, justifyContent: 'flex-start' },
});
