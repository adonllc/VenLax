export interface HelpfulVoteRowProps {
  helpfulVotes: number;
  totalVotes: number;
  onVote: (helpful: boolean) => void;
  voteLoading?: boolean;
}

export function HelpfulVoteRow({ helpfulVotes, totalVotes, onVote, voteLoading }: HelpfulVoteRowProps) {
  return (
    <div className="flex items-center gap-3 text-xs text-text-secondary">
      <span>{helpfulVotes} of {totalVotes} found helpful</span>
      <button
        disabled={voteLoading}
        onClick={() => onVote(true)}
        className="hover:text-green disabled:opacity-50 transition-colors"
        aria-label="Mark as helpful"
      >
        👍 Helpful
      </button>
      <button
        disabled={voteLoading}
        onClick={() => onVote(false)}
        className="hover:text-orange disabled:opacity-50 transition-colors"
        aria-label="Mark as not useful"
      >
        👎 Not useful
      </button>
    </div>
  );
}
