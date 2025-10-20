import React, { useState } from 'react';
import {ExclamationTriangleIcon, UserMinusIcon, TrashIcon } from '@heroicons/react/24/outline';

const DeleteAccountModal = ({ isOpen, onClose, account, onConfirm }) => {
  const [deleteType, setDeleteType] = useState('temporary'); // 'temporary' or 'permanent'
  
  if (!isOpen || !account) return null;

  const handleConfirm = () => {
    onConfirm(deleteType);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" aria-hidden="true"></div>
        <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
          <div className="sm:flex sm:items-start">
            <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
            </div>
            <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
              <h3 className="text-base font-semibold leading-6 text-gray-900">
                Delete Account
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  Choose how you want to handle the account for {account.firstName} {account.lastName}:
                </p>
              </div>
              
              {/* Delete Type Selection */}
              <div className="mt-4 space-y-3">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="temporary-delete"
                      name="delete-type"
                      type="radio"
                      value="temporary"
                      checked={deleteType === 'temporary'}
                      onChange={(e) => setDeleteType(e.target.value)}
                      className="focus:ring-red-500 h-4 w-4 text-red-600 border-gray-300"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="temporary-delete" className="font-medium text-gray-700 cursor-pointer">
                      <div className="flex items-center">
                        <UserMinusIcon className="h-4 w-4 text-orange-500 mr-2" />
                        Temporarily Deactivate
                      </div>
                    </label>
                    <p className="text-gray-500 text-xs mt-1">
                      Account will be deactivated but can be restored later. User cannot log in.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="permanent-delete"
                      name="delete-type"
                      type="radio"
                      value="permanent"
                      checked={deleteType === 'permanent'}
                      onChange={(e) => setDeleteType(e.target.value)}
                      className="focus:ring-red-500 h-4 w-4 text-red-600 border-gray-300"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="permanent-delete" className="font-medium text-gray-700 cursor-pointer">
                      <div className="flex items-center">
                        <TrashIcon className="h-4 w-4 text-red-500 mr-2" />
                        Permanently Delete
                      </div>
                    </label>
                    <p className="text-gray-500 text-xs mt-1">
                      Account will be permanently removed from the system. This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className={`inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm sm:ml-3 sm:w-auto ${
                deleteType === 'temporary' 
                  ? 'bg-red-600 hover:bg-red-500' 
                  : 'bg-red-600 hover:bg-red-500'
              }`}
              onClick={handleConfirm}
            >
              {deleteType === 'temporary' ? 'Deactivate Account' : 'Permanently Delete'}
            </button>
            <button
              type="button"
              className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteAccountModal; 