import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSignIn, useSignUp, useListOrders } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';

type Tab = 'signin' | 'signup';

function formatPrice(amount: number, currency: string) {
  if (currency === 'NGN') return `₦${amount.toLocaleString()}`;
  return `${currency} ${amount.toLocaleString()}`;
}

export default function AccountScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, signOut, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  // Auth form state
  const [tab, setTab] = useState<Tab>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [authError, setAuthError] = useState('');

  const { mutateAsync: signIn, isPending: signingIn } = useSignIn();
  const { mutateAsync: signUp, isPending: signingUp } = useSignUp();
  const { data: orders } = useListOrders();

  const isPending = signingIn || signingUp;

  const handleAuth = async () => {
    setAuthError('');
    if (!email || !password) { setAuthError('Please fill in all fields'); return; }
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (tab === 'signin') {
        await signIn({ data: { email, password } });
      } else {
        if (!name) { setAuthError('Name is required'); return; }
        await signUp({ data: { email, password, name } });
      }
      await queryClient.invalidateQueries();
      setEmail(''); setPassword(''); setName(''); setAuthError('');
    } catch (e: any) {
      const msg = e?.response?.data?.error ?? 'Something went wrong';
      setAuthError(msg);
    }
  };

  const handleSignOut = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    signOut();
    await queryClient.invalidateQueries();
  };

  if (authLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // ----- Signed-in view -----
  if (user) {
    return (
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: topPad + 16, paddingBottom: bottomPad + 16 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile card */}
        <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.avatarBig, { backgroundColor: colors.accent }]}>
            <Text style={[styles.avatarInitial, { color: colors.primary }]}>
              {user.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.profileName, { color: colors.foreground }]}>{user.name}</Text>
            <Text style={[styles.profileEmail, { color: colors.mutedForeground }]}>{user.email}</Text>
            <View style={[styles.roleBadge, { backgroundColor: colors.accent }]}>
              <Text style={[styles.roleText, { color: colors.primary }]}>{user.role}</Text>
            </View>
          </View>
        </View>

        {/* Orders */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>My Orders</Text>

        {(orders?.length ?? 0) === 0 ? (
          <View style={[styles.emptyOrders, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
            <Feather name="package" size={28} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No orders yet</Text>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {(orders ?? []).map((order) => (
              <TouchableOpacity
                key={order.id}
                style={[styles.orderCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => router.push(`/order/${order.id}`)}
                activeOpacity={0.8}
              >
                <View style={styles.orderTop}>
                  <Text style={[styles.orderTracking, { color: colors.foreground }]}>
                    #{order.trackingCode}
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          order.status === 'delivered'
                            ? '#D1FAE5'
                            : order.status === 'cancelled'
                            ? '#FEE2E2'
                            : colors.accent,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        {
                          color:
                            order.status === 'delivered'
                              ? '#065F46'
                              : order.status === 'cancelled'
                              ? '#991B1B'
                              : colors.primary,
                        },
                      ]}
                    >
                      {order.status}
                    </Text>
                  </View>
                </View>
                <View style={styles.orderBottom}>
                  <Text style={[styles.orderItems, { color: colors.mutedForeground }]}>
                    {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                  </Text>
                  <Text style={[styles.orderTotal, { color: colors.primary }]}>
                    {formatPrice(order.total, order.currency)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Sign out */}
        <TouchableOpacity
          style={[styles.signOutBtn, { borderColor: colors.border }]}
          onPress={handleSignOut}
        >
          <Feather name="log-out" size={18} color={colors.destructive} />
          <Text style={[styles.signOutText, { color: colors.destructive }]}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // ----- Auth form -----
  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.authScroll,
        { paddingTop: topPad + 32, paddingBottom: bottomPad + 16 },
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.logoMark, { backgroundColor: colors.accent }]}>
        <Feather name="shopping-bag" size={28} color={colors.primary} />
      </View>
      <Text style={[styles.authTitle, { color: colors.foreground }]}>AllMart</Text>
      <Text style={[styles.authSubtitle, { color: colors.mutedForeground }]}>
        {tab === 'signin' ? 'Welcome back' : 'Create your account'}
      </Text>

      {/* Tab switcher */}
      <View style={[styles.tabRow, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
        {(['signin', 'signup'] as Tab[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[
              styles.tabBtn,
              tab === t && { backgroundColor: colors.background },
            ]}
            onPress={() => { setTab(t); setAuthError(''); }}
          >
            <Text
              style={[
                styles.tabBtnText,
                { color: tab === t ? colors.foreground : colors.mutedForeground },
              ]}
            >
              {t === 'signin' ? 'Sign in' : 'Sign up'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Fields */}
      <View style={styles.fields}>
        {tab === 'signup' && (
          <View style={[styles.inputWrap, { borderColor: colors.input, backgroundColor: colors.card }]}>
            <Feather name="user" size={16} color={colors.mutedForeground} />
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              placeholder="Full name"
              placeholderTextColor={colors.mutedForeground}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>
        )}

        <View style={[styles.inputWrap, { borderColor: colors.input, backgroundColor: colors.card }]}>
          <Feather name="mail" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[styles.input, { color: colors.foreground }]}
            placeholder="Email address"
            placeholderTextColor={colors.mutedForeground}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={[styles.inputWrap, { borderColor: colors.input, backgroundColor: colors.card }]}>
          <Feather name="lock" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[styles.input, { color: colors.foreground }]}
            placeholder="Password"
            placeholderTextColor={colors.mutedForeground}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPass}
          />
          <TouchableOpacity onPress={() => setShowPass(!showPass)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Feather name={showPass ? 'eye-off' : 'eye'} size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>
      </View>

      {authError ? (
        <Text style={[styles.errorText, { color: colors.destructive }]}>{authError}</Text>
      ) : null}

      <TouchableOpacity
        style={[styles.authBtn, { backgroundColor: colors.primary, opacity: isPending ? 0.7 : 1 }]}
        onPress={handleAuth}
        disabled={isPending}
      >
        {isPending ? (
          <ActivityIndicator size="small" color={colors.primaryForeground} />
        ) : (
          <Text style={[styles.authBtnText, { color: colors.primaryForeground }]}>
            {tab === 'signin' ? 'Sign in' : 'Create account'}
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 16, gap: 16 },
  authScroll: { paddingHorizontal: 24, alignItems: 'stretch' },
  logoMark: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 12 },
  authTitle: { fontSize: 28, fontFamily: 'Inter_700Bold', textAlign: 'center', marginBottom: 4 },
  authSubtitle: { fontSize: 15, fontFamily: 'Inter_400Regular', textAlign: 'center', marginBottom: 28 },
  tabRow: { flexDirection: 'row', borderRadius: 12, borderWidth: 1, padding: 4, marginBottom: 24 },
  tabBtn: { flex: 1, paddingVertical: 9, borderRadius: 9, alignItems: 'center' },
  tabBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  fields: { gap: 12, marginBottom: 16 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14 },
  input: { flex: 1, fontSize: 15, fontFamily: 'Inter_400Regular', padding: 0, margin: 0 },
  errorText: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center', marginBottom: 4 },
  authBtn: { paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 4 },
  authBtnText: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  profileCard: { flexDirection: 'row', gap: 14, borderRadius: 16, borderWidth: 1, padding: 16, alignItems: 'center', marginBottom: 4 },
  avatarBig: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontSize: 24, fontFamily: 'Inter_700Bold' },
  profileName: { fontSize: 17, fontFamily: 'Inter_700Bold' },
  profileEmail: { fontSize: 13, fontFamily: 'Inter_400Regular', marginBottom: 4 },
  roleBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100 },
  roleText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', textTransform: 'capitalize' },
  sectionTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', marginTop: 4 },
  emptyOrders: { flexDirection: 'row', gap: 10, alignItems: 'center', borderRadius: 14, borderWidth: 1, padding: 18 },
  emptyText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  orderCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 8 },
  orderTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderTracking: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100 },
  statusText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', textTransform: 'capitalize' },
  orderBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderItems: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  orderTotal: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  signOutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderRadius: 14, paddingVertical: 14, marginTop: 8 },
  signOutText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
});
