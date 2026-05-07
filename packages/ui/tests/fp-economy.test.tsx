import { render, screen } from '@testing-library/react';
import { FPBadge } from '../src/components/fp-economy/FPBadge';
import { StreakBanner } from '../src/components/fp-economy/StreakBanner';
import { MissionCard } from '../src/components/fp-economy/MissionCard';
import { BadgeDisplay } from '../src/components/fp-economy/BadgeDisplay';
import { XPProgressBar } from '../src/components/fp-economy/XPProgressBar';
import { RewardCard } from '../src/components/fp-economy/RewardCard';
import { WalletSummary } from '../src/components/fp-economy/WalletSummary';
import { SubscriptionBadge } from '../src/components/fp-economy/SubscriptionBadge';

describe('FPBadge', () => {
  it('renders amount with FP label', () => {
    render(<FPBadge amount={1500} />);
    expect(screen.getByText(/1,500/)).toBeInTheDocument();
  });
});

describe('StreakBanner', () => {
  it('shows day count and multiplier', () => {
    render(<StreakBanner day={5} multiplier={1.5} dailyFp={150} />);
    expect(screen.getByText(/Day 5/)).toBeInTheDocument();
    expect(screen.getByText(/1\.5×/)).toBeInTheDocument();
  });
});

describe('MissionCard', () => {
  it('shows title and FP reward', () => {
    render(<MissionCard title="Make 2 forecasts" fpReward={300} progress={1} total={2} completed={false} />);
    expect(screen.getByText('Make 2 forecasts')).toBeInTheDocument();
    expect(screen.getByText(/300 FP/)).toBeInTheDocument();
  });
});

describe('BadgeDisplay', () => {
  it('shows unlocked badge', () => {
    render(<BadgeDisplay name="Sharpshooter" icon="🎯" fpReward={5000} unlocked={true} />);
    expect(screen.getByText('Sharpshooter')).toBeInTheDocument();
  });
  it('shows locked badge dimmed', () => {
    render(<BadgeDisplay name="Day 30 Loyalty" icon="📅" fpReward={5000} unlocked={false} />);
    expect(screen.getByText('Day 30 Loyalty')).toBeInTheDocument();
  });
});

describe('XPProgressBar', () => {
  it('renders level name', () => {
    render(<XPProgressBar level="analyst" xp={2400} nextLevelXp={5000} />);
    expect(screen.getByText('Analyst')).toBeInTheDocument();
  });
});

describe('RewardCard', () => {
  it('shows reward name and FP cost', () => {
    render(<RewardCard name="Amazon $10" category="ecommerce" fpCost={10000} imageUrl={null} onRedeem={() => {}} />);
    expect(screen.getByText('Amazon $10')).toBeInTheDocument();
    expect(screen.getByText(/10,000 FP/)).toBeInTheDocument();
  });
});

describe('WalletSummary', () => {
  it('shows earned FP balance', () => {
    render(<WalletSummary earnedFp={25000} expiresAt={new Date(Date.now() + 86400_000 * 30)} />);
    expect(screen.getByText(/25,000/)).toBeInTheDocument();
  });
});

describe('SubscriptionBadge', () => {
  it('renders Pro tier', () => {
    render(<SubscriptionBadge tier="pro" />);
    expect(screen.getByText('Pro')).toBeInTheDocument();
  });
});
