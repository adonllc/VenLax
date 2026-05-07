import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../../tokens';
import { Avatar } from '../atoms/Avatar';
import { VerifiedBadge, ReviewBadge } from './VerifiedBadge';

export interface ReviewCardProps {
  reviewerName: string;
  reviewerAvatar?: string | null;
  rating: number;
  title: string;
  body: string;
  badge: ReviewBadge;
  helpfulVotes: number;
  totalVotes: number;
  createdAt: Date;
  onVote?: (helpful: boolean) => void;
}

export function ReviewCard({ reviewerName, reviewerAvatar, rating, title, body, badge, helpfulVotes, totalVotes, createdAt, onVote }: ReviewCardProps) {
  const safeRating = Math.max(0, Math.min(5, Math.round(rating)));
  const stars = '★'.repeat(safeRating) + '☆'.repeat(5 - safeRating);
  return (
    <View style={[styles.card, badge === 'none' && styles.dimmed]}>
      <View style={styles.header}>
        <Avatar name={reviewerName} src={reviewerAvatar} size="sm" />
        <View style={styles.meta}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{reviewerName}</Text>
            <VerifiedBadge type={badge} />
          </View>
          <View style={styles.starRow}>
            <Text style={styles.stars}>{stars}</Text>
            <Text style={styles.date}>{createdAt.toLocaleDateString()}</Text>
          </View>
        </View>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      {onVote && (
        <View style={styles.voteRow}>
          <Text style={styles.voteCount}>{helpfulVotes} of {totalVotes} found helpful</Text>
          <TouchableOpacity onPress={() => onVote(true)} accessibilityLabel="Mark as helpful">
            <Text style={styles.voteBtn}>👍 Helpful</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onVote(false)} accessibilityLabel="Mark as not helpful">
            <Text style={styles.voteBtn}>👎 Not helpful</Text>
          </TouchableOpacity>
        </View>
      )}
      <Text style={styles.disclosure}>Reviewer earned VenlaxIQ ForecastPoints for this review.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.dark.surface3, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: colors.dark.border, gap: 8 },
  dimmed: { opacity: 0.7 },
  header: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  meta: { flex: 1, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  name: { color: colors.dark.textPrimary, fontWeight: '500', fontSize: 13 },
  starRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stars: { color: colors.lemon, fontSize: 13 },
  date: { color: colors.dark.textSecondary, fontSize: 11 },
  title: { color: colors.dark.textPrimary, fontWeight: '600', fontSize: 13 },
  body: { color: colors.dark.textSecondary, fontSize: 13, lineHeight: 20 },
  voteRow: { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  voteCount: { color: colors.dark.textSecondary, fontSize: 11 },
  voteBtn: { color: colors.dark.textSecondary, fontSize: 11 },
  disclosure: { color: colors.dark.textSecondary, fontSize: 10, borderTopWidth: 1, borderTopColor: colors.dark.border, paddingTop: 8 },
});
