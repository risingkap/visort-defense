import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  UserIcon,
  UserPlusIcon,
  TableCellsIcon,
  EyeIcon,
  EyeSlashIcon,
  ExclamationCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import ViewAccounts from './ViewAccounts';
import ConfirmationModal from './ConfirmationModal';

const CreateAccount = () => {
  const [showForm, setShowForm] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [formData, setFormData] = useState({
    employeeNumber: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'employee', 
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [accounts, setAccounts] = useState([]);

  // Fetch accounts from backend on mount
  useEffect(() => {
  const fetchAccounts = async () => {
    try {
      console.log('Attempting to fetch...'); // Debug 1
      const response = await fetch('http://localhost:5000/api/accounts');
      
      console.log('Response status:', response.status); // Debug 2
      const text = await response.text();
      console.log('Raw response:', text); // Debug 3
      
      if (response.ok) {
        const data = JSON.parse(text);
        setAccounts(data);
      } else {
        console.error('Server error:', text);
      }
    } catch (error) {
      console.error('Full fetch error:', { // Debug 4
        message: error.message,
        stack: error.stack,
        rawError: error
      });
    }
  };
  fetchAccounts();
}, []);

  const showError = (message) => {
    setErrorMessage(message);
    setShowErrorModal(true);
  };

  const closeErrorModal = () => {
    setShowErrorModal(false);
    setErrorMessage('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddAccount = () => {
    // Add your client-side validation here if needed
    setShowConfirmation(true);
  };

  const confirmAddAccount = async () => {
  try {
    const payload = {
      employeeNumber: formData.employeeNumber,
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      password: formData.password,
      confirmPassword: formData.confirmPassword,
      role: formData.role,
    };

    const response = await fetch('http://localhost:5000/api/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });


    if (!response.ok) {
      const errorData = await response.json();
      console.error('Server responded with error:', errorData);
      showError(`Account creation failed: ${errorData.error || 'Unknown error'}`);
      return;
    }

    const createdAccount = await response.json();

    setAccounts(prev => [...prev, createdAccount]);

    setFormData({
      employeeNumber: '',
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'employee',
    });

    setShowConfirmation(false);
    setShowForm(false);
  } catch (error) {
    console.error('Error creating account:', error);
    showError('Unexpected error. Please try again.');
  }
};

  const cancelAddAccount = () => {
    setShowConfirmation(false);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };


  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <ConfirmationModal 
        isOpen={showConfirmation}
        onClose={cancelAddAccount}
        onConfirm={confirmAddAccount}
        formData={formData}
      />

      <div className="max-w-[95vw] mx-auto">
        {/* Header with Toggle Buttons */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center">
            <UserIcon className="h-6 w-6 mr-2 text-green-700" />
            Account Management
          </h1>
          
          <div className="flex space-x-2">
            <button
              onClick={() => setShowForm(false)}
              className={`flex items-center px-4 py-2 rounded-md transition-colors ${!showForm ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              <TableCellsIcon className="h-5 w-5 mr-2" />
              View Accounts
            </button>
            <button
              onClick={() => setShowForm(true)}
              className={`flex items-center px-4 py-2 rounded-md transition-colors ${showForm ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              <UserPlusIcon className="h-5 w-5 mr-2" />
              Create Account
            </button>
          </div>
        </div>

        {/* Toggle Content */}
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden max-h-[98vh] w-full max-w-[95vw] flex flex-col">
          {showForm ? (
            <div className="flex flex-col h-full">
              {/* Simple White Header */}
              <div className="bg-white border-b border-gray-200 p-4 flex-shrink-0">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <UserPlusIcon className="h-6 w-6 text-gray-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Create New Account</h2>
                    <p className="text-gray-500 text-sm">Add a new team member to the system</p>
                  </div>
                </div>
              </div>
              
              {/* Modern Form Content */}
              <div className="p-4 space-y-3 overflow-y-auto flex-1">
                <form>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Employee Number */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-900">
                        Employee Number
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          name="employeeNumber"
                          value={formData.employeeNumber}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-[#294B29]/20 focus:border-[#294B29] transition-all duration-200 text-gray-900 placeholder-gray-400"
                          placeholder="Enter employee number (e.g., EMP123)"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                          <UserIcon className="h-5 w-5 text-gray-400" />
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">Unique identifier for the employee</p>
                    </div>

                    {/* First Name */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-900">
                        First Name
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-[#294B29]/20 focus:border-[#294B29] transition-all duration-200 text-gray-900 placeholder-gray-400"
                          placeholder="Enter first name"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                          <UserIcon className="h-5 w-5 text-gray-400" />
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">Employee's first name</p>
                    </div>

                    {/* Last Name */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-900">
                        Last Name
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-[#294B29]/20 focus:border-[#294B29] transition-all duration-200 text-gray-900 placeholder-gray-400"
                          placeholder="Enter last name"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                          <UserIcon className="h-5 w-5 text-gray-400" />
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">Employee's last name</p>
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-900">
                        Email Address
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-[#294B29]/20 focus:border-[#294B29] transition-all duration-200 text-gray-900 placeholder-gray-400"
                          placeholder="Enter email address"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                          </svg>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">Employee's email address for login</p>
                    </div>

                    {/* Password */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-900">
                        Password
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-[#294B29]/20 focus:border-[#294B29] transition-all duration-200 text-gray-900 placeholder-gray-400 pr-12"
                          placeholder="Enter secure password"
                        />
                        <button
                          type="button"
                          onClick={togglePasswordVisibility}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-gray-50 rounded-r-xl transition-colors"
                        >
                          {showPassword ? (
                            <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                          ) : (
                            <EyeIcon className="h-5 w-5 text-gray-400" />
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500">Minimum 8 characters with uppercase, lowercase, number, and special character</p>
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-900">
                        Confirm Password
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-[#294B29]/20 focus:border-[#294B29] transition-all duration-200 text-gray-900 placeholder-gray-400 pr-12"
                          placeholder="Confirm password"
                        />
                        <button
                          type="button"
                          onClick={toggleConfirmPasswordVisibility}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-gray-50 rounded-r-xl transition-colors"
                        >
                          {showConfirmPassword ? (
                            <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                          ) : (
                            <EyeIcon className="h-5 w-5 text-gray-400" />
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500">Re-enter the password to confirm</p>
                    </div>

                    {/* Role Selection with Modern Cards */}
                    <div className="md:col-span-2 space-y-2">
                      <label className="block text-sm font-semibold text-gray-900">
                        Account Role
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div 
                          className={`p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                            formData.role === 'employee' 
                              ? 'border-[#294B29] bg-[#294B29]/5' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => setFormData({...formData, role: 'employee'})}
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`h-4 w-4 rounded-full border-2 ${
                              formData.role === 'employee' 
                                ? 'border-[#294B29] bg-[#294B29]' 
                                : 'border-gray-300'
                            }`}>
                              {formData.role === 'employee' && (
                                <div className="h-2 w-2 bg-white rounded-full m-0.5"></div>
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">Employee</p>
                              <p className="text-sm text-gray-500">Standard user access</p>
                            </div>
                          </div>
                        </div>
                        <div 
                          className={`p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                            formData.role === 'admin' 
                              ? 'border-[#294B29] bg-[#294B29]/5' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => setFormData({...formData, role: 'admin'})}
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`h-4 w-4 rounded-full border-2 ${
                              formData.role === 'admin' 
                                ? 'border-[#294B29] bg-[#294B29]' 
                                : 'border-gray-300'
                            }`}>
                              {formData.role === 'admin' && (
                                <div className="h-2 w-2 bg-white rounded-full m-0.5"></div>
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">Admin</p>
                              <p className="text-sm text-gray-500">Full system access</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
              
              {/* Modern Footer with Enhanced Buttons */}
              <div className="bg-gray-50 px-4 py-3 flex justify-between items-center flex-shrink-0">
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                  <span>All fields marked with * are required</span>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowForm(false)}
                    className="px-6 py-3 text-gray-700 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddAccount}
                    className="px-8 py-3 bg-gradient-to-r from-[#294B29] to-[#1a3a1a] text-white rounded-xl hover:from-[#1a3a1a] hover:to-[#0f2a0f] transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                  >
                    <div className="flex items-center space-x-2">
                      <UserPlusIcon className="h-5 w-5" />
                      <span>Create Account</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <ViewAccounts accounts={accounts} />
          )}
        </div>
      </div>
      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <ExclamationCircleIcon className="h-7 w-7 text-red-600" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Account Creation Failed</h3>
                <p className="text-gray-700 mb-4">{errorMessage}</p>
                <div className="flex justify-end">
                  <button
                    onClick={closeErrorModal}
                    className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200"
                  >
                    OK
                  </button>
                </div>
              </div>
              <button
                onClick={closeErrorModal}
                className="flex-shrink-0 text-gray-400 hover:text-gray-500 transition-colors duration-200"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateAccount;
