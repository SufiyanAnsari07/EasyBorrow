import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Star, Clock, Shield, Users, BookOpen, Smartphone, Wrench, Camera, ArrowRight, ShoppingBag, Zap, TrendingUp } from 'lucide-react';
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
    if (searchTerm.trim()) navigate(`/items?keyword=${encodeURIComponent(searchTerm)}`);
  };

  const categoryIcons: Record<string, React.ReactNode> = {
    books: <BookOpen className="h-5 w-5" />,
    electronics: <Smartphone className="h-5 w-5" />,
    gadgets: <Smartphone className="h-5 w-5" />,
    tools: <Wrench className="h-5 w-5" />,
    photography: <Camera className="h-5 w-5" />,
  };

  return (
    <div className="min-h-screen pt-20">
      {/* Hero */}
      <section className="relative overflow-hidden py-24 md:py-32 px-4 sm:px-6 lg:px-8">
        {/* Background effects */}
        <div className="absolute top-[-80px] left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-accent-500/[0.06] rounded-full blur-[130px] pointer-events-none" />
        <div className="absolute top-[200px] right-[5%] w-[350px] h-[350px] bg-cyan-500/[0.04] rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[0px] left-[5%] w-[300px] h-[300px] bg-accent-700/[0.04] rounded-full blur-[100px] pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center animate-fade-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-500/10 border border-accent-500/20 text-accent-400 text-sm font-medium mb-8">
            <Zap className="h-3.5 w-3.5" />
            Borrow smarter, not harder
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 leading-tight tracking-tight">
            Rent Anything,{' '}
            <span className="gradient-text">Share Everything</span>
          </h1>

          <p className="text-dark-400 text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
            Unlock a world of possibilities without ownership. Rent from your community, earn from your belongings.
          </p>

          <form onSubmit={handleSearch} className="flex gap-3 justify-center max-w-lg mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400 h-4 w-4" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search items, tools, electronics..."
                className="input-dark !pl-11 !rounded-2xl !py-3.5"
              />
            </div>
            <button className="btn-accent !px-6 !rounded-2xl !py-3.5 flex items-center gap-2">
              Search <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="flex items-center justify-center gap-6 mt-8 text-sm text-dark-500">
            <span className="flex items-center gap-1.5"><Users className="h-4 w-4 text-accent-500" /> 1,000+ Users</span>
            <span className="w-px h-4 bg-dark-700" />
            <span className="flex items-center gap-1.5"><ShoppingBag className="h-4 w-4 text-accent-500" /> 5,000+ Items</span>
            <span className="w-px h-4 bg-dark-700" />
            <span className="flex items-center gap-1.5"><Star className="h-4 w-4 text-accent-500 fill-current" /> 4.8 Rating</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Shield, title: 'Verified Users', desc: 'All users are ID-verified', color: 'text-green-400', bg: 'bg-green-500/10' },
              { icon: Clock, title: 'Fast Booking', desc: 'Book in under 2 minutes', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
              { icon: Users, title: 'Community', desc: 'Trusted local network', color: 'text-accent-400', bg: 'bg-accent-500/10' },
              { icon: TrendingUp, title: 'Earn Money', desc: 'Monetize your items', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
            ].map(({ icon: Icon, title, desc, color, bg }) => (
              <div key={title} className="glass-card p-5 text-center group hover:border-accent-500/20 transition-all">
                <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center mx-auto mb-3`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <h3 className="text-white font-semibold text-sm mb-1">{title}</h3>
                <p className="text-dark-400 text-xs">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-white">Browse Categories</h2>
                <p className="text-dark-400 mt-1">Find exactly what you need</p>
              </div>
              <Link to="/items" className="text-accent-400 hover:text-accent-300 text-sm flex items-center gap-1 transition-colors">
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {categories.map((cat: any) => (
                <Link
                  key={cat._id}
                  to={`/items?category=${cat._id}`}
                  className="glass-card-hover p-4 text-center group"
                >
                  <div className="w-10 h-10 rounded-xl bg-accent-500/10 border border-accent-500/15 flex items-center justify-center mx-auto mb-2 text-accent-400 group-hover:bg-accent-500/20 transition-colors">
                    {categoryIcons[cat._id] || <ShoppingBag className="h-5 w-5" />}
                  </div>
                  <p className="text-white text-xs font-medium capitalize">{cat._id}</p>
                  <p className="text-dark-500 text-xs">{cat.count} items</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Items */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-white">Featured Items</h2>
              <p className="text-dark-400 mt-1">Top-rated items from our community</p>
            </div>
            <Link to="/items" className="text-accent-400 hover:text-accent-300 text-sm flex items-center gap-1 transition-colors">
              See all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {[...Array(8)].map((_, i) => <div key={i} className="glass-card h-60 animate-pulse" />)}
            </div>
          ) : featuredItems.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingBag className="h-12 w-12 text-dark-600 mx-auto mb-3" />
              <p className="text-dark-400">No items yet. Be the first to list!</p>
              <Link to="/add-item" className="btn-accent mt-4 inline-flex">List an Item</Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {featuredItems.map((item: any) => (
                <Link key={item._id} to={`/items/${item._id}`} className="glass-card-hover overflow-hidden group">
                  <div className="relative overflow-hidden">
                    <img
                      src={item.images?.[0] || 'https://images.pexels.com/photos/230544/pexels-photo-230544.jpeg'}
                      alt={item.title}
                      className="h-40 w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {item.rating?.count > 0 && (
                      <div className="absolute top-2 right-2 flex items-center gap-1 bg-dark-950/80 backdrop-blur-sm px-2 py-0.5 rounded-full">
                        <Star className="h-3 w-3 text-yellow-400 fill-current" />
                        <span className="text-xs text-white">{item.rating.average.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="text-white text-sm font-medium truncate group-hover:text-accent-400 transition-colors">{item.title}</h3>
                    <p className="text-accent-400 font-bold text-sm mt-1">₹{item.dailyPrice}<span className="text-dark-400 font-normal text-xs">/day</span></p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <div className="glass-card p-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-accent-500/[0.03] rounded-2xl" />
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Have something to rent out?
              </h2>
              <p className="text-dark-400 mb-8">Turn your idle items into income. List them on EasyBorrow and start earning today.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/add-item" className="btn-accent flex items-center gap-2 justify-center">
                  <ShoppingBag className="h-5 w-5" /> List an Item
                </Link>
                <Link to="/register" className="btn-ghost flex items-center gap-2 justify-center">
                  Create Account <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
