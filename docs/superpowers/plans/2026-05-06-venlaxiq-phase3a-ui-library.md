# VenlaxIQ Phase 3A — Shared Component Library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete `packages/ui` shared component library — 30+ web components (React + Tailwind) plus React Native variants — that all three frontend apps consume.

**Architecture:** Web components are React function components using Tailwind CSS with the existing custom-property token system. Native variants live in `packages/ui/src/native/` using React Native StyleSheet with the same `tokens.ts` values. Both platforms export under the same logical component names. `packages/ui/src/index.ts` exports web; `packages/ui/src/native/index.ts` exports RN.

**Tech Stack:** React 18, Tailwind CSS, clsx, tailwind-merge, React Native, Vitest, @testing-library/react

---

## File Map

```
packages/ui/
  package.json                                  MODIFY — add clsx, tailwind-merge, dev deps
  tsconfig.json                                 MODIFY — include tests
  src/
    tokens.ts                                   EXISTING — do not modify
    theme.tsx                                   EXISTING — do not modify
    index.ts                                    MODIFY — re-export all web components
    components/
      atoms/
        Button.tsx                              CREATE
        Input.tsx                               CREATE
        Select.tsx                              CREATE
        Avatar.tsx                              CREATE
        Badge.tsx                               CREATE
        Spinner.tsx                             CREATE
        Toast.tsx                               CREATE
      forecast/
        MarketCard.tsx                          CREATE
        ProbabilityBar.tsx                      CREATE
        ForecastEntryWidget.tsx                 CREATE
        PositionRow.tsx                         CREATE
        MarketStatusChip.tsx                    CREATE
        CategoryPill.tsx                        CREATE
        InsightCard.tsx                         CREATE
        SettlementBanner.tsx                    CREATE
      fp-economy/
        FPBadge.tsx                             CREATE
        StreakBanner.tsx                         CREATE
        MissionCard.tsx                         CREATE
        BadgeDisplay.tsx                        CREATE
        XPProgressBar.tsx                       CREATE
        RewardCard.tsx                          CREATE
        WalletSummary.tsx                       CREATE
        SubscriptionBadge.tsx                   CREATE
      reviews/
        ReviewCard.tsx                          CREATE
        VerifiedBadge.tsx                       CREATE
        HelpfulVoteRow.tsx                      CREATE
        ReviewForm.tsx                          CREATE
        TrustSummary.tsx                        CREATE
      social/
        LeaderboardRow.tsx                      CREATE
        ProfileHeader.tsx                       CREATE
        AccuracyGauge.tsx                       CREATE
        ForecastHistoryRow.tsx                  CREATE
        FollowButton.tsx                        CREATE
      layout/
        TopBar.tsx                              CREATE
        Sidebar.tsx                             CREATE
        BottomTabBar.tsx                        CREATE
        PageContainer.tsx                       CREATE
        EmptyState.tsx                          CREATE
        NotificationBell.tsx                    CREATE
    native/
      index.ts                                  CREATE
      components/
        atoms/
          Button.tsx                            CREATE
          Input.tsx                             CREATE
          Badge.tsx                             CREATE
          Avatar.tsx                            CREATE
          Spinner.tsx                           CREATE
        forecast/
          MarketCard.tsx                        CREATE
          ProbabilityBar.tsx                    CREATE
          MarketStatusChip.tsx                  CREATE
          CategoryPill.tsx                      CREATE
          InsightCard.tsx                       CREATE
          SettlementBanner.tsx                  CREATE
          ForecastEntryWidget.tsx               CREATE
        fp-economy/
          FPBadge.tsx                           CREATE
          StreakBanner.tsx                       CREATE
          MissionCard.tsx                       CREATE
          BadgeDisplay.tsx                      CREATE
          XPProgressBar.tsx                     CREATE
          RewardCard.tsx                        CREATE
          WalletSummary.tsx                     CREATE
          SubscriptionBadge.tsx                 CREATE
        reviews/
          ReviewCard.tsx                        CREATE
          VerifiedBadge.tsx                     CREATE
          HelpfulVoteRow.tsx                    CREATE
          TrustSummary.tsx                      CREATE
        social/
          LeaderboardRow.tsx                    CREATE
          ProfileHeader.tsx                     CREATE
          AccuracyGauge.tsx                     CREATE
          FollowButton.tsx                      CREATE
        layout/
          TopBar.tsx                            CREATE
          BottomTabBar.tsx                      CREATE
          PageContainer.tsx                     CREATE
          EmptyState.tsx                        CREATE
  tests/
    atoms.test.tsx                              CREATE
    forecast.test.tsx                           CREATE
    fp-economy.test.tsx                         CREATE
    reviews.test.tsx                            CREATE
    social.test.tsx                             CREATE
    layout.test.tsx                             CREATE
```

---

## Task 1: Package Setup + Dependencies

**Files:**
- Modify: `packages/ui/package.json`
- Modify: `packages/ui/tsconfig.json`

- [ ] **Step 1: Update packages/ui/package.json**

```json
{
  "name": "@venlaxiq/ui",
  "version": "0.1.0",
  "exports": {
    ".": "./src/index.ts",
    "./native": "./src/native/index.ts",
    "./tokens": "./src/tokens.ts",
    "./theme": "./src/theme.tsx"
  },
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.3.0"
  },
  "devDependencies": {
    "@testing-library/react": "^16.0.0",
    "@testing-library/user-event": "^14.5.0",
    "@types/react": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "jsdom": "^24.0.0",
    "typescript": "^5.4.0",
    "vitest": "^1.6.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0"
  },
  "peerDependencies": {
    "react": ">=18",
    "react-native": ">=0.74"
  }
}
```

- [ ] **Step 2: Update packages/ui/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "declaration": true,
    "skipLibCheck": true,
    "esModuleInterop": true
  },
  "include": ["src", "tests"]
}
```

- [ ] **Step 3: Create vitest config at `packages/ui/vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
  },
});
```

- [ ] **Step 4: Create `packages/ui/tests/setup.ts`**

```ts
import '@testing-library/jest-dom';
```

- [ ] **Step 5: Install dependencies from repo root**

```bash
pnpm install
```

Expected: `clsx` and `tailwind-merge` appear in `packages/ui/node_modules`.

- [ ] **Step 6: Commit**

```bash
git add packages/ui/package.json packages/ui/tsconfig.json packages/ui/vitest.config.ts packages/ui/tests/setup.ts
git commit -m "chore(ui): package setup, add clsx + tailwind-merge, vitest config"
```

---

## Task 2: Atom Components

**Files:**
- Create: `packages/ui/src/components/atoms/Button.tsx`
- Create: `packages/ui/src/components/atoms/Input.tsx`
- Create: `packages/ui/src/components/atoms/Select.tsx`
- Create: `packages/ui/src/components/atoms/Avatar.tsx`
- Create: `packages/ui/src/components/atoms/Badge.tsx`
- Create: `packages/ui/src/components/atoms/Spinner.tsx`
- Create: `packages/ui/src/components/atoms/Toast.tsx`
- Create: `packages/ui/tests/atoms.test.tsx`

- [ ] **Step 1: Write failing atom tests**

```tsx
// packages/ui/tests/atoms.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../src/components/atoms/Button';
import { Input } from '../src/components/atoms/Input';
import { Badge } from '../src/components/atoms/Badge';
import { Avatar } from '../src/components/atoms/Avatar';
import { Spinner } from '../src/components/atoms/Spinner';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
  it('is disabled when loading', () => {
    render(<Button loading>Save</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
  it('calls onClick', async () => {
    const fn = vi.fn();
    render(<Button onClick={fn}>Go</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('Input', () => {
  it('renders placeholder', () => {
    render(<Input placeholder="Enter value" />);
    expect(screen.getByPlaceholderText('Enter value')).toBeInTheDocument();
  });
  it('shows error message', () => {
    render(<Input error="Required" />);
    expect(screen.getByText('Required')).toBeInTheDocument();
  });
});

describe('Badge', () => {
  it('renders label', () => {
    render(<Badge label="Pro" variant="green" />);
    expect(screen.getByText('Pro')).toBeInTheDocument();
  });
});

describe('Avatar', () => {
  it('shows initials when no src', () => {
    render(<Avatar name="John Doe" />);
    expect(screen.getByText('JD')).toBeInTheDocument();
  });
});

describe('Spinner', () => {
  it('renders without crashing', () => {
    const { container } = render(<Spinner />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm --filter @venlaxiq/ui test
```

Expected: `Cannot find module '../src/components/atoms/Button'`

- [ ] **Step 3: Create `packages/ui/src/components/atoms/Button.tsx`**

```tsx
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-green text-[#0D0D0D] hover:bg-green-dark',
  secondary: 'bg-surface-3 text-text-primary hover:bg-surface-2 border border-border',
  ghost: 'text-text-primary hover:bg-surface-2',
  danger: 'bg-[#FF3B30] text-white hover:bg-red-700',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs rounded-lg',
  md: 'h-10 px-4 text-sm rounded-xl',
  lg: 'h-12 px-6 text-base rounded-xl',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={twMerge(clsx(
        'inline-flex items-center justify-center font-semibold transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className,
      ))}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <span className="mr-2 animate-spin inline-block">⟳</span>}
      {children}
    </button>
  );
}
```

- [ ] **Step 4: Create `packages/ui/src/components/atoms/Input.tsx`**

```tsx
import { clsx } from 'clsx';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, className, id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={clsx(
          'h-10 w-full rounded-xl bg-surface-3 border px-3 text-sm text-text-primary placeholder:text-text-secondary outline-none transition-colors',
          error ? 'border-[#FF3B30] focus:ring-1 focus:ring-[#FF3B30]' : 'border-border focus:border-green focus:ring-1 focus:ring-green',
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-[#FF3B30]">{error}</p>}
      {hint && !error && <p className="text-xs text-text-secondary">{hint}</p>}
    </div>
  );
}
```

- [ ] **Step 5: Create `packages/ui/src/components/atoms/Select.tsx`**

```tsx
import { clsx } from 'clsx';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
}

export function Select({ label, options, error, className, id, ...props }: SelectProps) {
  const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={selectId} className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={clsx(
          'h-10 w-full rounded-xl bg-surface-3 border border-border px-3 text-sm text-text-primary outline-none focus:border-green focus:ring-1 focus:ring-green',
          className,
        )}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && <p className="text-xs text-[#FF3B30]">{error}</p>}
    </div>
  );
}
```

- [ ] **Step 6: Create `packages/ui/src/components/atoms/Avatar.tsx`**

```tsx
import { clsx } from 'clsx';

export interface AvatarProps {
  src?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');
}

const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-base' };

export function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={clsx('rounded-full object-cover bg-surface-3', sizes[size], className)}
      />
    );
  }
  return (
    <div className={clsx('rounded-full bg-surface-3 border border-border flex items-center justify-center font-semibold text-text-primary', sizes[size], className)}>
      {initials(name)}
    </div>
  );
}
```

- [ ] **Step 7: Create `packages/ui/src/components/atoms/Badge.tsx`**

```tsx
import { clsx } from 'clsx';

export type BadgeVariant = 'green' | 'lemon' | 'orange' | 'neutral';

export interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  className?: string;
}

const variants: Record<BadgeVariant, string> = {
  green: 'bg-[rgba(0,212,106,0.15)] text-green border-green/30',
  lemon: 'bg-[rgba(255,230,0,0.15)] text-lemon border-lemon/30',
  orange: 'bg-[rgba(255,107,0,0.15)] text-orange border-orange/30',
  neutral: 'bg-surface-3 text-text-secondary border-border',
};

export function Badge({ label, variant = 'neutral', className }: BadgeProps) {
  return (
    <span className={clsx('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border', variants[variant], className)}>
      {label}
    </span>
  );
}
```

- [ ] **Step 8: Create `packages/ui/src/components/atoms/Spinner.tsx`**

```tsx
import { clsx } from 'clsx';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = { sm: 'w-4 h-4 border-2', md: 'w-6 h-6 border-2', lg: 'w-10 h-10 border-4' };

export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <div
      role="status"
      className={clsx('animate-spin rounded-full border-green border-t-transparent', sizes[size], className)}
    />
  );
}
```

- [ ] **Step 9: Create `packages/ui/src/components/atoms/Toast.tsx`**

```tsx
import { clsx } from 'clsx';

export type ToastVariant = 'success' | 'error' | 'info';

export interface ToastProps {
  message: string;
  variant?: ToastVariant;
  onClose?: () => void;
}

const variants: Record<ToastVariant, { cls: string; icon: string }> = {
  success: { cls: 'border-green bg-[rgba(0,212,106,0.10)] text-green', icon: '✓' },
  error: { cls: 'border-[#FF3B30] bg-[rgba(255,59,48,0.10)] text-[#FF3B30]', icon: '✕' },
  info: { cls: 'border-border bg-surface-2 text-text-primary', icon: 'ℹ' },
};

export function Toast({ message, variant = 'info', onClose }: ToastProps) {
  const { cls, icon } = variants[variant];
  return (
    <div className={clsx('flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium shadow-lg', cls)}>
      <span className="text-base">{icon}</span>
      <span className="flex-1">{message}</span>
      {onClose && (
        <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100">✕</button>
      )}
    </div>
  );
}
```

- [ ] **Step 10: Run tests to verify they pass**

```bash
pnpm --filter @venlaxiq/ui test
```

Expected: all 7 atom tests PASS.

- [ ] **Step 11: Commit**

```bash
git add packages/ui/src/components/atoms packages/ui/tests/atoms.test.tsx
git commit -m "feat(ui): add atom components — Button, Input, Select, Avatar, Badge, Spinner, Toast"
```

---

## Task 3: Forecast Domain Components

**Files:**
- Create: `packages/ui/src/components/forecast/ProbabilityBar.tsx`
- Create: `packages/ui/src/components/forecast/MarketStatusChip.tsx`
- Create: `packages/ui/src/components/forecast/CategoryPill.tsx`
- Create: `packages/ui/src/components/forecast/MarketCard.tsx`
- Create: `packages/ui/src/components/forecast/PositionRow.tsx`
- Create: `packages/ui/src/components/forecast/InsightCard.tsx`
- Create: `packages/ui/src/components/forecast/SettlementBanner.tsx`
- Create: `packages/ui/src/components/forecast/ForecastEntryWidget.tsx`
- Create: `packages/ui/tests/forecast.test.tsx`

- [ ] **Step 1: Write failing forecast tests**

```tsx
// packages/ui/tests/forecast.test.tsx
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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm --filter @venlaxiq/ui test
```

Expected: FAIL — modules not found.

- [ ] **Step 3: Create `packages/ui/src/components/forecast/ProbabilityBar.tsx`**

```tsx
export interface ProbabilityBarProps {
  yesProb: number; // 0–100
}

export function ProbabilityBar({ yesProb }: ProbabilityBarProps) {
  const noProb = 100 - yesProb;
  return (
    <div className="relative h-2 rounded-full overflow-hidden bg-orange">
      <div
        className="absolute inset-y-0 left-0 bg-green rounded-full transition-all duration-300"
        style={{ width: `${yesProb}%` }}
      />
      <div className="absolute inset-0 flex justify-between items-center px-2 pointer-events-none">
        <span className="text-[9px] font-mono font-bold text-[#0D0D0D] leading-none">YES {yesProb}%</span>
        <span className="text-[9px] font-mono font-bold text-[#0D0D0D] leading-none">NO {noProb}%</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create `packages/ui/src/components/forecast/MarketStatusChip.tsx`**

```tsx
import { clsx } from 'clsx';

export type MarketStatus = 'draft' | 'open' | 'closed' | 'resolved' | 'settled';

export interface MarketStatusChipProps {
  status: MarketStatus;
}

const config: Record<MarketStatus, { label: string; cls: string }> = {
  draft:    { label: 'Draft',    cls: 'bg-surface-3 text-text-secondary border-border' },
  open:     { label: 'Open',     cls: 'bg-[rgba(0,212,106,0.15)] text-green border-green/30' },
  closed:   { label: 'Closed',   cls: 'bg-[rgba(255,107,0,0.15)] text-orange border-orange/30' },
  resolved: { label: 'Resolved', cls: 'bg-[rgba(255,230,0,0.15)] text-lemon border-lemon/30' },
  settled:  { label: 'Settled',  cls: 'bg-surface-3 text-text-secondary border-border' },
};

export function MarketStatusChip({ status }: MarketStatusChipProps) {
  const { label, cls } = config[status];
  return (
    <span className={clsx('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border shrink-0', cls)}>
      {label}
    </span>
  );
}
```

- [ ] **Step 5: Create `packages/ui/src/components/forecast/CategoryPill.tsx`**

```tsx
import { clsx } from 'clsx';

export type MarketCategory = 'sports' | 'politics' | 'open';

export interface CategoryPillProps {
  category: MarketCategory;
  className?: string;
}

const config: Record<MarketCategory, { label: string; cls: string }> = {
  sports:   { label: 'Sports',   cls: 'text-green bg-[rgba(0,212,106,0.10)]' },
  politics: { label: 'Politics', cls: 'text-lemon bg-[rgba(255,230,0,0.10)]' },
  open:     { label: 'Open',     cls: 'text-text-secondary bg-surface-3' },
};

export function CategoryPill({ category, className }: CategoryPillProps) {
  const { label, cls } = config[category];
  return (
    <span className={clsx('px-2 py-0.5 rounded-full text-xs font-semibold', cls, className)}>
      {label}
    </span>
  );
}
```

- [ ] **Step 6: Create `packages/ui/src/components/forecast/MarketCard.tsx`**

```tsx
import { clsx } from 'clsx';
import { ProbabilityBar } from './ProbabilityBar';
import { MarketStatusChip, MarketStatus } from './MarketStatusChip';
import { CategoryPill, MarketCategory } from './CategoryPill';

export interface MarketCardProps {
  id: string;
  title: string;
  category: MarketCategory;
  status: MarketStatus;
  yesProb: number;
  closesAt: Date;
  totalVolumeFp?: number;
  onClick?: () => void;
  className?: string;
}

export function MarketCard({ id: _id, title, category, status, yesProb, closesAt, totalVolumeFp, onClick, className }: MarketCardProps) {
  const closingSoon = status === 'open' && (closesAt.getTime() - Date.now()) < 3_600_000;
  const probColor = yesProb >= 50 ? 'text-green' : 'text-orange';

  return (
    <div
      onClick={onClick}
      className={clsx(
        'bg-surface-2 border border-border rounded-xl p-4 transition-colors',
        onClick && 'cursor-pointer hover:border-green/40',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3 className="text-text-primary font-semibold text-sm leading-snug flex-1">{title}</h3>
        <MarketStatusChip status={status} />
      </div>
      <div className="flex items-center gap-2 mb-3">
        <CategoryPill category={category} />
        {closingSoon && (
          <span className="text-orange text-xs font-semibold">Closing soon</span>
        )}
      </div>
      <ProbabilityBar yesProb={yesProb} />
      <div className="flex items-center justify-between mt-3">
        <span className={clsx('font-mono font-bold text-xl', probColor)}>{yesProb}%</span>
        {totalVolumeFp != null && (
          <span className="text-text-secondary text-xs font-mono">⚡ {totalVolumeFp.toLocaleString()} FP</span>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Create `packages/ui/src/components/forecast/PositionRow.tsx`**

```tsx
import { clsx } from 'clsx';
import { Button } from '../atoms/Button';

export interface PositionRowProps {
  side: boolean; // true = Yes, false = No
  shares: number;
  fpDeployed: number;
  priceAtEntry: number;
  marketTitle: string;
  isWithdrawn: boolean;
  onWithdraw?: () => void;
  withdrawLoading?: boolean;
}

export function PositionRow({ side, shares, fpDeployed, priceAtEntry, marketTitle, isWithdrawn, onWithdraw, withdrawLoading }: PositionRowProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0 gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-text-primary text-sm font-medium truncate">{marketTitle}</p>
        <div className="flex items-center gap-3 mt-1">
          <span className={clsx('text-xs font-semibold font-mono', side ? 'text-green' : 'text-orange')}>
            {side ? 'YES' : 'NO'}
          </span>
          <span className="text-text-secondary text-xs">{shares} shares</span>
          <span className="text-text-secondary text-xs">@ {priceAtEntry}%</span>
          <span className="text-text-secondary text-xs font-mono">⚡ {fpDeployed.toLocaleString()} FP deployed</span>
        </div>
      </div>
      {!isWithdrawn && onWithdraw && (
        <Button variant="secondary" size="sm" onClick={onWithdraw} loading={withdrawLoading}>
          Withdraw
        </Button>
      )}
      {isWithdrawn && (
        <span className="text-text-secondary text-xs">Withdrawn</span>
      )}
    </div>
  );
}
```

- [ ] **Step 8: Create `packages/ui/src/components/forecast/InsightCard.tsx`**

```tsx
import { clsx } from 'clsx';
import { Button } from '../atoms/Button';

export interface InsightSignal {
  suggestedProbability: number;
  confidence: number; // 1–5
  keyFactors: string[];
  sourceUrls: string[];
}

export interface InsightCardProps {
  tier: 'free' | 'pro' | 'elite';
  signal?: InsightSignal;
  onFirstView?: () => void;
  onUpgrade?: () => void;
}

export function InsightCard({ tier, signal, onUpgrade }: InsightCardProps) {
  if (tier === 'free') {
    return (
      <div className="bg-surface-2 border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lemon text-xs font-bold uppercase tracking-wide">AI Insight Signal</span>
          <span className="text-xs text-text-secondary">Pro+ only</span>
        </div>
        <p className="text-text-secondary text-sm mb-3">Upgrade to Pro to see AI-generated probability estimates and key factors.</p>
        <Button variant="primary" size="sm" onClick={onUpgrade}>Upgrade to Pro</Button>
      </div>
    );
  }

  if (!signal) {
    return (
      <div className="bg-surface-2 border border-border rounded-xl p-4">
        <span className="text-lemon text-xs font-bold uppercase tracking-wide">AI Insight Signal</span>
        <p className="text-text-secondary text-sm mt-2">Signal generating — check back in a few hours.</p>
      </div>
    );
  }

  const stars = Array.from({ length: 5 }, (_, i) => i < signal.confidence ? '★' : '☆').join('');

  return (
    <div className="bg-surface-2 border border-lemon/20 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-lemon text-xs font-bold uppercase tracking-wide">AI Insight Signal</span>
        <span className="text-lemon text-sm font-mono">{stars}</span>
      </div>
      <div className="flex items-baseline gap-2 mb-3">
        <span className={clsx('font-mono font-bold text-2xl', signal.suggestedProbability >= 50 ? 'text-green' : 'text-orange')}>
          {signal.suggestedProbability}%
        </span>
        <span className="text-text-secondary text-xs">suggested probability</span>
      </div>
      <ul className="space-y-1 mb-3">
        {signal.keyFactors.map((f, i) => (
          <li key={i} className="text-text-primary text-xs flex gap-2">
            <span className="text-lemon">•</span>{f}
          </li>
        ))}
      </ul>
      <p className="text-text-secondary text-[10px]">Not financial advice. For educational purposes only.</p>
    </div>
  );
}
```

- [ ] **Step 9: Create `packages/ui/src/components/forecast/SettlementBanner.tsx`**

```tsx
export interface SettlementBannerProps {
  fpEarned: number;
  outcome: boolean;
  userSide?: boolean;
}

export function SettlementBanner({ fpEarned, outcome, userSide }: SettlementBannerProps) {
  const won = userSide === outcome;
  return (
    <div className={`rounded-xl p-4 border ${won ? 'bg-[rgba(0,212,106,0.10)] border-green/30' : 'bg-surface-2 border-border'}`}>
      <p className="text-xs font-bold uppercase tracking-wide text-text-secondary mb-1">Market Settled</p>
      <p className="text-text-primary font-semibold">
        Outcome: <span className={outcome ? 'text-green' : 'text-orange'}>{outcome ? 'YES' : 'NO'}</span>
      </p>
      {fpEarned > 0 && (
        <p className="text-lemon font-mono font-bold text-lg mt-1">
          +{fpEarned.toLocaleString()} FP earned
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 10: Create `packages/ui/src/components/forecast/ForecastEntryWidget.tsx`**

```tsx
'use client';
import { useState } from 'react';
import { clsx } from 'clsx';
import { Button } from '../atoms/Button';
import { FPBadge } from '../fp-economy/FPBadge';

export interface ForecastEntryWidgetProps {
  marketId: string;
  yesProb: number;
  fpBalance: number;
  maxFp: number;
  onSubmit: (side: boolean, fpAmount: number) => Promise<void>;
  isLoggedIn: boolean;
  onLoginPrompt?: () => void;
}

export function ForecastEntryWidget({ yesProb, fpBalance, maxFp, onSubmit, isLoggedIn, onLoginPrompt }: ForecastEntryWidgetProps) {
  const [side, setSide] = useState<boolean | null>(null);
  const [fp, setFp] = useState(100);
  const [loading, setLoading] = useState(false);

  if (!isLoggedIn) {
    return (
      <div className="bg-surface-2 border border-border rounded-xl p-4 text-center">
        <p className="text-text-secondary text-sm mb-3">Log in to make a forecast entry</p>
        <Button variant="primary" size="sm" onClick={onLoginPrompt}>Log in</Button>
      </div>
    );
  }

  const cost = Math.min(fp, fpBalance);
  const prob = side === true ? yesProb : side === false ? (100 - yesProb) : null;

  async function handleSubmit() {
    if (side === null) return;
    setLoading(true);
    try { await onSubmit(side, fp); } finally { setLoading(false); }
  }

  return (
    <div className="bg-surface-2 border border-border rounded-xl p-4 space-y-4">
      <div className="flex gap-3">
        <button
          onClick={() => setSide(true)}
          className={clsx('flex-1 h-12 rounded-xl font-semibold text-sm transition-all', side === true ? 'bg-green text-[#0D0D0D]' : 'bg-surface-3 text-green border border-green/40 hover:bg-green/10')}
        >
          YES · {yesProb}%
        </button>
        <button
          onClick={() => setSide(false)}
          className={clsx('flex-1 h-12 rounded-xl font-semibold text-sm transition-all', side === false ? 'bg-orange text-[#0D0D0D]' : 'bg-surface-3 text-orange border border-orange/40 hover:bg-orange/10')}
        >
          NO · {100 - yesProb}%
        </button>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-text-secondary">
          <span>FP to deploy</span>
          <FPBadge amount={fpBalance} label="balance" />
        </div>
        <input
          type="range"
          min={50}
          max={Math.min(maxFp, fpBalance)}
          value={fp}
          onChange={(e) => setFp(Number(e.target.value))}
          className="w-full accent-green"
        />
        <div className="flex justify-between">
          <span className="font-mono text-lemon text-sm">⚡ {cost.toLocaleString()} FP</span>
          {prob != null && <span className="text-text-secondary text-xs">implied {prob}%</span>}
        </div>
      </div>
      <Button
        variant="primary"
        className="w-full"
        disabled={side === null || fp < 50}
        loading={loading}
        onClick={handleSubmit}
      >
        Enter Forecast
      </Button>
      <p className="text-text-secondary text-[10px] text-center">Y = Yes · N = No · Enter to confirm</p>
    </div>
  );
}
```

- [ ] **Step 11: Run tests to verify they pass**

```bash
pnpm --filter @venlaxiq/ui test
```

Expected: all forecast tests PASS.

- [ ] **Step 12: Commit**

```bash
git add packages/ui/src/components/forecast packages/ui/tests/forecast.test.tsx
git commit -m "feat(ui): add forecast domain components — MarketCard, ProbabilityBar, InsightCard, ForecastEntryWidget, etc."
```

---

## Task 4: FP Economy Components

**Files:**
- Create: `packages/ui/src/components/fp-economy/FPBadge.tsx`
- Create: `packages/ui/src/components/fp-economy/StreakBanner.tsx`
- Create: `packages/ui/src/components/fp-economy/MissionCard.tsx`
- Create: `packages/ui/src/components/fp-economy/BadgeDisplay.tsx`
- Create: `packages/ui/src/components/fp-economy/XPProgressBar.tsx`
- Create: `packages/ui/src/components/fp-economy/RewardCard.tsx`
- Create: `packages/ui/src/components/fp-economy/WalletSummary.tsx`
- Create: `packages/ui/src/components/fp-economy/SubscriptionBadge.tsx`
- Create: `packages/ui/tests/fp-economy.test.tsx`

- [ ] **Step 1: Write failing FP economy tests**

```tsx
// packages/ui/tests/fp-economy.test.tsx
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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm --filter @venlaxiq/ui test
```

Expected: FAIL — modules not found.

- [ ] **Step 3: Create `packages/ui/src/components/fp-economy/FPBadge.tsx`**

```tsx
export interface FPBadgeProps {
  amount: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizes = { sm: 'text-xs', md: 'text-sm', lg: 'text-base' };

export function FPBadge({ amount, label, size = 'md' }: FPBadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1 font-mono font-bold text-lemon ${sizes[size]}`}>
      ⚡ {amount.toLocaleString()} FP
      {label && <span className="text-text-secondary font-normal text-xs ml-1">{label}</span>}
    </span>
  );
}
```

- [ ] **Step 4: Create `packages/ui/src/components/fp-economy/StreakBanner.tsx`**

```tsx
export interface StreakBannerProps {
  day: number;
  multiplier: number;
  dailyFp: number;
  onClaim?: () => void;
  claimed?: boolean;
  claimLoading?: boolean;
}

export function StreakBanner({ day, multiplier, dailyFp, onClaim, claimed, claimLoading }: StreakBannerProps) {
  const glowing = day >= 7;
  return (
    <div className={`rounded-xl p-4 border ${glowing ? 'border-lemon/40 bg-[rgba(255,230,0,0.08)]' : 'border-border bg-surface-2'}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-lemon text-xs font-bold uppercase tracking-wide mb-1">
            {glowing ? '🔥 ' : ''}Day {day} Streak
          </p>
          <p className="text-text-primary font-semibold">
            {multiplier}× multiplier · <span className="text-lemon font-mono">⚡ {dailyFp.toLocaleString()} FP</span>
          </p>
        </div>
        {onClaim && !claimed && (
          <button
            onClick={onClaim}
            disabled={claimLoading}
            className="bg-lemon text-[#0D0D0D] font-semibold text-sm px-4 py-2 rounded-lg hover:bg-yellow-300 disabled:opacity-50"
          >
            {claimLoading ? '...' : 'Claim'}
          </button>
        )}
        {claimed && <span className="text-green text-sm font-semibold">✓ Claimed</span>}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create `packages/ui/src/components/fp-economy/MissionCard.tsx`**

```tsx
export interface MissionCardProps {
  title: string;
  fpReward: number;
  progress: number;
  total: number;
  completed: boolean;
  onComplete?: () => void;
}

export function MissionCard({ title, fpReward, progress, total, completed }: MissionCardProps) {
  const pct = Math.min(100, Math.round((progress / total) * 100));
  return (
    <div className={`bg-surface-2 border rounded-xl p-3 ${completed ? 'border-green/30' : 'border-border'}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-text-primary text-sm font-medium">{title}</p>
        <span className="text-lemon text-xs font-mono font-bold shrink-0">+{fpReward.toLocaleString()} FP</span>
      </div>
      <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
        <div className="h-full bg-green transition-all duration-300" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-text-secondary text-xs mt-1">{progress}/{total}</p>
    </div>
  );
}
```

- [ ] **Step 6: Create `packages/ui/src/components/fp-economy/BadgeDisplay.tsx`**

```tsx
import { clsx } from 'clsx';

export interface BadgeDisplayProps {
  name: string;
  icon: string;
  fpReward: number;
  unlocked: boolean;
  earnedAt?: Date;
}

export function BadgeDisplay({ name, icon, fpReward, unlocked, earnedAt }: BadgeDisplayProps) {
  return (
    <div className={clsx('flex flex-col items-center p-3 rounded-xl border', unlocked ? 'bg-surface-2 border-green/20' : 'bg-surface-2 border-border opacity-40')}>
      <span className="text-3xl mb-2">{icon}</span>
      <p className="text-text-primary text-xs font-semibold text-center">{name}</p>
      <span className="text-lemon text-xs font-mono mt-1">⚡ {fpReward.toLocaleString()}</span>
      {unlocked && earnedAt && (
        <span className="text-text-secondary text-[10px] mt-1">{earnedAt.toLocaleDateString()}</span>
      )}
    </div>
  );
}
```

- [ ] **Step 7: Create `packages/ui/src/components/fp-economy/XPProgressBar.tsx`**

```tsx
export type XpLevel = 'rookie' | 'analyst' | 'expert' | 'master' | 'legend';

export interface XPProgressBarProps {
  level: XpLevel;
  xp: number;
  nextLevelXp: number;
}

const levelLabels: Record<XpLevel, string> = {
  rookie: 'Rookie', analyst: 'Analyst', expert: 'Expert', master: 'Master', legend: 'Legend',
};

export function XPProgressBar({ level, xp, nextLevelXp }: XPProgressBarProps) {
  const pct = level === 'legend' ? 100 : Math.min(100, Math.round((xp / nextLevelXp) * 100));
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-orange font-semibold">{levelLabels[level]}</span>
        <span className="text-text-secondary font-mono">{xp.toLocaleString()} XP</span>
      </div>
      <div className="h-2 bg-surface-3 rounded-full overflow-hidden">
        <div className="h-full bg-orange transition-all duration-300" style={{ width: `${pct}%` }} />
      </div>
      {level !== 'legend' && (
        <p className="text-text-secondary text-[10px] mt-1">{nextLevelXp.toLocaleString()} XP to next level</p>
      )}
    </div>
  );
}
```

- [ ] **Step 8: Create `packages/ui/src/components/fp-economy/RewardCard.tsx`**

```tsx
import { Button } from '../atoms/Button';

export interface RewardCardProps {
  name: string;
  category: string;
  fpCost: number;
  imageUrl: string | null;
  onRedeem: () => void;
  redeemLoading?: boolean;
  canAfford?: boolean;
}

export function RewardCard({ name, category, fpCost, imageUrl, onRedeem, redeemLoading, canAfford = true }: RewardCardProps) {
  return (
    <div className="bg-surface-2 border border-border rounded-xl overflow-hidden">
      <div className="h-28 bg-surface-3 flex items-center justify-center">
        {imageUrl ? (
          <img src={imageUrl} alt={name} className="h-full w-full object-cover" />
        ) : (
          <span className="text-3xl">🎁</span>
        )}
      </div>
      <div className="p-3">
        <p className="text-text-secondary text-[10px] uppercase tracking-wide mb-0.5">{category}</p>
        <p className="text-text-primary text-sm font-semibold mb-2">{name}</p>
        <div className="flex items-center justify-between">
          <span className="text-lemon font-mono text-sm font-bold">⚡ {fpCost.toLocaleString()} FP</span>
          <Button variant="primary" size="sm" onClick={onRedeem} loading={redeemLoading} disabled={!canAfford}>
            Redeem
          </Button>
        </div>
        {!canAfford && <p className="text-text-secondary text-[10px] mt-1">Insufficient FP</p>}
      </div>
    </div>
  );
}
```

- [ ] **Step 9: Create `packages/ui/src/components/fp-economy/WalletSummary.tsx`**

```tsx
export interface WalletSummaryProps {
  earnedFp: number;
  expiresAt: Date | null;
}

export function WalletSummary({ earnedFp, expiresAt }: WalletSummaryProps) {
  const daysLeft = expiresAt ? Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / 86400_000)) : null;
  return (
    <div className="bg-surface-2 border border-lemon/20 rounded-xl p-5">
      <p className="text-text-secondary text-xs uppercase tracking-wide mb-1">Redeemable FP Balance</p>
      <p className="text-lemon font-mono font-bold text-3xl">⚡ {earnedFp.toLocaleString()}</p>
      {daysLeft != null && (
        <p className={`text-xs mt-2 ${daysLeft < 14 ? 'text-orange' : 'text-text-secondary'}`}>
          Expires in {daysLeft} day{daysLeft !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 10: Create `packages/ui/src/components/fp-economy/SubscriptionBadge.tsx`**

```tsx
export type SubscriptionTier = 'free' | 'pro' | 'elite';

export interface SubscriptionBadgeProps {
  tier: SubscriptionTier;
}

const config: Record<SubscriptionTier, { label: string; cls: string }> = {
  free:  { label: 'Free',  cls: 'bg-surface-3 text-text-secondary border-border' },
  pro:   { label: 'Pro',   cls: 'bg-[rgba(0,212,106,0.15)] text-green border-green/30' },
  elite: { label: 'Elite', cls: 'bg-[rgba(255,230,0,0.15)] text-lemon border-lemon/30' },
};

export function SubscriptionBadge({ tier }: SubscriptionBadgeProps) {
  const { label, cls } = config[tier];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${cls}`}>
      {label}
    </span>
  );
}
```

- [ ] **Step 11: Run tests to verify they pass**

```bash
pnpm --filter @venlaxiq/ui test
```

Expected: all FP economy tests PASS.

- [ ] **Step 12: Commit**

```bash
git add packages/ui/src/components/fp-economy packages/ui/tests/fp-economy.test.tsx
git commit -m "feat(ui): add FP economy components — FPBadge, StreakBanner, MissionCard, BadgeDisplay, XPProgressBar, RewardCard, WalletSummary, SubscriptionBadge"
```

---

## Task 5: Review Components

**Files:**
- Create: `packages/ui/src/components/reviews/VerifiedBadge.tsx`
- Create: `packages/ui/src/components/reviews/ReviewCard.tsx`
- Create: `packages/ui/src/components/reviews/HelpfulVoteRow.tsx`
- Create: `packages/ui/src/components/reviews/ReviewForm.tsx`
- Create: `packages/ui/src/components/reviews/TrustSummary.tsx`
- Create: `packages/ui/tests/reviews.test.tsx`

- [ ] **Step 1: Write failing review tests**

```tsx
// packages/ui/tests/reviews.test.tsx
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
});

describe('TrustSummary', () => {
  it('renders review count and average stars', () => {
    render(<TrustSummary verifiedCount={42} averageRating={4.3} totalCount={55} />);
    expect(screen.getByText(/42/)).toBeInTheDocument();
    expect(screen.getByText(/4\.3/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm --filter @venlaxiq/ui test
```

Expected: FAIL.

- [ ] **Step 3: Create `packages/ui/src/components/reviews/VerifiedBadge.tsx`**

```tsx
export type ReviewBadge = 'none' | 'verified' | 'community_trusted';

export interface VerifiedBadgeProps {
  type: ReviewBadge;
}

export function VerifiedBadge({ type }: VerifiedBadgeProps) {
  if (type === 'none') return null;
  if (type === 'community_trusted') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-[rgba(255,230,0,0.15)] text-lemon border border-lemon/30">
        ★ Community Trusted
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-[rgba(0,212,106,0.15)] text-green border border-green/30">
      ✓ Verified
    </span>
  );
}
```

- [ ] **Step 4: Create `packages/ui/src/components/reviews/ReviewCard.tsx`**

```tsx
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
    <span className="text-lemon text-sm">
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
          <button onClick={() => onVote(true)} className="text-xs text-text-secondary hover:text-green">👍 Helpful</button>
          <button onClick={() => onVote(false)} className="text-xs text-text-secondary hover:text-orange">👎 Not helpful</button>
        </div>
      )}
      <p className="text-text-secondary text-[10px] border-t border-border pt-2">
        Reviewer earned VenlaxIQ ForecastPoints for this review.
      </p>
    </div>
  );
}
```

- [ ] **Step 5: Create `packages/ui/src/components/reviews/HelpfulVoteRow.tsx`**

```tsx
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
      >
        👍 Helpful
      </button>
      <button
        disabled={voteLoading}
        onClick={() => onVote(false)}
        className="hover:text-orange disabled:opacity-50 transition-colors"
      >
        👎 Not helpful
      </button>
    </div>
  );
}
```

- [ ] **Step 6: Create `packages/ui/src/components/reviews/ReviewForm.tsx`**

```tsx
'use client';
import { useState } from 'react';
import { Input } from '../atoms/Input';
import { Button } from '../atoms/Button';

export interface ReviewFormData {
  title: string;
  body: string;
  rating: number;
  receiptFile?: File;
}

export interface ReviewFormProps {
  onSubmit: (data: ReviewFormData) => Promise<void>;
  productName: string;
}

export function ReviewForm({ onSubmit, productName }: ReviewFormProps) {
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | undefined>();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try { await onSubmit({ title, body, rating, receiptFile }); } finally { setLoading(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-text-secondary text-sm">Reviewing: <span className="text-text-primary font-medium">{productName}</span></p>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary mb-1">Rating</p>
        <div className="flex gap-1">
          {[1,2,3,4,5].map((s) => (
            <button key={s} type="button" onClick={() => setRating(s)} className={`text-2xl ${s <= rating ? 'text-lemon' : 'text-surface-3'}`}>★</button>
          ))}
        </div>
      </div>
      <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Summarise your experience" required />
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Review</label>
        <textarea
          className="bg-surface-3 border border-border rounded-xl px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary outline-none focus:border-green focus:ring-1 focus:ring-green resize-none"
          rows={4}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Share your experience in detail..."
          required
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Receipt (optional — earn Verified badge)</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setReceiptFile(e.target.files?.[0])}
          className="text-sm text-text-secondary"
        />
      </div>
      <p className="text-text-secondary text-[10px]">You will earn VenlaxIQ ForecastPoints for publishing this review.</p>
      <Button type="submit" variant="primary" className="w-full" loading={loading}>Submit Review</Button>
    </form>
  );
}
```

- [ ] **Step 7: Create `packages/ui/src/components/reviews/TrustSummary.tsx`**

```tsx
export interface TrustSummaryProps {
  verifiedCount: number;
  totalCount: number;
  averageRating: number;
}

export function TrustSummary({ verifiedCount, totalCount, averageRating }: TrustSummaryProps) {
  return (
    <div className="bg-surface-2 border border-border rounded-xl p-4 flex items-center gap-6">
      <div>
        <p className="text-text-primary font-mono font-bold text-3xl">{averageRating.toFixed(1)}</p>
        <p className="text-text-secondary text-xs">{totalCount} reviews</p>
      </div>
      <div className="border-l border-border pl-6">
        <p className="text-green font-semibold text-sm">{verifiedCount} Verified</p>
        <p className="text-text-secondary text-xs">{totalCount - verifiedCount} unverified</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 8: Run tests to verify they pass**

```bash
pnpm --filter @venlaxiq/ui test
```

Expected: all review tests PASS.

- [ ] **Step 9: Commit**

```bash
git add packages/ui/src/components/reviews packages/ui/tests/reviews.test.tsx
git commit -m "feat(ui): add review components — ReviewCard, VerifiedBadge, HelpfulVoteRow, ReviewForm, TrustSummary"
```

---

## Task 6: Social + Profile Components

**Files:**
- Create: `packages/ui/src/components/social/LeaderboardRow.tsx`
- Create: `packages/ui/src/components/social/ProfileHeader.tsx`
- Create: `packages/ui/src/components/social/AccuracyGauge.tsx`
- Create: `packages/ui/src/components/social/ForecastHistoryRow.tsx`
- Create: `packages/ui/src/components/social/FollowButton.tsx`
- Create: `packages/ui/tests/social.test.tsx`

- [ ] **Step 1: Write failing social tests**

```tsx
// packages/ui/tests/social.test.tsx
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
    expect(screen.getByText(/YES/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm --filter @venlaxiq/ui test
```

Expected: FAIL.

- [ ] **Step 3: Create `packages/ui/src/components/social/LeaderboardRow.tsx`**

```tsx
import { clsx } from 'clsx';
import { Avatar } from '../atoms/Avatar';

export interface LeaderboardRowProps {
  rank: number;
  username: string;
  accuracy: number;
  fpEarned: number;
  avatarUrl: string | null;
  isCurrentUser: boolean;
}

export function LeaderboardRow({ rank, username, accuracy, fpEarned, avatarUrl, isCurrentUser }: LeaderboardRowProps) {
  return (
    <div className={clsx('flex items-center gap-3 py-3 border-b border-border last:border-0', isCurrentUser && 'bg-[rgba(0,212,106,0.05)] rounded-lg px-2')}>
      <span className="font-mono font-bold text-sm text-text-secondary w-8 shrink-0">#{rank}</span>
      <Avatar name={username} src={avatarUrl} size="sm" />
      <div className="flex-1 min-w-0">
        <p className={clsx('text-sm font-medium truncate', isCurrentUser ? 'text-green' : 'text-text-primary')}>{username}</p>
      </div>
      <div className="text-right shrink-0">
        <p className={clsx('font-mono text-sm font-bold', accuracy >= 70 ? 'text-green' : 'text-orange')}>{accuracy}%</p>
        <p className="text-text-secondary text-xs font-mono">⚡ {fpEarned.toLocaleString()}</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create `packages/ui/src/components/social/ProfileHeader.tsx`**

```tsx
import { Avatar } from '../atoms/Avatar';
import { SubscriptionBadge, SubscriptionTier } from '../fp-economy/SubscriptionBadge';
import { FollowButton } from './FollowButton';
import { XpLevel } from '../fp-economy/XPProgressBar';

export interface ProfileHeaderProps {
  username: string;
  avatarUrl: string | null;
  tier: SubscriptionTier;
  xpLevel: XpLevel;
  accuracy: number;
  isOwnProfile: boolean;
  isFollowing: boolean;
  followerCount: number;
  followingCount?: number;
  onFollow: () => void;
  followLoading?: boolean;
}

export function ProfileHeader({ username, avatarUrl, tier, xpLevel, accuracy, isOwnProfile, isFollowing, followerCount, followingCount, onFollow, followLoading }: ProfileHeaderProps) {
  return (
    <div className="bg-surface-2 border border-border rounded-xl p-5">
      <div className="flex items-start gap-4">
        <Avatar name={username} src={avatarUrl} size="lg" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h2 className="text-text-primary font-bold text-lg">{username}</h2>
            <SubscriptionBadge tier={tier} />
            <span className="text-orange text-xs font-semibold capitalize">{xpLevel}</span>
          </div>
          <p className={`font-mono text-sm font-bold mb-2 ${accuracy >= 70 ? 'text-green' : 'text-orange'}`}>{accuracy}% accuracy</p>
          <div className="flex items-center gap-4 text-xs text-text-secondary">
            <span><strong className="text-text-primary">{followerCount}</strong> followers</span>
            {followingCount != null && <span><strong className="text-text-primary">{followingCount}</strong> following</span>}
          </div>
        </div>
        {!isOwnProfile && (
          <FollowButton isFollowing={isFollowing} onFollow={onFollow} loading={followLoading} />
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create `packages/ui/src/components/social/AccuracyGauge.tsx`**

```tsx
export interface AccuracyGaugeProps {
  accuracy: number; // 0–100
  forecastCount: number;
}

export function AccuracyGauge({ accuracy, forecastCount }: AccuracyGaugeProps) {
  const color = accuracy >= 70 ? 'text-green' : 'text-orange';
  const barColor = accuracy >= 70 ? 'bg-green' : 'bg-orange';
  return (
    <div className="bg-surface-2 border border-border rounded-xl p-4">
      <p className="text-text-secondary text-xs uppercase tracking-wide mb-2">Accuracy Score</p>
      <p className={`font-mono font-bold text-3xl mb-2 ${color}`}>{accuracy}%</p>
      <div className="h-2 bg-surface-3 rounded-full overflow-hidden mb-1">
        <div className={`h-full ${barColor} transition-all duration-300`} style={{ width: `${accuracy}%` }} />
      </div>
      <p className="text-text-secondary text-xs">{forecastCount} forecasts</p>
    </div>
  );
}
```

- [ ] **Step 6: Create `packages/ui/src/components/social/FollowButton.tsx`**

```tsx
import { Button } from '../atoms/Button';

export interface FollowButtonProps {
  isFollowing: boolean;
  onFollow: () => void;
  loading?: boolean;
}

export function FollowButton({ isFollowing, onFollow, loading }: FollowButtonProps) {
  return (
    <Button
      variant={isFollowing ? 'secondary' : 'primary'}
      size="sm"
      onClick={onFollow}
      loading={loading}
    >
      {isFollowing ? 'Following' : 'Follow'}
    </Button>
  );
}
```

- [ ] **Step 7: Create `packages/ui/src/components/social/ForecastHistoryRow.tsx`**

```tsx
import { clsx } from 'clsx';

export interface ForecastHistoryRowProps {
  marketTitle: string;
  side: boolean;
  outcome: boolean | null;
  fpEarned: number | null;
  settledAt: Date | null;
}

export function ForecastHistoryRow({ marketTitle, side, outcome, fpEarned, settledAt }: ForecastHistoryRowProps) {
  const won = outcome !== null && side === outcome;
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0 gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-text-primary text-sm font-medium truncate">{marketTitle}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={clsx('text-xs font-semibold', side ? 'text-green' : 'text-orange')}>YES</span>
          {outcome !== null && (
            <span className="text-text-secondary text-xs">→ Settled {outcome ? 'YES' : 'NO'}</span>
          )}
          {settledAt && <span className="text-text-secondary text-xs">{settledAt.toLocaleDateString()}</span>}
        </div>
      </div>
      {fpEarned != null && (
        <span className={clsx('text-sm font-mono font-bold shrink-0', won ? 'text-lemon' : 'text-text-secondary')}>
          {won ? '+' : ''}{fpEarned.toLocaleString()} FP
        </span>
      )}
      {outcome === null && <span className="text-text-secondary text-xs shrink-0">Pending</span>}
    </div>
  );
}
```

- [ ] **Step 8: Run tests to verify they pass**

```bash
pnpm --filter @venlaxiq/ui test
```

Expected: all social tests PASS.

- [ ] **Step 9: Commit**

```bash
git add packages/ui/src/components/social packages/ui/tests/social.test.tsx
git commit -m "feat(ui): add social/profile components — LeaderboardRow, ProfileHeader, AccuracyGauge, FollowButton, ForecastHistoryRow"
```

---

## Task 7: Layout Components

**Files:**
- Create: `packages/ui/src/components/layout/PageContainer.tsx`
- Create: `packages/ui/src/components/layout/EmptyState.tsx`
- Create: `packages/ui/src/components/layout/NotificationBell.tsx`
- Create: `packages/ui/src/components/layout/TopBar.tsx`
- Create: `packages/ui/src/components/layout/Sidebar.tsx`
- Create: `packages/ui/src/components/layout/BottomTabBar.tsx`
- Create: `packages/ui/tests/layout.test.tsx`

- [ ] **Step 1: Write failing layout tests**

```tsx
// packages/ui/tests/layout.test.tsx
import { render, screen } from '@testing-library/react';
import { PageContainer } from '../src/components/layout/PageContainer';
import { EmptyState } from '../src/components/layout/EmptyState';
import { NotificationBell } from '../src/components/layout/NotificationBell';

describe('PageContainer', () => {
  it('renders children', () => {
    render(<PageContainer><p>Content</p></PageContainer>);
    expect(screen.getByText('Content')).toBeInTheDocument();
  });
});

describe('EmptyState', () => {
  it('renders icon and message', () => {
    render(<EmptyState icon="📭" title="No markets yet" description="Come back later." />);
    expect(screen.getByText('No markets yet')).toBeInTheDocument();
    expect(screen.getByText('Come back later.')).toBeInTheDocument();
  });
});

describe('NotificationBell', () => {
  it('renders unread count badge', () => {
    render(<NotificationBell unreadCount={5} onClick={() => {}} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });
  it('renders without badge when zero', () => {
    render(<NotificationBell unreadCount={0} onClick={() => {}} />);
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm --filter @venlaxiq/ui test
```

Expected: FAIL.

- [ ] **Step 3: Create `packages/ui/src/components/layout/PageContainer.tsx`**

```tsx
import { clsx } from 'clsx';

export interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  narrow?: boolean;
}

export function PageContainer({ children, className, narrow = false }: PageContainerProps) {
  return (
    <main className={clsx('mx-auto w-full px-4 py-6', narrow ? 'max-w-2xl' : 'max-w-5xl', className)}>
      {children}
    </main>
  );
}
```

- [ ] **Step 4: Create `packages/ui/src/components/layout/EmptyState.tsx`**

```tsx
import { Button } from '../atoms/Button';

export interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  ctaLabel?: string;
  onCta?: () => void;
}

export function EmptyState({ icon, title, description, ctaLabel, onCta }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="text-5xl mb-4">{icon}</span>
      <h3 className="text-text-primary font-semibold text-lg mb-2">{title}</h3>
      <p className="text-text-secondary text-sm max-w-sm mb-4">{description}</p>
      {ctaLabel && onCta && (
        <Button variant="primary" onClick={onCta}>{ctaLabel}</Button>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Create `packages/ui/src/components/layout/NotificationBell.tsx`**

```tsx
export interface NotificationBellProps {
  unreadCount: number;
  onClick: () => void;
}

export function NotificationBell({ unreadCount, onClick }: NotificationBellProps) {
  return (
    <button onClick={onClick} className="relative text-text-secondary hover:text-text-primary transition-colors p-1">
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 bg-orange text-[#0D0D0D] text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
}
```

- [ ] **Step 6: Create `packages/ui/src/components/layout/TopBar.tsx`**

```tsx
import { FPBadge } from '../fp-economy/FPBadge';
import { Avatar } from '../atoms/Avatar';
import { NotificationBell } from './NotificationBell';

export interface TopBarProps {
  username?: string;
  avatarUrl?: string | null;
  fpBalance?: number;
  unreadCount?: number;
  onNotifications?: () => void;
  onProfile?: () => void;
  onSearch?: () => void;
  children?: React.ReactNode;
}

export function TopBar({ username, avatarUrl, fpBalance, unreadCount = 0, onNotifications, onProfile, onSearch, children }: TopBarProps) {
  return (
    <header className="h-14 bg-surface border-b border-border flex items-center px-4 gap-3 sticky top-0 z-40">
      <span className="font-heading font-extrabold text-text-primary text-lg tracking-tight">VenlaxIQ</span>
      <div className="flex-1">{children}</div>
      <div className="flex items-center gap-3">
        {onSearch && (
          <button onClick={onSearch} className="text-text-secondary hover:text-text-primary transition-colors p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        )}
        {fpBalance != null && <FPBadge amount={fpBalance} size="sm" />}
        {onNotifications && <NotificationBell unreadCount={unreadCount} onClick={onNotifications} />}
        {username && (
          <button onClick={onProfile} className="flex items-center">
            <Avatar name={username} src={avatarUrl} size="sm" />
          </button>
        )}
      </div>
    </header>
  );
}
```

- [ ] **Step 7: Create `packages/ui/src/components/layout/Sidebar.tsx`**

```tsx
import { clsx } from 'clsx';

export interface SidebarItem {
  label: string;
  href: string;
  icon: string;
  active?: boolean;
  badge?: number;
}

export interface SidebarProps {
  items: SidebarItem[];
  onNavigate: (href: string) => void;
  username?: string;
  onLogout?: () => void;
  logo?: string;
}

export function Sidebar({ items, onNavigate, username, onLogout, logo = 'VenlaxIQ' }: SidebarProps) {
  return (
    <aside className="w-56 bg-surface-2 border-r border-border h-screen flex flex-col sticky top-0">
      <div className="h-14 flex items-center px-4 border-b border-border">
        <span className="font-heading font-extrabold text-text-primary text-base">{logo}</span>
      </div>
      <nav className="flex-1 py-3 overflow-y-auto">
        {items.map((item) => (
          <button
            key={item.href}
            onClick={() => onNavigate(item.href)}
            className={clsx(
              'w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors text-left',
              item.active ? 'text-green bg-[rgba(0,212,106,0.08)] border-r-2 border-green' : 'text-text-secondary hover:text-text-primary hover:bg-surface-3',
            )}
          >
            <span className="text-base w-5 text-center">{item.icon}</span>
            {item.label}
            {item.badge != null && item.badge > 0 && (
              <span className="ml-auto bg-orange text-[#0D0D0D] text-[10px] font-bold rounded-full px-1.5 py-0.5">{item.badge}</span>
            )}
          </button>
        ))}
      </nav>
      {username && (
        <div className="border-t border-border p-4">
          <p className="text-text-secondary text-xs truncate mb-2">{username}</p>
          {onLogout && (
            <button onClick={onLogout} className="text-xs text-text-secondary hover:text-[#FF3B30] transition-colors">
              Log out
            </button>
          )}
        </div>
      )}
    </aside>
  );
}
```

- [ ] **Step 8: Create `packages/ui/src/components/layout/BottomTabBar.tsx`**

```tsx
import { clsx } from 'clsx';

export interface TabItem {
  label: string;
  icon: string;
  href: string;
  active?: boolean;
}

export interface BottomTabBarProps {
  items: TabItem[];
  onNavigate: (href: string) => void;
}

export function BottomTabBar({ items, onNavigate }: BottomTabBarProps) {
  return (
    <nav className="fixed bottom-0 inset-x-0 bg-surface-2 border-t border-border flex h-16 z-50">
      {items.map((item) => (
        <button
          key={item.href}
          onClick={() => onNavigate(item.href)}
          className={clsx(
            'flex-1 flex flex-col items-center justify-center gap-1 transition-colors',
            item.active ? 'text-green' : 'text-text-secondary hover:text-text-primary',
          )}
        >
          <span className="text-xl leading-none">{item.icon}</span>
          <span className="text-[10px] font-semibold">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
```

- [ ] **Step 9: Run tests to verify they pass**

```bash
pnpm --filter @venlaxiq/ui test
```

Expected: all layout tests PASS. Full suite shows all tests across all files PASSING.

- [ ] **Step 10: Commit**

```bash
git add packages/ui/src/components/layout packages/ui/tests/layout.test.tsx
git commit -m "feat(ui): add layout components — TopBar, Sidebar, BottomTabBar, PageContainer, EmptyState, NotificationBell"
```

---

## Task 8: Update packages/ui/src/index.ts

**Files:**
- Modify: `packages/ui/src/index.ts`

- [ ] **Step 1: Rewrite `packages/ui/src/index.ts` to re-export all web components**

```ts
// Tokens + theme (existing)
export { colors, typography, spacing, radius, getSurface } from './tokens';
export type { Theme } from './tokens';
export { ThemeProvider, useTheme } from './theme';

// Atoms
export { Button } from './components/atoms/Button';
export type { ButtonProps, ButtonVariant, ButtonSize } from './components/atoms/Button';
export { Input } from './components/atoms/Input';
export type { InputProps } from './components/atoms/Input';
export { Select } from './components/atoms/Select';
export type { SelectProps, SelectOption } from './components/atoms/Select';
export { Avatar } from './components/atoms/Avatar';
export type { AvatarProps } from './components/atoms/Avatar';
export { Badge } from './components/atoms/Badge';
export type { BadgeProps, BadgeVariant } from './components/atoms/Badge';
export { Spinner } from './components/atoms/Spinner';
export type { SpinnerProps } from './components/atoms/Spinner';
export { Toast } from './components/atoms/Toast';
export type { ToastProps, ToastVariant } from './components/atoms/Toast';

// Forecast
export { ProbabilityBar } from './components/forecast/ProbabilityBar';
export type { ProbabilityBarProps } from './components/forecast/ProbabilityBar';
export { MarketStatusChip } from './components/forecast/MarketStatusChip';
export type { MarketStatusChipProps, MarketStatus } from './components/forecast/MarketStatusChip';
export { CategoryPill } from './components/forecast/CategoryPill';
export type { CategoryPillProps, MarketCategory } from './components/forecast/CategoryPill';
export { MarketCard } from './components/forecast/MarketCard';
export type { MarketCardProps } from './components/forecast/MarketCard';
export { PositionRow } from './components/forecast/PositionRow';
export type { PositionRowProps } from './components/forecast/PositionRow';
export { InsightCard } from './components/forecast/InsightCard';
export type { InsightCardProps, InsightSignal } from './components/forecast/InsightCard';
export { SettlementBanner } from './components/forecast/SettlementBanner';
export type { SettlementBannerProps } from './components/forecast/SettlementBanner';
export { ForecastEntryWidget } from './components/forecast/ForecastEntryWidget';
export type { ForecastEntryWidgetProps } from './components/forecast/ForecastEntryWidget';

// FP Economy
export { FPBadge } from './components/fp-economy/FPBadge';
export type { FPBadgeProps } from './components/fp-economy/FPBadge';
export { StreakBanner } from './components/fp-economy/StreakBanner';
export type { StreakBannerProps } from './components/fp-economy/StreakBanner';
export { MissionCard } from './components/fp-economy/MissionCard';
export type { MissionCardProps } from './components/fp-economy/MissionCard';
export { BadgeDisplay } from './components/fp-economy/BadgeDisplay';
export type { BadgeDisplayProps } from './components/fp-economy/BadgeDisplay';
export { XPProgressBar } from './components/fp-economy/XPProgressBar';
export type { XPProgressBarProps, XpLevel } from './components/fp-economy/XPProgressBar';
export { RewardCard } from './components/fp-economy/RewardCard';
export type { RewardCardProps } from './components/fp-economy/RewardCard';
export { WalletSummary } from './components/fp-economy/WalletSummary';
export type { WalletSummaryProps } from './components/fp-economy/WalletSummary';
export { SubscriptionBadge } from './components/fp-economy/SubscriptionBadge';
export type { SubscriptionBadgeProps, SubscriptionTier } from './components/fp-economy/SubscriptionBadge';

// Reviews
export { VerifiedBadge } from './components/reviews/VerifiedBadge';
export type { VerifiedBadgeProps, ReviewBadge } from './components/reviews/VerifiedBadge';
export { ReviewCard } from './components/reviews/ReviewCard';
export type { ReviewCardProps } from './components/reviews/ReviewCard';
export { HelpfulVoteRow } from './components/reviews/HelpfulVoteRow';
export type { HelpfulVoteRowProps } from './components/reviews/HelpfulVoteRow';
export { ReviewForm } from './components/reviews/ReviewForm';
export type { ReviewFormProps, ReviewFormData } from './components/reviews/ReviewForm';
export { TrustSummary } from './components/reviews/TrustSummary';
export type { TrustSummaryProps } from './components/reviews/TrustSummary';

// Social
export { LeaderboardRow } from './components/social/LeaderboardRow';
export type { LeaderboardRowProps } from './components/social/LeaderboardRow';
export { ProfileHeader } from './components/social/ProfileHeader';
export type { ProfileHeaderProps } from './components/social/ProfileHeader';
export { AccuracyGauge } from './components/social/AccuracyGauge';
export type { AccuracyGaugeProps } from './components/social/AccuracyGauge';
export { FollowButton } from './components/social/FollowButton';
export type { FollowButtonProps } from './components/social/FollowButton';
export { ForecastHistoryRow } from './components/social/ForecastHistoryRow';
export type { ForecastHistoryRowProps } from './components/social/ForecastHistoryRow';

// Layout
export { PageContainer } from './components/layout/PageContainer';
export type { PageContainerProps } from './components/layout/PageContainer';
export { EmptyState } from './components/layout/EmptyState';
export type { EmptyStateProps } from './components/layout/EmptyState';
export { NotificationBell } from './components/layout/NotificationBell';
export type { NotificationBellProps } from './components/layout/NotificationBell';
export { TopBar } from './components/layout/TopBar';
export type { TopBarProps } from './components/layout/TopBar';
export { Sidebar } from './components/layout/Sidebar';
export type { SidebarProps, SidebarItem } from './components/layout/Sidebar';
export { BottomTabBar } from './components/layout/BottomTabBar';
export type { BottomTabBarProps, TabItem } from './components/layout/BottomTabBar';
```

- [ ] **Step 2: Run full test suite to confirm no regressions**

```bash
pnpm --filter @venlaxiq/ui test
```

Expected: all tests PASS.

- [ ] **Step 3: Commit**

```bash
git add packages/ui/src/index.ts
git commit -m "feat(ui): complete web component library index exports"
```

---

## Task 9: React Native Native Variants

**Files:**
- Create: `packages/ui/src/native/index.ts`
- Create: `packages/ui/src/native/components/atoms/Button.tsx`
- Create: `packages/ui/src/native/components/atoms/Avatar.tsx`
- Create: `packages/ui/src/native/components/atoms/Badge.tsx`
- Create: `packages/ui/src/native/components/atoms/Spinner.tsx`
- Create: `packages/ui/src/native/components/atoms/Input.tsx`
- Create: `packages/ui/src/native/components/forecast/ProbabilityBar.tsx`
- Create: `packages/ui/src/native/components/forecast/MarketCard.tsx`
- Create: `packages/ui/src/native/components/forecast/MarketStatusChip.tsx`
- Create: `packages/ui/src/native/components/forecast/CategoryPill.tsx`
- Create: `packages/ui/src/native/components/forecast/InsightCard.tsx`
- Create: `packages/ui/src/native/components/forecast/SettlementBanner.tsx`
- Create: `packages/ui/src/native/components/forecast/ForecastEntryWidget.tsx`
- Create: `packages/ui/src/native/components/fp-economy/FPBadge.tsx`
- Create: `packages/ui/src/native/components/fp-economy/StreakBanner.tsx`
- Create: `packages/ui/src/native/components/fp-economy/MissionCard.tsx`
- Create: `packages/ui/src/native/components/fp-economy/BadgeDisplay.tsx`
- Create: `packages/ui/src/native/components/fp-economy/XPProgressBar.tsx`
- Create: `packages/ui/src/native/components/fp-economy/RewardCard.tsx`
- Create: `packages/ui/src/native/components/fp-economy/WalletSummary.tsx`
- Create: `packages/ui/src/native/components/fp-economy/SubscriptionBadge.tsx`
- Create: `packages/ui/src/native/components/reviews/ReviewCard.tsx`
- Create: `packages/ui/src/native/components/reviews/VerifiedBadge.tsx`
- Create: `packages/ui/src/native/components/reviews/HelpfulVoteRow.tsx`
- Create: `packages/ui/src/native/components/reviews/TrustSummary.tsx`
- Create: `packages/ui/src/native/components/social/LeaderboardRow.tsx`
- Create: `packages/ui/src/native/components/social/ProfileHeader.tsx`
- Create: `packages/ui/src/native/components/social/AccuracyGauge.tsx`
- Create: `packages/ui/src/native/components/social/FollowButton.tsx`
- Create: `packages/ui/src/native/components/layout/TopBar.tsx`
- Create: `packages/ui/src/native/components/layout/BottomTabBar.tsx`
- Create: `packages/ui/src/native/components/layout/PageContainer.tsx`
- Create: `packages/ui/src/native/components/layout/EmptyState.tsx`

- [ ] **Step 1: Create `packages/ui/src/native/components/atoms/Button.tsx`**

```tsx
import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { colors } from '../../../tokens';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  children: React.ReactNode;
}

export function Button({ variant = 'primary', size = 'md', loading, disabled, onPress, children }: ButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[styles.base, styles[`size_${size}` as keyof typeof styles] as any, styles[`variant_${variant}` as keyof typeof styles] as any, (disabled || loading) && styles.disabled]}
    >
      {loading && <ActivityIndicator size="small" color={variant === 'primary' ? '#0D0D0D' : colors.green} style={styles.spinner} />}
      <Text style={[styles.text, styles[`text_${variant}` as keyof typeof styles] as any, styles[`textSize_${size}` as keyof typeof styles] as any]}>
        {children}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  disabled: { opacity: 0.5 },
  spinner: { marginRight: 8 },
  variant_primary: { backgroundColor: colors.green },
  variant_secondary: { backgroundColor: colors.dark.surface3, borderWidth: 1, borderColor: colors.dark.border },
  variant_ghost: { backgroundColor: 'transparent' },
  variant_danger: { backgroundColor: '#FF3B30' },
  size_sm: { height: 32, paddingHorizontal: 12 },
  size_md: { height: 40, paddingHorizontal: 16 },
  size_lg: { height: 48, paddingHorizontal: 24 },
  text: { fontWeight: '600' },
  text_primary: { color: '#0D0D0D' },
  text_secondary: { color: colors.dark.textPrimary },
  text_ghost: { color: colors.dark.textPrimary },
  text_danger: { color: '#FFFFFF' },
  textSize_sm: { fontSize: 12 },
  textSize_md: { fontSize: 14 },
  textSize_lg: { fontSize: 16 },
});
```

- [ ] **Step 2: Create `packages/ui/src/native/components/atoms/Avatar.tsx`**

```tsx
import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { colors } from '../../../tokens';

export interface AvatarProps {
  src?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = { sm: 32, md: 40, lg: 56 };
const fontMap = { sm: 12, md: 14, lg: 18 };

function initials(name: string) {
  return name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');
}

export function Avatar({ src, name, size = 'md' }: AvatarProps) {
  const dim = sizeMap[size];
  const fs = fontMap[size];
  if (src) {
    return <Image source={{ uri: src }} style={[styles.base, { width: dim, height: dim, borderRadius: dim / 2 }]} />;
  }
  return (
    <View style={[styles.base, styles.fallback, { width: dim, height: dim, borderRadius: dim / 2 }]}>
      <Text style={[styles.initials, { fontSize: fs }]}>{initials(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { overflow: 'hidden' },
  fallback: { backgroundColor: colors.dark.surface3, borderWidth: 1, borderColor: colors.dark.border, alignItems: 'center', justifyContent: 'center' },
  initials: { color: colors.dark.textPrimary, fontWeight: '600' },
});
```

- [ ] **Step 3: Create `packages/ui/src/native/components/atoms/Badge.tsx`**

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../../tokens';

export type BadgeVariant = 'green' | 'lemon' | 'orange' | 'neutral';

export interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, { bg: string; text: string; border: string }> = {
  green:   { bg: 'rgba(0,212,106,0.15)',  text: colors.green,              border: 'rgba(0,212,106,0.3)' },
  lemon:   { bg: 'rgba(255,230,0,0.15)',  text: colors.lemon,              border: 'rgba(255,230,0,0.3)' },
  orange:  { bg: 'rgba(255,107,0,0.15)',  text: colors.orange,             border: 'rgba(255,107,0,0.3)' },
  neutral: { bg: colors.dark.surface3,    text: colors.dark.textSecondary, border: colors.dark.border },
};

export function Badge({ label, variant = 'neutral' }: BadgeProps) {
  const v = variantStyles[variant];
  return (
    <View style={[styles.base, { backgroundColor: v.bg, borderColor: v.border }]}>
      <Text style={[styles.text, { color: v.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, alignSelf: 'flex-start' },
  text: { fontSize: 11, fontWeight: '600' },
});
```

- [ ] **Step 4: Create `packages/ui/src/native/components/atoms/Spinner.tsx`**

```tsx
import React from 'react';
import { ActivityIndicator } from 'react-native';
import { colors } from '../../../tokens';

export interface SpinnerProps {
  size?: 'sm' | 'lg';
  color?: string;
}

export function Spinner({ size = 'sm', color = colors.green }: SpinnerProps) {
  return <ActivityIndicator size={size === 'sm' ? 'small' : 'large'} color={color} />;
}
```

- [ ] **Step 5: Create `packages/ui/src/native/components/atoms/Input.tsx`**

```tsx
import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { colors } from '../../../tokens';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({ label, error, ...props }: InputProps) {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label.toUpperCase()}</Text>}
      <TextInput
        style={[styles.input, error ? styles.inputError : styles.inputNormal]}
        placeholderTextColor={colors.dark.textSecondary}
        {...props}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 4 },
  label: { fontSize: 10, fontWeight: '700', color: colors.dark.textSecondary, letterSpacing: 1 },
  input: { height: 40, backgroundColor: colors.dark.surface3, borderRadius: 12, paddingHorizontal: 12, fontSize: 14, color: colors.dark.textPrimary, borderWidth: 1 },
  inputNormal: { borderColor: colors.dark.border },
  inputError: { borderColor: '#FF3B30' },
  error: { fontSize: 11, color: '#FF3B30' },
});
```

- [ ] **Step 6: Create `packages/ui/src/native/components/forecast/ProbabilityBar.tsx`**

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../../tokens';

export interface ProbabilityBarProps {
  yesProb: number;
}

export function ProbabilityBar({ yesProb }: ProbabilityBarProps) {
  const noProb = 100 - yesProb;
  return (
    <View>
      <View style={styles.track}>
        <View style={[styles.yes, { flex: yesProb }]} />
        <View style={[styles.no, { flex: noProb }]} />
      </View>
      <View style={styles.labels}>
        <Text style={styles.label}>YES {yesProb}%</Text>
        <Text style={styles.label}>NO {noProb}%</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 8, borderRadius: 4, overflow: 'hidden', flexDirection: 'row' },
  yes: { backgroundColor: colors.green },
  no: { backgroundColor: colors.orange },
  labels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  label: { fontSize: 10, fontWeight: '700', color: colors.dark.textSecondary, fontVariant: ['tabular-nums'] },
});
```

- [ ] **Step 7: Create `packages/ui/src/native/components/forecast/MarketCard.tsx`**

```tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../../tokens';
import { ProbabilityBar } from './ProbabilityBar';
import { MarketStatusChip, MarketStatus } from './MarketStatusChip';
import { CategoryPill, MarketCategory } from './CategoryPill';

export interface MarketCardProps {
  id: string;
  title: string;
  category: MarketCategory;
  status: MarketStatus;
  yesProb: number;
  closesAt: Date;
  totalVolumeFp?: number;
  onPress?: () => void;
}

export function MarketCard({ title, category, status, yesProb, closesAt, totalVolumeFp, onPress }: MarketCardProps) {
  const closingSoon = status === 'open' && (closesAt.getTime() - Date.now()) < 3_600_000;
  const probColor = yesProb >= 50 ? colors.green : colors.orange;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={2}>{title}</Text>
        <MarketStatusChip status={status} />
      </View>
      <View style={styles.row}>
        <CategoryPill category={category} />
        {closingSoon && <Text style={styles.closing}>Closing soon</Text>}
      </View>
      <ProbabilityBar yesProb={yesProb} />
      <View style={styles.footer}>
        <Text style={[styles.prob, { color: probColor }]}>{yesProb}%</Text>
        {totalVolumeFp != null && (
          <Text style={styles.volume}>⚡ {totalVolumeFp.toLocaleString()} FP</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.dark.surface2, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.dark.border },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 12 },
  title: { flex: 1, color: colors.dark.textPrimary, fontWeight: '600', fontSize: 14, lineHeight: 20 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  closing: { color: colors.orange, fontSize: 11, fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  prob: { fontWeight: '700', fontSize: 20, fontVariant: ['tabular-nums'] },
  volume: { color: colors.dark.textSecondary, fontSize: 11, fontVariant: ['tabular-nums'] },
});
```

- [ ] **Step 8: Create `packages/ui/src/native/components/forecast/MarketStatusChip.tsx`**

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../../tokens';

export type MarketStatus = 'draft' | 'open' | 'closed' | 'resolved' | 'settled';

export interface MarketStatusChipProps {
  status: MarketStatus;
}

const config: Record<MarketStatus, { label: string; bg: string; text: string }> = {
  draft:    { label: 'Draft',    bg: colors.dark.surface3,           text: colors.dark.textSecondary },
  open:     { label: 'Open',     bg: 'rgba(0,212,106,0.15)',         text: colors.green },
  closed:   { label: 'Closed',   bg: 'rgba(255,107,0,0.15)',         text: colors.orange },
  resolved: { label: 'Resolved', bg: 'rgba(255,230,0,0.15)',         text: colors.lemon },
  settled:  { label: 'Settled',  bg: colors.dark.surface3,           text: colors.dark.textSecondary },
};

export function MarketStatusChip({ status }: MarketStatusChipProps) {
  const c = config[status];
  return (
    <View style={[styles.chip, { backgroundColor: c.bg }]}>
      <Text style={[styles.text, { color: c.text }]}>{c.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: { borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2 },
  text: { fontSize: 11, fontWeight: '700' },
});
```

- [ ] **Step 9: Create `packages/ui/src/native/components/forecast/CategoryPill.tsx`**

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../../tokens';

export type MarketCategory = 'sports' | 'politics' | 'open';

export interface CategoryPillProps {
  category: MarketCategory;
}

const config: Record<MarketCategory, { label: string; bg: string; text: string }> = {
  sports:   { label: 'Sports',   bg: 'rgba(0,212,106,0.10)',  text: colors.green },
  politics: { label: 'Politics', bg: 'rgba(255,230,0,0.10)',  text: colors.lemon },
  open:     { label: 'Open',     bg: colors.dark.surface3,    text: colors.dark.textSecondary },
};

export function CategoryPill({ category }: CategoryPillProps) {
  const c = config[category];
  return (
    <View style={[styles.pill, { backgroundColor: c.bg }]}>
      <Text style={[styles.text, { color: c.text }]}>{c.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2 },
  text: { fontSize: 11, fontWeight: '700' },
});
```

- [ ] **Step 10: Create `packages/ui/src/native/components/forecast/InsightCard.tsx`**

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../../tokens';
import { Button } from '../atoms/Button';

export interface InsightSignal {
  suggestedProbability: number;
  confidence: number;
  keyFactors: string[];
  sourceUrls: string[];
}

export interface InsightCardProps {
  tier: 'free' | 'pro' | 'elite';
  signal?: InsightSignal;
  onUpgrade?: () => void;
}

export function InsightCard({ tier, signal, onUpgrade }: InsightCardProps) {
  if (tier === 'free') {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>AI Insight Signal</Text>
        <Text style={styles.lockedMsg}>Upgrade to Pro to access AI-generated probability estimates.</Text>
        <Button variant="primary" size="sm" onPress={onUpgrade}>Upgrade to Pro</Button>
      </View>
    );
  }
  if (!signal) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>AI Insight Signal</Text>
        <Text style={styles.lockedMsg}>Signal generating — check back in a few hours.</Text>
      </View>
    );
  }
  const stars = Array.from({ length: 5 }, (_, i) => i < signal.confidence ? '★' : '☆').join('');
  const probColor = signal.suggestedProbability >= 50 ? colors.green : colors.orange;
  return (
    <View style={[styles.card, styles.cardActive]}>
      <View style={styles.header}>
        <Text style={styles.title}>AI Insight Signal</Text>
        <Text style={styles.stars}>{stars}</Text>
      </View>
      <Text style={[styles.prob, { color: probColor }]}>{signal.suggestedProbability}%</Text>
      {signal.keyFactors.map((f, i) => (
        <Text key={i} style={styles.factor}>• {f}</Text>
      ))}
      <Text style={styles.disclaimer}>Not financial advice. For educational purposes only.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.dark.surface2, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.dark.border },
  cardActive: { borderColor: 'rgba(255,230,0,0.2)' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { color: colors.lemon, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  stars: { color: colors.lemon, fontSize: 14 },
  lockedMsg: { color: colors.dark.textSecondary, fontSize: 13, marginVertical: 8 },
  prob: { fontSize: 28, fontWeight: '700', marginBottom: 8 },
  factor: { color: colors.dark.textPrimary, fontSize: 12, marginBottom: 4 },
  disclaimer: { color: colors.dark.textSecondary, fontSize: 10, marginTop: 8 },
});
```

- [ ] **Step 11: Create `packages/ui/src/native/components/forecast/SettlementBanner.tsx`**

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../../tokens';

export interface SettlementBannerProps {
  fpEarned: number;
  outcome: boolean;
  userSide?: boolean;
}

export function SettlementBanner({ fpEarned, outcome, userSide }: SettlementBannerProps) {
  const won = userSide === outcome;
  return (
    <View style={[styles.banner, won && styles.bannerWon]}>
      <Text style={styles.label}>Market Settled</Text>
      <Text style={styles.outcome}>Outcome: <Text style={{ color: outcome ? colors.green : colors.orange }}>{outcome ? 'YES' : 'NO'}</Text></Text>
      {fpEarned > 0 && <Text style={styles.fp}>+{fpEarned.toLocaleString()} FP earned</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { backgroundColor: colors.dark.surface2, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.dark.border },
  bannerWon: { borderColor: 'rgba(0,212,106,0.3)', backgroundColor: 'rgba(0,212,106,0.08)' },
  label: { color: colors.dark.textSecondary, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
  outcome: { color: colors.dark.textPrimary, fontWeight: '600', fontSize: 14 },
  fp: { color: colors.lemon, fontWeight: '700', fontSize: 18, marginTop: 4 },
});
```

- [ ] **Step 12: Create `packages/ui/src/native/components/forecast/ForecastEntryWidget.tsx`**

```tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Slider, StyleSheet } from 'react-native';
import { colors } from '../../../tokens';
import { Button } from '../atoms/Button';

export interface ForecastEntryWidgetProps {
  marketId: string;
  yesProb: number;
  fpBalance: number;
  maxFp: number;
  onSubmit: (side: boolean, fpAmount: number) => Promise<void>;
}

export function ForecastEntryWidget({ yesProb, fpBalance, maxFp, onSubmit }: ForecastEntryWidgetProps) {
  const [side, setSide] = useState<boolean | null>(null);
  const [fp, setFp] = useState(100);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (side === null) return;
    setLoading(true);
    try { await onSubmit(side, fp); } finally { setLoading(false); }
  }

  return (
    <View style={styles.container}>
      <View style={styles.sideRow}>
        <TouchableOpacity
          onPress={() => setSide(true)}
          style={[styles.sideBtn, side === true ? styles.sideBtnYesActive : styles.sideBtnYes]}
        >
          <Text style={[styles.sideBtnText, { color: colors.green }]}>YES · {yesProb}%</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setSide(false)}
          style={[styles.sideBtn, side === false ? styles.sideBtnNoActive : styles.sideBtnNo]}
        >
          <Text style={[styles.sideBtnText, { color: colors.orange }]}>NO · {100 - yesProb}%</Text>
        </TouchableOpacity>
      </View>
      <Slider
        minimumValue={50}
        maximumValue={Math.min(maxFp, fpBalance)}
        value={fp}
        onValueChange={(v) => setFp(Math.round(v))}
        minimumTrackTintColor={colors.green}
        maximumTrackTintColor={colors.dark.surface3}
        thumbTintColor={colors.green}
        style={styles.slider}
      />
      <Text style={styles.fpLabel}>⚡ {fp.toLocaleString()} FP (balance: {fpBalance.toLocaleString()})</Text>
      <Button variant="primary" size="lg" onPress={handleSubmit} disabled={side === null || fp < 50} loading={loading}>
        Enter Forecast
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 16 },
  sideRow: { flexDirection: 'row', gap: 12 },
  sideBtn: { flex: 1, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  sideBtnYes: { backgroundColor: colors.dark.surface3, borderColor: 'rgba(0,212,106,0.4)' },
  sideBtnYesActive: { backgroundColor: colors.green, borderColor: colors.green },
  sideBtnNo: { backgroundColor: colors.dark.surface3, borderColor: 'rgba(255,107,0,0.4)' },
  sideBtnNoActive: { backgroundColor: colors.orange, borderColor: colors.orange },
  sideBtnText: { fontWeight: '700', fontSize: 14 },
  slider: { marginVertical: 4 },
  fpLabel: { color: colors.lemon, fontWeight: '700', fontSize: 13, textAlign: 'center' },
});
```

- [ ] **Step 13: Create `packages/ui/src/native/components/fp-economy/FPBadge.tsx`**

```tsx
import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { colors } from '../../../tokens';

export interface FPBadgeProps {
  amount: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

const fontSizes = { sm: 12, md: 14, lg: 18 };

export function FPBadge({ amount, size = 'md' }: FPBadgeProps) {
  return (
    <Text style={[styles.text, { fontSize: fontSizes[size] }]}>
      ⚡ {amount.toLocaleString()} FP
    </Text>
  );
}

const styles = StyleSheet.create({
  text: { color: colors.lemon, fontWeight: '700', fontVariant: ['tabular-nums'] },
});
```

- [ ] **Step 14: Create `packages/ui/src/native/components/fp-economy/StreakBanner.tsx`**

```tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../../tokens';

export interface StreakBannerProps {
  day: number;
  multiplier: number;
  dailyFp: number;
  onClaim?: () => void;
  claimed?: boolean;
  claimLoading?: boolean;
}

export function StreakBanner({ day, multiplier, dailyFp, onClaim, claimed }: StreakBannerProps) {
  const glowing = day >= 7;
  return (
    <View style={[styles.banner, glowing && styles.bannerGlow]}>
      <View style={styles.info}>
        <Text style={styles.day}>{glowing ? '🔥 ' : ''}Day {day} Streak</Text>
        <Text style={styles.detail}>{multiplier}× · <Text style={styles.fp}>⚡ {dailyFp.toLocaleString()} FP</Text></Text>
      </View>
      {onClaim && !claimed && (
        <TouchableOpacity onPress={onClaim} style={styles.claimBtn}>
          <Text style={styles.claimText}>Claim</Text>
        </TouchableOpacity>
      )}
      {claimed && <Text style={styles.claimed}>✓ Claimed</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { backgroundColor: colors.dark.surface2, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.dark.border, flexDirection: 'row', alignItems: 'center' },
  bannerGlow: { borderColor: 'rgba(255,230,0,0.4)', backgroundColor: 'rgba(255,230,0,0.06)' },
  info: { flex: 1 },
  day: { color: colors.lemon, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  detail: { color: colors.dark.textPrimary, fontWeight: '600', fontSize: 14 },
  fp: { color: colors.lemon },
  claimBtn: { backgroundColor: colors.lemon, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
  claimText: { color: '#0D0D0D', fontWeight: '700', fontSize: 14 },
  claimed: { color: colors.green, fontWeight: '600', fontSize: 14 },
});
```

- [ ] **Step 15: Create remaining native FP economy components**

Create `packages/ui/src/native/components/fp-economy/MissionCard.tsx`:
```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../../tokens';

export interface MissionCardProps {
  title: string;
  fpReward: number;
  progress: number;
  total: number;
  completed: boolean;
}

export function MissionCard({ title, fpReward, progress, total, completed }: MissionCardProps) {
  const pct = Math.min(100, Math.round((progress / total) * 100));
  return (
    <View style={[styles.card, completed && styles.cardDone]}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={2}>{title}</Text>
        <Text style={styles.reward}>+{fpReward.toLocaleString()} FP</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%` as any }]} />
      </View>
      <Text style={styles.progress}>{progress}/{total}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.dark.surface2, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: colors.dark.border },
  cardDone: { borderColor: 'rgba(0,212,106,0.3)' },
  header: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginBottom: 8 },
  title: { flex: 1, color: colors.dark.textPrimary, fontSize: 13, fontWeight: '500' },
  reward: { color: colors.lemon, fontSize: 12, fontWeight: '700', fontVariant: ['tabular-nums'] },
  track: { height: 4, backgroundColor: colors.dark.surface3, borderRadius: 2, overflow: 'hidden', marginBottom: 4 },
  fill: { height: '100%', backgroundColor: colors.green },
  progress: { color: colors.dark.textSecondary, fontSize: 11 },
});
```

Create `packages/ui/src/native/components/fp-economy/BadgeDisplay.tsx`:
```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../../tokens';

export interface BadgeDisplayProps {
  name: string;
  icon: string;
  fpReward: number;
  unlocked: boolean;
}

export function BadgeDisplay({ name, icon, fpReward, unlocked }: BadgeDisplayProps) {
  return (
    <View style={[styles.card, !unlocked && styles.locked]}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.name} numberOfLines={2}>{name}</Text>
      <Text style={styles.fp}>⚡ {fpReward.toLocaleString()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.dark.surface2, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: 'rgba(0,212,106,0.2)', alignItems: 'center', gap: 4 },
  locked: { opacity: 0.4, borderColor: colors.dark.border },
  icon: { fontSize: 28 },
  name: { color: colors.dark.textPrimary, fontSize: 11, fontWeight: '600', textAlign: 'center' },
  fp: { color: colors.lemon, fontSize: 11, fontWeight: '700' },
});
```

Create `packages/ui/src/native/components/fp-economy/XPProgressBar.tsx`:
```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../../tokens';

export type XpLevel = 'rookie' | 'analyst' | 'expert' | 'master' | 'legend';

const levelLabels: Record<XpLevel, string> = { rookie: 'Rookie', analyst: 'Analyst', expert: 'Expert', master: 'Master', legend: 'Legend' };

export interface XPProgressBarProps {
  level: XpLevel;
  xp: number;
  nextLevelXp: number;
}

export function XPProgressBar({ level, xp, nextLevelXp }: XPProgressBarProps) {
  const pct = level === 'legend' ? 100 : Math.min(100, Math.round((xp / nextLevelXp) * 100));
  return (
    <View>
      <View style={styles.header}>
        <Text style={styles.level}>{levelLabels[level]}</Text>
        <Text style={styles.xp}>{xp.toLocaleString()} XP</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%` as any }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  level: { color: colors.orange, fontWeight: '600', fontSize: 13 },
  xp: { color: colors.dark.textSecondary, fontSize: 12 },
  track: { height: 6, backgroundColor: colors.dark.surface3, borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: colors.orange },
});
```

Create `packages/ui/src/native/components/fp-economy/RewardCard.tsx`:
```tsx
import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { colors } from '../../../tokens';
import { Button } from '../atoms/Button';

export interface RewardCardProps {
  name: string;
  category: string;
  fpCost: number;
  imageUrl: string | null;
  onRedeem: () => void;
  redeemLoading?: boolean;
  canAfford?: boolean;
}

export function RewardCard({ name, category, fpCost, imageUrl, onRedeem, redeemLoading, canAfford = true }: RewardCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.imageBox}>
        {imageUrl ? <Image source={{ uri: imageUrl }} style={styles.image} /> : <Text style={styles.placeholder}>🎁</Text>}
      </View>
      <View style={styles.body}>
        <Text style={styles.category}>{category.toUpperCase()}</Text>
        <Text style={styles.name} numberOfLines={2}>{name}</Text>
        <View style={styles.footer}>
          <Text style={styles.fp}>⚡ {fpCost.toLocaleString()} FP</Text>
          <Button variant="primary" size="sm" onPress={onRedeem} loading={redeemLoading} disabled={!canAfford}>Redeem</Button>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.dark.surface2, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: colors.dark.border },
  imageBox: { height: 100, backgroundColor: colors.dark.surface3, alignItems: 'center', justifyContent: 'center' },
  image: { width: '100%', height: '100%' },
  placeholder: { fontSize: 32 },
  body: { padding: 12 },
  category: { color: colors.dark.textSecondary, fontSize: 9, fontWeight: '700', letterSpacing: 1, marginBottom: 2 },
  name: { color: colors.dark.textPrimary, fontSize: 13, fontWeight: '600', marginBottom: 8 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fp: { color: colors.lemon, fontWeight: '700', fontSize: 13 },
});
```

Create `packages/ui/src/native/components/fp-economy/WalletSummary.tsx`:
```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../../tokens';

export interface WalletSummaryProps {
  earnedFp: number;
  expiresAt: Date | null;
}

export function WalletSummary({ earnedFp, expiresAt }: WalletSummaryProps) {
  const daysLeft = expiresAt ? Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / 86400_000)) : null;
  return (
    <View style={styles.card}>
      <Text style={styles.label}>Redeemable FP Balance</Text>
      <Text style={styles.balance}>⚡ {earnedFp.toLocaleString()}</Text>
      {daysLeft != null && <Text style={[styles.expiry, daysLeft < 14 && styles.expiryUrgent]}>Expires in {daysLeft} days</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.dark.surface2, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: 'rgba(255,230,0,0.2)' },
  label: { color: colors.dark.textSecondary, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  balance: { color: colors.lemon, fontWeight: '700', fontSize: 32 },
  expiry: { color: colors.dark.textSecondary, fontSize: 12, marginTop: 8 },
  expiryUrgent: { color: colors.orange },
});
```

Create `packages/ui/src/native/components/fp-economy/SubscriptionBadge.tsx`:
```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../../tokens';

export type SubscriptionTier = 'free' | 'pro' | 'elite';

const config: Record<SubscriptionTier, { label: string; bg: string; text: string }> = {
  free:  { label: 'Free',  bg: colors.dark.surface3,          text: colors.dark.textSecondary },
  pro:   { label: 'Pro',   bg: 'rgba(0,212,106,0.15)',         text: colors.green },
  elite: { label: 'Elite', bg: 'rgba(255,230,0,0.15)',         text: colors.lemon },
};

export function SubscriptionBadge({ tier }: { tier: SubscriptionTier }) {
  const c = config[tier];
  return (
    <View style={[styles.chip, { backgroundColor: c.bg }]}>
      <Text style={[styles.text, { color: c.text }]}>{c.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: { borderRadius: 99, paddingHorizontal: 10, paddingVertical: 3 },
  text: { fontSize: 12, fontWeight: '700' },
});
```

- [ ] **Step 16: Create native review components**

Create `packages/ui/src/native/components/reviews/VerifiedBadge.tsx`:
```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../../tokens';

export type ReviewBadge = 'none' | 'verified' | 'community_trusted';

export function VerifiedBadge({ type }: { type: ReviewBadge }) {
  if (type === 'none') return null;
  const isTrusted = type === 'community_trusted';
  return (
    <View style={[styles.chip, { backgroundColor: isTrusted ? 'rgba(255,230,0,0.15)' : 'rgba(0,212,106,0.15)' }]}>
      <Text style={[styles.text, { color: isTrusted ? colors.lemon : colors.green }]}>
        {isTrusted ? '★ Community Trusted' : '✓ Verified'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: { borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2 },
  text: { fontSize: 11, fontWeight: '700' },
});
```

Create `packages/ui/src/native/components/reviews/ReviewCard.tsx`:
```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
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
}

export function ReviewCard({ reviewerName, reviewerAvatar, rating, title, body, badge, helpfulVotes, totalVotes, createdAt }: ReviewCardProps) {
  const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
  return (
    <View style={[styles.card, badge === 'none' && styles.dimmed]}>
      <View style={styles.header}>
        <Avatar name={reviewerName} src={reviewerAvatar} size="sm" />
        <View style={styles.meta}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{reviewerName}</Text>
            <VerifiedBadge type={badge} />
          </View>
          <View style={styles.ratingRow}>
            <Text style={styles.stars}>{stars}</Text>
            <Text style={styles.date}>{createdAt.toLocaleDateString()}</Text>
          </View>
        </View>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      <Text style={styles.votes}>{helpfulVotes} of {totalVotes} found helpful</Text>
      <Text style={styles.ftc}>Reviewer earned VenlaxIQ ForecastPoints for this review.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.dark.surface2, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.dark.border },
  dimmed: { opacity: 0.7 },
  header: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  meta: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 2 },
  name: { color: colors.dark.textPrimary, fontSize: 14, fontWeight: '600' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stars: { color: colors.lemon, fontSize: 13 },
  date: { color: colors.dark.textSecondary, fontSize: 11 },
  title: { color: colors.dark.textPrimary, fontSize: 14, fontWeight: '600', marginBottom: 4 },
  body: { color: colors.dark.textSecondary, fontSize: 13, marginBottom: 8 },
  votes: { color: colors.dark.textSecondary, fontSize: 12, marginBottom: 8 },
  ftc: { color: colors.dark.textSecondary, fontSize: 10, borderTopWidth: 1, borderTopColor: colors.dark.border, paddingTop: 8 },
});
```

Create `packages/ui/src/native/components/reviews/HelpfulVoteRow.tsx`:
```tsx
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
      <TouchableOpacity onPress={() => onVote(true)} disabled={voteLoading} style={styles.btn}>
        <Text style={styles.btnText}>👍</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => onVote(false)} disabled={voteLoading} style={styles.btn}>
        <Text style={styles.btnText}>👎</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  count: { color: colors.dark.textSecondary, fontSize: 12, flex: 1 },
  btn: { padding: 4 },
  btnText: { fontSize: 18 },
});
```

Create `packages/ui/src/native/components/reviews/TrustSummary.tsx`:
```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../../tokens';

export interface TrustSummaryProps {
  verifiedCount: number;
  totalCount: number;
  averageRating: number;
}

export function TrustSummary({ verifiedCount, totalCount, averageRating }: TrustSummaryProps) {
  return (
    <View style={styles.card}>
      <View style={styles.section}>
        <Text style={styles.rating}>{averageRating.toFixed(1)}</Text>
        <Text style={styles.sub}>{totalCount} reviews</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.section}>
        <Text style={styles.verified}>{verifiedCount} Verified</Text>
        <Text style={styles.sub}>{totalCount - verifiedCount} unverified</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.dark.surface2, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.dark.border, flexDirection: 'row', gap: 16, alignItems: 'center' },
  section: { flex: 1 },
  rating: { color: colors.dark.textPrimary, fontWeight: '700', fontSize: 28 },
  verified: { color: colors.green, fontWeight: '600', fontSize: 15 },
  sub: { color: colors.dark.textSecondary, fontSize: 12 },
  divider: { width: 1, height: 40, backgroundColor: colors.dark.border },
});
```

- [ ] **Step 17: Create native social components**

Create `packages/ui/src/native/components/social/LeaderboardRow.tsx`:
```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../../tokens';
import { Avatar } from '../atoms/Avatar';

export interface LeaderboardRowProps {
  rank: number;
  username: string;
  accuracy: number;
  fpEarned: number;
  avatarUrl: string | null;
  isCurrentUser: boolean;
}

export function LeaderboardRow({ rank, username, accuracy, fpEarned, avatarUrl, isCurrentUser }: LeaderboardRowProps) {
  return (
    <View style={[styles.row, isCurrentUser && styles.rowHighlight]}>
      <Text style={styles.rank}>#{rank}</Text>
      <Avatar name={username} src={avatarUrl} size="sm" />
      <Text style={[styles.name, isCurrentUser && styles.nameHighlight]} numberOfLines={1}>{username}</Text>
      <View style={styles.stats}>
        <Text style={[styles.accuracy, accuracy >= 70 ? styles.accuracyGreen : styles.accuracyOrange]}>{accuracy}%</Text>
        <Text style={styles.fp}>⚡ {fpEarned.toLocaleString()}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.dark.border },
  rowHighlight: { backgroundColor: 'rgba(0,212,106,0.05)', borderRadius: 12, paddingHorizontal: 8 },
  rank: { color: colors.dark.textSecondary, fontWeight: '700', fontSize: 13, width: 28 },
  name: { flex: 1, color: colors.dark.textPrimary, fontSize: 14, fontWeight: '500' },
  nameHighlight: { color: colors.green },
  stats: { alignItems: 'flex-end' },
  accuracy: { fontWeight: '700', fontSize: 14 },
  accuracyGreen: { color: colors.green },
  accuracyOrange: { color: colors.orange },
  fp: { color: colors.dark.textSecondary, fontSize: 11 },
});
```

Create `packages/ui/src/native/components/social/ProfileHeader.tsx`:
```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../../tokens';
import { Avatar } from '../atoms/Avatar';
import { SubscriptionBadge, SubscriptionTier } from '../fp-economy/SubscriptionBadge';
import { FollowButton } from './FollowButton';
import { XpLevel } from '../fp-economy/XPProgressBar';

export interface ProfileHeaderProps {
  username: string;
  avatarUrl: string | null;
  tier: SubscriptionTier;
  xpLevel: XpLevel;
  accuracy: number;
  isOwnProfile: boolean;
  isFollowing: boolean;
  followerCount: number;
  followingCount?: number;
  onFollow: () => void;
  followLoading?: boolean;
}

const levelLabels: Record<XpLevel, string> = { rookie: 'Rookie', analyst: 'Analyst', expert: 'Expert', master: 'Master', legend: 'Legend' };

export function ProfileHeader({ username, avatarUrl, tier, xpLevel, accuracy, isOwnProfile, isFollowing, followerCount, followingCount, onFollow, followLoading }: ProfileHeaderProps) {
  const accuracyColor = accuracy >= 70 ? colors.green : colors.orange;
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Avatar name={username} src={avatarUrl} size="lg" />
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.username} numberOfLines={1}>{username}</Text>
            <SubscriptionBadge tier={tier} />
          </View>
          <Text style={styles.level}>{levelLabels[xpLevel]}</Text>
          <Text style={[styles.accuracy, { color: accuracyColor }]}>{accuracy}% accuracy</Text>
          <View style={styles.followRow}>
            <Text style={styles.stat}><Text style={styles.statNum}>{followerCount}</Text> followers</Text>
            {followingCount != null && <Text style={styles.stat}><Text style={styles.statNum}>{followingCount}</Text> following</Text>}
          </View>
        </View>
        {!isOwnProfile && <FollowButton isFollowing={isFollowing} onFollow={onFollow} loading={followLoading} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.dark.surface2, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.dark.border },
  header: { flexDirection: 'row', gap: 16, alignItems: 'flex-start' },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 },
  username: { color: colors.dark.textPrimary, fontWeight: '700', fontSize: 18, flexShrink: 1 },
  level: { color: colors.orange, fontWeight: '600', fontSize: 13, marginBottom: 2 },
  accuracy: { fontWeight: '700', fontSize: 14, marginBottom: 8 },
  followRow: { flexDirection: 'row', gap: 16 },
  stat: { color: colors.dark.textSecondary, fontSize: 13 },
  statNum: { color: colors.dark.textPrimary, fontWeight: '700' },
});
```

Create `packages/ui/src/native/components/social/AccuracyGauge.tsx`:
```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../../tokens';

export interface AccuracyGaugeProps {
  accuracy: number;
  forecastCount: number;
}

export function AccuracyGauge({ accuracy, forecastCount }: AccuracyGaugeProps) {
  const color = accuracy >= 70 ? colors.green : colors.orange;
  return (
    <View style={styles.card}>
      <Text style={styles.label}>Accuracy Score</Text>
      <Text style={[styles.value, { color }]}>{accuracy}%</Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${accuracy}%` as any, backgroundColor: color }]} />
      </View>
      <Text style={styles.count}>{forecastCount} forecasts</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.dark.surface2, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.dark.border },
  label: { color: colors.dark.textSecondary, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  value: { fontWeight: '700', fontSize: 36, marginBottom: 8 },
  track: { height: 6, backgroundColor: colors.dark.surface3, borderRadius: 3, overflow: 'hidden', marginBottom: 4 },
  fill: { height: '100%', borderRadius: 3 },
  count: { color: colors.dark.textSecondary, fontSize: 12 },
});
```

Create `packages/ui/src/native/components/social/FollowButton.tsx`:
```tsx
import React from 'react';
import { Button } from '../atoms/Button';

export interface FollowButtonProps {
  isFollowing: boolean;
  onFollow: () => void;
  loading?: boolean;
}

export function FollowButton({ isFollowing, onFollow, loading }: FollowButtonProps) {
  return (
    <Button variant={isFollowing ? 'secondary' : 'primary'} size="sm" onPress={onFollow} loading={loading}>
      {isFollowing ? 'Following' : 'Follow'}
    </Button>
  );
}
```

- [ ] **Step 18: Create native layout components**

Create `packages/ui/src/native/components/layout/PageContainer.tsx`:
```tsx
import React from 'react';
import { ScrollView, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../../tokens';

export interface PageContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  scrollable?: boolean;
}

export function PageContainer({ children, style, scrollable = true }: PageContainerProps) {
  if (scrollable) {
    return (
      <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, style]}>
        {children}
      </ScrollView>
    );
  }
  return null;
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.dark.surface },
  content: { padding: 16, paddingBottom: 96 },
});
```

Create `packages/ui/src/native/components/layout/EmptyState.tsx`:
```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../../tokens';
import { Button } from '../atoms/Button';

export interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  ctaLabel?: string;
  onCta?: () => void;
}

export function EmptyState({ icon, title, description, ctaLabel, onCta }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {ctaLabel && onCta && <Button variant="primary" size="md" onPress={onCta}>{ctaLabel}</Button>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', paddingVertical: 64, paddingHorizontal: 32 },
  icon: { fontSize: 48, marginBottom: 16 },
  title: { color: colors.dark.textPrimary, fontWeight: '600', fontSize: 18, marginBottom: 8, textAlign: 'center' },
  description: { color: colors.dark.textSecondary, fontSize: 14, textAlign: 'center', marginBottom: 16 },
});
```

Create `packages/ui/src/native/components/layout/TopBar.tsx`:
```tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../../tokens';
import { Avatar } from '../atoms/Avatar';
import { FPBadge } from '../fp-economy/FPBadge';

export interface TopBarProps {
  username?: string;
  avatarUrl?: string | null;
  fpBalance?: number;
  unreadCount?: number;
  onNotifications?: () => void;
  onProfile?: () => void;
}

export function TopBar({ username, avatarUrl, fpBalance, unreadCount = 0, onNotifications, onProfile }: TopBarProps) {
  return (
    <View style={styles.bar}>
      <Text style={styles.logo}>VenlaxIQ</Text>
      <View style={styles.right}>
        {fpBalance != null && <FPBadge amount={fpBalance} size="sm" />}
        {onNotifications && (
          <TouchableOpacity onPress={onNotifications} style={styles.iconBtn}>
            <Text style={styles.bell}>🔔</Text>
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
        {username && (
          <TouchableOpacity onPress={onProfile}>
            <Avatar name={username} src={avatarUrl} size="sm" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { height: 56, backgroundColor: colors.dark.surface, borderBottomWidth: 1, borderBottomColor: colors.dark.border, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 12 },
  logo: { fontWeight: '800', fontSize: 18, color: colors.dark.textPrimary, flex: 1 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBtn: { position: 'relative' },
  bell: { fontSize: 20 },
  badge: { position: 'absolute', top: -4, right: -4, backgroundColor: colors.orange, borderRadius: 99, width: 16, height: 16, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#0D0D0D', fontSize: 9, fontWeight: '700' },
});
```

Create `packages/ui/src/native/components/layout/BottomTabBar.tsx`:
```tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../../tokens';

export interface TabItem {
  label: string;
  icon: string;
  href: string;
  active?: boolean;
}

export interface BottomTabBarProps {
  items: TabItem[];
  onNavigate: (href: string) => void;
}

export function BottomTabBar({ items, onNavigate }: BottomTabBarProps) {
  return (
    <View style={styles.bar}>
      {items.map((item) => (
        <TouchableOpacity key={item.href} onPress={() => onNavigate(item.href)} style={styles.tab}>
          <Text style={styles.icon}>{item.icon}</Text>
          <Text style={[styles.label, item.active && styles.labelActive]}>{item.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { height: 64, backgroundColor: colors.dark.surface2, borderTopWidth: 1, borderTopColor: colors.dark.border, flexDirection: 'row' },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  icon: { fontSize: 22 },
  label: { fontSize: 10, fontWeight: '600', color: colors.dark.textSecondary },
  labelActive: { color: colors.green },
});
```

- [ ] **Step 19: Create `packages/ui/src/native/index.ts`**

```ts
// Tokens + theme
export { colors, typography, spacing, radius } from '../tokens';
export type { Theme } from '../tokens';
export { ThemeProvider, useTheme } from '../theme';

// Atoms
export { Button } from './components/atoms/Button';
export type { ButtonProps, ButtonVariant, ButtonSize } from './components/atoms/Button';
export { Input } from './components/atoms/Input';
export type { InputProps } from './components/atoms/Input';
export { Avatar } from './components/atoms/Avatar';
export type { AvatarProps } from './components/atoms/Avatar';
export { Badge } from './components/atoms/Badge';
export type { BadgeProps, BadgeVariant } from './components/atoms/Badge';
export { Spinner } from './components/atoms/Spinner';
export type { SpinnerProps } from './components/atoms/Spinner';

// Forecast
export { ProbabilityBar } from './components/forecast/ProbabilityBar';
export type { ProbabilityBarProps } from './components/forecast/ProbabilityBar';
export { MarketStatusChip } from './components/forecast/MarketStatusChip';
export type { MarketStatusChipProps, MarketStatus } from './components/forecast/MarketStatusChip';
export { CategoryPill } from './components/forecast/CategoryPill';
export type { CategoryPillProps, MarketCategory } from './components/forecast/CategoryPill';
export { MarketCard } from './components/forecast/MarketCard';
export type { MarketCardProps } from './components/forecast/MarketCard';
export { InsightCard } from './components/forecast/InsightCard';
export type { InsightCardProps, InsightSignal } from './components/forecast/InsightCard';
export { SettlementBanner } from './components/forecast/SettlementBanner';
export type { SettlementBannerProps } from './components/forecast/SettlementBanner';
export { ForecastEntryWidget } from './components/forecast/ForecastEntryWidget';
export type { ForecastEntryWidgetProps } from './components/forecast/ForecastEntryWidget';

// FP Economy
export { FPBadge } from './components/fp-economy/FPBadge';
export type { FPBadgeProps } from './components/fp-economy/FPBadge';
export { StreakBanner } from './components/fp-economy/StreakBanner';
export type { StreakBannerProps } from './components/fp-economy/StreakBanner';
export { MissionCard } from './components/fp-economy/MissionCard';
export type { MissionCardProps } from './components/fp-economy/MissionCard';
export { BadgeDisplay } from './components/fp-economy/BadgeDisplay';
export type { BadgeDisplayProps } from './components/fp-economy/BadgeDisplay';
export { XPProgressBar } from './components/fp-economy/XPProgressBar';
export type { XPProgressBarProps, XpLevel } from './components/fp-economy/XPProgressBar';
export { RewardCard } from './components/fp-economy/RewardCard';
export type { RewardCardProps } from './components/fp-economy/RewardCard';
export { WalletSummary } from './components/fp-economy/WalletSummary';
export type { WalletSummaryProps } from './components/fp-economy/WalletSummary';
export { SubscriptionBadge } from './components/fp-economy/SubscriptionBadge';
export type { SubscriptionTier } from './components/fp-economy/SubscriptionBadge';

// Reviews
export { VerifiedBadge } from './components/reviews/VerifiedBadge';
export type { ReviewBadge } from './components/reviews/VerifiedBadge';
export { ReviewCard } from './components/reviews/ReviewCard';
export type { ReviewCardProps } from './components/reviews/ReviewCard';
export { HelpfulVoteRow } from './components/reviews/HelpfulVoteRow';
export type { HelpfulVoteRowProps } from './components/reviews/HelpfulVoteRow';
export { TrustSummary } from './components/reviews/TrustSummary';
export type { TrustSummaryProps } from './components/reviews/TrustSummary';

// Social
export { LeaderboardRow } from './components/social/LeaderboardRow';
export type { LeaderboardRowProps } from './components/social/LeaderboardRow';
export { ProfileHeader } from './components/social/ProfileHeader';
export type { ProfileHeaderProps } from './components/social/ProfileHeader';
export { AccuracyGauge } from './components/social/AccuracyGauge';
export type { AccuracyGaugeProps } from './components/social/AccuracyGauge';
export { FollowButton } from './components/social/FollowButton';
export type { FollowButtonProps } from './components/social/FollowButton';

// Layout
export { PageContainer } from './components/layout/PageContainer';
export type { PageContainerProps } from './components/layout/PageContainer';
export { EmptyState } from './components/layout/EmptyState';
export type { EmptyStateProps } from './components/layout/EmptyState';
export { TopBar } from './components/layout/TopBar';
export type { TopBarProps } from './components/layout/TopBar';
export { BottomTabBar } from './components/layout/BottomTabBar';
export type { BottomTabBarProps, TabItem } from './components/layout/BottomTabBar';
```

- [ ] **Step 20: Run full test suite to confirm all tests pass**

```bash
pnpm --filter @venlaxiq/ui test
```

Expected output:
```
✓ packages/ui/tests/atoms.test.tsx (7 tests)
✓ packages/ui/tests/forecast.test.tsx (8 tests)
✓ packages/ui/tests/fp-economy.test.tsx (8 tests)
✓ packages/ui/tests/reviews.test.tsx (4 tests)
✓ packages/ui/tests/social.test.tsx (5 tests)
✓ packages/ui/tests/layout.test.tsx (3 tests)
Test Files  6 passed (6)
Tests      35 passed (35)
```

- [ ] **Step 21: Commit**

```bash
git add packages/ui/src/native packages/ui/src/index.ts
git commit -m "feat(ui): add React Native native component variants + complete library index"
```
