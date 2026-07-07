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
  StatusBar,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, FontAwesome } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSignIn, useSignUp, useListOrders } from '@workspace/api-client-react';
import type { Order } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';

type Tab = 'signin' | 'signup';

const LAVENDER_BG = '#EDE8F8';
const LAVENDER_MID = '#C9BCF0';
const PURPLE = '#8B7BD8';
const CARD_BG = '#FAF9FF';
const WHITE = '#FFFFFF';
const TEXT_DARK = '#2D2248';
const TEXT_MUTED = '#9B93B8';
const ALLMART_ORANGE = '#E8621A';
const HEART_PINK = '#F08080';

function formatPrice(amount: number, currency: string) {
  if (currency === 'NGN') return `₦${amount.toLocaleString()}`;
  return `${currency} ${amount.toLocaleString()}`;
}

// Shopping bag logo using the real AllMart icon
function BagLogo() {
  return (
    <View style={logo.container}>
      {/* Bag handles */}
      <View style={logo.handleLeft} />
      <View style={logo.handleRight} />
      {/* Bag body with real logo */}
      <View style={logo.bag}>
        <Image
          source={require('@/assets/images/icon.png')}
          style={logo.icon}
          resizeMode="cover"
        />
      </View>
    </View>
  );
}

const logo = StyleSheet.create({
  container: {
    width: 104,
    height: 114,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  handleLeft: {
    position: 'absolute',
    top: 2,
    left: 22,
    width: 18,
    height: 26,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderWidth: 4,
    borderColor: ALLMART_ORANGE,
    borderBottomWidth: 0,
    borderRightWidth: 0,
    backgroundColor: 'transparent',
  },
  handleRight: {
    position: 'absolute',
    top: 2,
    right: 22,
    width: 18,
    height: 26,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderWidth: 4,
    borderColor: ALLMART_ORANGE,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    backgroundColor: 'transparent',
  },
  bag: {
    width: 90,
    height: 90,
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: ALLMART_ORANGE,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 10,
  },
  icon: {
    width: 90,
    height: 90,
  },
});

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
      <View style={[styles.centered, { backgroundColor: LAVENDER_BG }]}>
        <ActivityIndicator size="large" color={PURPLE} />
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
          <View style={[styles.avatarBig, { backgroundColor: LAVENDER_MID }]}>
            <Text style={[styles.avatarInitial, { color: PURPLE }]}>
              {user.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.profileName, { color: colors.foreground }]}>{user.name}</Text>
            <Text style={[styles.profileEmail, { color: colors.mutedForeground }]}>{user.email}</Text>
            <View style={[styles.roleBadge, { backgroundColor: LAVENDER_BG }]}>
              <Text style={[styles.roleText, { color: PURPLE }]}>{user.role}</Text>
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
            {(orders ?? []).map((order: Order) => (
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
                            : LAVENDER_BG,
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
                              : PURPLE,
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
                  <Text style={[styles.orderTotal, { color: PURPLE }]}>
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

  // ----- Auth form (new design) -----
  return (
    <View style={styles.authRoot}>
      <StatusBar barStyle="dark-content" backgroundColor={LAVENDER_BG} />
      <ScrollView
        style={styles.authScroll}
        contentContainerStyle={[
          styles.authContent,
          { paddingTop: topPad + 20, paddingBottom: bottomPad + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Heart */}
        <Text style={styles.heart}>♥</Text>

        {/* Heading */}
        <Text style={styles.welcomeTitle}>
          {tab === 'signin' ? 'Welcome Back' : 'Create Account'}
        </Text>
        <Text style={styles.welcomeSub}>
          {tab === 'signin'
            ? 'Login to continue your journey'
            : 'Join AllMart today'}
        </Text>

        {/* Bag logo */}
        <View style={styles.logoWrap}>
          <BagLogo />
        </View>

        {/* Card */}
        <View style={styles.card}>
          {/* Name field (sign up only) */}
          {tab === 'signup' && (
            <View style={styles.inputRow}>
              <View style={styles.iconCircle}>
                <Feather name="user" size={18} color={WHITE} />
              </View>
              <TextInput
                style={styles.inputField}
                placeholder="Full Name"
                placeholderTextColor={TEXT_MUTED}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>
          )}

          {/* Email field */}
          <View style={styles.inputRow}>
            <View style={styles.iconCircle}>
              <Feather name="user" size={18} color={WHITE} />
            </View>
            <TextInput
              style={styles.inputField}
              placeholder="Email or Username"
              placeholderTextColor={TEXT_MUTED}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Password field */}
          <View style={styles.inputRow}>
            <View style={styles.iconCircle}>
              <Feather name="lock" size={18} color={WHITE} />
            </View>
            <TextInput
              style={[styles.inputField, { flex: 1 }]}
              placeholder="Password"
              placeholderTextColor={TEXT_MUTED}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPass}
            />
            <TouchableOpacity
              onPress={() => setShowPass(!showPass)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Feather
                name={showPass ? 'eye-off' : 'eye'}
                size={18}
                color={TEXT_MUTED}
              />
            </TouchableOpacity>
          </View>

          {/* Forgot password */}
          {tab === 'signin' && (
            <TouchableOpacity style={styles.forgotWrap}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>
          )}

          {/* Error */}
          {authError ? (
            <Text style={styles.errorText}>{authError}</Text>
          ) : null}

          {/* Login / Sign up button */}
          <TouchableOpacity
            style={[styles.loginBtn, isPending && { opacity: 0.75 }]}
            onPress={handleAuth}
            disabled={isPending}
            activeOpacity={0.85}
          >
            {isPending ? (
              <ActivityIndicator size="small" color={WHITE} />
            ) : (
              <Text style={styles.loginBtnText}>
                {tab === 'signin' ? 'Login' : 'Create Account'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social buttons */}
          <View style={styles.socialRow}>
            <TouchableOpacity style={styles.socialBtn} activeOpacity={0.8}>
              <Text style={styles.googleG}>G</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialBtn} activeOpacity={0.8}>
              <FontAwesome name="apple" size={20} color={TEXT_DARK} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialBtn} activeOpacity={0.8}>
              <FontAwesome name="facebook" size={20} color="#1877F2" />
            </TouchableOpacity>
          </View>

          {/* Switch tab */}
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>
              {tab === 'signin'
                ? "Don't have an account?"
                : 'Already have an account?'}
            </Text>
            <TouchableOpacity
              onPress={() => { setTab(tab === 'signin' ? 'signup' : 'signin'); setAuthError(''); }}
            >
              <Text style={styles.switchLink}>
                {tab === 'signin' ? ' Sign Up' : ' Sign In'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  // Loading & signed-in
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 16, gap: 16 },
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

  // New auth design
  authRoot: {
    flex: 1,
    backgroundColor: LAVENDER_BG,
  },
  authScroll: {
    flex: 1,
    backgroundColor: LAVENDER_BG,
  },
  authContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  heart: {
    fontSize: 24,
    color: HEART_PINK,
    marginBottom: 8,
  },
  welcomeTitle: {
    fontSize: 30,
    fontFamily: 'Inter_700Bold',
    color: TEXT_DARK,
    textAlign: 'center',
    marginBottom: 6,
  },
  welcomeSub: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: TEXT_MUTED,
    textAlign: 'center',
    marginBottom: 20,
  },
  logoWrap: {
    marginBottom: 24,
    alignItems: 'center',
  },

  // Form card
  card: {
    width: '100%',
    backgroundColor: CARD_BG,
    borderRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 20,
    shadowColor: '#7B6BA0',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
    gap: 14,
  },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WHITE,
    borderRadius: 14,
    paddingVertical: 4,
    paddingHorizontal: 6,
    shadowColor: '#B0A0D0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 2,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  inputField: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: TEXT_DARK,
    paddingVertical: 12,
    padding: 0,
    margin: 0,
  },

  forgotWrap: {
    alignSelf: 'flex-end',
    marginTop: -6,
  },
  forgotText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: PURPLE,
  },

  errorText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: '#E05555',
    textAlign: 'center',
    marginTop: -4,
  },

  loginBtn: {
    backgroundColor: PURPLE,
    borderRadius: 50,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: PURPLE,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  loginBtnText: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
    color: WHITE,
    letterSpacing: 0.3,
  },

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: -2,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0D8F0',
  },
  dividerText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: TEXT_MUTED,
  },

  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  socialBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: WHITE,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#B0A0D0',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  googleG: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: '#EA4335',
  },

  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  switchLabel: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: TEXT_MUTED,
  },
  switchLink: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    color: PURPLE,
  },
});
