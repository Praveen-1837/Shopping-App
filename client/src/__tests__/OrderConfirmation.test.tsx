import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import OrderConfirmation from '../pages/OrderConfirmation';
import apiClient from '../api/axios';

// Mock Clerk useAuth
vi.mock('@clerk/clerk-react', () => ({
  useAuth: () => ({
    getToken: vi.fn().mockResolvedValue('mock_token_123'),
    isSignedIn: true,
    isLoaded: true,
  }),
}));

// Mock axios apiClient
vi.mock('../api/axios', () => ({
  default: {
    get: vi.fn(),
  },
}));

describe('OrderConfirmation Component', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
  });

  const mockOrder = {
    id: 'ord_confirm_987654321',
    status: 'CONFIRMED',
    paymentStatus: 'SUCCESS',
    paymentId: 'TXN_TEST_MOCK_123',
    paymentMethod: 'Card Payment',
    total: 1250,
    createdAt: new Date('2026-09-06T10:00:00Z').toISOString(),
    deliveryAddress: {
      recipientName: 'Praveen Shinde',
      streetAddress: '12 Blooming Meadows, MG Road',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400001',
      phone: '+919876543210',
    },
    items: [
      {
        id: 'item_1',
        productId: 'prod_1',
        quantity: 1,
        price: 450,
        itemType: 'PRODUCT',
        product: {
          title: 'Cold-Pressed Virgin Coconut Oil',
          images: ['https://example.com/oil.jpg'],
        },
      },
      {
        id: 'item_2',
        courseId: 'course_1',
        quantity: 1,
        price: 800,
        itemType: 'COURSE',
        course: {
          title: 'Permaculture Design Masterclass',
          previewVideo: 'https://example.com/video.mp4',
        },
      },
    ],
  };

  it('renders order confirmation page with animated checkmark and order details', async () => {
    (apiClient.get as any).mockResolvedValueOnce({
      data: {
        success: true,
        data: mockOrder,
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/order/ord_confirm_987654321/confirmation']}>
          <Routes>
            <Route path="/order/:id/confirmation" element={<OrderConfirmation />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Initial loading indicator
    expect(screen.getByText(/Confirming Your Order/i)).toBeInTheDocument();

    // After resolution
    expect(await screen.findByText('Order Confirmed!')).toBeInTheDocument();
    expect(screen.getByText('ord_confirm_987654321')).toBeInTheDocument();

    // Check checkmark SVG is present
    const checkmark = screen.getByRole('img', { name: /Order successful checkmark/i });
    expect(checkmark).toBeInTheDocument();

    // Digital course activation banner
    expect(screen.getByText('Digital Masterclass Activated')).toBeInTheDocument();
    expect(screen.getByText('Instant Access')).toBeInTheDocument();

    // Items list
    expect(screen.getByText('Cold-Pressed Virgin Coconut Oil')).toBeInTheDocument();
    expect(screen.getByText('Permaculture Design Masterclass')).toBeInTheDocument();

    // Action buttons
    const trackOrderBtn = screen.getByRole('link', { name: /Track Your Order/i });
    expect(trackOrderBtn).toHaveAttribute('href', '/order/ord_confirm_987654321');

    const continueShoppingBtn = screen.getByRole('link', { name: /Continue Shopping/i });
    expect(continueShoppingBtn).toHaveAttribute('href', '/');

    const accessLearningBtn = screen.getByRole('link', { name: /Access My Learning/i });
    expect(accessLearningBtn).toHaveAttribute('href', '/my-world/courses');
  });

  it('renders error state cleanly when order retrieval fails', async () => {
    (apiClient.get as any).mockRejectedValueOnce(new Error('Network error'));

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/order/invalid_order_id/confirmation']}>
          <Routes>
            <Route path="/order/:id/confirmation" element={<OrderConfirmation />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(await screen.findByText('Order Not Found')).toBeInTheDocument();
    expect(screen.getByText(/We were unable to locate your order details/i)).toBeInTheDocument();
  });

  it('verifies SVG checkmark elements have animation classes for circular draw and check stroke', async () => {
    (apiClient.get as any).mockResolvedValueOnce({
      data: {
        success: true,
        data: mockOrder,
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/order/ord_confirm_987654321/confirmation']}>
          <Routes>
            <Route path="/order/:id/confirmation" element={<OrderConfirmation />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    const svgImg = await screen.findByRole('img', { name: /Order successful checkmark/i });
    expect(svgImg).toBeInTheDocument();

    const circle = svgImg.querySelector('circle');
    expect(circle).toHaveClass('checkmark-circle');

    const path = svgImg.querySelector('path');
    expect(path).toHaveClass('checkmark-stem');
  });
});
