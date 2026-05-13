import { View, StyleSheet } from 'react-native';
import {
  Users,
  UtensilsCrossed,
  Palette,
  Gamepad2,
  Mountain,
  Dumbbell,
  HeartPulse,
  Music,
  Code2,
  Clapperboard,
  Flame,
  Trophy,
  BookOpen,
} from 'lucide-react-native';

export type CategoryKey =
  | 'Social'
  | 'Food & Drink'
  | 'Arts'
  | 'Games'
  | 'Outdoors'
  | 'Fitness'
  | 'Wellness'
  | 'Music'
  | 'Tech'
  | 'Film'
  | 'Sports'
  | 'Learning'
  | 'default';

const MAP: Record<CategoryKey, { Icon: React.ComponentType<any>; bg: string; fg: string }> = {
  Social:       { Icon: Users,           bg: '#EFF6FF', fg: '#3882F6' },
  'Food & Drink': { Icon: UtensilsCrossed, bg: '#FFF7ED', fg: '#EA580C' },
  Arts:         { Icon: Palette,         bg: '#F5F3FF', fg: '#7C3AED' },
  Games:        { Icon: Gamepad2,        bg: '#ECFDF5', fg: '#059669' },
  Outdoors:     { Icon: Mountain,        bg: '#F0F9FF', fg: '#0284C7' },
  Fitness:      { Icon: Dumbbell,        bg: '#FEF2F2', fg: '#DC2626' },
  Wellness:     { Icon: HeartPulse,      bg: '#FDF4FF', fg: '#C026D3' },
  Music:        { Icon: Music,           bg: '#FFFBEB', fg: '#D97706' },
  Tech:         { Icon: Code2,           bg: '#EEF2FF', fg: '#4F46E5' },
  Film:         { Icon: Clapperboard,    bg: '#F8FAFC', fg: '#475569' },
  Sports:       { Icon: Trophy,          bg: '#FEFCE8', fg: '#CA8A04' },
  Learning:     { Icon: BookOpen,        bg: '#F0FDF4', fg: '#16A34A' },
  default:      { Icon: Flame,           bg: '#FFF5F0', fg: '#FF6B35' },
};

function resolve(category?: string): (typeof MAP)[CategoryKey] {
  if (!category) return MAP.default;
  const exact = MAP[category as CategoryKey];
  if (exact) return exact;
  // fuzzy match
  const lower = category.toLowerCase();
  if (lower.includes('food') || lower.includes('drink') || lower.includes('cook') || lower.includes('brunch') || lower.includes('coffee')) return MAP['Food & Drink'];
  if (lower.includes('art') || lower.includes('paint') || lower.includes('draw')) return MAP.Arts;
  if (lower.includes('game') || lower.includes('bowl') || lower.includes('chess') || lower.includes('board')) return MAP.Games;
  if (lower.includes('out') || lower.includes('hike') || lower.includes('bike') || lower.includes('trail') || lower.includes('run')) return MAP.Outdoors;
  if (lower.includes('fit') || lower.includes('gym') || lower.includes('yoga') || lower.includes('workout')) return MAP.Fitness;
  if (lower.includes('well') || lower.includes('sound') || lower.includes('meditat')) return MAP.Wellness;
  if (lower.includes('music') || lower.includes('jazz') || lower.includes('concert')) return MAP.Music;
  if (lower.includes('film') || lower.includes('movie') || lower.includes('cinema')) return MAP.Film;
  if (lower.includes('sport') || lower.includes('tennis') || lower.includes('pickleball') || lower.includes('soccer')) return MAP.Sports;
  if (lower.includes('learn') || lower.includes('class') || lower.includes('workshop') || lower.includes('study')) return MAP.Learning;
  return MAP.Social;
}

interface Props {
  category?: string;
  size?: 'sm' | 'md' | 'lg';
}

const SIZES = {
  sm: { wrap: 28, icon: 14, radius: 8 },
  md: { wrap: 38, icon: 19, radius: 10 },
  lg: { wrap: 52, icon: 26, radius: 14 },
};

export function CategoryIcon({ category, size = 'md' }: Props) {
  const { Icon, bg, fg } = resolve(category);
  const dim = SIZES[size];

  return (
    <View
      style={[
        styles.wrap,
        { width: dim.wrap, height: dim.wrap, borderRadius: dim.radius, backgroundColor: bg },
      ]}
    >
      <Icon size={dim.icon} color={fg} strokeWidth={2} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { justifyContent: 'center', alignItems: 'center' },
});
