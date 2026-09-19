import React, { useState, useEffect } from 'react';

export default function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="bg-error text-white px-4 py-2 text-center fixed top-0 w-full z-[9999] font-semibold text-sm shadow-md flex items-center justify-center space-x-2">
      <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
      <span>⚠️ You're offline. Features like checkout and order tracking may not work. Please check your internet connection.</span>
    </div>
  );
}
