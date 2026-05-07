import { render, screen } from '@testing-library/react';
import { ProbabilityBar } from '../src/components/forecast/ProbabilityBar';
import { MarketCard } from '../src/components/forecast/MarketCard';
import { MarketStatusChip } from '../src/components/forecast/MarketStatusChip';
import { CategoryPill } from '../src/components/forecast/CategoryPill';
import { InsightCard } from '../src/components/forecast/InsightCard';
import { SettlementBanner } from '../src/components/forecast/SettlementBanner';
import { PositionRow } from '../src/components/forecast/PositionRow';

describe('ProbabilityBar', () => {
  it('renders yes and no labels', () => {
    render(<ProbabilityBar yesProb={73} />);
    expect(screen.getByText(/YES 73%/)).toBeInTheDocument();
    expect(screen.getByText(/NO 27%/)).toBeInTheDocument();
  });
});

describe('MarketStatusChip', () => {
  it('renders Open status', () => {
    render(<MarketStatusChip status="open" />);
    expect(screen.getByText('Open')).toBeInTheDocument();
  });
  it('renders Settled status', () => {
    render(<MarketStatusChip status="settled" />);
    expect(screen.getByText('Settled')).toBeInTheDocument();
  });
});

describe('CategoryPill', () => {
  it('renders sports category', () => {
    render(<CategoryPill category="sports" />);
    expect(screen.getByText('Sports')).toBeInTheDocument();
  });
});

describe('MarketCard', () => {
  it('renders market title and probability', () => {
    render(
      <MarketCard
        id="m1"
        title="Will the Eagles win Super Bowl LX?"
        category="sports"
        status="open"
        yesProb={62}
        closesAt={new Date(Date.now() + 86400_000)}
      />
    );
    expect(screen.getByText('Will the Eagles win Super Bowl LX?')).toBeInTheDocument();
    expect(screen.getByText('62%')).toBeInTheDocument();
  });
  it('shows Closing soon badge when < 1h to close', () => {
    render(
      <MarketCard
        id="m2"
        title="Test"
        category="politics"
        status="open"
        yesProb={40}
        closesAt={new Date(Date.now() + 1800_000)}
      />
    );
    expect(screen.getByText('Closing soon')).toBeInTheDocument();
  });
});

describe('InsightCard', () => {
  it('renders locked state for free tier', () => {
    render(<InsightCard tier="free" />);
    expect(screen.getByText(/Pro\+ only/i)).toBeInTheDocument();
  });
  it('renders signal data for pro tier', () => {
    render(
      <InsightCard
        tier="pro"
        signal={{ suggestedProbability: 68, confidence: 4, keyFactors: ['Strong momentum', 'Weather favors Yes'], sourceUrls: ['https://example.com'] }}
        onFirstView={() => {}}
      />
    );
    expect(screen.getByText('68%')).toBeInTheDocument();
  });
});

describe('SettlementBanner', () => {
  it('renders earned FP', () => {
    render(<SettlementBanner fpEarned={1200} outcome={true} />);
    expect(screen.getByText(/1,200 FP/)).toBeInTheDocument();
  });
});

describe('PositionRow', () => {
  it('renders side and shares', () => {
    render(
      <PositionRow
        side={true}
        shares={10}
        fpDeployed={500}
        priceAtEntry={55}
        marketTitle="Eagles win?"
        isWithdrawn={false}
        onWithdraw={() => {}}
      />
    );
    expect(screen.getByText('YES')).toBeInTheDocument();
    expect(screen.getByText('10 shares')).toBeInTheDocument();
  });
});
