import { useEffect } from 'react';
import { type DimensionValue, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { radius } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  style?: ViewStyle;
}

export function Skeleton({ width = '100%', height = 16, style }: SkeletonProps) {
  const { colors } = useTheme();
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.45, { duration: 800 }), -1, true);
  }, [opacity]);

  const animated = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View
      style={[{ width, height, borderRadius: radius.md, backgroundColor: colors.skeleton }, animated, style]}
    />
  );
}
