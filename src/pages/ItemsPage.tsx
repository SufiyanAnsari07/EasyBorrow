import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Star, MapPin, Calendar, SlidersHorizontal, X, Package } from 'lucide-react';
import { itemsAPI } from '../services/api';

const ItemsPage = () => {
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    keyword: searchParams.get('keyword') || '',
    category: searchParams.get('category') || '',
    minPrice: '',
    maxPrice: '',
    location: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedItems = items.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(items.length / itemsPerPage);

  useEffect(() => { fetchItems(); fetchCategories(); }, [filters]);

  const fetchItems = async () => {
    try {
      setIsLoading(true);
      const params = {
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== '')),
        limit: 1000
      };
      const response = await itemsAPI.getItems(params);
      setItems(response.data.data.items);
      setCurrentPage(1);
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await itemsAPI.getCategories();
      setCategories(response.data.data.categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchItems();
  };

  const clearFilters = () => {
    setFilters({ keyword: '', category: '', minPrice: '', maxPrice: '', location: '', sortBy: 'createdAt', sortOrder: 'desc' });
  };

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [currentPage]);

  const activeFilterCount = [filters.category, filters.minPrice, filters.maxPrice, filters.location]
    .filter(Boolean).length;

  return (
    <div className="min-h-screen pt-20">
      {/* Page Header */}
      <div className="border-b border-dark-800 bg-dark-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-white mb-1">Browse Items</h1>
          <p className="text-dark-400">Find the perfect item to rent from our community</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400 h-4 w-4" />
            <input
              type="text"
              value={filters.keyword}
              onChange={(e) => handleFilterChange('keyword', e.target.value)}
              placeholder="Search for items..."
              className="input-dark !pl-11 !rounded-xl"
            />
          </div>
          <button type="submit" className="btn-accent !px-6 !py-3">Search</button>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all text-sm font-medium ${
              showFilters || activeFilterCount > 0
                ? 'border-accent-500/50 text-accent-400 bg-accent-500/10'
                : 'border-dark-700 text-dark-300 hover:border-dark-600 hover:text-white bg-dark-900'
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="bg-accent-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </form>

        {/* Filters Panel */}
        {showFilters && (
          <div className="glass-card p-5 mb-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-medium">Filters</h3>
              <button onClick={clearFilters} className="text-dark-400 hover:text-white text-sm flex items-center gap-1 transition-colors">
                <X className="h-3.5 w-3.5" /> Clear all
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="input-dark !py-2.5"
              >
                <option value="">All Categories</option>
                {categories.map((cat: any) => (
                  <option key={cat._id} value={cat._id} className="capitalize bg-dark-900">
                    {cat._id} ({cat.count})
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={filters.minPrice}
                onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                placeholder="Min Price (₹)"
                className="input-dark !py-2.5"
              />
              <input
                type="number"
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                placeholder="Max Price (₹)"
                className="input-dark !py-2.5"
              />
              <input
                type="text"
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
                placeholder="Location"
                className="input-dark !py-2.5"
              />
              <select
                value={`${filters.sortBy}-${filters.sortOrder}`}
                onChange={(e) => {
                  const [sortBy, sortOrder] = e.target.value.split('-');
                  handleFilterChange('sortBy', sortBy);
                  handleFilterChange('sortOrder', sortOrder);
                }}
                className="input-dark !py-2.5"
              >
                <option value="createdAt-desc" className="bg-dark-900">Newest First</option>
                <option value="dailyPrice-asc" className="bg-dark-900">Price: Low to High</option>
                <option value="dailyPrice-desc" className="bg-dark-900">Price: High to Low</option>
                <option value="rating-desc" className="bg-dark-900">Highest Rated</option>
              </select>
            </div>
          </div>
        )}

        {/* Results Count */}
        <div className="flex justify-between items-center mb-6">
          <p className="text-dark-400 text-sm">
            {isLoading ? 'Searching...' : `${items.length} item${items.length !== 1 ? 's' : ''} found`}
          </p>
          {!isLoading && totalPages > 1 && (
            <p className="text-dark-500 text-sm">Page {currentPage} of {totalPages}</p>
          )}
        </div>

        {/* Items Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="glass-card overflow-hidden animate-pulse">
                <div className="h-48 bg-dark-800 rounded-t-2xl" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-dark-800 rounded w-3/4" />
                  <div className="h-4 bg-dark-800 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-dark-800 border border-dark-700 flex items-center justify-center mx-auto mb-4">
              <Package className="h-8 w-8 text-dark-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No items found</h3>
            <p className="text-dark-400 mb-6">Try adjusting your search criteria</p>
            <Link to="/add-item" className="btn-accent">List Your First Item</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {paginatedItems.map((item: any) => (
              <Link
                key={item._id}
                to={`/items/${item._id}`}
                className="glass-card-hover overflow-hidden group flex flex-col"
              >
                <div className="relative overflow-hidden h-48">
                  <img
                    src={item.images[0] || 'https://images.pexels.com/photos/230544/pexels-photo-230544.jpeg'}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-semibold ${
                    item.availability?.isAvailable
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    {item.availability?.isAvailable ? 'Available' : 'Rented'}
                  </span>
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="font-semibold text-white mb-1 truncate group-hover:text-accent-400 transition-colors">
                    {item.title}
                  </h3>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg font-bold text-accent-400">₹{item.dailyPrice}<span className="text-dark-400 text-xs font-normal">/day</span></span>
                    <div className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 text-yellow-400 fill-current" />
                      <span className="text-xs text-dark-300">{item.rating.average.toFixed(1)}</span>
                    </div>
                  </div>
                  <div className="flex items-center text-xs text-dark-400 mt-auto">
                    <MapPin className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                    <span className="truncate capitalize">{item.location.city}, {item.location.state}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-10">
            <button
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-xl border border-dark-700 text-dark-300 hover:border-dark-600 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm"
            >
              Previous
            </button>
            {[...Array(Math.min(totalPages, 5))].map((_, i) => {
              const page = i + 1;
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-10 h-10 rounded-xl text-sm font-medium transition-all ${
                    currentPage === page
                      ? 'bg-accent-500 text-white'
                      : 'border border-dark-700 text-dark-300 hover:border-dark-600 hover:text-white'
                  }`}
                >
                  {page}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded-xl border border-dark-700 text-dark-300 hover:border-dark-600 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ItemsPage;
