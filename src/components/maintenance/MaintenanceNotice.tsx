import React from 'react';
import { AlertTriangle, Clock, Wrench } from 'lucide-react';

interface MaintenanceNoticeProps {
  message?: string;
  estimatedDowntime?: string;
}

const MaintenanceNotice: React.FC<MaintenanceNoticeProps> = ({ 
  message = 'System is currently under maintenance. Please try again later.',
  estimatedDowntime = 'We apologize for the inconvenience. The system will be back online shortly.'
}) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center">
              <Wrench className="w-10 h-10 text-orange-600" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-yellow-800" />
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Under Maintenance
        </h1>

        {/* Message */}
        <p className="text-gray-600 mb-6 leading-relaxed">
          {message}
        </p>

        {/* Estimated Downtime */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center text-sm text-gray-500 mb-2">
            <Clock className="w-4 h-4 mr-2" />
            Status Update
          </div>
          <p className="text-sm text-gray-700">
            {estimatedDowntime}
          </p>
        </div>

        {/* Refresh Button */}
        <button
          onClick={() => window.location.reload()}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Check Again
        </button>

        {/* Contact Info */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Need immediate assistance?{' '}
            <a 
              href="mailto:support@EASYBORROW.com" 
              className="text-blue-600 hover:text-blue-700 underline"
            >
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceNotice;