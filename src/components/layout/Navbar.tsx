import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, User, Menu, X, ShoppingBag, Settings, LogOut, Shield } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAuth();
    navigate('/');
    setIsProfileMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-dark-950/80 backdrop-blur-2xl border-b border-accent-500/[0.06]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-accent-500/20 rounded-xl blur-lg group-hover:bg-accent-500/30 transition-all duration-500"></div>
              <div className="relative w-10 h-10 rounded-xl bg-accent-500/15 border border-accent-500/20 flex items-center justify-center">
                <ShoppingBag className="h-5 w-5 text-accent-400 group-hover:scale-110 transition-transform duration-300" />
              </div>
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">
              Easy<span className="text-accent-400">Borrow</span>
            </span>
          </Link>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-xl mx-12">
            <div className="relative w-full group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-dark-400 h-4 w-4 group-focus-within:text-accent-400 transition-colors" />
              <input
                type="text"
                placeholder="Search items, tools, properties..."
                className="input-dark !rounded-full !pl-11 border-dark-700 bg-dark-900/50 hover:bg-dark-900 focus:bg-dark-950 transition-all shadow-inner"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    navigate(`/items?keyword=${e.currentTarget.value}`);
                  }
                }}
              />
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            <Link 
              to="/items" 
              className="px-4 py-2 text-sm font-medium text-dark-200 hover:text-white rounded-xl hover:bg-white/[0.04] transition-all"
            >
              Browse
            </Link>
            
            {isAuthenticated ? (
              <>
                <Link 
                  to="/dashboard" 
                  className="px-4 py-2 text-sm font-medium text-dark-200 hover:text-white rounded-xl hover:bg-white/[0.04] transition-all"
                >
                  Dashboard
                </Link>
                <Link
                  to="/complaints"
                  className="px-4 py-2 text-sm font-medium text-dark-200 hover:text-white rounded-xl hover:bg-white/[0.04] transition-all"
                >
                  Complaints
                </Link>
                
                <div className="w-px h-6 bg-dark-700 mx-2"></div>

                {/* Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-dark-900 border border-dark-700 hover:border-dark-600 transition-all"
                  >
                    <div className="w-7 h-7 bg-accent-500/15 rounded-lg flex items-center justify-center border border-accent-500/20">
                      {user?.profileImage ? (
                        <img 
                          src={user.profileImage} 
                          alt={user.name}
                          className="w-full h-full rounded-lg object-cover"
                        />
                      ) : (
                        <User className="h-3.5 w-3.5 text-accent-400" />
                      )}
                    </div>
                    <span className="font-medium text-sm text-dark-100 px-1">{user?.name?.split(' ')[0]}</span>
                  </button>

                  {isProfileMenuOpen && (
                    <div className="absolute right-0 mt-3 w-64 glass-card border border-dark-700 shadow-2xl py-2 z-50 animate-fade-in">
                      <div className="px-4 py-3 border-b border-dark-700/50 mb-2">
                        <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
                        <p className="text-xs text-dark-400 truncate mt-0.5">{user?.email}</p>
                        <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-accent-500/10 border border-accent-500/20">
                          <span className="text-xs font-medium text-accent-400">
                            Wallet: ₹{user?.wallet?.balance?.toLocaleString() || 0}
                          </span>
                        </div>
                      </div>
                      
                      <Link
                        to="/profile"
                        className="flex items-center px-4 py-2 text-sm text-dark-200 hover:text-white hover:bg-white/[0.04] transition-colors"
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        <Settings className="h-4 w-4 mr-3 text-dark-400" />
                        Profile Settings
                      </Link>
                      
                      {user?.role === 'admin' && (
                        <Link
                          to="/admin"
                          className="flex items-center px-4 py-2 text-sm text-dark-200 hover:text-white hover:bg-white/[0.04] transition-colors"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          <Shield className="h-4 w-4 mr-3 text-accent-400" />
                          Admin Panel
                        </Link>
                      )}
                      
                      <div className="border-t border-dark-700/50 my-2"></div>
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                      >
                        <LogOut className="h-4 w-4 mr-3" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3 ml-2">
                <Link
                  to="/login"
                  className="px-5 py-2 text-sm font-medium text-dark-200 hover:text-white transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="btn-accent !px-6 !py-2.5 text-sm"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2.5 rounded-xl text-dark-300 hover:text-white hover:bg-white/[0.04] transition-colors"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden pb-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-dark-400 h-4 w-4 group-focus-within:text-accent-400" />
            <input
              type="text"
              placeholder="Search items..."
              className="input-dark !rounded-full !pl-11 border-dark-700 bg-dark-900 flex w-full"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  navigate(`/items?keyword=${e.currentTarget.value}`);
                  setIsMenuOpen(false);
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {isMenuOpen && (
        <div className="md:hidden bg-dark-950 border-t border-dark-800">
          <div className="px-4 py-3 space-y-1">
            <Link
              to="/items"
              className="block px-4 py-3 text-sm font-medium text-dark-200 hover:text-white hover:bg-white/[0.04] rounded-xl transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Browse Items
            </Link>
            
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className="block px-4 py-3 text-sm font-medium text-dark-200 hover:text-white hover:bg-white/[0.04] rounded-xl transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  to="/profile"
                  className="block px-4 py-3 text-sm font-medium text-dark-200 hover:text-white hover:bg-white/[0.04] rounded-xl transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Profile Settings
                </Link>
                <Link
                  to="/complaints"
                  className="block px-4 py-3 text-sm font-medium text-dark-200 hover:text-white hover:bg-white/[0.04] rounded-xl transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Complaints
                </Link>
                {user?.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="block px-4 py-3 text-sm font-medium text-accent-400 bg-accent-500/10 rounded-xl transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Admin Panel
                  </Link>
                )}
                <div className="border-t border-dark-800 my-2 pt-2"></div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-3 text-sm font-medium text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Link
                  to="/login"
                  className="text-center px-4 py-3 text-sm font-medium text-dark-200 bg-dark-800 hover:bg-dark-700 rounded-xl transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="text-center px-4 py-3 text-sm font-medium text-white bg-accent-500 hover:bg-accent-600 rounded-xl transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
