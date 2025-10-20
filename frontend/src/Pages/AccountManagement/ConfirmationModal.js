import React, { useState } from 'react';
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  formData 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await onConfirm();
    } catch (err) {
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
        <div className="flex justify-between items-start mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Confirm Account Details</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 disabled:opacity-50"
            disabled={isLoading}
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Account Details Section */}
        <div className="space-y-3">
          <div className="flex items-center">
            <span className="text-sm font-medium text-gray-500 w-32">Employee Number:</span>
            <span className="text-sm text-gray-900">{formData.employeeNumber}</span>
          </div>
          <div className="flex items-center">
            <span className="text-sm font-medium text-gray-500 w-32">Name:</span>
            <span className="text-sm text-gray-900">{formData.firstName} {formData.lastName}</span>
          </div>
          <div className="flex items-center">
            <span className="text-sm font-medium text-gray-500 w-32">Email:</span>
            <span className="text-sm text-gray-900 break-all">{formData.email}</span>
          </div>
          <div className="flex items-center">
            <span className="text-sm font-medium text-gray-500 w-32">Role:</span>
            <span className="text-sm text-gray-900 capitalize">{formData.role}</span>
          </div>

          <div className="mt-4 border-t border-gray-200 pt-4">
            <p className="text-sm text-gray-500 italic">
              The password fields are hidden for security reasons.
            </p>
          </div>

          {/* Error message display */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 rounded-md flex items-start">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2 mt-0.5" />
              <span className="text-sm text-red-600">{error}</span>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className={`px-4 py-2 text-sm font-medium text-white rounded-md flex items-center justify-center ${isLoading ? 'bg-green-500' : 'bg-green-600 hover:bg-green-700'}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
