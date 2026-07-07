import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  useListChatMessages,
  useSendChatMessage,
  useResetChat,
} from '@workspace/api-client-react';
import type { ChatMessage, Product } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useColors } from '@/hooks/useColors';

const PURPLE = '#7C3AED';
const PURPLE_LIGHT = '#EDE9FE';
const PURPLE_DARK = '#5B21B6';
const WHITE = '#FFFFFF';
const TEXT_DARK = '#1C1028';
const TEXT_MUTED = '#6B7280';
const BG = '#F8F7FF';

function formatPrice(amount: number, currency: string) {
  if (currency === 'NGN') return `₦${amount.toLocaleString()}`;
  return `${currency} ${amount.toLocaleString()}`;
}

function ProductSuggestion({ product }: { product: Product }) {
  const router = useRouter();
  return (
    <TouchableOpacity
      style={ps.card}
      onPress={() => router.push(`/product/${product.id}`)}
      activeOpacity={0.85}
    >
      <Image source={{ uri: product.imageUrl }} style={ps.img} resizeMode="cover" />
      <View style={ps.info}>
        <Text style={ps.name} numberOfLines={2}>{product.name}</Text>
        <Text style={ps.price}>{formatPrice(product.price, product.currency)}</Text>
      </View>
    </TouchableOpacity>
  );
}

const ps = StyleSheet.create({
  card: {
    width: 120,
    backgroundColor: WHITE,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0EEFF',
    marginRight: 10,
  },
  img: { width: 120, height: 100 },
  info: { padding: 8, gap: 2 },
  name: { fontSize: 11, fontFamily: 'Inter_500Medium', color: TEXT_DARK, lineHeight: 14 },
  price: { fontSize: 12, fontFamily: 'Inter_700Bold', color: PURPLE },
});

function Bubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user';
  return (
    <View style={[bst.row, isUser ? bst.rowRight : bst.rowLeft]}>
      {!isUser && (
        <View style={bst.avatar}>
          <Text style={{ fontSize: 14 }}>🤖</Text>
        </View>
      )}
      <View style={[bst.bubble, isUser ? bst.userBubble : bst.aiBubble]}>
        <Text style={[bst.text, { color: isUser ? WHITE : TEXT_DARK }]}>{msg.content}</Text>
        {(msg.productSuggestions?.length ?? 0) > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginTop: 10 }}
            contentContainerStyle={{ paddingRight: 4 }}
          >
            {msg.productSuggestions!.map((p: Product) => (
              <ProductSuggestion key={p.id} product={p} />
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const bst = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', marginVertical: 5, paddingHorizontal: 16 },
  rowLeft: { justifyContent: 'flex-start' },
  rowRight: { justifyContent: 'flex-end' },
  avatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: PURPLE_LIGHT,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 8, marginBottom: 2,
  },
  bubble: {
    maxWidth: '78%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  userBubble: { backgroundColor: PURPLE, borderBottomRightRadius: 4 },
  aiBubble: { backgroundColor: WHITE, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#EDDEFF' },
  text: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20 },
});

const QUICK_PROMPTS = [
  "What's on sale today?",
  "Show me electronics",
  "I need a gift under $50",
  "Best rated products",
];

export default function AIScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const qc = useQueryClient();

  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);

  const { data: messages = [], isLoading } = useListChatMessages();
  const { mutateAsync: sendMessage } = useSendChatMessage();
  const { mutateAsync: resetChat } = useResetChat();

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const handleSend = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || sending) return;
    setInput('');
    setSending(true);
    try {
      await sendMessage({ data: { content } });
      await qc.invalidateQueries({ queryKey: ['/api/chat/messages'] });
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 150);
    } catch {
      // silent
    } finally {
      setSending(false);
    }
  };

  const handleReset = async () => {
    await resetChat({});
    await qc.invalidateQueries({ queryKey: ['/api/chat/messages'] });
  };

  const showEmpty = !isLoading && messages.length === 0;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: BG }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={[st.header, { paddingTop: topPad + 8 }]}>
        <View style={st.headerInner}>
          <View style={st.headerLeft}>
            <View style={st.aiAvatar}>
              <Text style={{ fontSize: 22 }}>🤖</Text>
            </View>
            <View>
              <Text style={st.headerTitle}>Ask AI</Text>
              <Text style={st.headerSub}>AllMart Shopping Assistant</Text>
            </View>
          </View>
          {messages.length > 0 && (
            <TouchableOpacity onPress={handleReset} style={st.resetBtn}>
              <Feather name="refresh-cw" size={16} color={PURPLE} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Messages */}
      {isLoading ? (
        <View style={st.centered}>
          <ActivityIndicator color={PURPLE} size="large" />
        </View>
      ) : showEmpty ? (
        <ScrollView
          contentContainerStyle={[st.emptyWrap, { paddingBottom: bottomPad + 100 }]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={st.emptyEmoji}>✨</Text>
          <Text style={st.emptyTitle}>How can I help you?</Text>
          <Text style={st.emptySub}>Ask me anything about products, deals, or recommendations.</Text>
          <View style={st.quickGrid}>
            {QUICK_PROMPTS.map((p) => (
              <TouchableOpacity
                key={p}
                style={st.quickChip}
                onPress={() => handleSend(p)}
                activeOpacity={0.75}
              >
                <Text style={st.quickText}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => String(m.id)}
          renderItem={({ item }) => <Bubble msg={item} />}
          contentContainerStyle={{ paddingTop: 12, paddingBottom: 16 }}
          showsVerticalScrollIndicator={false}
          onLayout={() => listRef.current?.scrollToEnd({ animated: false })}
        />
      )}

      {/* Sending indicator */}
      {sending && (
        <View style={st.typingRow}>
          <View style={st.typingBubble}>
            <ActivityIndicator size="small" color={PURPLE} />
            <Text style={st.typingText}>AI is thinking…</Text>
          </View>
        </View>
      )}

      {/* Input bar */}
      <View style={[st.inputBar, { paddingBottom: bottomPad + 8 }]}>
        <View style={st.inputWrap}>
          <TextInput
            style={st.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask about products..."
            placeholderTextColor={TEXT_MUTED}
            returnKeyType="send"
            onSubmitEditing={() => handleSend()}
            editable={!sending}
            multiline
          />
          <TouchableOpacity
            style={[st.sendBtn, { opacity: (!input.trim() || sending) ? 0.5 : 1 }]}
            onPress={() => handleSend()}
            disabled={!input.trim() || sending}
            activeOpacity={0.8}
          >
            <Feather name="send" size={18} color={WHITE} />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const st = StyleSheet.create({
  header: {
    backgroundColor: WHITE,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EEFF',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  aiAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: PURPLE_LIGHT,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontFamily: 'Inter_700Bold', color: TEXT_DARK },
  headerSub: { fontSize: 12, fontFamily: 'Inter_400Regular', color: TEXT_MUTED },
  resetBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: PURPLE_LIGHT,
    alignItems: 'center', justifyContent: 'center',
  },

  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', color: TEXT_DARK, textAlign: 'center', marginBottom: 8 },
  emptySub: { fontSize: 14, fontFamily: 'Inter_400Regular', color: TEXT_MUTED, textAlign: 'center', lineHeight: 20, marginBottom: 28 },
  quickGrid: { width: '100%', gap: 10 },
  quickChip: {
    backgroundColor: WHITE,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EDDEFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  quickText: { fontSize: 14, fontFamily: 'Inter_500Medium', color: TEXT_DARK },

  typingRow: { paddingHorizontal: 16, paddingBottom: 4 },
  typingBubble: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: WHITE, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10,
    alignSelf: 'flex-start', borderWidth: 1, borderColor: '#EDDEFF',
  },
  typingText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: TEXT_MUTED },

  inputBar: {
    backgroundColor: WHITE,
    borderTopWidth: 1,
    borderTopColor: '#F0EEFF',
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  inputWrap: {
    flexDirection: 'row', alignItems: 'flex-end',
    backgroundColor: BG,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EDDEFF',
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 6,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: TEXT_DARK,
    maxHeight: 100,
    paddingTop: Platform.OS === 'ios' ? 4 : 0,
  },
  sendBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: PURPLE,
    alignItems: 'center', justifyContent: 'center',
  },
});
