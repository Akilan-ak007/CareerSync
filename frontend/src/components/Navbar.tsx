import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { Bell, Check, MailOpen, Menu, GraduationCap } from 'lucide-react';

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
    if (path.startsWith('/dashboard')) return 'Placement Dashboard & Analytics';
    if (path.startsWith('/students')) return 'Student Directory';
    if (path.startsWith('/companies')) return 'Corporate Partners';
    if (path.startsWith('/company-approvals')) return 'Company Approval Queue';
    if (path.startsWith('/drives')) return 'Placement Drive Management';
    if (path.startsWith('/team')) return 'Placement Officers';
    if (path.startsWith('/offers')) return 'Student Offer Records';
    if (path.startsWith('/reports')) return 'Reports & Analytics Generator';
    if (path.startsWith('/audit-logs')) return 'System Audit Trails';
    return 'Rathinam Placement Portal';
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between z-40 relative shadow-xs">
      {/* Left Title & Mobile Menu Toggle */}
      <div className="flex items-center space-x-3">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:text-red-900 hover:bg-slate-100 transition-all focus:outline-none"
            aria-label="Toggle Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="flex items-center space-x-2">
          <GraduationCap className="w-5 h-5 text-red-800 hidden sm:inline-block" />
          <h2 className="text-base md:text-lg font-bold text-slate-800 tracking-wide truncate">{getPageTitle()}</h2>
        </div>
      </div>

      {/* Action Center */}
      <div className="flex items-center space-x-4 md:space-x-6">
        <span className="hidden sm:inline-block text-xs text-slate-500 font-semibold tracking-wide">
          {new Date().toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
        </span>

        {/* Notifications Icon */}
        <div className="relative">
          <button
            onClick={() => setShowDrawer(!showDrawer)}
            className="p-2 rounded-full hover:bg-slate-100 transition-all text-slate-600 hover:text-red-900 relative"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 w-4 h-4 bg-red-800 text-white text-[9px] font-extrabold flex items-center justify-center rounded-full animate-pulse shadow-xs">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showDrawer && (
            <div className="absolute right-0 mt-3 w-72 sm:w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-4 animate-fade-in text-slate-700">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
                <span className="font-bold text-xs text-slate-800 uppercase tracking-wider">Notifications ({unreadCount})</span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[10px] text-red-700 hover:text-red-900 font-bold uppercase tracking-wider flex items-center space-x-1"
                  >
                    <MailOpen className="w-3 h-3" />
                    <span>Clear All</span>
                  </button>
                )}
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2">
                {notifications.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400 font-medium">
                    No new notifications.
                  </div>
                ) : (
                  notifications.map((item) => (
                    <div
                      key={item.id}
                      className={`p-2.5 rounded-lg text-xs border transition-all ${
                        item.isRead
                          ? 'bg-slate-50 border-slate-200 opacity-70'
                          : 'bg-red-50/50 border-red-200 hover:border-red-300'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className={`font-bold ${item.isRead ? 'text-slate-600' : 'text-slate-900'}`}>
                          {item.title}
                        </span>
                        {!item.isRead && (
                          <button
                            onClick={() => handleMarkRead(item.id)}
                            className="p-0.5 hover:bg-red-100 rounded text-red-700 transition-all"
                            title="Mark as read"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] leading-relaxed text-slate-600">{item.message}</p>
                      <p className="text-[9px] text-slate-400 text-right mt-1 font-mono">
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
