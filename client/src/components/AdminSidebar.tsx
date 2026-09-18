import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useUser, useClerk } from '@clerk/clerk-react';
import {
  LayoutDashboard, Package, ShoppingBag, ShieldCheck, Users,
  Store, CheckCircle2, AlertCircle, Settings, LogOut,
  ChevronsLeft, ChevronsRight, Search, ChevronDown, ChevronUp, Command, Image
} from 'lucide-react';
import logo from '../assets/logo.png';

const getLocalJSON = (key: string, fallback: any) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
};

export default function AdminSidebar() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const location = useLocation();
  const currentPath = location.pathname;
  const searchRef = useRef<HTMLInputElement>(null);

  const [isCollapsed, setIsCollapsed] = useState<boolean>(() =>
    getLocalJSON('adminSidebarCollapsed', false)
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() =>
    getLocalJSON('adminSidebarExpanded', { menu: true, people: true, operations: true })
  );
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('adminSidebarCollapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  useEffect(() => {
    localStorage.setItem('adminSidebarExpanded', JSON.stringify(expandedSections));
  }, [expandedSections]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
        if (isCollapsed) setIsCollapsed(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCollapsed]);

  const toggleSection = (id: string) => {
    setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const sections = [
    {
      id: 'menu',
      title: 'Menu',
      items: [
        { id: 'dashboard', label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
        { id: 'products', label: 'Products', path: '/admin/products', icon: Package },
        { id: 'orders', label: 'Orders', path: '/admin/orders', icon: ShoppingBag },
        { id: 'categories', label: 'Categories', path: '/admin/categories', icon: ShieldCheck },
      ]
    },
    {
      id: 'people',
      title: 'People & Approvals',
      items: [
        { id: 'users', label: 'Users', path: '/admin/users', icon: Users },
        { id: 'stores', label: 'Stores', path: '/admin/stores', icon: Store },
        { id: 'approvals', label: 'Approvals', path: '/admin/onboarding', icon: CheckCircle2 },
      ]
    },
    {
      id: 'operations',
      title: 'Operations',
      items: [
        { id: 'banners', label: 'Banners', path: '/admin/banners', icon: Image },
        { id: 'cancellations', label: 'Cancellations', path: '/admin/cancellation-requests', icon: AlertCircle },
      ]
    }
  ];

  const filteredSections = sections.map(section => ({
    ...section,
    items: section.items.filter(item => item.label.toLowerCase().includes(searchQuery.toLowerCase()))
  })).filter(section => section.items.length > 0);

  const displaySections = searchQuery ? filteredSections : sections;

  return (
    <div className={`sticky top-6 h-[calc(100vh-3rem)] flex flex-col bg-[#1B2E1E] text-white rounded-3xl border border-[#2A442E] shadow-soft transition-all duration-300 z-40 ${isCollapsed ? 'w-[84px]' : 'w-72 sm:w-80'}`}>
      
      {/* 1. Header (Logo & Collapse Toggle) */}
      <div className={`flex items-center p-4 shrink-0 border-b border-white/10 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        {!isCollapsed && (
          <Link to="/admin/dashboard" className="flex items-center space-x-2 overflow-hidden hover:opacity-80 transition-opacity">
            <div className="bg-white p-1 rounded-lg">
              <img src={logo} alt="EcoMarket" className="h-6 w-auto shrink-0" />
            </div>
            <span className="font-logo font-bold text-xl text-white tracking-wide leading-none truncate">EcoMarket</span>
          </Link>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-full bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/10 transition-colors shadow-sm"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <ChevronsRight className="w-4 h-4" /> : <ChevronsLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* 2. Tools (Badge & Search) */}
      {!isCollapsed && (
        <div className="px-4 pt-4 pb-2 shrink-0 space-y-3">
          <div className="text-[10px] font-bold text-center bg-white/10 text-white/90 border border-white/20 rounded-full py-1 uppercase tracking-widest shadow-xs">
            Admin Operations Portal
          </div>
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-white/80 transition-colors" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search admin..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-xl pl-9 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30 transition-all text-white placeholder:text-white/40 shadow-inner"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-0.5 pointer-events-none text-white/50 bg-black/40 px-1.5 py-0.5 rounded-md border border-white/10 shadow-xs">
              <Command className="w-3 h-3" />
              <span className="text-[10px] font-bold font-mono">K</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Navigation Sections */}
      <div className={`flex-1 overflow-y-auto no-scrollbar py-2 ${isCollapsed ? 'px-2' : 'px-3 space-y-5'}`}>
        {displaySections.map((section) => {
          const isSectionExpanded = searchQuery ? true : expandedSections[section.id];
          return (
            <div key={section.id} className="space-y-1">
              {!isCollapsed && (
                <button
                  onClick={() => !searchQuery && toggleSection(section.id)}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-[11px] font-extrabold text-white/50 uppercase tracking-wider hover:text-white transition-colors cursor-pointer group"
                >
                  <span>{section.title}</span>
                  {!searchQuery && (
                    isSectionExpanded 
                      ? <ChevronUp className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity" /> 
                      : <ChevronDown className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity" />
                  )}
                </button>
              )}
              {isCollapsed && <div className="h-px bg-white/10 mx-2 my-4"></div>}

              {(isSectionExpanded || isCollapsed) && (
                <div className={`space-y-1 ${isCollapsed ? 'mt-0' : 'mt-1'}`}>
                  {section.items.map((item) => {
                    const isActive = currentPath === item.path || currentPath.startsWith(item.path + '/');
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.id}
                        to={item.path}
                        title={isCollapsed ? item.label : undefined}
                        className={`flex items-center transition-all duration-200 cursor-pointer ${
                          isCollapsed 
                            ? 'justify-center p-3 rounded-2xl mx-auto w-12 h-12' 
                            : 'px-3 py-2.5 space-x-3 rounded-xl'
                        } ${
                          isActive
                            ? 'bg-primary text-white shadow-md font-bold border border-white/10'
                            : 'text-white/60 hover:bg-white/5 hover:text-white font-medium border border-transparent'
                        }`}
                      >
                        <Icon className={`shrink-0 ${isCollapsed ? 'w-5 h-5' : 'w-4 h-4'} ${isActive ? 'text-white' : ''}`} />
                        {!isCollapsed && <span className="text-sm truncate">{item.label}</span>}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 4. Bottom Profile */}
      <div className="p-3 shrink-0 mt-auto border-t border-white/10">
        <div className="relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className={`w-full flex items-center border border-white/10 rounded-2xl bg-black/20 hover:bg-black/40 transition-all group ${
              isCollapsed ? 'justify-center p-2' : 'justify-between p-2.5'
            }`}
            title={isCollapsed ? "Profile & Settings" : undefined}
          >
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="w-9 h-9 rounded-full bg-white/10 overflow-hidden shrink-0 border border-white/20 group-hover:border-white/40 transition-all">
                <img 
                  src={user?.imageUrl || `https://ui-avatars.com/api/?name=${user?.fullName || 'Admin'}&background=2F5233&color=fff`} 
                  alt="Avatar" 
                  className="w-full h-full object-cover" 
                />
              </div>
              {!isCollapsed && (
                <div className="text-left min-w-0 flex-1">
                  <p className="text-sm font-bold text-white truncate">{user?.fullName || 'Admin User'}</p>
                  <p className="text-[10px] text-white/50 truncate">{user?.primaryEmailAddress?.emailAddress || 'admin@ecomarket.com'}</p>
                </div>
              )}
            </div>
            {!isCollapsed && (
              <div className="text-white/50 group-hover:text-white shrink-0 transition-colors pl-2">
                {isProfileOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </div>
            )}
          </button>

          {/* Profile Popover */}
          {isProfileOpen && (
            <div className={`absolute bottom-[calc(100%+8px)] z-50 bg-[#2A442E] text-white rounded-2xl border border-white/10 shadow-xl p-1.5 space-y-0.5 animate-fade-in ${isCollapsed ? 'left-0 w-48' : 'left-0 right-0'}`}>
              <Link
                to="/admin/settings"
                onClick={() => setIsProfileOpen(false)}
                className="flex items-center space-x-2 px-3 py-2.5 rounded-xl text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white transition-colors"
              >
                <Settings className="w-4 h-4 shrink-0" />
                <span>Settings</span>
              </Link>
              <button
                onClick={() => {
                  setIsProfileOpen(false);
                  signOut();
                }}
                className="w-full flex items-center space-x-2 px-3 py-2.5 rounded-xl text-sm font-bold text-[#f87171] hover:bg-[#f87171]/10 transition-colors text-left"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span>Log out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
