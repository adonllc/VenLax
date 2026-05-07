import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../../tokens';

export interface HelpfulVoteRowProps {
  helpfulVotes: number;
  totalVotes: number;
  onVote: (helpful: boolean) => void;
  voteLoading?: boolean;
}

export function HelpfulVoteRow({ helpfulVotes, totalVotes, onVote, voteLoading }: HelpfulVoteRowProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.count}>{helpfulVotes} of {totalVotes} found helpful</Text>
      <TouchableOpacity onPress={() => onVote(true)} disabled={voteLoading} accessibilityLabel="Mark as helpful">
        <Text style={styles.btn}>👍 Helpful</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => onVote(false)} disabled={voteLoading} accessibilityLabel="Mark as not helpful">
        <Text style={styles.btn}>👎 Not helpful</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  count: { color: colors.dark.textSecondary, fontSize: 11 },
  btn: { color: colors.dark.textSecondary, fontSize: 11 },
});
