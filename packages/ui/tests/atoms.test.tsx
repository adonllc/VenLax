import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../src/components/atoms/Button';
import { Input } from '../src/components/atoms/Input';
import { Select } from '../src/components/atoms/Select';
import { Avatar } from '../src/components/atoms/Avatar';
import { Badge } from '../src/components/atoms/Badge';
import { Spinner } from '../src/components/atoms/Spinner';
import { Toast } from '../src/components/atoms/Toast';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
  it('shows loading spinner', () => {
    render(<Button loading>Submit</Button>);
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
  it('renders label', () => {
    render(<Input label="Email" />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });
  it('shows error message', () => {
    render(<Input label="Password" error="Required" />);
    expect(screen.getByText('Required')).toBeInTheDocument();
  });
});

describe('Select', () => {
  it('renders options', () => {
    render(<Select options={[{ value: 'a', label: 'Apple' }, { value: 'b', label: 'Banana' }]} />);
    expect(screen.getByText('Apple')).toBeInTheDocument();
    expect(screen.getByText('Banana')).toBeInTheDocument();
  });
});

describe('Avatar', () => {
  it('renders initials when no src', () => {
    render(<Avatar name="Jane Smith" />);
    expect(screen.getByText('JS')).toBeInTheDocument();
  });
  it('renders image when src provided', () => {
    render(<Avatar name="Jane Smith" src="https://example.com/avatar.jpg" />);
    expect(screen.getByRole('img')).toBeInTheDocument();
  });
});

describe('Badge', () => {
  it('renders label', () => {
    render(<Badge label="Open" variant="green" />);
    expect(screen.getByText('Open')).toBeInTheDocument();
  });
});

describe('Spinner', () => {
  it('renders with role status', () => {
    render(<Spinner />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});

describe('Toast', () => {
  it('renders message', () => {
    render(<Toast message="Saved!" variant="success" />);
    expect(screen.getByText('Saved!')).toBeInTheDocument();
  });
  it('calls onClose when close button clicked', async () => {
    const fn = vi.fn();
    render(<Toast message="Oops" onClose={fn} />);
    await userEvent.click(screen.getByRole('button'));
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
