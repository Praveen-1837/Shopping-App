export interface CartItem {
  productId?: string;
  courseId?: string;
  quantity: number;
  type?: 'PRODUCT' | 'COURSE';
  itemType?: 'PRODUCT' | 'COURSE';
  title: string;
  price: number;
  image: string;
  category?: string;
  sellerName?: string;
}

export interface Cart {
  id: string;
  items: CartItem[];
  updatedAt: string;
}

export interface DeliveryAddress {
  recipientName: string;
  streetAddress: string;
  city: string;
  state: string;
  postalCode: string;
  phone: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId?: string;
  courseId?: string;
  quantity: number;
  price: number;
  itemType: string;
  product?: {
    title: string;
    images: string[];
    category: string;
  };
  course?: {
    title: string;
    previewVideo?: string;
    category?: string;
  };
}

export interface Order {
  id: string;
  userId: string;
  status: 'PENDING' | 'CONFIRMED' | 'PACKED' | 'SHIPPED' | 'IN_TRANSIT' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';
  paymentStatus: 'PENDING' | 'SUCCESS' | 'FAILED';
  paymentId?: string;
  paymentMethod?: string;
  total: number;
  deliveryAddress?: DeliveryAddress;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}
