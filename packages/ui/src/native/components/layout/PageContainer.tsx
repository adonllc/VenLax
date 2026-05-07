import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';

export interface PageContainerProps {
  children: React.ReactNode;
  scrollable?: boolean;
}

export function PageContainer({ children, scrollable = true }: PageContainerProps) {
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, !scrollable && styles.fill]}
      scrollEnabled={scrollable}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#0D0D0D' },
  content: { padding: 16, gap: 16 },
  fill: { flex: 1 },
});
