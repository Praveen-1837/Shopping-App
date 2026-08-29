import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import apiClient from '../api/axios';
import { Cart as CartType } from '../types/cart';
import { MapPin, ArrowLeft, ArrowRight, RefreshCw, Truck, BookmarkCheck } from 'lucide-react';

interface SavedAddress {
  id: string;
  label: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

export default function Checkout() {
  const navigate = useNavigate();
  const { getToken } = useAuth();

  // Address State
  const [recipientName, setRecipientName] = useState<string>('Praveen Shinde');
  const [streetAddress, setStreetAddress] = useState<string>('12 Blooming Meadows, MG Road');
  const [city, setCity] = useState<string>('Mumbai');
  const [state, setState] = useState<string>('Maharashtra');
  const [postalCode, setPostalCode] = useState<string>('400001');
  const [phone, setPhone] = useState<string>('+919876543210');
  const [selectedAddrId, setSelectedAddrId] = useState<string>('');

  // Fetch cart details
  const { data, isLoading } = useQuery<{ success: boolean; data: CartType }>({
    queryKey: ['cart'],
    queryFn: async () => {
      const token = await getToken();
      const res = await apiClient.get<{ success: boolean; data: CartType }>('/cart', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
  });

  // Fetch user saved addresses
  const { data: savedAddrsData } = useQuery<{ success: boolean; data: SavedAddress[] }>({
    queryKey: ['saved-addresses'],
    queryFn: async () => {
      try {
        const token = await getToken();
        const res = await apiClient.get<{ success: boolean; data: SavedAddress[] }>('/addresses', {
          headers: { Authorization: `Bearer ${token}` },
        });
        return res.data;
      } catch (e) {
        return { success: true, data: [] };
      }
    },
  });

  const savedAddresses = savedAddrsData?.data || [];
  const cartItems = data?.data?.items || [];
  const subtotal = cartItems.reduce((acc, item) => acc + Number(item.price) * item.quantity, 0);
  const shipping = cartItems.length > 0 && subtotal < 1000 ? 70 : 0;
  const total = subtotal + shipping;

  const handleSelectSavedAddress = (id: string) => {
    setSelectedAddrId(id);
    const selected = savedAddresses.find((a) => a.id === id);
    if (selected) {
      setStreetAddress(`${selected.line1}${selected.line2 ? `, ${selected.line2}` : ''}`);
      setCity(selected.city);
      setState(selected.state);
      setPostalCode(selected.pincode);
    }
  };

  const handleSubmitAddress = (e: React.FormEvent) => {
    e.preventDefault();
    const addressObj = {
      recipientName,
      streetAddress,
      city,
      state,
      postalCode,
      phone,
    };
    sessionStorage.setItem('deliveryAddress', JSON.stringify(addressObj));
    navigate('/checkout/payment');
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3 text-text-secondary">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm font-medium">Preparing checkout details...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-text-muted/15 pb-6">
        <div>
          <div className="flex items-center space-x-2 text-primary font-semibold text-xs uppercase tracking-wider mb-1">
            <Truck className="w-4 h-4" />
            <span>Step 1 of 2</span>
          </div>
          <h1 className="text-3xl font-bold font-heading text-primary">Delivery Address</h1>
          <p className="text-sm text-text-secondary">
            Enter or pick a saved shipping address for your physical marketplace items
          </p>
        </div>

        <Link
          to="/cart"
          className="flex items-center space-x-1 text-xs text-text-secondary hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Cart</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Address Form */}
        <form onSubmit={handleSubmitAddress} className="lg:col-span-2 space-y-6">
          <div className="bg-background-card rounded-2xl p-8 border border-text-muted/15 shadow-soft space-y-4">
            <div className="flex items-center justify-between border-b border-text-muted/10 pb-3">
              <div className="flex items-center space-x-2 text-primary font-bold font-heading">
                <MapPin className="w-5 h-5 text-primary" />
                <h2 className="text-lg">Shipping Recipient Information</h2>
              </div>
            </div>

            {/* Pick Saved Address Selector */}
            {savedAddresses.length > 0 && (
              <div className="p-4 bg-primary-light/40 border border-primary/20 rounded-xl space-y-2">
                <label className="block text-xs font-bold text-primary uppercase tracking-wider flex items-center space-x-1.5">
                  <BookmarkCheck className="w-4 h-4" />
                  <span>Pick a Saved Address from Profile</span>
                </label>
                <select
                  value={selectedAddrId}
                  onChange={(e) => handleSelectSavedAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-background-card border border-primary/30 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
                >
                  <option value="">-- Choose a Saved Address --</option>
                  {savedAddresses.map((addr) => (
                    <option key={addr.id} value={addr.id}>
                      [{addr.label}] {addr.line1}, {addr.city} ({addr.pincode}) {addr.isDefault ? '★ Default' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-text-primary">
                  Full Recipient Name <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-background-muted/60 border border-text-muted/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-text-primary">
                  Contact Phone Number <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2.5 bg-background-muted/60 border border-text-muted/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-text-primary">
                Street Address <span className="text-error">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="House No, Apartment, Street name"
                value={streetAddress}
                onChange={(e) => setStreetAddress(e.target.value)}
                className="w-full px-4 py-2.5 bg-background-muted/60 border border-text-muted/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-text-primary">
                  City <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-4 py-2.5 bg-background-muted/60 border border-text-muted/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-text-primary">
                  State / Region <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-4 py-2.5 bg-background-muted/60 border border-text-muted/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-text-primary">
                  Postal Code (PIN) <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="w-full px-4 py-2.5 bg-background-muted/60 border border-text-muted/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-primary text-white hover:bg-primary-hover font-semibold text-sm rounded-xl transition-all shadow-soft flex items-center justify-center space-x-2 cursor-pointer"
          >
            <span>Proceed to Payment Method</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Mini Order Summary */}
        <div className="space-y-4">
          <div className="bg-background-card rounded-2xl p-6 border border-text-muted/15 shadow-soft space-y-4">
            <h2 className="text-base font-bold font-heading text-primary border-b border-text-muted/10 pb-3">
              Order Items ({cartItems.length})
            </h2>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {cartItems.map((item) => (
                <div key={item.productId} className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-3">
                    <img src={item.image} alt={item.title} className="w-10 h-10 rounded-lg object-cover border" />
                    <div>
                      <p className="font-semibold text-text-primary line-clamp-1">{item.title}</p>
                      <span className="text-text-muted">Qty: {item.quantity}</span>
                    </div>
                  </div>
                  <span className="font-bold text-primary font-heading">
                    ₹{(Number(item.price) * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-text-muted/10 pt-3 space-y-1.5 text-xs text-text-secondary">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-text-primary">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="font-semibold text-text-primary">{shipping === 0 ? 'FREE' : `₹${shipping.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-text-primary pt-2 border-t">
                <span>Total</span>
                <span className="text-primary font-heading text-lg">₹{total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
