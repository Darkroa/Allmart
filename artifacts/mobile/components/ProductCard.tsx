import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';

interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice?: number | null;
  currency: string;
  imageUrl: string;
  rating: number;
  category: string;
}

interface ProductCardProps {
  product: Product;
  onPress: () => void;
  onAddToCart?: () => void;
  addingToCart?: boolean;
  width?: number;
}

function formatPrice(amount: number, currency: string) {
  if (currency === 'NGN') return `₦${amount.toLocaleString()}`;
  return `${currency} ${amount.toLocaleString()}`;
}

export default function ProductCard({
  product,
  onPress,
  onAddToCart,
  addingToCart,
  width,
}: ProductCardProps) {
  const colors = useColors();

  const discount =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round((1 - product.price / product.originalPrice) * 100)
      : null;

  const handleAddToCart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onAddToCart?.();
  };

  return (
    <TouchableOpacity
      style={[styles.card, { borderColor: colors.border, width }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={[styles.imageWrapper, { backgroundColor: colors.secondary }]}>
        <Image
          source={{ uri: product.imageUrl }}
          style={styles.image}
          resizeMode="cover"
        />
        {discount ? (
          <View style={[styles.badge, { backgroundColor: colors.primary }]}>
            <Text style={[styles.badgeText, { color: colors.primaryForeground }]}>
              -{discount}%
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={2}>
          {product.name}
        </Text>

        <View style={styles.ratingRow}>
          <Feather name="star" size={11} color="#F59E0B" />
          <Text style={[styles.rating, { color: colors.mutedForeground }]}>
            {product.rating.toFixed(1)}
          </Text>
        </View>

        <View style={styles.priceRow}>
          <View>
            <Text style={[styles.price, { color: colors.primary }]}>
              {formatPrice(product.price, product.currency)}
            </Text>
            {product.originalPrice ? (
              <Text style={[styles.originalPrice, { color: colors.mutedForeground }]}>
                {formatPrice(product.originalPrice, product.currency)}
              </Text>
            ) : null}
          </View>

          {onAddToCart ? (
            <TouchableOpacity
              style={[styles.cartBtn, { backgroundColor: colors.primary }]}
              onPress={handleAddToCart}
              disabled={addingToCart}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              {addingToCart ? (
                <ActivityIndicator size="small" color={colors.primaryForeground} />
              ) : (
                <Feather name="plus" size={16} color={colors.primaryForeground} />
              )}
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 12,
  },
  imageWrapper: {
    width: '100%',
    aspectRatio: 1,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
  },
  info: {
    padding: 10,
    gap: 4,
  },
  name: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    lineHeight: 18,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  rating: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  price: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
  },
  originalPrice: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    textDecorationLine: 'line-through',
  },
  cartBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
