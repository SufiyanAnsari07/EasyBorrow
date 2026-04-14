import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Mail, Phone, MapPin, Facebook, Twitter, Instagram } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-[#0B0F19] text-dark-200 border-t border-dark-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-16 grid grid-cols-1 md:grid-cols-4 gap-10 lg:gap-8">
          {/* Brand Section */}
          <div className="space-y-6 md:col-span-1">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 rounded-xl bg-accent-500/15 border border-accent-500/20 flex items-center justify-center">
                <ShoppingBag className="h-5 w-5 text-accent-400 group-hover:scale-110 transition-transform duration-300" />
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">Easy<span className="text-accent-400">Borrow</span></span>
            </Link>
            <p className="text-dark-400 text-sm leading-relaxed max-w-sm">
              The smartest way to rent and lend items locally. 
              Share resources, save money, and build a stronger community with EASYBORROW.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="w-10 h-10 rounded-full flex items-center justify-center bg-dark-900 border border-dark-700 text-dark-400 hover:text-accent-400 hover:border-accent-500/30 transition-all">
                <Facebook className="h-4 w-4" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full flex items-center justify-center bg-dark-900 border border-dark-700 text-dark-400 hover:text-accent-400 hover:border-accent-500/30 transition-all">
                <Twitter className="h-4 w-4" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full flex items-center justify-center bg-dark-900 border border-dark-700 text-dark-400 hover:text-accent-400 hover:border-accent-500/30 transition-all">
                <Instagram className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-6">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/items" className="text-dark-400 hover:text-accent-400 transition-colors text-sm">
                  Browse Items
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-dark-400 hover:text-accent-400 transition-colors text-sm">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/reviews" className="text-dark-400 hover:text-accent-400 transition-colors text-sm">
                  Community Reviews
                </Link>
              </li>
              <li>
                <Link to="/complaints" className="text-dark-400 hover:text-accent-400 transition-colors text-sm">
                  Support Center
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-6">Categories</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/items?category=electronics" className="text-dark-400 hover:text-accent-400 transition-colors text-sm">
                  Electronics
                </Link>
              </li>
              <li>
                <Link to="/items?category=books" className="text-dark-400 hover:text-accent-400 transition-colors text-sm">
                  Books & Study
                </Link>
              </li>
              <li>
                <Link to="/items?category=tools" className="text-dark-400 hover:text-accent-400 transition-colors text-sm">
                  Tools & Hardware
                </Link>
              </li>
              <li>
                <Link to="/items?category=sports" className="text-dark-400 hover:text-accent-400 transition-colors text-sm">
                  Sports Gear
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-6">Contact</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3 text-dark-400 group">
                <div className="mt-0.5"><Mail className="h-4 w-4 group-hover:text-accent-400 transition-colors" /></div>
                <span className="text-sm">support@EASYBORROW.com</span>
              </div>
              <div className="flex items-start space-x-3 text-dark-400 group">
                <div className="mt-0.5"><Phone className="h-4 w-4 group-hover:text-accent-400 transition-colors" /></div>
                <span className="text-sm">+91 9876543210</span>
              </div>
              <div className="flex items-start space-x-3 text-dark-400 group">
                <div className="mt-0.5"><MapPin className="h-4 w-4 group-hover:text-accent-400 transition-colors" /></div>
                <span className="text-sm">Mumbai, India</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="py-8 border-t border-dark-800/50 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 mt-4">
          <p className="text-dark-500 text-sm">
            © {new Date().getFullYear()} EASYBORROW. All rights reserved.
          </p>
          <div className="flex flex-wrap justify-center space-x-6">
            <Link to="/privacy" className="text-dark-500 hover:text-white text-sm transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-dark-500 hover:text-white text-sm transition-colors">
              Terms of Service
            </Link>
            <Link to="/help" className="text-dark-500 hover:text-white text-sm transition-colors">
              Help Center
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;