import React, { useState, useEffect } from 'react';
import { AlertTriangle, MessageCircle, Calendar, FileText, Plus, Send } from 'lucide-react';
import { complaintsAPI } from '../services/api';
import { useAuthStore } from '../stores/authStore';

const ComplaintsPage = () => {
  const { user } = useAuthStore();
  const [complaints, setComplaints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('filed');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  useEffect(() => {
    fetchComplaints();
  }, [activeTab]);

  const fetchComplaints = async () => {
    try {
      setIsLoading(true);
      const response = await complaintsAPI.getUserComplaints({ type: activeTab });
      setComplaints(response.data.data.complaints);
    } catch (error) {
      console.error('Error fetching complaints:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800';
      case 'investigating': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getComplaintRelation = (complaint: any) => {
    if (complaint.type === 'item_damage') {
      return {
        label: 'Related to Item',
        detail: complaint.item?.title ? `Item: ${complaint.item.title}` : 'Item complaint',
        className: 'bg-purple-100 text-purple-800'
      };
    }

    return {
      label: 'Related to User',
      detail: activeTab === 'filed'
        ? `Against: ${complaint.defendant?.name || 'User'}`
        : `Filed by: ${complaint.complainant?.name || 'User'}`,
      className: 'bg-blue-100 text-blue-800'
    };
  };

  const tabs = [
    { id: 'filed', label: 'Filed by Me' },
    { id: 'received', label: 'Against Me' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Complaints</h1>
          <p className="text-gray-600">Manage your complaints and disputes</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          File Complaint
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Complaints List */}
      {isLoading ? (
        <div className="space-y-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
              <div className="h-16 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : complaints.length === 0 ? (
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No complaints found</h3>
          <p className="text-gray-600 mb-6">
            {activeTab === 'filed' 
              ? "You haven't filed any complaints yet." 
              : "No complaints have been filed against you."
            }
          </p>
          {activeTab === 'filed' && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              File Your First Complaint
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {complaints.map((complaint: any) => {
            const relation = getComplaintRelation(complaint);

            return (
            <div key={complaint._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(complaint.status)}`}>
                      {complaint.status.charAt(0).toUpperCase() + complaint.status.slice(1)}
                    </span>
                    <span className={`text-xs font-medium ${getPriorityColor(complaint.priority)}`}>
                      {complaint.priority.toUpperCase()} PRIORITY
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${relation.className}`}>
                      {relation.label}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{complaint.subject}</h3>
                  <p className="text-sm text-gray-600 mb-2">{relation.detail}</p>
                  
                  <div className="flex items-center text-sm text-gray-600 mb-3">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>Filed on {new Date(complaint.createdAt).toLocaleDateString()}</span>
                  </div>
                  
                  <p className="text-gray-700 mb-4 line-clamp-2">{complaint.description}</p>
                  
                  {/* Other Party */}
                  <div className="flex items-center mb-4">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                      {activeTab === 'filed' ? (
                        complaint.defendant?.profileImage ? (
                          <img src={complaint.defendant.profileImage} alt={complaint.defendant.name} className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <span className="text-xs font-medium">{complaint.defendant?.name?.charAt(0)}</span>
                        )
                      ) : (
                        complaint.complainant?.profileImage ? (
                          <img src={complaint.complainant.profileImage} alt={complaint.complainant.name} className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <span className="text-xs font-medium">{complaint.complainant?.name?.charAt(0)}</span>
                        )
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {activeTab === 'filed' ? complaint.defendant?.name : complaint.complainant?.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {activeTab === 'filed' ? 'Defendant' : 'Complainant'}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setSelectedComplaint(complaint)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center text-sm"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    View Details
                  </button>
                </div>
              </div>
              
              {/* Type Badge */}
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  <FileText className="h-3 w-3 mr-1" />
                  {complaint.type.replace('_', ' ').toUpperCase()}
                </span>
                
                {complaint.messages && complaint.messages.length > 0 && (
                  <span className="text-xs text-gray-500">
                    {complaint.messages.length} message{complaint.messages.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
            );
          })}
        </div>
      )}

      {/* Create Complaint Modal */}
      {showCreateForm && (
        <CreateComplaintModal 
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            setShowCreateForm(false);
            fetchComplaints();
          }}
        />
      )}

      {/* Complaint Detail Modal */}
      {selectedComplaint && (
        <ComplaintDetailModal
          complaint={selectedComplaint}
          onClose={() => setSelectedComplaint(null)}
          onUpdate={fetchComplaints}
        />
      )}
    </div>
  );
};

// Create Complaint Modal Component
const CreateComplaintModal = ({ onClose, onSuccess }: any) => {
  const [formData, setFormData] = useState({
    defendantId: '',
    bookingId: '',
    type: 'other',
    subject: '',
    description: ''
  });
  const [evidence, setEvidence] = useState<FileList | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const complaintTypes = [
    { value: 'item_damage', label: 'Item Damage' },
    { value: 'late_return', label: 'Late Return' },
    { value: 'no_show', label: 'No Show' },
    { value: 'inappropriate_behavior', label: 'Inappropriate Behavior' },
    { value: 'payment_issue', label: 'Payment Issue' },
    { value: 'other', label: 'Other' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('defendantId', formData.defendantId);
      formDataToSend.append('type', formData.type);
      formDataToSend.append('subject', formData.subject);
      formDataToSend.append('description', formData.description);
      
      if (formData.bookingId) {
        formDataToSend.append('bookingId', formData.bookingId);
      }
      
      if (evidence) {
        Array.from(evidence).forEach((file) => {
          formDataToSend.append('evidence', file);
        });
      }

      await complaintsAPI.createComplaint(formDataToSend);
      onSuccess();
    } catch (error) {
      console.error('Error creating complaint:', error);
      alert('Failed to create complaint');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">File a Complaint</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Complaint Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                {complaintTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject *
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                maxLength={100}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                maxLength={1000}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Evidence (Optional)
              </label>
              <input
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                onChange={(e) => setEvidence(e.target.files)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Upload up to 3 files (images, PDFs, documents)
              </p>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Filing...' : 'File Complaint'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Complaint Detail Modal Component
const ComplaintDetailModal = ({ complaint, onClose, onUpdate }: any) => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSending(true);
    try {
      await complaintsAPI.addComplaintMessage(complaint._id, { message });
      setMessage('');
      onUpdate();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Complaint Details</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">{complaint.subject}</h3>
              <p className="text-gray-700">{complaint.description}</p>
            </div>
            
            {/* Messages */}
            <div>
              <h4 className="font-medium text-gray-900 mb-4">Messages</h4>
              <div className="space-y-4 max-h-60 overflow-y-auto">
                {complaint.messages?.map((msg: any, index: number) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium">
                        {msg.sender?.name?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-sm">{msg.sender?.name}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(msg.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-gray-700 text-sm">{msg.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Send Message */}
            <form onSubmit={handleSendMessage} className="flex space-x-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="submit"
                disabled={isSending || !message.trim()}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplaintsPage;
