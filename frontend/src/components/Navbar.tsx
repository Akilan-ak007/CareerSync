import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { Bell, Check, MailOpen, Menu, GraduationCap, LogOut, User } from 'lucide-react';

interface NavbarProps {
  onToggleMobileMenu?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleMobileMenu }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
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

  const handleLogout = () => {
    logout();
    navigate('/login');
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
    if (path.startsWith('/team')) return 'Placement Team & Officers';
    if (path.startsWith('/offers')) return 'Student Offer Records';
    if (path.startsWith('/reports')) return 'Reports & Analytics Generator';
    if (path.startsWith('/audit-logs')) return 'System Audit Trails';
    return 'Rathinam Placement Portal';
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between z-40 relative shadow-xs">
      <div className="rgu-gradient-bar w-full absolute top-0 left-0 z-50"></div>
      
      {/* Left: Mobile Menu Toggle & Brand Indicator */}
      <div className="flex items-center space-x-3 w-1/4">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 rounded-xl text-slate-700 hover:text-purple-900 hover:bg-slate-100 transition-all focus:outline-none"
            aria-label="Toggle Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="hidden sm:flex items-center space-x-2 bg-purple-50 border border-purple-200 px-3 py-1 rounded-full">
          <GraduationCap className="w-4 h-4 text-purple-800" />
          <span className="text-[11px] font-extrabold text-purple-900 tracking-wider">RGU CAREERSYNC</span>
        </div>
      </div>

      {/* Center: Centered Page Title Standard */}
      <div className="flex-1 text-center flex items-center justify-center">
        <h2 className="text-sm md:text-base font-black text-slate-900 tracking-tight truncate uppercase">
          {getPageTitle()}
        </h2>
      </div>

      {/* Right: Actions, Notifications, User Profile & Logout */}
      <div className="flex items-center justify-end space-x-2 md:space-x-4 w-1/3">
        {/* Notifications Icon */}
        <div className="relative">
          <button
            onClick={() => setShowDrawer(!showDrawer)}
            className="p-2 rounded-xl hover:bg-slate-100 transition-all text-slate-600 hover:text-purple-900 relative"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-600 text-white text-[9px] font-extrabold flex items-center justify-center rounded-full animate-pulse shadow-xs">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showDrawer && (
            <div className="absolute right-0 mt-3 w-72 sm:w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 p-4 animate-fade-in text-slate-700">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
                <span className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">Notifications ({unreadCount})</span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[10px] text-purple-800 hover:text-purple-950 font-bold uppercase tracking-wider flex items-center space-x-1"
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
                      className={`p-2.5 rounded-xl text-xs border transition-all ${
                        item.isRead
                          ? 'bg-slate-50 border-slate-200 opacity-70'
                          : 'bg-purple-50/50 border-purple-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className={`font-extrabold ${item.isRead ? 'text-slate-600' : 'text-slate-900'}`}>
                          {item.title}
                        </span>
                        {!item.isRead && (
                          <button
                            onClick={() => handleMarkRead(item.id)}
                            className="p-0.5 hover:bg-purple-100 rounded text-purple-800 transition-all"
                            title="Mark as read"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] leading-relaxed text-slate-600 font-medium">{item.message}</p>
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

        {/* User Profile Pill */}
        {user && (
          <div className="flex items-center space-x-2 border-l border-slate-200 pl-3 md:pl-4">
            <div className="flex items-center space-x-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl p-1 md:pr-3 transition-colors">
              <div className="w-7 h-7 rounded-lg bg-purple-900 text-white font-extrabold flex items-center justify-center text-xs shadow-xs">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-extrabold text-slate-900 leading-tight max-w-[110px] truncate">{user.name}</span>
                <span className="text-[9px] text-purple-800 font-bold uppercase tracking-wider leading-tight">{user.role?.replace('_', ' ')}</span>
              </div>
            </div>

            {/* Logout Button right next to My Profile in Header Top Right */}
            <button
              onClick={handleLogout}
              className="flex items-center space-x-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all shadow-xs"
              title="Logout Session"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
