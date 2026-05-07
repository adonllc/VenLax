import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VerifiedBadge } from '../src/components/reviews/VerifiedBadge';
import { ReviewCard } from '../src/components/reviews/ReviewCard';
import { HelpfulVoteRow } from '../src/components/reviews/HelpfulVoteRow';
import { TrustSummary } from '../src/components/reviews/TrustSummary';

describe('VerifiedBadge', () => {
  it('renders verified badge', () => {
    render(<VerifiedBadge type="verified" />);
    expect(screen.getByText('Verified')).toBeInTheDocument();
  });
  it('renders community trusted badge', () => {
    render(<VerifiedBadge type="community_trusted" />);
    expect(screen.getByText('Community Trusted')).toBeInTheDocument();
  });
  it('renders nothing for none type', () => {
    const { container } = render(<VerifiedBadge type="none" />);
    expect(container.firstChild).toBeNull();
  });
});

describe('ReviewCard', () => {
  it('renders reviewer name and body', () => {
    render(
      <ReviewCard
        reviewerName="Jane Smith"
        rating={5}
        title="Great product"
        body="Really happy with this purchase."
        badge="verified"
        helpfulVotes={12}
        totalVotes={15}
        createdAt={new Date('2026-01-01')}
        onVote={() => {}}
      />
    );
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Really happy with this purchase.')).toBeInTheDocument();
    expect(screen.getByText(/Reviewer earned VenlaxIQ ForecastPoints/)).toBeInTheDocument();
  });
});

describe('HelpfulVoteRow', () => {
  it('renders helpful vote counts', () => {
    render(<HelpfulVoteRow helpfulVotes={8} totalVotes={10} onVote={() => {}} />);
    expect(screen.getByText(/8 of 10/)).toBeInTheDocument();
  });
  it('calls onVote with true when Helpful clicked', async () => {
    const fn = vi.fn();
    render(<HelpfulVoteRow helpfulVotes={0} totalVotes={0} onVote={fn} />);
    await userEvent.click(screen.getByRole('button', { name: /helpful/i }));
    expect(fn).toHaveBeenCalledWith(true);
  });
});

describe('TrustSummary', () => {
  it('renders review count and average stars', () => {
    render(<TrustSummary verifiedCount={42} averageRating={4.3} totalCount={55} />);
    expect(screen.getByText(/42/)).toBeInTheDocument();
    expect(screen.getByText(/4\.3/)).toBeInTheDocument();
  });
});
