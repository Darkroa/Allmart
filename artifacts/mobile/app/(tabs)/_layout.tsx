import React from 'react';
import {
  Platform,
  StyleSheet,
  useColorScheme,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { Tabs, useRouter } from 'expo-router';
import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';
import { SymbolView } from 'expo-symbols';
import { useGetCart } from '@workspace/api-client-react';

const PURPLE = '#7C3AED';
const PURPLE_LIGHT = '#EDE9FE';
const WHITE = '#FFFFFF';
const TAB_BAR_H = 64;

function CartTabIcon({ color, badge }: { color: string; badge?: number }) {
  return (
    <View>
      {Platform.OS === 'ios' ? (
        <SymbolView name="cart" tintColor={color} size={24} />
      ) : (
        <Feather name="shopping-cart" size={22} color={color} />
      )}
      {(badge ?? 0) > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge! > 9 ? '9+' : badge}</Text>
        </View>
      )}
    </View>
  );
}

/** Floating purple circle button rendered in the center of the tab bar */
function AskAITabButton({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity
      style={styles.aiWrapper}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.aiCircle}>
        <Feather name="cpu" size={24} color={WHITE} />
      </View>
      <Text style={styles.aiLabel}>Ask AI</Text>
    </TouchableOpacity>
  );
}

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: 'house', selected: 'house.fill' }} />
        <Label>Shop</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="search">
        <Icon sf={{ default: 'magnifyingglass', selected: 'magnifyingglass' }} />
        <Label>Search</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="ai">
        <Icon sf={{ default: 'sparkles', selected: 'sparkles' }} />
        <Label>Ask AI</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="cart">
        <Icon sf={{ default: 'cart', selected: 'cart.fill' }} />
        <Label>Cart</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="account">
        <Icon sf={{ default: 'person', selected: 'person.fill' }} />
        <Label>Account</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const isIOS = Platform.OS === 'ios';
  const isWeb = Platform.OS === 'web';
  const router = useRouter();

  const { data: cart } = useGetCart();
  const cartCount = cart?.items?.length ?? 0;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: PURPLE,
        tabBarInactiveTintColor: colors.mutedForeground,
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: isIOS ? 'transparent' : WHITE,
          borderTopWidth: 1,
          borderTopColor: '#F0EEFF',
          elevation: 0,
          height: isWeb ? 84 : TAB_BAR_H + (isIOS ? 20 : 0),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={100}
              tint={isDark ? 'dark' : 'extraLight'}
              style={StyleSheet.absoluteFill}
            />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: WHITE }]} />
          ),
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: 'Inter_500Medium',
          marginBottom: isIOS ? 0 : 4,
        },
      }}
    >
      {/* Shop */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Shop',
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="house" tintColor={color} size={24} />
            ) : (
              <Feather name="home" size={22} color={color} />
            ),
        }}
      />

      {/* Search */}
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="magnifyingglass" tintColor={color} size={24} />
            ) : (
              <Feather name="search" size={22} color={color} />
            ),
        }}
      />

      {/* ── Center AI button ── */}
      <Tabs.Screen
        name="ai"
        options={{
          title: '',
          tabBarIcon: () => null,
          tabBarLabel: () => null,
          tabBarButton: () => (
            <AskAITabButton onPress={() => router.push('/(tabs)/ai')} />
          ),
        }}
      />

      {/* Cart */}
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarBadge: cartCount > 0 ? cartCount : undefined,
          tabBarIcon: ({ color }) => <CartTabIcon color={color} badge={cartCount} />,
        }}
      />

      {/* Account */}
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="person" tintColor={color} size={24} />
            ) : (
              <Feather name="user" size={22} color={color} />
            ),
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#EF4444',
    borderRadius: 9,
    minWidth: 17,
    height: 17,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: WHITE,
    fontSize: 10,
    fontWeight: '700',
  },

  // Center AI button
  aiWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 4,
  },
  aiCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -18, // lift above the tab bar
    shadowColor: PURPLE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 10,
    borderWidth: 3,
    borderColor: WHITE,
  },
  aiLabel: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: PURPLE,
    marginTop: 3,
  },
});
