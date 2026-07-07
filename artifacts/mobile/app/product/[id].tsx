import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useGetProduct, useAddCartItem } from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';

const { width: SCREEN_W } = Dimensions.get('window');

function formatPrice(amount: number, currency: string) {
  if (currency === 'NGN') return `₦${amount.toLocaleString()}`;
  return `${currency} ${amount.toLocaleString()}`;
}

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [added, setAdded] = useState(false);
  const [adding, setAdding] = useState(false);

  const { data: product, isLoading, isError } = useGetProduct(Number(id));
  const { mutateAsync: addToCart } = useAddCartItem();

  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const handleAddToCart = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setAdding(true);
    try {
      await addToCart({ data: { productId: Number(id), quantity: 1 } });
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch {
    } finally {
      setAdding(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isError || !product) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Feather name="alert-circle" size={36} color={colors.mutedForeground} />
        <Text style={[styles.errorText, { color: colors.mutedForeground }]}>Product not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.backLink, { color: colors.primary }]}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const discount =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round((1 - product.price / product.originalPrice) * 100)
      : null;

  return (
    <>
      <Stack.Screen
        options={{
          title: '',
          headerTransparent: true,
          headerTintColor: colors.foreground,
          headerStyle: { backgroundColor: 'transparent' },
        }}
      />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: bottomPad + 90 }}
        >
          {/* Image */}
          <View style={[styles.imageContainer, { backgroundColor: colors.secondary }]}>
            <Image
              source={{ uri: product.imageUrl }}
              style={styles.image}
              resizeMode="cover"
            />
            {discount ? (
              <View style={[styles.discountBadge, { backgroundColor: colors.primary }]}>
                <Text style={[styles.discountText, { color: colors.primaryForeground }]}>
                  -{discount}% OFF
                </Text>
              </View>
            ) : null}
          </View>

          {/* Info */}
          <View style={styles.info}>
            <View style={[styles.categoryChip, { backgroundColor: colors.accent }]}>
              <Text style={[styles.categoryText, { color: colors.primary }]}>
                {product.category}
              </Text>
            </View>

            <Text style={[styles.name, { color: colors.foreground }]}>
              {product.name}
            </Text>

            {/* Rating + seller */}
            <View style={styles.metaRow}>
              <View style={styles.ratingWrap}>
                <Feather name="star" size={14} color="#F59E0B" />
                <Text style={[styles.rating, { color: colors.foreground }]}>
                  {product.rating.toFixed(1)}
                </Text>
              </View>
              <Text style={[styles.seller, { color: colors.mutedForeground }]}>
                by {product.sellerName}
              </Text>
              <View style={styles.stockWrap}>
                <View
                  style={[
                    styles.stockDot,
                    { backgroundColor: product.stock > 0 ? '#10B981' : colors.destructive },
                  ]}
                />
                <Text style={[styles.stockText, { color: colors.mutedForeground }]}>
                  {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                </Text>
              </View>
            </View>

            {/* Price */}
            <View style={styles.priceRow}>
              <Text style={[styles.price, { color: colors.primary }]}>
                {formatPrice(product.price, product.currency)}
              </Text>
              {product.originalPrice ? (
                <Text style={[styles.originalPrice, { color: colors.mutedForeground }]}>
                  {formatPrice(product.originalPrice, product.currency)}
                </Text>
              ) : null}
            </View>

            {/* Description */}
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <Text style={[styles.descTitle, { color: colors.foreground }]}>Description</Text>
            <Text style={[styles.desc, { color: colors.mutedForeground }]}>
              {product.description}
            </Text>

            {/* Tags */}
            {product.tags?.length > 0 && (
              <View style={styles.tagsRow}>
                {product.tags.map((tag) => (
                  <View
                    key={tag}
                    style={[styles.tag, { backgroundColor: colors.secondary, borderColor: colors.border }]}
                  >
                    <Text style={[styles.tagText, { color: colors.mutedForeground }]}>#{tag}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>

        {/* Sticky add to cart */}
        <View
          style={[
            styles.footer,
            {
              borderTopColor: colors.border,
              backgroundColor: colors.background,
              paddingBottom: bottomPad + 12,
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.addBtn,
              {
                backgroundColor: added ? '#10B981' : colors.primary,
                opacity: adding || product.stock === 0 ? 0.6 : 1,
              },
            ]}
            onPress={handleAddToCart}
            disabled={adding || product.stock === 0}
          >
            {adding ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Feather
                  name={added ? 'check' : 'shopping-cart'}
                  size={18}
                  color="#fff"
                />
                <Text style={styles.addBtnText}>
                  {product.stock === 0
                    ? 'Out of Stock'
                    : added
                    ? 'Added!'
                    : 'Add to Cart'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  imageContainer: { width: SCREEN_W, height: SCREEN_W * 0.85 },
  image: { width: '100%', height: '100%' },
  discountBadge: { position: 'absolute', top: 60, right: 16, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  discountText: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  info: { padding: 20, gap: 10 },
  categoryChip: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },
  categoryText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', textTransform: 'capitalize' },
  name: { fontSize: 22, fontFamily: 'Inter_700Bold', lineHeight: 28 },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12 },
  ratingWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rating: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  seller: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  stockWrap: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  stockDot: { width: 7, height: 7, borderRadius: 4 },
  stockText: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  price: { fontSize: 26, fontFamily: 'Inter_700Bold' },
  originalPrice: { fontSize: 16, fontFamily: 'Inter_400Regular', textDecorationLine: 'line-through' },
  divider: { height: 1, marginVertical: 4 },
  descTitle: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  desc: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 22 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100, borderWidth: 1 },
  tagText: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  footer: { paddingHorizontal: 20, paddingTop: 14, borderTopWidth: 1 },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 14 },
  addBtnText: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: '#fff' },
  errorText: { fontSize: 15, fontFamily: 'Inter_400Regular' },
  backLink: { fontSize: 14, fontFamily: 'Inter_500Medium' },
});
