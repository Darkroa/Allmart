import { useTheme } from '@/context/ThemeContext';
import colors from '@/constants/colors';

type Palette = typeof colors.light;

/**
 * Returns the design tokens for the current color scheme.
 * Uses the manual ThemeContext toggle so users can override the system setting.
 */
export function useColors(): Palette & { radius: number } {
  const { colorScheme } = useTheme();
  const palette: Palette =
    colorScheme === 'dark' && 'dark' in colors
      ? (colors.dark as Palette)
      : colors.light;
  return { ...palette, radius: colors.radius };
}
