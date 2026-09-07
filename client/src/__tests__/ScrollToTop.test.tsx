import { render, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route, Link } from 'react-router-dom';
import ScrollToTop from '../components/ScrollToTop';

describe('ScrollToTop Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.scrollTo = vi.fn();
  });

  it('resets scroll position to (0, 0) on initial render and route changes', async () => {
    const { getByText } = render(
      <MemoryRouter initialEntries={['/my-account']}>
        <ScrollToTop />
        <nav>
          <Link to="/farmer-centre">Farmer Centre</Link>
          <Link to="/shop">Shop</Link>
        </nav>
        <Routes>
          <Route path="/my-account" element={<div>My Account Page</div>} />
          <Route path="/farmer-centre" element={<div>Farmer Centre Page</div>} />
          <Route path="/shop" element={<div>Shop Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    // Initial render resets scroll
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0);

    // Simulate navigation: /my-account -> /farmer-centre
    await act(async () => {
      fireEvent.click(getByText('Farmer Centre'));
    });
    expect(window.scrollTo).toHaveBeenCalledTimes(2);
    expect(window.scrollTo).toHaveBeenLastCalledWith(0, 0);

    // Simulate navigation: /farmer-centre -> /shop
    await act(async () => {
      fireEvent.click(getByText('Shop'));
    });
    expect(window.scrollTo).toHaveBeenCalledTimes(3);
    expect(window.scrollTo).toHaveBeenLastCalledWith(0, 0);
  });

  it('scrolls to element when anchor hash is present in navigation', () => {
    const mockScrollIntoView = vi.fn();
    const reviewsDiv = document.createElement('div');
    reviewsDiv.id = 'reviews';
    reviewsDiv.scrollIntoView = mockScrollIntoView;
    document.body.appendChild(reviewsDiv);

    render(
      <MemoryRouter initialEntries={['/product/123#reviews']}>
        <ScrollToTop />
        <Routes>
          <Route path="/product/:id" element={<div>Product Detail</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
    document.body.removeChild(reviewsDiv);
  });
});
