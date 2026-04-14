import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Star,
  Clock,
  Shield,
  Users,
  ChevronRight,
  BookOpen,
  Smartphone,
  Wrench,
  Camera,
  ArrowRight,
  ShoppingBag
} from 'lucide-react';

import { itemsAPI } from '../services/api';

const HomePage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [featuredItems, setFeaturedItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [itemsResponse, categoriesResponse] = await Promise.all([
          itemsAPI.getItems({ limit: 8, sortBy: 'rating', sortOrder: 'desc' }),
          itemsAPI.getCategories()
        ]);

        setFeaturedItems(itemsResponse.data?.data?.items || []);
        setCategories((categoriesResponse.data?.data?.categories || []).slice(0, 6));
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/items?keyword=${encodeURIComponent(searchTerm)}`);
    }
  };

  const categoryIcons: { [key: string]: React.ReactNode } = {
    books: <BookOpen className="h-6 w-6" />,
    electronics: <Smartphone className="h-6 w-6" />,
    gadgets: <Smartphone className="h-6 w-6" />,
    tools: <Wrench className="h-6 w-6" />,
    photography: <Camera className="h-6 w-6" />,
  };

  return (
    <div className="min-h-[calc(100vh-80px)] pt-20">

      {/* HERO */}
      <section className="relative overflow-hidden py-16 md:py-24 px-4 sm:px-6 lg:px-8">
        <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[600px] h-[500px] bg-accent-500/[0.07] rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-[200px] right-[10%] w-[300px] h-[300px] bg-cyan-500/[0.04] rounded-full blur-[100px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto text-center">

          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6">
            Rent Anything, <span className="text-accent-400">Share Everything</span>
          </h1>

          <p className="text-dark-400 mb-10">
            Unlock a world of possibilities without ownership.
          </p>

          <form onSubmit={handleSearch} className="flex gap-3 justify-center">
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search items..."
              className="input-dark px-4 py-3 rounded-xl w-80"
            />
            <button className="btn-accent px-6 py-3 rounded-xl">
              Search
            </button>
          </form>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-20 px-6">
        <div className="grid md:grid-cols-4 gap-6">
          {[
            { icon: Shield, title: 'Secure' },
            { icon: Clock, title: 'Fast' },
            { icon: Users, title: 'Community' },
            { icon: Star, title: 'Rated' }
          ].map((f, i) => (
            <div key={i} className="glass-card p-6 text-center">
              <f.icon className="mx-auto mb-3 text-accent-400" />
              <h3 className="text-white">{f.title}</h3>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURED ITEMS */}
      <section className="py-20 px-6">
        <h2 className="text-3xl text-white mb-8">Featured Items</h2>

        {isLoading ? (
          <p className="text-dark-400">Loading...</p>
        ) : (
          <div className="grid md:grid-cols-4 gap-6">
            {featuredItems.map((item: any) => (
              <Link key={item._id} to={`/items/${item._id}`} className="glass-card p-4">
                <img
                  src={item.images?.[0]}
                  className="h-40 w-full object-cover rounded"
                />
                <h3 className="text-white mt-2">{item.title}</h3>
                <p className="text-accent-400">₹{item.dailyPrice}</p>
              </Link>
            ))}

            {featuredItems.length === 0 && (
              <div className="col-span-4 text-center text-dark-400">
                <ShoppingBag className="mx-auto mb-2" />
                No Items Found
              </div>
            )}
          </div>
        )}
      </section>

    </div>
  );
};

export default HomePage;