import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { Bell, Check, MailOpen, Menu } from 'lucide-react';

interface NavbarProps {
  onToggleMobileMenu?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleMobileMenu }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showDrawer, setShowDrawer] = useState(false);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const fetchNotifications = async () => {
    try {
      const res = await api.notifications.list();
      if (res.success) {
        setNotifications(res.data);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.notifications.readAll();
      fetchNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await api.notifications.read(id);
      fetchNotifications();
    } catch (error) {
      console.error('Error marking read:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 20000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.startsWith('/dashboard')) return 'Analytics Dashboard';
    if (path.startsWith('/students')) return 'Students Repository';
    if (path.startsWith('/companies')) return 'Companies Directory';
    if (path.startsWith('/company-approvals')) return 'Approval Queue';
    if (path.startsWith('/drives')) return 'Placement Drives';
    if (path.startsWith('/team')) return 'Placement Team';
    if (path.startsWith('/offers')) return 'Offers Tracking';
    if (path.startsWith('/reports')) return 'Reports Generator';
    if (path.startsWith('/audit-logs')) return 'Audit Trails';
    return 'Placement Platform';
  };

  return (
    <header className="h-16 bg-brand-dark bg-opacity-80 backdrop-blur-md border-b border-brand-cocoa border-opacity-35 px-4 md:px-8 flex items-center justify-between z-40 relative">
      {/* Left Title & Mobile Menu Toggle */}
      <div className="flex items-center space-x-3">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 rounded-lg text-gray-300 hover:text-white hover:bg-brand-cocoa/40 transition-all focus:outline-none"
            aria-label="Toggle Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <h2 className="text-lg md:text-xl font-bold text-white tracking-wide truncate">{getPageTitle()}</h2>
      </div>

      {/* Action Center */}
      <div className="flex items-center space-x-4 md:space-x-6">
        <span className="hidden sm:inline-block text-xs text-brand-rosy font-medium tracking-wide">
          {new Date().toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
        </span>

        {/* Notifications Icon */}
        <div className="relative">
          <button
            onClick={() => setShowDrawer(!showDrawer)}
            className="p-2 rounded-full hover:bg-brand-cocoa hover:bg-opacity-40 transition-all text-gray-300 hover:text-white relative"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 w-4 h-4 bg-brand-rosy text-brand-black text-[9px] font-extrabold flex items-center justify-center rounded-full animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showDrawer && (
            <div className="absolute right-0 mt-3 w-72 sm:w-80 bg-brand-card border border-brand-cocoa border-opacity-50 rounded-xl shadow-2xl z-50 p-4 animate-fade-in text-gray-300">
              <div className="flex items-center justify-between border-b border-brand-cocoa border-opacity-30 pb-2 mb-3">
                <span className="font-bold text-sm text-white">Notifications ({unreadCount})</span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[10px] text-brand-rosy hover:text-white font-bold uppercase tracking-wider flex items-center space-x-1"
                  >
                    <MailOpen className="w-3 h-3" />
                    <span>Clear All</span>
                  </button>
                )}
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2.5">
                {notifications.length === 0 ? (
                  <div className="py-6 text-center text-xs text-brand-rosy font-medium">
                    No notifications yet.
                  </div>
                ) : (
                  notifications.map((item) => (
                    <div
                      key={item.id}
                      className={`p-2.5 rounded-lg text-xs border transition-all ${
                        item.isRead
                          ? 'bg-brand-dark bg-opacity-20 border-brand-cocoa border-opacity-20 opacity-60'
                          : 'bg-brand-dark border-brand-cocoa hover:border-brand-rosy'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className={`font-semibold ${item.isRead ? 'text-gray-400' : 'text-white'}`}>
                          {item.title}
                        </span>
                        {!item.isRead && (
                          <button
                            onClick={() => handleMarkRead(item.id)}
                            className="p-0.5 hover:bg-brand-cocoa rounded text-brand-rosy hover:text-white transition-all"
                            title="Mark as read"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] leading-relaxed text-gray-400">{item.message}</p>
                      <p className="text-[9px] text-brand-rosy text-right mt-1">
                        {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
