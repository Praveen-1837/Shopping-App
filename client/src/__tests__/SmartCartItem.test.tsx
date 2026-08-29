import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SmartCartItem from '../components/SmartCartItem';

describe('SmartCartItem Component (Phase 4 & 10)', () => {
  const mockItem = {
    productId: 'prod_123',
    quantity: 2,
    price: 450,
    title: 'Cold-Pressed Virgin Coconut Oil',
    image: 'https://example.com/oil.jpg',
    type: 'PRODUCT' as const,
  };

  it('renders product title and formatted price correctly', () => {
    render(
      <SmartCartItem
        item={mockItem}
        onUpdateQuantity={vi.fn()}
        onRemove={vi.fn()}
      />
    );

    expect(screen.getByText('Cold-Pressed Virgin Coconut Oil')).toBeInTheDocument();
    expect(screen.getByText('₹450.00')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('calls onUpdateQuantity when increment button is clicked', () => {
    const handleUpdate = vi.fn();
    render(
      <SmartCartItem
        item={mockItem}
        onUpdateQuantity={handleUpdate}
        onRemove={vi.fn()}
      />
    );

    const incrementButton = screen.getByTitle('Increase quantity');
    fireEvent.click(incrementButton);

    expect(handleUpdate).toHaveBeenCalledWith('prod_123', undefined, 3);
  });

  it('calls onRemove when remove button is clicked', () => {
    const handleRemove = vi.fn();
    render(
      <SmartCartItem
        item={mockItem}
        onUpdateQuantity={vi.fn()}
        onRemove={handleRemove}
      />
    );

    const removeButton = screen.getByTitle('Remove item');
    fireEvent.click(removeButton);

    expect(handleRemove).toHaveBeenCalledWith('prod_123', undefined);
  });
});
