import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ChatWidget from '../components/ChatWidget';

// Mock Clerk useAuth
vi.mock('@clerk/clerk-react', () => ({
  useAuth: () => ({
    getToken: vi.fn().mockResolvedValue('mock_token_123'),
    isSignedIn: true,
  }),
}));

// Mock useUserRole
vi.mock('../hooks/useUserRole', () => ({
  useUserRole: () => ({
    isAdmin: false,
  }),
}));

describe('ChatWidget AI Assistant Icon & Attention Animation', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.useFakeTimers();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the custom EcoAiIcon and initial entrance animation class on page load', () => {
    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <ChatWidget />
      </QueryClientProvider>
    );

    const button = screen.getByRole('button', { name: /ask eco ai assistant/i });
    expect(button).toBeInTheDocument();

    // Verify initial entrance animation class is attached
    expect(button.className).toContain('ai-btn-entrance');

    // Verify pulse ring element is present on initial load
    const pulseRing = container.querySelector('.ai-ring-pulse');
    expect(pulseRing).toBeInTheDocument();

    // Verify SVG icon with bot face is rendered inside button
    const svgIcon = button.querySelector('svg');
    expect(svgIcon).toBeInTheDocument();
    expect(svgIcon?.getAttribute('viewBox')).toBe('0 0 64 64');
  });

  it('stops pulse animation immediately when chat widget is opened by the user', () => {
    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <ChatWidget />
      </QueryClientProvider>
    );

    // Prior to click: pulse ring exists
    expect(container.querySelector('.ai-ring-pulse')).toBeInTheDocument();

    const button = screen.getByRole('button', { name: /ask eco ai assistant/i });
    fireEvent.click(button);

    // Chat drawer opens
    expect(screen.getByText(/ecomarket ai assistant/i)).toBeInTheDocument();

    // Floating button & pulse ring are gone
    expect(container.querySelector('.ai-ring-pulse')).not.toBeInTheDocument();
  });

  it('stops pulsing automatically after 25s safety timeout', () => {
    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <ChatWidget />
      </QueryClientProvider>
    );

    expect(container.querySelector('.ai-ring-pulse')).toBeInTheDocument();

    // Fast-forward past 25s
    act(() => {
      vi.advanceTimersByTime(26000);
    });

    expect(container.querySelector('.ai-ring-pulse')).not.toBeInTheDocument();
  });

  it('removes initial entrance animation class once entrance animation completes', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ChatWidget />
      </QueryClientProvider>
    );

    const button = screen.getByRole('button', { name: /ask eco ai assistant/i });
    expect(button.className).toContain('ai-btn-entrance');

    // Fast forward past entrance animation duration (1000ms)
    act(() => {
      vi.advanceTimersByTime(1100);
    });

    expect(button.className).not.toContain('ai-btn-entrance');
  });
});
