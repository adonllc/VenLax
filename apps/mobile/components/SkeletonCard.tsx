import { View, StyleSheet, Animated } from "react-native";
import { useEffect, useRef } from "react";

export function SkeletonCard({ height = 100 }: { height?: number }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.8, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 700, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return <Animated.View style={[styles.skeleton, { height, opacity }]} />;
}

const styles = StyleSheet.create({
  skeleton: { backgroundColor: "#2E2E2E", borderRadius: 12, width: "100%", marginBottom: 12 },
});
