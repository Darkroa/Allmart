import React from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onPress?: () => void;
  editable?: boolean;
  autoFocus?: boolean;
}

export default function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search products…',
  onPress,
  editable = true,
  autoFocus = false,
}: SearchBarProps) {
  const colors = useColors();

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: colors.secondary, borderColor: colors.border },
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <Feather name="search" size={18} color={colors.mutedForeground} />
      <TextInput
        style={[styles.input, { color: colors.foreground }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        editable={editable && !onPress}
        autoFocus={autoFocus}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChangeText('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Feather name="x" size={16} color={colors.mutedForeground} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    padding: 0,
    margin: 0,
  },
});
