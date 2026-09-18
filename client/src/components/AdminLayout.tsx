import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import { Menu, X } from 'lucide-react';

export default function AdminLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex bg-background min-h-screen w-full overflow-x-hidden">
      {/* Mobile Top Header (Visible only below lg) */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-40 flex items-center px-4 shadow-sm">
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 -ml-2 rounded-lg text-text-secondary hover:bg-slate-100 transition-colors"
        >
          <Menu className="w-6 h-6 text-primary" />
        </button>
        <span className="ml-2 font-heading font-bold text-lg text-primary">EcoMarket Admin</span>
      </div>

      {/* Desktop Sidebar */}
      <div className="shrink-0 z-40 hidden lg:block p-4">
        <AdminSidebar />
      </div>
      
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] h-full flex flex-col pt-4 pb-4 pl-4 bg-transparent animate-slide-in-left">
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute top-6 -right-12 p-2 bg-white rounded-full text-text-primary shadow-lg"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="h-full overflow-y-auto no-scrollbar pb-10" onClick={() => setIsMobileMenuOpen(false)}>
               {/* Click bubbling will close menu when link clicked */}
              <AdminSidebar />
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area - Full width */}
      <div className="flex-1 min-w-0 w-full p-4 pt-20 lg:pt-4 sm:p-6 lg:p-8">
        <Outlet />
      </div>
    </div>
  );
}
