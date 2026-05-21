import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Star, MapPin, Shield, User, ChevronLeft, ChevronRight, Heart, Share2, Package, Tag, Wrench, AlertCircle
} from 'lucide-react';
import { itemsAPI, bookingsAPI, reviewsAPI } from '../services/api';
import { useAuthStore } from '../stores/authStore';

const ItemDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const [item, setItem] = useState<any>(null);
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [bookingData, setBookingData] = useState({ startDate: '', endDate: '', message: '' });
  const [isBooking, setIsBooking] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState('');

  useEffect(() => {
    if (id) { fetchItemDetails(); fetchReviews(); }
  }, [id]);

  const fetchItemDetails = async () => {
    try {
      const response = await itemsAPI.getItemById(id!);
      setItem(response.data.data.item);
    } catch (error) {
      navigate('/items');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await reviewsAPI.getItemReviews(id!, { limit: 10 });
      setReviews(response.data.data.reviews);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const calculateTotalCost = () => {
    if (!bookingData.startDate || !bookingData.endDate || !item) return { days: 0, rentalCost: 0, deposit: 0, total: 0 };
    const start = new Date(bookingData.startDate);
    const end = new Date(bookingData.endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (days <= 0) return { days: 0, rentalCost: 0, deposit: 0, total: 0 };
    const rentalCost = days * (item.dailyPrice || 0);
    const deposit = ((item.itemValue || 0) * (item.depositPercentage || 0)) / 100;
    return { days, rentalCost, deposit, total: rentalCost + deposit };
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) { navigate('/login'); return; }
    if (!bookingData.startDate || !bookingData.endDate) { setBookingError('Please select booking dates'); return; }
    const costs = calculateTotalCost();
    if (costs.days <= 0) { setBookingError('End date must be after start date'); return; }
    try {
      setIsBooking(true);
      setBookingError('');
      await bookingsAPI.createBooking({
        itemId: id, startDate: bookingData.startDate, endDate: bookingData.endDate,
        message: bookingData.message, totalAmount: costs.total,
        rentalAmount: costs.rentalCost, depositAmount: costs.deposit
      });
      setBookingSuccess(true);
      setTimeout(() => navigate('/bookings'), 2000);
    } catch (error: any) {
      setBookingError(error.response?.data?.message || 'Error creating booking');
    } finally {
      setIsBooking(false);
    }
  };

  useEffect(() => {
    if (!item?._id) return;
    try {
      const raw = localStorage.getItem('favorite-items');
      const ids: string[] = raw ? JSON.parse(raw) : [];
      setIsFavorite(ids.includes(item._id));
    } catch {}
  }, [item?._id]);

  const toggleFavorite = () => {
    if (!item?._id) return;
    try {
      const raw = localStorage.getItem('favorite-items');
      const ids: string[] = raw ? JSON.parse(raw) : [];
      const next = ids.includes(item._id) ? ids.filter(i => i !== item._id) : [...ids, item._id];
      setIsFavorite(!ids.includes(item._id));
      localStorage.setItem('favorite-items', JSON.stringify(next));
    } catch {}
  };

  const nextImage = () => item?.images && setCurrentImageIndex(p => p === item.images.length - 1 ? 0 : p + 1);
  const prevImage = () => item?.images && setCurrentImageIndex(p => p === 0 ? item.images.length - 1 : p - 1);

  const fileName = item?.images?.[currentImageIndex]?.split('\\').pop();
  const imageUrl = fileName ? `/uploads/items/${fileName}` : 'https://images.pexels.com/photos/230544/pexels-photo-230544.jpeg';

  if (isLoading) {
    return (
      <div className="min-h-screen pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
          <div className="h-6 bg-dark-800 rounded w-32 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="h-96 bg-dark-800 rounded-2xl" />
            <div className="space-y-4">
              <div className="h-8 bg-dark-800 rounded w-3/4" />
              <div className="h-4 bg-dark-800 rounded w-1/2" />
              <div className="h-4 bg-dark-800 rounded w-1/3" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Item not found</h1>
          <Link to="/items" className="text-accent-400 hover:text-accent-300">Browse other items</Link>
        </div>
      </div>
    );
  }

  const costs = calculateTotalCost();
  const isOwner = user?._id === item?.owner?._id;

  return (
    <div className="min-h-screen pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <Link to="/items" className="inline-flex items-center text-dark-400 hover:text-white transition-colors mb-8 text-sm">
          <ChevronLeft className="h-4 w-4 mr-1" /> Back to Items
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Image Gallery */}
          <div className="space-y-3">
            <div className="relative rounded-2xl overflow-hidden bg-dark-900 border border-dark-800">
              <img src={imageUrl} alt={item.title} className="w-full h-96 object-cover" />
              {item.images.length > 1 && (
                <>
                  <button onClick={prevImage} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-dark-950/80 backdrop-blur-sm text-white rounded-full flex items-center justify-center hover:bg-dark-950 transition-colors border border-dark-700">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button onClick={nextImage} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-dark-950/80 backdrop-blur-sm text-white rounded-full flex items-center justify-center hover:bg-dark-950 transition-colors border border-dark-700">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </>
              )}
              <div className="absolute top-3 right-3 flex gap-2">
                <button onClick={toggleFavorite} className="w-9 h-9 bg-dark-950/80 backdrop-blur-sm rounded-full flex items-center justify-center border border-dark-700 hover:border-dark-600 transition-colors">
                  <Heart className={`h-4 w-4 ${isFavorite ? 'text-red-400 fill-current' : 'text-dark-300'}`} />
                </button>
                <button className="w-9 h-9 bg-dark-950/80 backdrop-blur-sm rounded-full flex items-center justify-center border border-dark-700 hover:border-dark-600 transition-colors">
                  <Share2 className="h-4 w-4 text-dark-300" />
                </button>
              </div>
            </div>
            {item.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {item.images.map((image: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                      index === currentImageIndex ? 'border-accent-500' : 'border-dark-700 hover:border-dark-600'
                    }`}
                  >
                    <img src={`/uploads/items/${image.split('\\').pop()}`} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Item Details */}
          <div className="space-y-6">
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <h1 className="text-3xl font-bold text-white">{item.title}</h1>
                <span className={`flex-shrink-0 mt-1 px-3 py-1 rounded-full text-sm font-medium ${
                  item.availability?.isAvailable
                    ? 'bg-green-500/15 text-green-400 border border-green-500/25'
                    : 'bg-red-500/15 text-red-400 border border-red-500/25'
                }`}>
                  {item.availability?.isAvailable ? 'Available' : 'Not Available'}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-dark-400">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  <span className="text-dark-300">{item.rating.average.toFixed(1)}</span>
                  <span>({item.rating.count} reviews)</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{item.location.city}, {item.location.state}</span>
                </div>
              </div>
            </div>

            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold text-accent-400">₹{item.dailyPrice}</span>
              <span className="text-dark-400 mb-1">per day</span>
            </div>

            <p className="text-dark-300 leading-relaxed">{item.description}</p>

            {/* Item Details Grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Category', value: item.category, icon: Tag },
                { label: 'Condition', value: item.condition, icon: Wrench },
                { label: 'Item Value', value: `₹${(item.itemValue || 0).toLocaleString()}`, icon: Package },
                { label: 'Security Deposit', value: `₹${(((item.itemValue || 0) * (item.depositPercentage || 0)) / 100).toLocaleString()}`, icon: Shield },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="glass-card p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="h-3.5 w-3.5 text-accent-400" />
                    <span className="text-xs text-dark-400">{label}</span>
                  </div>
                  <p className="text-white font-medium capitalize text-sm">{value}</p>
                </div>
              ))}
            </div>

            {/* Owner Info */}
            <div className="glass-card p-4">
              <h3 className="text-sm font-semibold text-dark-300 mb-3">Owner</h3>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-accent-500/10 rounded-full flex items-center justify-center border border-accent-500/15 overflow-hidden">
                  {item.owner?.profileImage
                    ? <img src={item.owner.profileImage} alt={item.owner?.name} className="w-full h-full object-cover" />
                    : <User className="h-5 w-5 text-accent-400" />
                  }
                </div>
                <div>
                  <p className="font-medium text-white">{item.owner?.name}</p>
                  <div className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 text-yellow-400 fill-current" />
                    <span className="text-xs text-dark-400">
                      {(item.owner?.rating?.average ?? 0).toFixed(1)} ({item.owner?.rating?.count ?? 0} reviews)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Booking Form */}
        {!isOwner && item.availability?.isAvailable && (
          <div className="glass-card p-6 mb-8">
            <h2 className="text-xl font-semibold text-white mb-5">Book This Item</h2>

            {bookingSuccess ? (
              <div className="text-center py-6">
                <div className="w-14 h-14 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-3 border border-green-500/20">
                  <Shield className="h-7 w-7 text-green-400" />
                </div>
                <h3 className="text-white font-semibold mb-1">Request Sent to Owner!</h3>
                <p className="text-dark-400 text-sm">The owner can accept or reject it. Redirecting to your bookings...</p>
              </div>
            ) : (
              <form onSubmit={handleBooking} className="space-y-4">
                {bookingError && (
                  <div className="p-3 rounded-xl bg-red-500/8 border border-red-500/15 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                    <span className="text-sm text-red-400">{bookingError}</span>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-2">Start Date</label>
                    <input
                      type="date"
                      value={bookingData.startDate}
                      onChange={(e) => setBookingData(prev => ({ ...prev, startDate: e.target.value }))}
                      min={new Date().toISOString().split('T')[0]}
                      className="input-dark"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-2">End Date</label>
                    <input
                      type="date"
                      value={bookingData.endDate}
                      onChange={(e) => setBookingData(prev => ({ ...prev, endDate: e.target.value }))}
                      min={bookingData.startDate || new Date().toISOString().split('T')[0]}
                      className="input-dark"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">Message to Owner <span className="text-dark-500">(Optional)</span></label>
                  <textarea
                    value={bookingData.message}
                    onChange={(e) => setBookingData(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Tell the owner about your rental needs..."
                    rows={3}
                    className="input-dark resize-none"
                  />
                </div>
                {costs.days > 0 && (
                  <div className="bg-dark-900 rounded-xl p-4 border border-dark-700">
                    <h3 className="font-medium text-white mb-3 text-sm">Cost Breakdown</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-dark-300">
                        <span>Rental ({costs.days} day{costs.days > 1 ? 's' : ''} × ₹{item.dailyPrice})</span>
                        <span>₹{costs.rentalCost.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-dark-300">
                        <span>Security Deposit</span>
                        <span>₹{costs.deposit.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-white border-t border-dark-700 pt-2 mt-2">
                        <span>Total</span>
                        <span className="text-accent-400">₹{costs.total.toLocaleString()}</span>
                      </div>
                    </div>
                    <p className="text-xs text-dark-500 mt-2 flex items-center gap-1">
                      <Shield className="h-3 w-3" /> Security deposit refunded after item return
                    </p>
                  </div>
                )}
                <button
                  type="submit"
                  disabled={isBooking || !isAuthenticated}
                  className="btn-accent w-full !py-3.5"
                >
                  {isBooking ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />Sending Request...</>
                  ) : 'Send Booking Request'}
                </button>
                {!isAuthenticated && (
                  <p className="text-center text-sm text-dark-400">
                    <Link to="/login" className="text-accent-400 hover:text-accent-300">Sign in</Link> to book this item
                  </p>
                )}
              </form>
            )}
          </div>
        )}

        {/* Reviews */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-semibold text-white">Reviews</h2>
            <Link to="/complaints" className="text-sm text-dark-400 hover:text-accent-400 transition-colors">
              File a complaint
            </Link>
          </div>

          {!isOwner && isAuthenticated && (
            <div className="mb-5 p-3 rounded-xl bg-accent-500/5 border border-accent-500/15">
              <p className="text-sm text-dark-300">
                Reviews can only be submitted for completed bookings. Go to your bookings page to leave a review.
              </p>
            </div>
          )}

          {reviews.length === 0 ? (
            <p className="text-dark-400 text-center py-8">No reviews yet. Be the first to review!</p>
          ) : (
            <div className="space-y-5">
              {reviews.map((review: any) => (
                <div key={review._id} className="border-b border-dark-800 pb-5 last:border-0">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-dark-800 flex items-center justify-center flex-shrink-0 overflow-hidden border border-dark-700">
                      {review.reviewer.profileImage
                        ? <img src={review.reviewer.profileImage} alt={review.reviewer.name} className="w-full h-full object-cover" />
                        : <span className="text-sm font-medium text-dark-300">{review.reviewer.name.charAt(0)}</span>
                      }
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-white text-sm">{review.reviewer.name}</p>
                        <span className="text-xs text-dark-500">{new Date(review.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex mb-2">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`h-3.5 w-3.5 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-dark-700'}`} />
                        ))}
                      </div>
                      <p className="text-dark-300 text-sm">{review.comment}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default ItemDetailPage;
