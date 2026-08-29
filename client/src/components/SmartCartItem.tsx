import React from 'react';
import { Minus, Plus, Trash2, BookOpen, Package } from 'lucide-react';

export interface CartItemProps {
  item: {
    productId?: string;
    courseId?: string;
    quantity: number;
    price: number;
    title: string;
    image?: string;
    type?: 'PRODUCT' | 'COURSE';
  };
  onUpdateQuantity: (productId?: string, courseId?: string, newQty?: number) => void;
  onRemove: (productId?: string, courseId?: string) => void;
}

export default function SmartCartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  const isCourse = item.type === 'COURSE' || !!item.courseId;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-background-card rounded-2xl border border-text-muted/15 shadow-soft gap-4 hover:border-primary/30 transition-all">
      <div className="flex items-center space-x-4">
        {/* Item Thumbnail / Icon */}
        <div className="w-16 h-16 rounded-xl bg-background-muted overflow-hidden shrink-0 flex items-center justify-center border border-text-muted/10">
          {item.image ? (
            <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
          ) : isCourse ? (
            <BookOpen className="w-7 h-7 text-secondary" />
          ) : (
            <Package className="w-7 h-7 text-primary" />
          )}
        </div>

        {/* Item Title & Type Badge */}
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                isCourse ? 'bg-secondary-light text-secondary' : 'bg-primary-light text-primary'
              }`}
            >
              {isCourse ? 'Masterclass' : 'Eco Product'}
            </span>
          </div>

          <h4 className="font-heading font-bold text-sm text-text-primary line-clamp-1">
            {item.title}
          </h4>

          <span className="text-xs font-semibold text-primary block">
            ₹{Number(item.price).toFixed(2)}
          </span>
        </div>
      </div>

      {/* Controls: Quantity Stepper & Remove Action */}
      <div className="flex items-center justify-between sm:justify-end space-x-6 border-t sm:border-t-0 pt-3 sm:pt-0 border-text-muted/10">
        {!isCourse && (
          <div className="flex items-center space-x-2 bg-background-muted rounded-xl p-1 border border-text-muted/15">
            <button
              onClick={() =>
                item.quantity > 1 &&
                onUpdateQuantity(item.productId, item.courseId, item.quantity - 1)
              }
              disabled={item.quantity <= 1}
              className="p-1 rounded-lg text-text-secondary hover:text-text-primary hover:bg-background-card transition-colors disabled:opacity-30 cursor-pointer"
              title="Decrease quantity"
              aria-label="Decrease quantity"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>

            <span className="text-xs font-bold w-6 text-center text-text-primary">
              {item.quantity}
            </span>

            <button
              onClick={() =>
                onUpdateQuantity(item.productId, item.courseId, item.quantity + 1)
              }
              className="p-1 rounded-lg text-text-secondary hover:text-text-primary hover:bg-background-card transition-colors cursor-pointer"
              title="Increase quantity"
              aria-label="Increase quantity"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="flex items-center space-x-4">
          <span className="text-sm font-extrabold font-heading text-text-primary">
            ₹{(Number(item.price) * (item.quantity || 1)).toFixed(2)}
          </span>

          <button
            onClick={() => onRemove(item.productId, item.courseId)}
            className="p-2 rounded-xl text-text-muted hover:text-error hover:bg-error-light transition-colors cursor-pointer"
            title="Remove item"
            aria-label="Remove item"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
