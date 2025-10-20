import React, { useState, useEffect } from 'react';
import { 
  PencilIcon, 
  TrashIcon,
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExclamationCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import EditAccountModal from './EditAccountModal';
import DeleteAccountModal from './DeleteAccountModal';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ViewAccounts = ({ accounts: initialAccounts, onAccountsUpdate }) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [accounts, setAccounts] = useState(initialAccounts);
  const [error, setError] = useState(null);
  const accountsPerPage = 10;

  useEffect(() => {
    setAccounts(initialAccounts);
  }, [initialAccounts]);

  const handleEditClick = (account) => {
    setSelectedAccount(account);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (account) => {
    setSelectedAccount(account);
    setIsDeleteModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsEditModalOpen(false);
    setIsDeleteModalOpen(false);
    setSelectedAccount(null);
    setError(null);
  };

  const handleSaveChanges = async (updatedAccount) => {
    try {
      console.log('Saving account changes:', {
        accountId: selectedAccount._id,
        updatedData: updatedAccount
      });

      const response = await fetch(`${process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000')}/api/accounts/${selectedAccount._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedAccount)
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Backend error:', errorData);
        throw new Error(errorData.error || 'Failed to update account');
      }

      const result = await response.json();
      console.log('Update successful:', result);

      const updatedAccounts = accounts.map(acc => 
        acc._id === selectedAccount._id ? result.account : acc
      );
      
      setAccounts(updatedAccounts);
      onAccountsUpdate?.(updatedAccounts);
      toast.success('Account updated successfully');
      handleCloseModal();
    } catch (error) {
      setError(error.message);
      console.error('Update error:', error);
      toast.error('Failed to update account: ' + error.message);
    }
  };

  const handleDeleteConfirm = async (deleteType) => {
    try {
      if (deleteType === 'temporary') {
        // Temporarily deactivate account
        const response = await fetch(`${process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000')}/api/accounts/${selectedAccount._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isActive: false })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to deactivate account');
        }

        const result = await response.json();
        const updatedAccounts = accounts.map(acc => 
          acc._id === selectedAccount._id ? result.account : acc
        );
        setAccounts(updatedAccounts);
        onAccountsUpdate?.(updatedAccounts);
        toast.success('Account deactivated successfully');
      } else {
        // Permanently delete account
        const response = await fetch(`${process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000')}/api/accounts/${selectedAccount._id}`, {
          method: 'DELETE'
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to delete account');
        }

        const updatedAccounts = accounts.filter(acc => acc._id !== selectedAccount._id);
        setAccounts(updatedAccounts);
        onAccountsUpdate?.(updatedAccounts);
        toast.success('Account permanently deleted');
      }
      
      handleCloseModal();
    } catch (error) {
      setError(error.message);
      console.error('Delete error:', error);
      toast.error(`Failed to ${deleteType === 'temporary' ? 'deactivate' : 'delete'} account: ${error.message}`);
    }
  };

  const handleRestoreAccount = async (account) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000')}/api/accounts/${account._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: true })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to restore account');
      }

      const result = await response.json();
      const updatedAccounts = accounts.map(acc => 
        acc._id === account._id ? result.account : acc
      );
      setAccounts(updatedAccounts);
      onAccountsUpdate?.(updatedAccounts);
      toast.success('Account restored successfully');
    } catch (error) {
      setError(error.message);
      console.error('Restore error:', error);
      toast.error('Failed to restore account: ' + error.message);
    }
  };

  const filteredAccounts = accounts.filter(account => {
  const searchLower = searchTerm.toLowerCase();
  return (
    (account.employeeNumber ?? '').toLowerCase().includes(searchLower) ||
    (account.firstName ?? '').toLowerCase().includes(searchLower) ||
    (account.lastName ?? '').toLowerCase().includes(searchLower) ||
    (account.email ?? '').toLowerCase().includes(searchLower) ||
    (account.role ?? '').toLowerCase().includes(searchLower)
  );
});

  // Pagination logic
  const indexOfLastAccount = currentPage * accountsPerPage;
  const indexOfFirstAccount = indexOfLastAccount - accountsPerPage;
  const currentAccounts = filteredAccounts.slice(indexOfFirstAccount, indexOfLastAccount);
  const totalPages = Math.ceil(filteredAccounts.length / accountsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="h-full w-full flex flex-col space-y-6 px-4 py-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 flex-shrink-0">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-gray-900">Employee Accounts</h2>
          <span className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
            {filteredAccounts.length} accounts
          </span>
        </div>
        <div className="relative w-full sm:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search accounts..."
            className="pl-9 pr-3 py-3 text-sm border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-[#294B29] focus:border-[#294B29] transition-all duration-200"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start shadow-sm">
          <ExclamationCircleIcon className="h-5 w-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" />
          <span className="text-sm text-red-600 font-medium">{error}</span>
        </div>
      )}

      <div className="flex-1 min-h-0">
        <div className="h-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="p-4 sm:p-6">
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-gray-200 min-w-[800px] table-fixed">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                Employee #
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                Name
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-64">
                Email
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                Role
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                Status
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-36">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentAccounts.length > 0 ? (
              currentAccounts.map((account) => (
                <tr key={account.id} className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {account.employeeNumber}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    <div className="flex items-center space-x-2">
                      <div className="flex-shrink-0">
                        <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-semibold">
                          {account.firstName?.charAt(0)?.toUpperCase()}{account.lastName?.charAt(0)?.toUpperCase()}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {account.firstName} {account.lastName}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {account.email}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 capitalize text-center">
                    <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                      {account.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                      account.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {account.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    <div className="flex space-x-1 justify-center">
                      <button 
                        onClick={() => handleEditClick(account)}
                        className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors duration-200"
                        aria-label="Edit account"
                        title="Edit account"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      {!account.isActive ? (
                        <button 
                          onClick={() => handleRestoreAccount(account)}
                          className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50 transition-colors duration-200"
                          aria-label="Restore account"
                          title="Restore account"
                        >
                          <ArrowPathIcon className="h-4 w-4" />
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleDeleteClick(account)}
                          className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors duration-200"
                          aria-label="Delete account"
                          title="Delete account"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-sm text-gray-500">
                  No accounts found
                </td>
              </tr>
            )}
          </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {filteredAccounts.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 flex-shrink-0 pt-8 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            Showing <span className="font-semibold text-gray-900">{indexOfFirstAccount + 1}</span> to{' '}
            <span className="font-semibold text-gray-900">
              {Math.min(indexOfLastAccount, filteredAccounts.length)}
            </span> of{' '}
            <span className="font-semibold text-gray-900">{filteredAccounts.length}</span> accounts
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => paginate(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-all duration-200 hover:scale-105"
            >
              <ChevronLeftIcon className="h-4 w-4 mr-2" />
              Previous
            </button>
            <div className="flex space-x-2">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => paginate(i + 1)}
                  className={`px-4 py-2 border rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 ${
                    currentPage === i + 1
                      ? 'bg-[#294B29] text-white border-[#294B29] shadow-sm'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button
              onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-all duration-200 hover:scale-105"
            >
              Next
              <ChevronRightIcon className="h-4 w-4 ml-2" />
            </button>
          </div>
        </div>
      )}

      <EditAccountModal
        isOpen={isEditModalOpen}
        onClose={handleCloseModal}
        account={selectedAccount}
        onSave={handleSaveChanges}
        error={error}
      />

      <DeleteAccountModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseModal}
        account={selectedAccount}
        onConfirm={handleDeleteConfirm}
        error={error}
      />
    </div>
  );
};

export default ViewAccounts;
