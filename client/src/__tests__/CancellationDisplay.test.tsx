import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import OrderDetail from '../pages/OrderDetail';
import MyOrders from '../pages/MyOrders';
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

describe('Customer-Facing Order Cancellation Display', () => {
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

  describe('OrderDetail Component (/order/:id)', () => {
    it('shows clear cancellation notice with reason and date instead of the tracking stepper when cancelled', async () => {
      const mockCancelledOrder = {
        id: 'ord_cancelled_test_12345',
        status: 'CANCELLED',
        paymentStatus: 'SUCCESS',
        total: 850,
        createdAt: '2026-09-07T08:00:00.000Z',
        updatedAt: '2026-09-07T09:30:00.000Z',
        cancellationReason: 'Item is temporarily out of stock in warehouse',
        items: [
          {
            id: 'item_1',
            productId: 'prod_1',
            quantity: 2,
            price: 425,
            itemType: 'PRODUCT',
            product: {
              title: 'Handmade Bamboo Basket',
              images: ['https://example.com/basket.jpg'],
              category: 'Artisan Crafts',
            },
          },
        ],
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          success: true,
          data: mockCancelledOrder,
        },
      });

      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/order/ord_cancelled_test_12345']}>
            <Routes>
              <Route path="/order/:id" element={<OrderDetail />} />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      );

      // 1. Heading "This order was cancelled" is present
      const noticeHeading = await screen.findByText(/this order was cancelled/i);
      expect(noticeHeading).toBeInTheDocument();

      // 2. Cancellation reason is prominently displayed
      expect(
        screen.getByText(/"Item is temporarily out of stock in warehouse"/i)
      ).toBeInTheDocument();

      // 3. Cancellation date is rendered
      expect(screen.getByText(/cancelled on/i)).toBeInTheDocument();

      // 4. Refund information is shown
      expect(
        screen.getByText(/full refund has been automatically initiated/i)
      ).toBeInTheDocument();

      // 5. The tracking stepper (e.g. "Shipment Delivery Progress") is NOT rendered
      expect(
        screen.queryByText(/shipment delivery progress/i)
      ).not.toBeInTheDocument();
      expect(screen.queryByText(/order confirmed/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/out for delivery/i)).not.toBeInTheDocument();
    });

    it('renders normal tracking stepper for active/in-progress orders', async () => {
      const mockActiveOrder = {
        id: 'ord_active_test_67890',
        status: 'SHIPPED',
        paymentStatus: 'SUCCESS',
        total: 420,
        createdAt: '2026-09-07T08:00:00.000Z',
        updatedAt: '2026-09-07T08:30:00.000Z',
        cancellationReason: null,
        items: [
          {
            id: 'item_2',
            productId: 'prod_2',
            quantity: 1,
            price: 420,
            itemType: 'PRODUCT',
            product: {
              title: 'Eco Terracotta Cup Set',
              images: ['https://example.com/cup.jpg'],
              category: 'Eco Living',
            },
          },
        ],
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          success: true,
          data: mockActiveOrder,
        },
      });

      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/order/ord_active_test_67890']}>
            <Routes>
              <Route path="/order/:id" element={<OrderDetail />} />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      );

      // Tracking stepper should be visible
      const stepperTitle = await screen.findByText(/shipment delivery progress/i);
      expect(stepperTitle).toBeInTheDocument();

      // Cancellation notice should NOT be present
      expect(
        screen.queryByText(/this order was cancelled/i)
      ).not.toBeInTheDocument();
    });
  });

  describe('MyOrders Component (/my-world/orders)', () => {
    it('renders visually distinct badge and cancellation notice for cancelled orders in the order history list', async () => {
      const mockOrdersList = [
        {
          id: 'ord_cancelled_list_1',
          status: 'CANCELLED',
          paymentStatus: 'SUCCESS',
          total: 650,
          createdAt: '2026-09-07T07:00:00.000Z',
          updatedAt: '2026-09-07T07:45:00.000Z',
          cancellationReason: 'Customer requested immediate cancellation',
          items: [
            {
              id: 'item_1',
              productId: 'prod_1',
              quantity: 1,
              price: 650,
              product: {
                title: 'Organic Honey 500g',
                images: ['https://example.com/honey.jpg'],
              },
            },
          ],
        },
        {
          id: 'ord_active_list_2',
          status: 'CONFIRMED',
          paymentStatus: 'SUCCESS',
          total: 1200,
          createdAt: '2026-09-07T08:00:00.000Z',
          updatedAt: '2026-09-07T08:05:00.000Z',
          cancellationReason: null,
          items: [
            {
              id: 'item_2',
              productId: 'prod_2',
              quantity: 1,
              price: 1200,
              product: {
                title: 'Cold-Pressed Coconut Oil 1L',
                images: ['https://example.com/oil.jpg'],
              },
            },
          ],
        },
      ];

      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          success: true,
          data: mockOrdersList,
          pagination: {
            total: 2,
            page: 1,
            limit: 8,
            totalPages: 1,
          },
        },
      });

      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/my-world/orders']}>
            <Routes>
              <Route path="/my-world/orders" element={<MyOrders />} />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      );

      // 1. CANCELLED badge is displayed
      const cancelledBadge = await screen.findByText('CANCELLED');
      expect(cancelledBadge).toBeInTheDocument();
      expect(cancelledBadge.className).toContain('bg-error-light');

      // 2. Cancellation banner with reason is visible on the cancelled card
      expect(screen.getByText(/order cancelled:/i)).toBeInTheDocument();
      expect(
        screen.getByText(/"Customer requested immediate cancellation"/i)
      ).toBeInTheDocument();

      // 3. Confirm active order has CONFIRMED badge and NO cancellation banner
      expect(screen.getByText('CONFIRMED')).toBeInTheDocument();
    });
  });
});
