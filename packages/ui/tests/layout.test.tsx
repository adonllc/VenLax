import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PageContainer } from '../src/components/layout/PageContainer';
import { EmptyState } from '../src/components/layout/EmptyState';
import { NotificationBell } from '../src/components/layout/NotificationBell';
import { TopBar } from '../src/components/layout/TopBar';
import { Sidebar } from '../src/components/layout/Sidebar';
import { BottomTabBar } from '../src/components/layout/BottomTabBar';

describe('PageContainer', () => {
  it('renders children', () => {
    render(<PageContainer><p>Content</p></PageContainer>);
    expect(screen.getByText('Content')).toBeInTheDocument();
  });
  it('applies narrow class when narrow prop is set', () => {
    const { container } = render(<PageContainer narrow><p>Narrow</p></PageContainer>);
    expect(container.querySelector('main')).toBeInTheDocument();
  });
});

describe('EmptyState', () => {
  it('renders icon and message', () => {
    render(<EmptyState icon="📭" title="No markets yet" description="Come back later." />);
    expect(screen.getByText('No markets yet')).toBeInTheDocument();
    expect(screen.getByText('Come back later.')).toBeInTheDocument();
  });
  it('renders CTA button when provided', () => {
    render(<EmptyState icon="📭" title="Empty" description="Nothing here." ctaLabel="Get Started" onCta={() => {}} />);
    expect(screen.getByRole('button', { name: 'Get Started' })).toBeInTheDocument();
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
  it('shows 9+ for counts over 9', () => {
    render(<NotificationBell unreadCount={15} onClick={() => {}} />);
    expect(screen.getByText('9+')).toBeInTheDocument();
  });
});

describe('TopBar', () => {
  it('renders brand name', () => {
    render(<TopBar />);
    expect(screen.getByText('VenlaxIQ')).toBeInTheDocument();
  });
  it('renders FP balance when provided', () => {
    render(<TopBar fpBalance={12000} />);
    expect(screen.getByText(/12,000/)).toBeInTheDocument();
  });
});

describe('Sidebar', () => {
  it('renders all nav items', () => {
    const items = [
      { label: 'Dashboard', href: '/dashboard', icon: '📊' },
      { label: 'Markets', href: '/markets', icon: '📈' },
    ];
    render(<Sidebar items={items} onNavigate={() => {}} />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Markets')).toBeInTheDocument();
  });
  it('calls onNavigate when item clicked', async () => {
    const fn = vi.fn();
    const items = [{ label: 'Home', href: '/home', icon: '🏠' }];
    render(<Sidebar items={items} onNavigate={fn} />);
    await userEvent.click(screen.getByText('Home'));
    expect(fn).toHaveBeenCalledWith('/home');
  });
});

describe('BottomTabBar', () => {
  it('renders all tab items', () => {
    const items = [
      { label: 'Home', href: '/', icon: '🏠' },
      { label: 'Forecast', href: '/forecast', icon: '📈' },
    ];
    render(<BottomTabBar items={items} onNavigate={() => {}} />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Forecast')).toBeInTheDocument();
  });
  it('calls onNavigate when tab clicked', async () => {
    const fn = vi.fn();
    const items = [{ label: 'Profile', href: '/profile', icon: '👤' }];
    render(<BottomTabBar items={items} onNavigate={fn} />);
    await userEvent.click(screen.getByText('Profile'));
    expect(fn).toHaveBeenCalledWith('/profile');
  });
});
