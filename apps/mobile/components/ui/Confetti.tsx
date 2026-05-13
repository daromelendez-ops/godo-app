import { useEffect, useRef } from 'react';
import { View, Animated, Dimensions, StyleSheet } from 'react-native';

const { width: W } = Dimensions.get('window');
const COLORS = ['#3882F6', '#CFF8EE', '#FFDD55', '#FF72C6', '#FFA864', '#34C759'];
const COUNT = 24;

interface Piece {
  id: number;
  color: string;
  angle: number;
  speed: number;
  size: number;
  delay: number;
}

function ConfettiPiece({ color, angle, speed, size, delay }: Piece) {
  const y = useRef(new Animated.Value(0)).current;
  const x = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  const vx = Math.cos(angle) * speed * W * 0.008;
  const vy = Math.sin(angle) * speed * W * 0.008;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 50, useNativeDriver: true }),
        Animated.timing(x, { toValue: vx * 60, duration: 1200, useNativeDriver: true }),
        Animated.timing(y, { toValue: vy * 60 + 200, duration: 1200, useNativeDriver: true }),
        Animated.timing(rotate, { toValue: 4, duration: 1200, useNativeDriver: true }),
        Animated.sequence([
          Animated.delay(700),
          Animated.timing(opacity, { toValue: 0, duration: 500, useNativeDriver: true }),
        ]),
      ]),
    ]).start();
  }, []);

  const spin = rotate.interpolate({ inputRange: [0, 4], outputRange: ['0deg', '1440deg'] });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        bottom: 90,
        left: W / 2 - size / 2,
        width: size,
        height: size,
        borderRadius: size > 12 ? size / 2 : 2,
        backgroundColor: color,
        opacity,
        transform: [{ translateX: x }, { translateY: y }, { rotate: spin }],
      }}
    />
  );
}

export function Confetti() {
  const pieces: Piece[] = Array.from({ length: COUNT }, (_, i) => ({
    id: i,
    color: COLORS[i % COLORS.length],
    angle: (Math.PI * 2 * i) / COUNT + (Math.random() - 0.5) * 0.4,
    speed: 6 + Math.random() * 6,
    size: 8 + Math.random() * 8,
    delay: Math.random() * 150,
  }));

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {pieces.map(p => (
        <ConfettiPiece key={p.id} {...p} />
      ))}
    </View>
  );
}
