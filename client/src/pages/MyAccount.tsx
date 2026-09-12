import React, { useState, useEffect } from 'react';
import { useAuth, useUser, useClerk } from '@clerk/clerk-react';
import { formatRoleLabel } from "../utils/formatters";
import { Link } from 'react-router-dom';
import apiClient from '../api/axios';
import Wishlist from './Wishlist';
import {
  User as UserIcon,
  ShoppingBag,
  MapPin,
  CreditCard,
  Shield,
  Sliders,
  HelpCircle,
  Check,
  Edit2,
  Trash2,
  Plus,
  Download,
  ExternalLink,
  Lock,
  Sun,
  Moon,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Mail,
  Phone,
  Send,
  FileText,
  BookOpen,
  Store,
  Sparkles,
  ArrowRight,
  UserCheck,
  Heart,
} from 'lucide-react';

interface SyncedUser {
  id: string;
  clerkId: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  username?: string;
  alternatePhone?: string;
  createdAt: string;
}

interface AddressItem {
  id: string;
  label: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

interface OrderItem {
  id: string;
  createdAt: string;
  status: string;
  paymentStatus: string;
  total: number | string;
  items: Array<{
    id: string;
    quantity: number;
    price: number | string;
    product?: { title: string; images?: string[] };
    course?: { title: string; thumbnailUrl?: string };
  }>;
}

interface SupportTicket {
  id: string;
  subject: string;
  message: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | string;
  createdAt: string;
}

type TabType = 'identity' | 'orders' | 'addresses' | 'payments' | 'security' | 'wishlist' | 'support';

const AVAILABLE_ROLES = ['CUSTOMER', 'SELLER', 'FARMER', 'ARTISAN', 'EDUCATOR', 'DELIVERY_PARTNER', 'ADMIN'];

export default function MyAccount() {
  const { getToken } = useAuth();
  const { user: clerkUser } = useUser();
  const { openUserProfile } = useClerk();

  const [activeTab, setActiveTab] = useState<TabType>('identity');

  // Local Sync User Profile state
  const [dbUser, setDbUser] = useState<SyncedUser | null>(null);
  const [loadingUser, setLoadingUser] = useState<boolean>(true);
  const [userError, setUserError] = useState<string | null>(null);

  // Identity Form State
  const [name, setName] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [usernameEdited, setUsernameEdited] = useState<boolean>(false);
  const [phone, setPhone] = useState<string>('');
  const [alternatePhone, setAlternatePhone] = useState<string>('');
  const [savingProfile, setSavingProfile] = useState<boolean>(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Username Availability State
  const [availStatus, setAvailStatus] = useState<{
    loading: boolean;
    available?: boolean;
    message?: string;
    suggestion?: string;
  } | null>(null);

  // Address Book State
  const [addresses, setAddresses] = useState<AddressItem[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState<boolean>(false);
  const [showAddrModal, setShowAddrModal] = useState<boolean>(false);
  const [editingAddrId, setEditingAddrId] = useState<string | null>(null);
  const [addrForm, setAddrForm] = useState({
    label: 'Home',
    line1: '',
    line2: '',
    city: '',
    state: '',
    pincode: '',
    isDefault: false,
  });
  const [savingAddr, setSavingAddr] = useState<boolean>(false);
  const [pincodeLoading, setPincodeLoading] = useState<boolean>(false);
  const [addrError, setAddrError] = useState<string | null>(null);

  // Orders State
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loadingOrders, setLoadingOrders] = useState<boolean>(false);
  const [downloadingInvId, setDownloadingInvId] = useState<string | null>(null);

  // Support Tickets State
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState<boolean>(false);
  const [ticketSubject, setTicketSubject] = useState<string>('');
  const [ticketMessage, setTicketMessage] = useState<string>('');
  const [submittingTicket, setSubmittingTicket] = useState<boolean>(false);
  const [ticketMsg, setTicketMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Theme Mode State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return document.documentElement.classList.contains('dark') || localStorage.getItem('theme') === 'dark';
  });

  // Dev Role Switcher State
  const [updatingRole, setUpdatingRole] = useState<boolean>(false);
  const [devRoleMsg, setDevRoleMsg] = useState<string | null>(null);

  const slugifyName = (str: string) => {
    return str
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s_]/g, '')
      .replace(/\s+/g, '_');
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!usernameEdited || !username) {
      const suggested = slugifyName(val);
      setUsername(suggested);
    }
  };

  const handleUsernameInputChange = (val: string) => {
    setUsernameEdited(true);
    const cleaned = val.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setUsername(cleaned);
  };

  // Debounced Username Availability Check
  useEffect(() => {
    const trimmed = username.trim().toLowerCase();
    if (!trimmed) {
      setAvailStatus(null);
      return;
    }

    setAvailStatus({ loading: true });
    const timer = setTimeout(async () => {
      try {
        const token = await getToken();
        const res = await apiClient.get<{
          success: boolean;
          available: boolean;
          username: string;
          suggestedAlternative?: string;
        }>(`/users/username-available?username=${encodeURIComponent(trimmed)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data.available) {
          setAvailStatus({ loading: false, available: true, message: 'Available' });
        } else {
          setAvailStatus({
            loading: false,
            available: false,
            message: 'Already taken',
            suggestion: res.data.suggestedAlternative,
          });
        }
      } catch (err) {
        setAvailStatus(null);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [username]);

  // Load User Profile
  const fetchProfile = async () => {
    setLoadingUser(true);
    setUserError(null);
    try {
      const token = await getToken();
      const res = await apiClient.get<{ success: boolean; data: SyncedUser }>('/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userData = res.data.data;
      setDbUser(userData);
      setName(userData.name || '');
      const fetchedUsername = userData.username || '';
      setUsername(fetchedUsername);
      if (fetchedUsername) {
        setUsernameEdited(true);
      }
      setPhone(userData.phone || '');
      setAlternatePhone(userData.alternatePhone || '');
    } catch (err: any) {
      setUserError(err.response?.data?.error?.message || err.message || 'Failed to fetch user profile');
    } finally {
      setLoadingUser(false);
    }
  };

  // Load Addresses
  const fetchAddresses = async () => {
    setLoadingAddresses(true);
    try {
      const token = await getToken();
      const res = await apiClient.get<{ success: boolean; data: AddressItem[] }>('/addresses', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAddresses(res.data.data || []);
    } catch (err: any) {
      console.error('Failed to load addresses:', err);
    } finally {
      setLoadingAddresses(false);
    }
  };

  // Load Orders
  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const token = await getToken();
      const res = await apiClient.get<{ success: boolean; data: OrderItem[] }>('/my-orders', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(res.data.data || []);
    } catch (err: any) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Load Support Tickets
  const fetchTickets = async () => {
    setLoadingTickets(true);
    try {
      const token = await getToken();
      const res = await apiClient.get<{ success: boolean; data: SupportTicket[] }>('/support/tickets', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTickets(res.data.data || []);
    } catch (err: any) {
      console.error('Failed to load support tickets:', err);
    } finally {
      setLoadingTickets(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (activeTab === 'addresses') fetchAddresses();
    if (activeTab === 'orders') fetchOrders();
    if (activeTab === 'support') fetchTickets();
  }, [activeTab]);

  // Handle Profile Update
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      const token = await getToken();
      const res = await apiClient.patch(
        '/users/profile',
        { name, username, phone, alternatePhone },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDbUser(res.data.data);
      setProfileMsg({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err: any) {
      setProfileMsg({
        type: 'error',
        text: err.response?.data?.error?.message || 'Failed to update profile',
      });
    } finally {
      setSavingProfile(false);
    }
  };

  // Pincode Auto-Fill
  const handlePincodeChange = async (val: string) => {
    setAddrForm((prev) => ({ ...prev, pincode: val }));
    if (val.trim().length === 6 && /^\d+$/.test(val.trim())) {
      setPincodeLoading(true);
      try {
        const response = await fetch(`https://api.postalpincode.in/pincode/${val.trim()}`);
        const data = await response.json();
        if (data && data[0] && data[0].Status === 'Success' && data[0].PostOffice?.length > 0) {
          const po = data[0].PostOffice[0];
          setAddrForm((prev) => ({
            ...prev,
            city: po.District || po.Block || prev.city,
            state: po.State || prev.state,
          }));
        }
      } catch (err) {
        console.error('Pincode lookup error:', err);
      } finally {
        setPincodeLoading(false);
      }
    }
  };

  // Address Actions
  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAddr(true);
    setAddrError(null);
    try {
      const token = await getToken();
      if (editingAddrId) {
        await apiClient.put(`/addresses/${editingAddrId}`, addrForm, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await apiClient.post('/addresses', addrForm, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      setShowAddrModal(false);
      setEditingAddrId(null);
      setAddrForm({ label: 'Home', line1: '', line2: '', city: '', state: '', pincode: '', isDefault: false });
      fetchAddresses();
    } catch (err: any) {
      setAddrError(err.response?.data?.error?.message || 'Failed to save address');
    } finally {
      setSavingAddr(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return;
    try {
      const token = await getToken();
      await apiClient.delete(`/addresses/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchAddresses();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to delete address');
    }
  };

  const handleSetDefaultAddress = async (id: string) => {
    try {
      const token = await getToken();
      await apiClient.patch(`/addresses/${id}/default`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchAddresses();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to set default address');
    }
  };

  // Download / Preview Invoice PDF
  const handleDownloadInvoice = async (orderId: string) => {
    setDownloadingInvId(orderId);
    const pdfWindow = window.open('', '_blank');
    try {
      const token = await getToken();
      const response = await apiClient.get(`/orders/${orderId}/invoice`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      if (pdfWindow) {
        pdfWindow.location.href = url;
      } else {
        window.open(url, '_blank');
      }
    } catch (err: any) {
      if (pdfWindow) pdfWindow.close();
      alert('Failed to preview invoice PDF.');
    } finally {
      setDownloadingInvId(null);
    }
  };

  // Support Ticket Submission
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingTicket(true);
    setTicketMsg(null);
    try {
      const token = await getToken();
      await apiClient.post(
        '/support/tickets',
        { subject: ticketSubject, message: ticketMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTicketSubject('');
      setTicketMessage('');
      setTicketMsg({ type: 'success', text: 'Support ticket submitted successfully!' });
      fetchTickets();
    } catch (err: any) {
      setTicketMsg({ type: 'error', text: err.response?.data?.error?.message || 'Failed to create support ticket' });
    } finally {
      setSubmittingTicket(false);
    }
  };

  // Dark Mode Toggle
  const toggleDarkMode = () => {
    const nextMode = !isDarkMode;
    setIsDarkMode(nextMode);
    if (nextMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  // Dev Role Switcher
  const handleDevRoleChange = async (newRole: string) => {
    setUpdatingRole(true);
    setDevRoleMsg(null);
    try {
      const token = await getToken();
      const response = await apiClient.patch(
        '/dev/role',
        { role: newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDbUser(response.data.data);
      setDevRoleMsg(`Role updated to ${newRole}`);
    } catch (err: any) {
      alert('Failed to change role');
    } finally {
      setUpdatingRole(false);
    }
  };

  const roleBadgeStyle = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-error-light text-error border-error/30';
      case 'EDUCATOR':
        return 'bg-accent-light text-accent border-accent/30';
      case 'SELLER':
      case 'FARMER':
      case 'ARTISAN':
        return 'bg-secondary-light text-secondary border-secondary/30';
      default:
        return 'bg-primary-light text-primary border-primary/30';
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Page Header & Header Card */}
      <div className="bg-background-card rounded-2xl p-6 sm:p-8 border border-text-muted/15 shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-5">
          <div className="relative group">
            {clerkUser?.imageUrl ? (
              <img
                src={clerkUser.imageUrl}
                alt={dbUser?.name || 'Profile'}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-primary/30 shadow-soft"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary-hover text-white flex items-center justify-center text-3xl font-bold font-heading shadow-soft">
                {dbUser?.name?.charAt(0) || 'U'}
              </div>
            )}
            <button
              onClick={() => openUserProfile && openUserProfile()}
              className="absolute -bottom-2 -right-2 p-1.5 bg-background-card border border-text-muted/20 rounded-lg text-text-secondary hover:text-primary transition-colors shadow-soft"
              title="Manage Avatar via Clerk"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1">
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl sm:text-3xl font-bold font-heading text-primary">{dbUser?.name || 'My Account'}</h1>
              <span className={`px-3 py-1 rounded-full text-xs font-bold font-mono border tracking-wider ${roleBadgeStyle(dbUser?.role)}`}>
                {formatRoleLabel(dbUser?.role || 'CUSTOMER')}
              </span>
            </div>
            <p className="text-sm text-text-secondary flex items-center space-x-2">
              <Mail className="w-4 h-4 text-text-muted" />
              <span>{clerkUser?.primaryEmailAddress?.emailAddress || dbUser?.email}</span>
              {dbUser?.username && <span className="text-primary font-medium">(@{dbUser.username})</span>}
            </p>
          </div>
        </div>

        {/* Header Action Shortcuts */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={fetchProfile}
            disabled={loadingUser}
            className="flex items-center space-x-2 px-4 py-2 bg-background-muted hover:bg-text-muted/10 text-text-primary text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingUser ? 'animate-spin' : ''}`} />
            <span>Sync Profile</span>
          </button>
          <Link
            to="/cart"
            className="flex items-center space-x-2 px-4 py-2 bg-primary text-white hover:bg-primary-hover text-xs font-semibold rounded-xl transition-colors shadow-soft"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Go to Cart</span>
          </Link>
        </div>
      </div>

      {/* Main Grid: Sidebar Tabs + Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-2">
          <div className="bg-background-card rounded-2xl p-3 border border-text-muted/15 shadow-soft space-y-1">
            {[
              { id: 'identity', label: 'Identity & Details', icon: UserIcon },
              { id: 'orders', label: 'Orders & Invoices', icon: ShoppingBag },
              { id: 'addresses', label: 'Saved Addresses', icon: MapPin },
              { id: 'payments', label: 'Payments & Security', icon: CreditCard },
              { id: 'security', label: 'Security & Password', icon: Shield },
              { id: 'wishlist', label: 'Wishlist', icon: Heart },
              { id: 'support', label: 'Support & Tickets', icon: HelpCircle },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-primary text-white font-semibold shadow-soft'
                      : 'text-text-secondary hover:bg-background-muted hover:text-text-primary'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-primary'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Quick Access Card for Role Dashboards */}
          <div className="bg-background-card rounded-2xl p-4 border border-text-muted/15 shadow-soft space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>Quick Portals</span>
            </h3>
            <div className="space-y-2">
              <Link
                to="/my-learning"
                className="flex items-center justify-between p-2.5 bg-background-muted/60 hover:bg-primary-light/50 rounded-xl text-xs font-semibold text-text-primary hover:text-primary transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <BookOpen className="w-4 h-4 text-accent" />
                  <span>My Learning Courses</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>

              {(dbUser?.role === 'SELLER' || dbUser?.role === 'FARMER' || dbUser?.role === 'ARTISAN') && (
                <Link
                  to="/seller-centre"
                  className="flex items-center justify-between p-2.5 bg-background-muted/60 hover:bg-secondary-light/50 rounded-xl text-xs font-semibold text-text-primary hover:text-secondary transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <Store className="w-4 h-4 text-secondary" />
                    <span>Seller Dashboard</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}

              {dbUser?.role === 'EDUCATOR' && (
                <Link
                  to="/educator-centre"
                  className="flex items-center justify-between p-2.5 bg-background-muted/60 hover:bg-accent-light/50 rounded-xl text-xs font-semibold text-text-primary hover:text-accent transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-accent" />
                    <span>Educator Dashboard</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}

              {dbUser?.role === 'ADMIN' && (
                <Link
                  to="/admin/dashboard"
                  className="flex items-center justify-between p-2.5 bg-background-muted/60 hover:bg-error-light/50 rounded-xl text-xs font-semibold text-text-primary hover:text-error transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-error" />
                    <span>Admin Control Suite</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          {/* TAB 1: IDENTITY & PERSONAL DETAILS */}
          {activeTab === 'identity' && (
            <div className="bg-background-card rounded-2xl p-6 sm:p-8 border border-text-muted/15 shadow-soft space-y-6">
              <div className="border-b border-text-muted/10 pb-4">
                <h2 className="text-xl font-bold font-heading text-primary">Identity & Personal Details</h2>
                <p className="text-xs text-text-secondary">Update your profile information and public details</p>
              </div>

              {profileMsg && (
                <div
                  className={`p-4 rounded-xl text-xs font-medium flex items-center space-x-2 border ${
                    profileMsg.type === 'success'
                      ? 'bg-success-light text-success border-success/30'
                      : 'bg-error-light text-error border-error/30'
                  }`}
                >
                  {profileMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  <span>{profileMsg.text}</span>
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-text-primary">Full Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      className="w-full px-4 py-2.5 bg-background-muted/60 border border-text-muted/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold text-text-primary">Username (Unique, optional)</label>
                      {availStatus && (
                        <div className="text-[11px] font-medium flex items-center space-x-1">
                          {availStatus.loading ? (
                            <span className="text-text-muted flex items-center space-x-1">
                              <RefreshCw className="w-3 h-3 animate-spin text-primary" />
                              <span>Checking...</span>
                            </span>
                          ) : availStatus.available ? (
                            <span className="text-success flex items-center space-x-1 font-semibold">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Available</span>
                            </span>
                          ) : (
                            <span className="text-error flex items-center space-x-1">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                              <span>Taken — try </span>
                              {availStatus.suggestion && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setUsername(availStatus.suggestion!);
                                    setUsernameEdited(true);
                                  }}
                                  className="underline font-bold text-primary hover:text-primary-hover font-mono cursor-pointer"
                                >
                                  @{availStatus.suggestion}
                                </button>
                              )}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs font-mono text-text-muted">@</span>
                      <input
                        type="text"
                        placeholder={name ? slugifyName(name) : 'john_doe'}
                        value={username}
                        onChange={(e) => handleUsernameInputChange(e.target.value)}
                        className="w-full pl-8 pr-4 py-2.5 bg-background-muted/60 border border-text-muted/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between min-h-[20px]">
                      <label className="text-xs font-semibold text-text-primary flex items-center space-x-1.5">
                        <span>Your Email</span>
                        <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 bg-success-light text-success text-[10px] font-bold rounded-full border border-success/30">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Verified</span>
                        </span>
                      </label>
                    </div>
                    <div className="relative flex items-center">
                      <input
                        type="email"
                        disabled
                        value={clerkUser?.primaryEmailAddress?.emailAddress || dbUser?.email || ''}
                        className="w-full pl-4 pr-10 py-2.5 bg-background-muted/40 border border-text-muted/15 rounded-xl text-sm text-text-secondary cursor-not-allowed font-mono truncate"
                      />
                      <button
                        type="button"
                        onClick={() => openUserProfile && openUserProfile()}
                        className="absolute right-2.5 p-1.5 text-text-muted hover:text-primary hover:bg-background-card border border-transparent hover:border-text-muted/20 rounded-lg transition-all cursor-pointer"
                        title="Change Email via Clerk"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center min-h-[20px]">
                      <label className="text-xs font-semibold text-text-primary">Phone Number</label>
                    </div>
                    <input
                      type="text"
                      placeholder="+91 9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-2.5 bg-background-muted/60 border border-text-muted/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center min-h-[20px]">
                      <label className="text-xs font-semibold text-text-primary">Alternate Phone</label>
                    </div>
                    <input
                      type="text"
                      placeholder="+91 9123456789"
                      value={alternatePhone}
                      onChange={(e) => setAlternatePhone(e.target.value)}
                      className="w-full px-4 py-2.5 bg-background-muted/60 border border-text-muted/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="px-6 py-2.5 bg-primary text-white hover:bg-primary-hover text-sm font-semibold rounded-xl transition-all shadow-soft flex items-center space-x-2 cursor-pointer disabled:opacity-50"
                  >
                    {savingProfile && <RefreshCw className="w-4 h-4 animate-spin" />}
                    <span>Save Profile Changes</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: ORDERS, TRANSACTIONS & ACTIVITY */}
          {activeTab === 'orders' && (
            <div className="bg-background-card rounded-2xl p-6 sm:p-8 border border-text-muted/15 shadow-soft space-y-6">
              <div className="flex items-center justify-between border-b border-text-muted/10 pb-4">
                <div>
                  <h2 className="text-xl font-bold font-heading text-primary">Orders & Tax Invoices</h2>
                  <p className="text-xs text-text-secondary">View order history and download official PDF tax invoices</p>
                </div>
                <button
                  onClick={fetchOrders}
                  className="p-2 bg-background-muted hover:bg-text-muted/10 text-text-primary rounded-xl transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingOrders ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {loadingOrders ? (
                <div className="py-12 text-center text-text-secondary space-y-2">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-primary" />
                  <p className="text-xs">Loading order history...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="py-12 text-center space-y-4">
                  <ShoppingBag className="w-12 h-12 mx-auto text-text-muted/40" />
                  <p className="text-sm font-semibold text-text-secondary">No orders placed yet</p>
                  <Link
                    to="/marketplace"
                    className="inline-block px-5 py-2.5 bg-primary text-white hover:bg-primary-hover text-xs font-semibold rounded-xl transition-all shadow-soft"
                  >
                    Explore Marketplace Products
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="p-5 bg-background-muted/40 border border-text-muted/15 rounded-2xl space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-text-muted/10 pb-3">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-sm font-bold text-primary">#{order.id.slice(0, 8)}</span>
                            <span className="text-xs text-text-muted">• {new Date(order.createdAt).toLocaleDateString()}</span>
                          </div>
                          <p className="text-xs text-text-secondary mt-0.5">
                            Status: <span className="font-semibold text-text-primary uppercase">{order.status}</span>
                          </p>
                        </div>

                        <div className="flex items-center space-x-3">
                          <span className="font-bold text-base font-heading text-primary">
                            ₹{Number(order.total).toFixed(2)}
                          </span>
                          <button
                            onClick={() => handleDownloadInvoice(order.id)}
                            disabled={downloadingInvId === order.id}
                            className="flex items-center space-x-1.5 px-3 py-1.5 bg-primary-light hover:bg-primary/20 text-primary text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                          >
                            {downloadingInvId === order.id ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Download className="w-3.5 h-3.5" />
                            )}
                            <span>Invoice</span>
                          </button>
                        </div>
                      </div>

                      {/* Items Preview */}
                      <div className="space-y-2">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between text-xs">
                            <span className="font-medium text-text-primary">
                              {item.product?.title || item.course?.title || 'Item'} (x{item.quantity})
                            </span>
                            <span className="text-text-secondary font-mono">₹{(Number(item.price) * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ADDRESSES & LOGISTICS */}
          {activeTab === 'addresses' && (
            <div className="bg-background-card rounded-2xl p-6 sm:p-8 border border-text-muted/15 shadow-soft space-y-6">
              <div className="flex items-center justify-between border-b border-text-muted/10 pb-4">
                <div>
                  <h2 className="text-xl font-bold font-heading text-primary">Address Book & Logistics</h2>
                  <p className="text-xs text-text-secondary">Manage saved delivery addresses with Indian pincode auto-lookup</p>
                </div>
                <button
                  onClick={() => {
                    setEditingAddrId(null);
                    setAddrForm({ label: 'Home', line1: '', line2: '', city: '', state: '', pincode: '', isDefault: false });
                    setShowAddrModal(true);
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-primary text-white hover:bg-primary-hover text-xs font-semibold rounded-xl transition-all shadow-soft cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Address</span>
                </button>
              </div>

              {loadingAddresses ? (
                <div className="py-12 text-center text-text-secondary space-y-2">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-primary" />
                  <p className="text-xs">Loading addresses...</p>
                </div>
              ) : addresses.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <MapPin className="w-12 h-12 mx-auto text-text-muted/40" />
                  <p className="text-sm font-semibold text-text-secondary">No addresses saved yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      className={`p-5 rounded-2xl border space-y-3 relative ${
                        addr.isDefault
                          ? 'bg-primary-light/30 border-primary/40 shadow-soft'
                          : 'bg-background-muted/40 border-text-muted/15'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm font-heading text-primary flex items-center space-x-2">
                          <MapPin className="w-4 h-4" />
                          <span>{addr.label}</span>
                        </span>
                        {addr.isDefault ? (
                          <span className="px-2.5 py-0.5 bg-primary text-white text-[10px] font-bold rounded-full uppercase tracking-wider">
                            Default
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSetDefaultAddress(addr.id)}
                            className="text-[11px] text-text-secondary hover:text-primary underline cursor-pointer"
                          >
                            Set Default
                          </button>
                        )}
                      </div>

                      <div className="text-xs text-text-secondary space-y-0.5">
                        <p className="font-medium text-text-primary">{addr.line1}</p>
                        {addr.line2 && <p>{addr.line2}</p>}
                        <p>
                          {addr.city}, {addr.state} - <span className="font-mono font-semibold">{addr.pincode}</span>
                        </p>
                      </div>

                      <div className="flex items-center justify-end space-x-2 pt-2 border-t border-text-muted/10">
                        <button
                          onClick={() => {
                            setEditingAddrId(addr.id);
                            setAddrForm({
                              label: addr.label,
                              line1: addr.line1,
                              line2: addr.line2 || '',
                              city: addr.city,
                              state: addr.state,
                              pincode: addr.pincode,
                              isDefault: addr.isDefault,
                            });
                            setShowAddrModal(true);
                          }}
                          className="p-1.5 hover:bg-primary/10 text-primary rounded-lg transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteAddress(addr.id)}
                          className="p-1.5 hover:bg-error/10 text-error rounded-lg transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Modal for Add / Edit Address */}
              {showAddrModal && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="bg-background-card rounded-2xl p-6 sm:p-8 max-w-md w-full border border-text-muted/20 shadow-2xl space-y-4">
                    <div className="flex items-center justify-between border-b border-text-muted/10 pb-3">
                      <h3 className="font-bold font-heading text-lg text-primary">
                        {editingAddrId ? 'Edit Address' : 'Add New Address'}
                      </h3>
                      <button
                        onClick={() => setShowAddrModal(false)}
                        className="text-text-muted hover:text-text-primary text-xl font-bold cursor-pointer"
                      >
                        ×
                      </button>
                    </div>

                    {addrError && <p className="text-xs text-error font-medium">{addrError}</p>}

                    <form onSubmit={handleSaveAddress} className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-text-primary mb-1">Address Label</label>
                        <select
                          value={addrForm.label}
                          onChange={(e) => setAddrForm((prev) => ({ ...prev, label: e.target.value }))}
                          className="w-full px-3 py-2 bg-background-muted/60 border border-text-muted/20 rounded-xl text-sm"
                        >
                          <option value="Home">Home</option>
                          <option value="Office">Office</option>
                          <option value="Farm">Farm</option>
                          <option value="Warehouse">Warehouse</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-text-primary mb-1">Street Address Line 1</label>
                        <input
                          type="text"
                          required
                          value={addrForm.line1}
                          onChange={(e) => setAddrForm((prev) => ({ ...prev, line1: e.target.value }))}
                          className="w-full px-3 py-2 bg-background-muted/60 border border-text-muted/20 rounded-xl text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-text-primary mb-1">Line 2 (Optional)</label>
                        <input
                          type="text"
                          value={addrForm.line2}
                          onChange={(e) => setAddrForm((prev) => ({ ...prev, line2: e.target.value }))}
                          className="w-full px-3 py-2 bg-background-muted/60 border border-text-muted/20 rounded-xl text-sm"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-xs font-semibold text-text-primary mb-1">
                            Pincode {pincodeLoading && <RefreshCw className="inline w-3 h-3 animate-spin text-primary" />}
                          </label>
                          <input
                            type="text"
                            required
                            maxLength={6}
                            placeholder="400001"
                            value={addrForm.pincode}
                            onChange={(e) => handlePincodeChange(e.target.value)}
                            className="w-full px-3 py-2 bg-background-muted/60 border border-text-muted/20 rounded-xl text-sm font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-text-primary mb-1">City</label>
                          <input
                            type="text"
                            required
                            value={addrForm.city}
                            onChange={(e) => setAddrForm((prev) => ({ ...prev, city: e.target.value }))}
                            className="w-full px-3 py-2 bg-background-muted/60 border border-text-muted/20 rounded-xl text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-text-primary mb-1">State</label>
                          <input
                            type="text"
                            required
                            value={addrForm.state}
                            onChange={(e) => setAddrForm((prev) => ({ ...prev, state: e.target.value }))}
                            className="w-full px-3 py-2 bg-background-muted/60 border border-text-muted/20 rounded-xl text-sm"
                          />
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 pt-1">
                        <input
                          type="checkbox"
                          id="isDefault"
                          checked={addrForm.isDefault}
                          onChange={(e) => setAddrForm((prev) => ({ ...prev, isDefault: e.target.checked }))}
                          className="rounded border-text-muted text-primary focus:ring-primary"
                        />
                        <label htmlFor="isDefault" className="text-xs text-text-primary">Set as default delivery address</label>
                      </div>

                      <div className="pt-3 flex justify-end space-x-2">
                        <button
                          type="button"
                          onClick={() => setShowAddrModal(false)}
                          className="px-4 py-2 bg-background-muted text-text-secondary hover:text-text-primary text-xs font-semibold rounded-xl"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={savingAddr}
                          className="px-5 py-2 bg-primary text-white hover:bg-primary-hover text-xs font-semibold rounded-xl shadow-soft"
                        >
                          {savingAddr ? 'Saving...' : 'Save Address'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: PAYMENTS & BILLING */}
          {activeTab === 'payments' && (
            <div className="bg-background-card rounded-2xl p-6 sm:p-8 border border-text-muted/15 shadow-soft space-y-6">
              <div className="border-b border-text-muted/10 pb-4">
                <h2 className="text-xl font-bold font-heading text-primary">Payments & Billing</h2>
                <p className="text-xs text-text-secondary">Security and checkout transaction parameters</p>
              </div>

              <div className="bg-primary-light/40 border border-primary/30 rounded-2xl p-6 space-y-3">
                <div className="flex items-center space-x-3 text-primary font-bold font-heading">
                  <CreditCard className="w-6 h-6 text-primary" />
                  <h3 className="text-base">Secure Gateway Processing</h3>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Payment methods are processed securely at checkout via our mock pass-through gateway. In accordance with zero-trust security architecture, credit cards, bank accounts, and wallet tokens are never saved or persisted on your account profile.
                </p>
              </div>
            </div>
          )}

          {/* TAB 5: SECURITY */}
          {activeTab === 'security' && (
            <div className="bg-background-card rounded-2xl p-6 sm:p-8 border border-text-muted/15 shadow-soft space-y-6">
              <div className="border-b border-text-muted/10 pb-4">
                <h2 className="text-xl font-bold font-heading text-primary">Account Security & Credentials</h2>
                <p className="text-xs text-text-secondary">Password updates, 2FA, and active session controls managed by Clerk Auth</p>
              </div>

              <div className="p-6 bg-background-muted/40 border border-text-muted/15 rounded-2xl space-y-4">
                <div className="flex items-center space-x-3 text-text-primary font-bold font-heading">
                  <Lock className="w-5 h-5 text-primary" />
                  <h3>Authentication & Access Controls</h3>
                </div>
                <p className="text-xs text-text-secondary">
                  Your password, two-factor authentication, and connected devices are secured via Clerk's encrypted identity provider.
                </p>
                <button
                  onClick={() => openUserProfile && openUserProfile()}
                  className="flex items-center space-x-2 px-5 py-2.5 bg-primary text-white hover:bg-primary-hover text-xs font-semibold rounded-xl shadow-soft cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open Account Security Panel</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 6: WISHLIST */}
          {activeTab === 'wishlist' && (
            <div className="bg-background-card rounded-2xl p-6 sm:p-8 border border-text-muted/15 shadow-soft">
              <Wishlist />
            </div>
          )}

          {/* TAB 7: SUPPORT & HELP */}
          {activeTab === 'support' && (
            <div className="bg-background-card rounded-2xl p-6 sm:p-8 border border-text-muted/15 shadow-soft space-y-6">
              <div className="border-b border-text-muted/10 pb-4">
                <h2 className="text-xl font-bold font-heading text-primary">Support & Customer Help</h2>
                <p className="text-xs text-text-secondary">File a ticket with support or access help documentation</p>
              </div>

              {ticketMsg && (
                <div
                  className={`p-4 rounded-xl text-xs font-medium flex items-center space-x-2 border ${
                    ticketMsg.type === 'success'
                      ? 'bg-success-light text-success border-success/30'
                      : 'bg-error-light text-error border-error/30'
                  }`}
                >
                  {ticketMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  <span>{ticketMsg.text}</span>
                </div>
              )}

              {/* Submit Ticket Form */}
              <form onSubmit={handleCreateTicket} className="p-5 bg-background-muted/40 border border-text-muted/15 rounded-2xl space-y-3">
                <h3 className="font-bold text-sm font-heading text-primary flex items-center space-x-2">
                  <Send className="w-4 h-4 text-primary" />
                  <span>Submit a New Support Ticket</span>
                </h3>

                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">Subject</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Question about order shipment"
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                    className="w-full px-4 py-2 bg-background-card border border-text-muted/20 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">Message</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Describe your issue or question in detail..."
                    value={ticketMessage}
                    onChange={(e) => setTicketMessage(e.target.value)}
                    className="w-full px-4 py-2 bg-background-card border border-text-muted/20 rounded-xl text-sm"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submittingTicket}
                    className="px-5 py-2 bg-primary text-white hover:bg-primary-hover text-xs font-semibold rounded-xl shadow-soft cursor-pointer flex items-center space-x-2"
                  >
                    {submittingTicket && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>Submit Ticket</span>
                  </button>
                </div>
              </form>

              {/* User's Submitted Tickets */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold font-heading text-text-primary">Your Support Tickets</h3>
                {loadingTickets ? (
                  <div className="py-6 text-center text-text-secondary text-xs">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-primary" />
                  </div>
                ) : tickets.length === 0 ? (
                  <p className="text-xs text-text-secondary italic">No support tickets submitted yet.</p>
                ) : (
                  <div className="space-y-2">
                    {tickets.map((t) => (
                      <div key={t.id} className="p-4 bg-background-muted/30 border border-text-muted/15 rounded-xl space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs text-text-primary">{t.subject}</span>
                          <span className="px-2 py-0.5 bg-primary-light text-primary text-[10px] font-bold rounded-full uppercase">
                            {t.status}
                          </span>
                        </div>
                        <p className="text-xs text-text-secondary line-clamp-2">{t.message}</p>
                        <span className="text-[10px] text-text-muted">{new Date(t.createdAt).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Policy Quick Links */}
              <div className="border-t border-text-muted/10 pt-4 flex flex-wrap gap-4 text-xs font-semibold text-primary">
                <Link to="/help" className="hover:underline flex items-center space-x-1">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Help & FAQ</span>
                </Link>
                <Link to="/terms" className="hover:underline flex items-center space-x-1">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Terms of Service</span>
                </Link>
                <Link to="/privacy" className="hover:underline flex items-center space-x-1">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Privacy Policy</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* DEV-ONLY Role Switcher Drawer (Strictly gated to DEV environment AND ADMIN role) */}
      {import.meta.env.DEV && dbUser?.role === 'ADMIN' && (
        <div className="mt-8 p-4 bg-background-card border border-text-muted/15 rounded-2xl text-xs space-y-2">
          <div className="flex items-center justify-between text-text-muted">
            <span className="font-bold flex items-center space-x-1">
              <UserCheck className="w-3.5 h-3.5 text-primary" />
              <span>[DEV ONLY] Quick Role Switcher</span>
            </span>
            {devRoleMsg && <span className="text-success font-medium">{devRoleMsg}</span>}
          </div>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_ROLES.map((r) => (
              <button
                key={r}
                onClick={() => handleDevRoleChange(r)}
                disabled={updatingRole || dbUser?.role === r}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold cursor-pointer ${
                  dbUser?.role === r
                    ? 'bg-primary text-white'
                    : 'bg-background-muted text-text-primary border border-text-muted/20 hover:bg-primary-light'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
