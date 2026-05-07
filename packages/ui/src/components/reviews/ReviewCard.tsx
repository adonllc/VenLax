import { clsx } from 'clsx';
import { VerifiedBadge, ReviewBadge } from './VerifiedBadge';
import { Avatar } from '../atoms/Avatar';

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

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-lemon text-sm" aria-label={`${rating} out of 5 stars`}>
      {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
    </span>
  );
}

export function ReviewCard({ reviewerName, reviewerAvatar, rating, title, body, badge, helpfulVotes, totalVotes, createdAt, onVote }: ReviewCardProps) {
  const opacity = badge === 'none' ? 'opacity-70' : '';
  return (
    <div className={clsx('bg-surface-2 border border-border rounded-xl p-4', opacity)}>
      <div className="flex items-center gap-3 mb-3">
        <Avatar name={reviewerName} src={reviewerAvatar} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-text-primary text-sm font-medium">{reviewerName}</p>
            <VerifiedBadge type={badge} />
          </div>
          <div className="flex items-center gap-2">
            <Stars rating={rating} />
            <span className="text-text-secondary text-xs">{createdAt.toLocaleDateString()}</span>
          </div>
        </div>
      </div>
      <p className="text-text-primary text-sm font-semibold mb-1">{title}</p>
      <p className="text-text-secondary text-sm mb-3">{body}</p>
      {onVote && (
        <div className="flex items-center gap-3 mb-3">
          <span className="text-text-secondary text-xs">{helpfulVotes} of {totalVotes} found helpful</span>
          <button onClick={() => onVote(true)} className="text-xs text-text-secondary hover:text-green" aria-label="Mark as helpful">👍 Helpful</button>
          <button onClick={() => onVote(false)} className="text-xs text-text-secondary hover:text-orange" aria-label="Mark as unhelpful">👎 Not helpful</button>
        </div>
      )}
      <p className="text-text-secondary text-[10px] border-t border-border pt-2">
        Reviewer earned VenlaxIQ ForecastPoints for this review.
      </p>
    </div>
  );
}
