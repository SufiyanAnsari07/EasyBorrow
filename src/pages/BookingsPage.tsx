import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Star, MessageCircle, CheckCircle, XCircle, AlertTriangle, X, Package } from 'lucide-react';
import { bookingsAPI, reviewsAPI, complaintsAPI } from '../services/api';
import { useAuthStore } from '../stores/authStore';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25',
  approved: 'bg-accent-500/15 text-accent-400 border-accent-500/25',
  active: 'bg-green-500/15 text-green-400 border-green-500/25',
  completed: 'bg-dark-600 text-dark-300 border-dark-600',
  cancelled: 'bg-red-500/15 text-red-400 border-red-500/25',
  rejected: 'bg-red-500/15 text-red-400 border-red-500/25',
};

const statusLabels: Record<string, string> = {
  pending: 'Pending owner review',
  approved: 'Accepted',
  active: 'Active',
  completed: 'Completed',
  cancelled: 'Cancelled',
  rejected: 'Rejected',
};

const Modal = ({ onClose, title, children }: { onClose: () => void; title: string; children: React.ReactNode }) => (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <div className="glass-card p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-in">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-white">{title}</h2>
        <button onClick={onClose} className="p-2 hover:bg-dark-800 rounded-lg transition-colors text-dark-400 hover:text-white"><X className="h-4 w-4" /></button>
      </div>
      {children}
    </div>
  </div>
);

const BookingsPage = () => {
  const { user } = useAuthStore();
  const [bookings, setBookings] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [reviewingBooking, setReviewingBooking] = useState<any>(null);
  const [reviewData, setReviewData] = useState({ type: 'item', rating: 5, comment: '' });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [complainingBooking, setComplainingBooking] = useState<any>(null);
  const [complaintData, setComplaintData] = useState({ type: 'other', subject: '', description: '' });
  const [complaintEvidence, setComplaintEvidence] = useState<FileList | null>(null);
  const [isSubmittingComplaint, setIsSubmittingComplaint] = useState(false);

  useEffect(() => { fetchBookings(); }, [activeTab]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (!document.hidden) fetchBookings(false);
    }, 10000);

    return () => window.clearInterval(intervalId);
  }, [activeTab]);

  const fetchBookings = async (showLoader = true) => {
    try {
      if (showLoader) setIsLoading(true);
      const params = activeTab !== 'all' ? { status: activeTab } : {};
      const response = await bookingsAPI.getUserBookings(params);
      setBookings(response.data.data.bookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      if (showLoader) setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (bookingId: string, status: string) => {
    try {
      await bookingsAPI.updateBookingStatus(bookingId, { status });
      fetchBookings();
      setSelectedBooking(null);
    } catch (error) { console.error('Error updating booking:', error); }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingBooking) return;
    try {
      setIsSubmittingReview(true);
      await reviewsAPI.createReview({ bookingId: reviewingBooking._id, type: 'item', rating: reviewData.rating, comment: reviewData.comment });
      setReviewingBooking(null);
      setReviewData({ type: 'item', rating: 5, comment: '' });
      fetchBookings();
    } catch (error: any) { alert(error.response?.data?.message || 'Error submitting review'); }
    finally { setIsSubmittingReview(false); }
  };

  const handleSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complainingBooking) return;
    try {
      setIsSubmittingComplaint(true);
      const formDataToSend = new FormData();
      const defendantId = complainingBooking.borrower._id === user?._id ? complainingBooking.lender._id : complainingBooking.borrower._id;
      formDataToSend.append('defendantId', defendantId);
      formDataToSend.append('bookingId', complainingBooking._id);
      formDataToSend.append('type', complaintData.type);
      formDataToSend.append('subject', complaintData.subject);
      formDataToSend.append('description', complaintData.description);
      if (complaintEvidence) Array.from(complaintEvidence).forEach(f => formDataToSend.append('evidence', f));
      await complaintsAPI.createComplaint(formDataToSend);
      setComplainingBooking(null);
      setComplaintData({ type: 'other', subject: '', description: '' });
      setComplaintEvidence(null);
      fetchBookings();
    } catch (error: any) { alert(error.response?.data?.message || 'Error filing complaint'); }
    finally { setIsSubmittingComplaint(false); }
  };

  const tabs = ['all', 'pending', 'approved', 'rejected', 'active', 'completed'];

  return (
    <div className="min-h-screen pt-20">
      <div className="border-b border-dark-800 bg-dark-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-white mb-1">My Bookings</h1>
          <p className="text-dark-400">Manage your rental bookings and requests</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Bar */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize ${
                activeTab === tab
                  ? 'bg-accent-500 text-white'
                  : 'bg-dark-900 border border-dark-700 text-dark-300 hover:border-dark-600 hover:text-white'
              }`}
            >
              {tab === 'all' ? 'All Bookings' : statusLabels[tab] || tab}
            </button>
          ))}
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => <div key={i} className="glass-card h-72 animate-pulse" />)}
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-dark-800 border border-dark-700 flex items-center justify-center mx-auto mb-4">
              <Package className="h-8 w-8 text-dark-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No bookings found</h3>
            <p className="text-dark-400 mb-5">You haven't made any bookings yet.</p>
            <Link to="/items" className="btn-accent">Browse Items</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {bookings.map((booking: any) => {
              const isBorrower = booking.borrower._id === user?._id;
              const otherParty = isBorrower ? booking.lender : booking.borrower;
              const canReview = isBorrower && booking.status === 'completed' && !booking.userActions?.hasReviewed;
              const canComplain = isBorrower && booking.status === 'completed' && !booking.userActions?.hasComplained;
              return (
                <div key={booking._id} className="glass-card overflow-hidden flex flex-col">
                  <div className="relative">
                    <img src={booking.item.images?.[0] || 'https://images.pexels.com/photos/230544/pexels-photo-230544.jpeg'} alt={booking.item.title} className="w-full h-44 object-cover" />
                    <div className="absolute top-3 left-3 right-3 flex justify-between">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[booking.status] || statusColors.pending} capitalize`}>
                        {statusLabels[booking.status] || booking.status}
                      </span>
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-dark-950/80 text-dark-200 border border-dark-700">
                        {isBorrower ? 'Borrowing' : 'Lending'}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="font-semibold text-white mb-2">{booking.item.title}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-dark-400 mb-1">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{new Date(booking.startDate).toLocaleDateString()} – {new Date(booking.endDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-dark-400 mb-3">
                      <span>{booking.pricing?.totalDays} days</span>
                      <span className="font-semibold text-white">₹{booking.pricing?.totalAmount?.toLocaleString()}</span>
                    </div>

                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-7 h-7 rounded-full bg-dark-800 border border-dark-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {otherParty.profileImage
                          ? <img src={otherParty.profileImage} alt="" className="w-full h-full object-cover" />
                          : <span className="text-xs text-dark-300">{otherParty.name.charAt(0)}</span>
                        }
                      </div>
                      <div>
                        <p className="text-sm text-white">{otherParty.name}</p>
                        <p className="text-xs text-dark-400">{isBorrower ? 'Lender' : 'Borrower'}</p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-auto flex-wrap">
                      {booking.status === 'pending' && !isBorrower && (
                        <>
                          <button onClick={() => handleStatusUpdate(booking._id, 'approved')} className="flex-1 py-1.5 rounded-lg text-xs font-medium bg-green-500/15 text-green-400 border border-green-500/25 hover:bg-green-500/25 transition-colors">Approve</button>
                          <button onClick={() => handleStatusUpdate(booking._id, 'rejected')} className="flex-1 py-1.5 rounded-lg text-xs font-medium bg-red-500/15 text-red-400 border border-red-500/25 hover:bg-red-500/25 transition-colors">Reject</button>
                        </>
                      )}
                      {booking.status === 'approved' && !isBorrower && (
                        <button onClick={() => handleStatusUpdate(booking._id, 'active')} className="flex-1 py-1.5 rounded-lg text-xs font-medium bg-accent-500/15 text-accent-400 border border-accent-500/25 hover:bg-accent-500/25 transition-colors">Mark Picked Up</button>
                      )}
                      {booking.status === 'active' && !isBorrower && (
                        <button onClick={() => handleStatusUpdate(booking._id, 'completed')} className="flex-1 py-1.5 rounded-lg text-xs font-medium bg-green-500/15 text-green-400 border border-green-500/25 hover:bg-green-500/25 transition-colors">Mark Returned</button>
                      )}
                      {booking.status === 'completed' && isBorrower && (
                        <>
                          <button
                            onClick={() => { if (canReview) { setReviewData({ type: 'item', rating: 5, comment: '' }); setReviewingBooking(booking); } }}
                            disabled={!canReview}
                            className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium bg-accent-500/15 text-accent-400 border border-accent-500/25 hover:bg-accent-500/25 transition-colors disabled:opacity-45 disabled:cursor-not-allowed disabled:hover:bg-accent-500/15"
                          >
                            <Star className="h-3 w-3" /> {booking.userActions?.hasReviewed ? 'Reviewed' : 'Review'}
                          </button>
                          <button
                            onClick={() => { if (canComplain) { setComplaintData({ type: 'other', subject: '', description: '' }); setComplaintEvidence(null); setComplainingBooking(booking); } }}
                            disabled={!canComplain}
                            className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium bg-red-500/15 text-red-400 border border-red-500/25 hover:bg-red-500/25 transition-colors disabled:opacity-45 disabled:cursor-not-allowed disabled:hover:bg-red-500/15"
                          >
                            <AlertTriangle className="h-3 w-3" /> {booking.userActions?.hasComplained ? 'Complaint Filed' : 'Complaint'}
                          </button>
                        </>
                      )}
                      <button onClick={() => setSelectedBooking(booking)} className="p-1.5 rounded-lg border border-dark-700 text-dark-400 hover:text-white hover:border-dark-600 transition-colors">
                        <MessageCircle className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {reviewingBooking && (
        <Modal title="Submit Review" onClose={() => { setReviewingBooking(null); setReviewData({ type: 'item', rating: 5, comment: '' }); }}>
          <form onSubmit={handleSubmitReview} className="space-y-4">
            <div>
              <label className="block text-sm text-dark-300 mb-2">Review Type</label>
              <select value="item" className="input-dark" disabled>
                <option value="item" className="bg-dark-900">Review Item</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-dark-300 mb-2">Rating</label>
              <div className="flex gap-2">
                {[1,2,3,4,5].map(r => (
                  <button key={r} type="button" onClick={() => setReviewData(p => ({ ...p, rating: r }))}
                    className={`w-10 h-10 rounded-lg border transition-all text-sm font-bold ${reviewData.rating >= r ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40' : 'bg-dark-900 text-dark-500 border-dark-700'}`}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm text-dark-300 mb-2">Comment <span className="text-dark-500">(Optional)</span></label>
              <textarea value={reviewData.comment} onChange={(e) => setReviewData(p => ({ ...p, comment: e.target.value }))} placeholder="Share your experience..." rows={4} className="input-dark resize-none" maxLength={500} />
              <p className="text-xs text-dark-500 mt-1">{reviewData.comment.length}/500</p>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => { setReviewingBooking(null); setReviewData({ type: 'item', rating: 5, comment: '' }); }} className="btn-ghost flex-1 !py-2.5 text-sm">Cancel</button>
              <button type="submit" disabled={isSubmittingReview} className="btn-accent flex-1 !py-2.5 text-sm">{isSubmittingReview ? 'Submitting...' : 'Submit Review'}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Complaint Modal */}
      {complainingBooking && (
        <Modal title="File a Complaint" onClose={() => { setComplainingBooking(null); setComplaintData({ type: 'other', subject: '', description: '' }); setComplaintEvidence(null); }}>
          <div className="mb-4 p-3 rounded-xl bg-red-500/8 border border-red-500/15">
            <p className="text-sm text-dark-300"><span className="text-dark-400">Booking:</span> {complainingBooking.item.title}</p>
            <p className="text-sm text-dark-300"><span className="text-dark-400">Against:</span> {complainingBooking.borrower._id === user?._id ? complainingBooking.lender.name : complainingBooking.borrower.name}</p>
          </div>
          <form onSubmit={handleSubmitComplaint} className="space-y-4">
            <div>
              <label className="block text-sm text-dark-300 mb-2">Type *</label>
              <select value={complaintData.type} onChange={(e) => setComplaintData(p => ({ ...p, type: e.target.value }))} className="input-dark" required>
                {['item_damage','late_return','no_show','inappropriate_behavior','payment_issue','other'].map(t => (
                  <option key={t} value={t} className="bg-dark-900 capitalize">{t.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-dark-300 mb-2">Subject *</label>
              <input type="text" value={complaintData.subject} onChange={(e) => setComplaintData(p => ({ ...p, subject: e.target.value }))} placeholder="Brief description of the issue" className="input-dark" required maxLength={100} />
            </div>
            <div>
              <label className="block text-sm text-dark-300 mb-2">Description *</label>
              <textarea value={complaintData.description} onChange={(e) => setComplaintData(p => ({ ...p, description: e.target.value }))} placeholder="Provide detailed information..." rows={5} className="input-dark resize-none" required maxLength={1000} />
              <p className="text-xs text-dark-500 mt-1">{complaintData.description.length}/1000</p>
            </div>
            <div>
              <label className="block text-sm text-dark-300 mb-2">Evidence <span className="text-dark-500">(Optional)</span></label>
              <input type="file" multiple accept=".jpg,.jpeg,.png,.pdf,.doc,.docx" onChange={(e) => setComplaintEvidence(e.target.files)} className="input-dark text-dark-300 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-accent-500/15 file:text-accent-400 hover:file:bg-accent-500/25" />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => { setComplainingBooking(null); setComplaintData({ type: 'other', subject: '', description: '' }); setComplaintEvidence(null); }} className="btn-ghost flex-1 !py-2.5 text-sm">Cancel</button>
              <button type="submit" disabled={isSubmittingComplaint} className="flex-1 !py-2.5 text-sm inline-flex items-center justify-center px-4 font-semibold rounded-xl bg-red-600 hover:bg-red-700 text-white transition-all">{isSubmittingComplaint ? 'Filing...' : 'File Complaint'}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <Modal title="Booking Details" onClose={() => setSelectedBooking(null)}>
          <div className="space-y-4">
            <div className="bg-dark-900 rounded-xl p-4 border border-dark-800">
              <h3 className="font-semibold text-white mb-1">{selectedBooking.item.title}</h3>
              <p className="text-xs text-dark-500">ID: {selectedBooking._id}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Start Date', value: new Date(selectedBooking.startDate).toLocaleDateString() },
                { label: 'End Date', value: new Date(selectedBooking.endDate).toLocaleDateString() },
                { label: 'Duration', value: `${selectedBooking.pricing?.totalDays} days` },
                { label: 'Status', value: statusLabels[selectedBooking.status] || selectedBooking.status },
              ].map(({ label, value }) => (
                <div key={label} className="bg-dark-900 rounded-xl p-3 border border-dark-800">
                  <p className="text-xs text-dark-400 mb-1">{label}</p>
                  <p className="text-white font-medium capitalize">{value}</p>
                </div>
              ))}
            </div>
            <div className="bg-dark-900 rounded-xl p-4 border border-dark-800">
              <p className="text-xs text-dark-400 mb-1">Total Amount</p>
              <p className="text-2xl font-bold text-accent-400">₹{selectedBooking.pricing?.totalAmount?.toLocaleString()}</p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default BookingsPage;
