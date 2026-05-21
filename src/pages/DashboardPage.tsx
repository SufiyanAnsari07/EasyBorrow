import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Package, Star, DollarSign, Eye, Edit, Trash2, CheckCircle, XCircle, Clock, TrendingUp, Calendar, CreditCard, History, Wallet, CalendarPlus, X } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { itemsAPI, bookingsAPI, authAPI } from '../services/api';

const statusColors: Record<string, string> = {
  completed: 'bg-green-500/15 text-green-400 border-green-500/25',
  active: 'bg-accent-500/15 text-accent-400 border-accent-500/25',
  approved: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25',
  rejected: 'bg-red-500/15 text-red-400 border-red-500/25',
  pending: 'bg-dark-600 text-dark-300 border-dark-600',
  cancelled: 'bg-red-500/15 text-red-400 border-red-500/25',
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, fetchProfile } = useAuthStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [myItems, setMyItems] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [walletAmount, setWalletAmount] = useState('');
  const [isAddingWallet, setIsAddingWallet] = useState(false);
  const [extendRentalModal, setExtendRentalModal] = useState<{ isOpen: boolean; item: any | null; booking: any | null }>({ isOpen: false, item: null, booking: null });
  const [newEndDate, setNewEndDate] = useState('');
  const [stats, setStats] = useState({ totalItems: 0, activeBookings: 0, totalEarnings: 0, pendingRequests: 0 });

  useEffect(() => { if (!user) return; fetchDashboardData(); }, [user]);

  useEffect(() => {
    const handleVisibilityChange = () => { if (!document.hidden && user) fetchDashboardData(); };
    const handleFocus = () => { if (user) fetchDashboardData(); };
    const intervalId = window.setInterval(() => {
      if (!document.hidden && user) fetchDashboardData(false);
    }, 10000);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [user]);

  const fetchDashboardData = async (showLoader = true) => {
    try {
      if (showLoader) setIsLoading(true);
      const [itemsRes, bookingsRes, allBookingsRes, requestsRes] = await Promise.allSettled([
        itemsAPI.getUserItems(),
        bookingsAPI.getUserBookings({ type: 'borrower' }),
        bookingsAPI.getUserBookings({ type: 'all' }),
        bookingsAPI.getUserBookings({ type: 'lender', status: 'pending' })
      ]);

      const items = itemsRes.status === 'fulfilled' ? itemsRes.value.data.data.items : [];
      const bookings = bookingsRes.status === 'fulfilled' ? bookingsRes.value.data.data.bookings : [];
      const allUserBookings = allBookingsRes.status === 'fulfilled' ? allBookingsRes.value.data.data.bookings : [];
      const pendingRequests = requestsRes.status === 'fulfilled' ? requestsRes.value.data.data.bookings : [];

      setMyItems(items);
      setMyBookings(bookings);
      setAllBookings(allUserBookings);
      setRequests(pendingRequests);
      setStats({
        totalItems: items.length,
        activeBookings: bookings.filter((b: any) => b.status === 'active').length,
        totalEarnings: user?.stats?.totalEarnings || 0,
        pendingRequests: pendingRequests.length
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      if (showLoader) setIsLoading(false);
    }
  };

  const handleBookingAction = async (bookingId: string, action: 'approve' | 'reject') => {
    try {
      await bookingsAPI.updateBookingStatus(bookingId, { status: action === 'approve' ? 'approved' : 'rejected' });
      fetchDashboardData();
    } catch (error) { console.error('Error updating booking:', error); }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!window.confirm('Delete this item? This cannot be undone.')) return;
    try {
      await itemsAPI.deleteItem(itemId);
      fetchDashboardData();
      await fetchProfile();
    } catch (error: any) { alert(error.response?.data?.message || 'Failed to delete item'); }
  };

  const handleExtendRentalSubmit = async () => {
    if (!extendRentalModal.booking || !newEndDate) return;
    try {
      await itemsAPI.extendRental({ bookingId: extendRentalModal.booking._id, newEndDate });
      setExtendRentalModal({ isOpen: false, item: null, booking: null });
      setNewEndDate('');
      await fetchProfile();
      fetchDashboardData();
    } catch (error: any) { alert(error.response?.data?.message || 'Error extending rental'); }
  };

  const handleAddToWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletAmount || parseFloat(walletAmount) <= 0) { alert('Please enter a valid amount'); return; }
    try {
      setIsAddingWallet(true);
      await authAPI.addToWallet({ amount: parseFloat(walletAmount) });
      await fetchProfile();
      setWalletAmount('');
      fetchDashboardData();
    } catch (error: any) { alert(error.response?.data?.message || 'Failed to add money to wallet'); }
    finally { setIsAddingWallet(false); }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'items', label: 'My Items', icon: Package },
    { id: 'bookings', label: 'My Bookings', icon: Calendar },
    { id: 'history', label: 'History', icon: History },
    { id: 'wallet', label: 'Wallet', icon: Wallet },
    { id: 'requests', label: 'Requests', icon: Clock },
  ];

  return (
    <div className="min-h-screen pt-20">
      {/* Header */}
      <div className="border-b border-dark-800 bg-dark-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-white mb-1">Dashboard</h1>
          <p className="text-dark-400">Welcome back, <span className="text-dark-200">{user?.name}</span>!</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Wallet Balance', value: `₹${(user?.wallet?.balance || 0).toLocaleString()}`, icon: DollarSign, color: 'text-green-400', bg: 'bg-green-500/10', tab: 'wallet' },
            { label: 'My Items', value: stats.totalItems, icon: Package, color: 'text-accent-400', bg: 'bg-accent-500/10', tab: 'items' },
            { label: 'Active Bookings', value: stats.activeBookings, icon: Calendar, color: 'text-cyan-400', bg: 'bg-cyan-500/10', tab: 'bookings' },
            { label: 'Total Earnings', value: `₹${stats.totalEarnings.toLocaleString()}`, icon: TrendingUp, color: 'text-yellow-400', bg: 'bg-yellow-500/10', tab: 'history' },
          ].map(({ label, value, icon: Icon, color, bg, tab }) => (
            <button key={label} onClick={() => setActiveTab(tab)} className="glass-card p-5 text-left hover:border-accent-500/20 transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
              </div>
              <p className={`text-2xl font-bold ${color} mb-1`}>{value}</p>
              <p className="text-xs text-dark-400">{label}</p>
            </button>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="glass-card p-5 mb-8">
          <h2 className="text-sm font-semibold text-dark-300 mb-4 uppercase tracking-wider">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { to: '/add-item', icon: Plus, label: 'List Item', sub: 'Add item to rent', color: 'text-accent-400' },
              { to: '/items', icon: Package, label: 'Browse', sub: 'Find items to rent', color: 'text-cyan-400' },
              { to: '/bookings', icon: Calendar, label: 'Bookings', sub: 'Manage rentals', color: 'text-yellow-400' },
              { to: '/profile', icon: Star, label: 'Profile', sub: 'Manage account', color: 'text-green-400' },
            ].map(({ to, icon: Icon, label, sub, color }) => (
              <Link key={to} to={to} className="flex items-center gap-3 p-3 rounded-xl border border-dark-700 hover:border-dark-600 hover:bg-dark-900 transition-all">
                <div className="w-9 h-9 rounded-lg bg-dark-800 flex items-center justify-center flex-shrink-0">
                  <Icon className={`h-4 w-4 ${color}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{label}</p>
                  <p className="text-xs text-dark-400">{sub}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="glass-card overflow-hidden">
          <div className="border-b border-dark-800 overflow-x-auto">
            <nav className="flex min-w-max px-2">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-2 py-4 px-4 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                    activeTab === id
                      ? 'border-accent-500 text-accent-400'
                      : 'border-transparent text-dark-400 hover:text-dark-200 hover:border-dark-600'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                  {id === 'requests' && stats.pendingRequests > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                      {stats.pendingRequests}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div>
                <h3 className="text-white font-semibold mb-4">Recent Activity</h3>
                {myBookings.length === 0 ? (
                  <div className="text-center py-10">
                    <History className="h-10 w-10 text-dark-600 mx-auto mb-3" />
                    <p className="text-dark-400">No recent activity</p>
                    <Link to="/items" className="text-accent-400 hover:text-accent-300 text-sm mt-1 inline-block">Browse items to get started</Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myBookings.slice(0, 5).map((booking: any) => (
                      <div key={booking._id} className="flex items-center justify-between p-3 bg-dark-900 rounded-xl border border-dark-800">
                        <div className="flex items-center gap-3">
                          <img src={booking.item.images[0] || 'https://images.pexels.com/photos/230544/pexels-photo-230544.jpeg'} alt="" className="w-11 h-11 object-cover rounded-lg" />
                          <div>
                            <p className="font-medium text-white text-sm">{booking.item.title}</p>
                            <p className="text-xs text-dark-400">{new Date(booking.startDate).toLocaleDateString()} – {new Date(booking.endDate).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[booking.status] || statusColors.pending}`}>{booking.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* My Items Tab */}
            {activeTab === 'items' && (
              <div>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-white font-semibold">My Items ({myItems.length})</h3>
                  <Link to="/add-item" className="btn-accent !px-4 !py-2 text-sm flex items-center gap-1.5">
                    <Plus className="h-4 w-4" /> Add Item
                  </Link>
                </div>
                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => <div key={i} className="animate-pulse bg-dark-800 rounded-xl h-64" />)}
                  </div>
                ) : myItems.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-10 w-10 text-dark-600 mx-auto mb-3" />
                    <p className="text-white font-medium mb-1">No items listed yet</p>
                    <p className="text-dark-400 text-sm mb-4">Start earning by listing your first item</p>
                    <Link to="/add-item" className="btn-accent">List First Item</Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {myItems.map((item: any) => (
                      <div key={item._id} className="bg-dark-900 rounded-xl overflow-hidden border border-dark-800">
                        <img src={item.images[0] || 'https://images.pexels.com/photos/230544/pexels-photo-230544.jpeg'} alt={item.title} className="w-full h-40 object-cover" />
                        <div className="p-4">
                          <h4 className="font-medium text-white mb-2 truncate">{item.title}</h4>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-accent-400 font-bold">₹{item.dailyPrice}<span className="text-dark-400 text-xs font-normal">/day</span></span>
                            <div className="flex items-center gap-1">
                              <Star className="h-3.5 w-3.5 text-yellow-400 fill-current" />
                              <span className="text-xs text-dark-400">{item.rating.average.toFixed(1)}</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${item.rentalStatus?.isRented ? 'bg-red-500/15 text-red-400 border-red-500/25' : 'bg-green-500/15 text-green-400 border-green-500/25'}`}>
                              {item.rentalStatus?.isRented ? 'Rented' : 'Available'}
                            </span>
                            <div className="flex gap-1">
                              <Link to={`/items/${item._id}`} className="p-1.5 rounded-lg hover:bg-dark-800 text-dark-400 hover:text-white transition-colors"><Eye className="h-4 w-4" /></Link>
                              {item.rentalStatus?.isRented && (
                                <button onClick={() => { setExtendRentalModal({ isOpen: true, item, booking: item.rentalStatus.currentBooking }); setNewEndDate(item.rentalStatus.rentedUntil); }} className="p-1.5 rounded-lg hover:bg-dark-800 text-dark-400 hover:text-accent-400 transition-colors"><CalendarPlus className="h-4 w-4" /></button>
                              )}
                              <button onClick={() => navigate(`/add-item?edit=${item._id}`)} className="p-1.5 rounded-lg hover:bg-dark-800 text-dark-400 hover:text-green-400 transition-colors"><Edit className="h-4 w-4" /></button>
                              <button onClick={() => handleDeleteItem(item._id)} className="p-1.5 rounded-lg hover:bg-dark-800 text-dark-400 hover:text-red-400 transition-colors"><Trash2 className="h-4 w-4" /></button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* My Bookings Tab */}
            {activeTab === 'bookings' && (
              <div>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-white font-semibold">My Bookings ({myBookings.length})</h3>
                  <Link to="/bookings" className="text-sm text-accent-400 hover:text-accent-300 transition-colors flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" /> View All
                  </Link>
                </div>
                {isLoading ? (
                  <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-dark-800 rounded-xl animate-pulse" />)}</div>
                ) : myBookings.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="h-10 w-10 text-dark-600 mx-auto mb-3" />
                    <p className="text-white font-medium mb-1">No bookings yet</p>
                    <Link to="/items" className="btn-accent mt-3">Browse Items</Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myBookings.map((booking: any) => (
                      <div key={booking._id} className="flex items-center gap-4 p-4 bg-dark-900 rounded-xl border border-dark-800">
                        <img src={booking.item.images[0] || 'https://images.pexels.com/photos/230544/pexels-photo-230544.jpeg'} alt="" className="w-14 h-14 object-cover rounded-lg flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-white text-sm truncate">{booking.item.title}</h4>
                          <p className="text-xs text-dark-400">{new Date(booking.startDate).toLocaleDateString()} – {new Date(booking.endDate).toLocaleDateString()}</p>
                          <p className="text-xs text-dark-500">Owner: {booking.lender.name}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[booking.status] || statusColors.pending}`}>{booking.status}</span>
                          <p className="text-xs text-dark-400 mt-1">₹{(booking.totalAmount || booking.pricing?.totalAmount || 0).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
              <div>
                <h3 className="text-white font-semibold mb-5">Rental History</h3>
                {isLoading ? (
                  <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-dark-800 rounded-xl animate-pulse" />)}</div>
                ) : allBookings.length === 0 ? (
                  <div className="text-center py-12">
                    <History className="h-10 w-10 text-dark-600 mx-auto mb-3" />
                    <p className="text-dark-400">No rental history yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {allBookings.map((booking: any) => (
                      <div key={booking._id} className="flex items-center gap-4 p-4 bg-dark-900 rounded-xl border border-dark-800">
                        <img src={booking.item?.images?.[0] || 'https://images.pexels.com/photos/230544/pexels-photo-230544.jpeg'} alt="" className="w-14 h-14 object-cover rounded-lg flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-white text-sm truncate">{booking.item?.title}</h4>
                          <p className="text-xs text-dark-400">{booking.borrower?._id === user?._id ? 'Rented from' : 'Rented to'} {booking.borrower?._id === user?._id ? booking.lender?.name : booking.borrower?.name}</p>
                          <p className="text-xs text-dark-500">{new Date(booking.startDate).toLocaleDateString()} – {new Date(booking.endDate).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[booking.status] || statusColors.pending}`}>{booking.status}</span>
                          <p className="text-xs text-dark-400 mt-1">₹{booking.pricing?.totalAmount?.toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Wallet Tab */}
            {activeTab === 'wallet' && (
              <div>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-white font-semibold">Wallet</h3>
                  <div className="px-4 py-2 bg-green-500/10 rounded-xl border border-green-500/20">
                    <span className="text-green-400 font-bold">₹{(user?.wallet?.balance || 0).toLocaleString()}</span>
                    <span className="text-dark-400 text-xs ml-1">balance</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-dark-900 rounded-xl p-5 border border-dark-800">
                    <h4 className="text-white font-medium mb-4 flex items-center gap-2"><CreditCard className="h-4 w-4 text-accent-400" /> Add Money</h4>
                    <form onSubmit={handleAddToWallet} className="space-y-4">
                      <div>
                        <label className="block text-sm text-dark-300 mb-2">Amount (₹)</label>
                        <input type="number" value={walletAmount} onChange={(e) => setWalletAmount(e.target.value)} placeholder="Enter amount" min="1" className="input-dark" required />
                      </div>
                      <button type="submit" disabled={isAddingWallet || !walletAmount} className="btn-accent w-full !py-2.5 text-sm">
                        {isAddingWallet ? 'Adding...' : 'Add to Wallet'}
                      </button>
                    </form>
                  </div>
                  <div className="bg-dark-900 rounded-xl p-5 border border-dark-800">
                    <h4 className="text-white font-medium mb-4">Recent Transactions</h4>
                    <div className="space-y-2 max-h-56 overflow-y-auto">
                      {!user?.wallet?.transactions?.length ? (
                        <p className="text-dark-400 text-sm text-center py-4">No transactions yet</p>
                      ) : (
                        user.wallet.transactions.slice(-10).reverse().map((t: any, i: number) => (
                          <div key={i} className="flex justify-between items-center p-2.5 bg-dark-800 rounded-lg">
                            <div>
                              <p className="text-sm text-white">{t.description}</p>
                              <p className="text-xs text-dark-400">{new Date(t.date).toLocaleDateString()}</p>
                            </div>
                            <span className={`text-sm font-bold ${t.type === 'credit' ? 'text-green-400' : 'text-red-400'}`}>
                              {t.type === 'credit' ? '+' : '-'}₹{t.amount}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Requests Tab */}
            {activeTab === 'requests' && (
              <div>
                <h3 className="text-white font-semibold mb-5">Booking Requests ({requests.length})</h3>
                {isLoading ? (
                  <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-dark-800 rounded-xl animate-pulse" />)}</div>
                ) : requests.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="h-10 w-10 text-dark-600 mx-auto mb-3" />
                    <p className="text-dark-400">No pending requests</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {requests.map((request: any) => (
                      <div key={request._id} className="bg-dark-900 rounded-xl border border-dark-800 p-4">
                        <div className="flex items-start gap-4">
                          <img src={request.item.images[0] || 'https://images.pexels.com/photos/230544/pexels-photo-230544.jpeg'} alt="" className="w-14 h-14 object-cover rounded-lg flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-white text-sm">{request.item.title}</h4>
                            <p className="text-xs text-dark-400">By {request.borrower.name} · {new Date(request.startDate).toLocaleDateString()} – {new Date(request.endDate).toLocaleDateString()}</p>
                            {request.totalAmount && <p className="text-sm font-medium text-accent-400 mt-1">₹{request.totalAmount.toLocaleString()}</p>}
                            {request.messages?.[0]?.message && <p className="text-xs text-dark-300 mt-2 bg-dark-800 rounded-lg p-2">{request.messages[0].message}</p>}
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            <button onClick={() => handleBookingAction(request._id, 'approve')} className="flex items-center gap-1 px-3 py-1.5 bg-green-500/15 text-green-400 border border-green-500/25 rounded-lg hover:bg-green-500/25 transition-colors text-xs font-medium">
                              <CheckCircle className="h-3.5 w-3.5" /> Approve
                            </button>
                            <button onClick={() => handleBookingAction(request._id, 'reject')} className="flex items-center gap-1 px-3 py-1.5 bg-red-500/15 text-red-400 border border-red-500/25 rounded-lg hover:bg-red-500/25 transition-colors text-xs font-medium">
                              <XCircle className="h-3.5 w-3.5" /> Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Extend Rental Modal */}
      {extendRentalModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card p-6 w-full max-w-md animate-fade-in">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-white">Extend Rental Period</h3>
              <button onClick={() => setExtendRentalModal({ isOpen: false, item: null, booking: null })} className="p-2 hover:bg-dark-800 rounded-lg transition-colors text-dark-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="bg-dark-900 rounded-xl p-4 mb-5 space-y-1 border border-dark-800">
              <p className="text-sm text-dark-300"><span className="text-dark-400">Item:</span> {extendRentalModal.item?.title}</p>
              <p className="text-sm text-dark-300"><span className="text-dark-400">Currently ends:</span> {new Date(extendRentalModal.booking?.endDate).toLocaleDateString()}</p>
              <p className="text-sm text-dark-300"><span className="text-dark-400">Rented by:</span> {extendRentalModal.booking?.borrower?.name}</p>
            </div>
            <div className="mb-5">
              <label className="block text-sm text-dark-300 mb-2">New End Date</label>
              <input type="date" value={newEndDate} onChange={(e) => setNewEndDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className="input-dark" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setExtendRentalModal({ isOpen: false, item: null, booking: null })} className="btn-ghost flex-1 !py-2.5 text-sm">Cancel</button>
              <button onClick={handleExtendRentalSubmit} className="btn-accent flex-1 !py-2.5 text-sm">Extend Rental</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
