import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LeaderboardRow } from '../src/components/social/LeaderboardRow';
import { ProfileHeader } from '../src/components/social/ProfileHeader';
import { AccuracyGauge } from '../src/components/social/AccuracyGauge';
import { FollowButton } from '../src/components/social/FollowButton';
import { ForecastHistoryRow } from '../src/components/social/ForecastHistoryRow';

describe('LeaderboardRow', () => {
  it('renders rank and username', () => {
    render(<LeaderboardRow rank={1} username="forecaster99" accuracy={82} fpEarned={45000} avatarUrl={null} isCurrentUser={false} />);
    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('forecaster99')).toBeInTheDocument();
    expect(screen.getByText(/82%/)).toBeInTheDocument();
  });
});

describe('ProfileHeader', () => {
  it('renders username and tier badge', () => {
    render(<ProfileHeader username="hemanth" avatarUrl={null} tier="elite" xpLevel="expert" accuracy={79} isOwnProfile={true} onFollow={() => {}} isFollowing={false} followerCount={120} />);
    expect(screen.getByText('hemanth')).toBeInTheDocument();
    expect(screen.getByText('Elite')).toBeInTheDocument();
  });
  it('shows follow button for other profiles', () => {
    render(<ProfileHeader username="alice" avatarUrl={null} tier="pro" xpLevel="analyst" accuracy={65} isOwnProfile={false} onFollow={() => {}} isFollowing={false} followerCount={50} />);
    expect(screen.getByRole('button', { name: /follow/i })).toBeInTheDocument();
  });
});

describe('AccuracyGauge', () => {
  it('renders accuracy percentage', () => {
    render(<AccuracyGauge accuracy={75} forecastCount={50} />);
    expect(screen.getByText(/75%/)).toBeInTheDocument();
  });
});

describe('FollowButton', () => {
  it('calls onFollow when clicked', async () => {
    const fn = vi.fn();
    render(<FollowButton isFollowing={false} onFollow={fn} />);
    await userEvent.click(screen.getByRole('button'));
    expect(fn).toHaveBeenCalledTimes(1);
  });
  it('shows Following when already following', () => {
    render(<FollowButton isFollowing={true} onFollow={() => {}} />);
    expect(screen.getByText('Following')).toBeInTheDocument();
  });
});

describe('ForecastHistoryRow', () => {
  it('renders market title and outcome', () => {
    render(
      <ForecastHistoryRow
        marketTitle="Eagles win Super Bowl?"
        side={true}
        outcome={true}
        fpEarned={1200}
        settledAt={new Date('2026-04-01')}
      />
    );
    expect(screen.getByText('Eagles win Super Bowl?')).toBeInTheDocument();
    expect(screen.getAllByText(/YES/).length).toBeGreaterThan(0);
  });
  it('shows Pending when outcome is null', () => {
    render(
      <ForecastHistoryRow
        marketTitle="Test market"
        side={true}
        outcome={null}
        fpEarned={null}
        settledAt={null}
      />
    );
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });
});
