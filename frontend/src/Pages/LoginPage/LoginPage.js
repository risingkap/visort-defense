import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';
import logo from './images/visortlogo.png';
import locationIcon from './images/location.png';

function LoginPage({ setIsLoggedIn }) {
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [showCodeSentModal, setShowCodeSentModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [attemptedReset, setAttemptedReset] = useState(false);
  const [codeFieldError, setCodeFieldError] = useState('');
  const [passwordFieldError, setPasswordFieldError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Frontend validation before sending to backend
    const trimmedEmployeeId = employeeId.trim();
    const trimmedPassword = password.trim();

    // Validate employee ID format (should be non-empty and contain only alphanumeric characters)
    if (!trimmedEmployeeId) {
      setError('Employee ID is required.');
      setIsLoading(false);
      return;
    }

    if (!trimmedPassword) {
      setError('Password is required.');
      setIsLoading(false);
      return;
    }

    // Additional validation: Check for minimum length
    if (trimmedEmployeeId.length < 3) {
      setError('Employee ID must be at least 3 characters long.');
      setIsLoading(false);
      return;
    }

    if (trimmedPassword.length < 4) {
      setError('Password must be at least 4 characters long.');
      setIsLoading(false);
      return;
    }

    try {
      const base = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000');
      const response = await fetch(`${base}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId: trimmedEmployeeId,
          password: trimmedPassword
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Login successful - validate that we received proper user data
        if (!data.user || !data.token) {
          setError('Invalid response from server. Please try again.');
          return;
        }

        // Block Employee role from logging in
        if (data.user.role && String(data.user.role).toLowerCase() === 'employee') {
          setError('Sorry, a medical staff cannot login. Contact the site admin.');
          return;
        }

        // Store authentication data
        setIsLoggedIn(true);
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("authToken", data.token);
        localStorage.setItem("userData", JSON.stringify(data.user));
        
        console.log('Login successful:', data.user);
        
        // Redirect to default dashboard page
        navigate('/disposal-history');
      } else {
        // Use the specific message from backend with enhanced error handling
        const errorMessage = data.message || 'Invalid Employee ID or Password';
        setError(errorMessage);
        
        // Log failed login attempt for security monitoring
        console.warn('Failed login attempt:', {
          employeeId: trimmedEmployeeId,
          timestamp: new Date().toISOString(),
          error: errorMessage
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      
      // Enhanced error handling for different types of network errors
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        setError('Unable to connect to server. Please check your internet connection and try again.');
      } else if (error.name === 'AbortError') {
        setError('Request timed out. Please try again.');
      } else {
        setError('Network error. Please check if the server is running.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23F0FDF4%22%20fill-opacity%3D%220.8%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%221%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-60"></div>
      
      <div className="flex min-h-screen relative z-10">
        {/* Left Section - Welcome */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-green-500 to-green-600 p-8 lg:p-12 flex-col justify-center relative overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
          <div className="absolute top-1/2 right-0 w-32 h-32 bg-white/5 rounded-full translate-x-16"></div>
          
          <div className="max-w-md relative z-10">
            <div className="mb-8">
              <div className="h-20 w-20 bg-white/25 backdrop-blur-sm rounded-3xl flex items-center justify-center mb-8 shadow-2xl border border-white/30">
                <img src={logo} alt="ViSORT Logo" className="h-12 w-12 drop-shadow-lg" />
              </div>
              <h1 className="text-5xl font-bold text-white mb-6 leading-tight drop-shadow-lg">
                Welcome to <span className="text-yellow-300">ViSORT</span>
              </h1>
              <p className="text-green-100 text-xl leading-relaxed font-medium">
                Manage waste categorization, tracking, and compliance effortlessly with our intelligent system.
              </p>
            </div>
            
            <div className="bg-white/15 backdrop-blur-md rounded-3xl p-8 border border-white/25 shadow-2xl">
              <div className="flex items-start space-x-5">
                <div className="h-14 w-14 bg-white/25 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                  <img src={locationIcon} alt="Location Icon" className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-xl mb-2">Casiño Medical Clinic</h3>
                  <p className="text-green-100 text-base leading-relaxed">910 A.T. Reyes, Mandaluyong, 1550 Metro Manila</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section - Login Form */}
        <div className="flex-1 lg:w-1/2 flex items-center justify-center p-4 lg:p-8 relative bg-white">
          {/* Floating Elements */}
          <div className="absolute top-20 left-10 w-20 h-20 bg-green-500/20 rounded-full blur-xl"></div>
          <div className="absolute bottom-20 right-10 w-32 h-32 bg-green-600/20 rounded-full blur-2xl"></div>
          
          <div className="w-full max-w-md relative z-10">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-10">
              <div className="h-20 w-20 bg-gradient-to-br from-green-500 to-green-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl border border-green-400/30">
                <img src={logo} alt="ViSORT Logo" className="h-12 w-12 drop-shadow-lg" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">ViSORT</h2>
              <p className="text-gray-600 text-lg">Automating Medical Waste Management</p>
            </div>

            {/* Desktop Logo */}
            <div className="hidden lg:block text-center mb-10">
              <h2 className="text-4xl font-bold text-gray-900 mb-3">
                Sign In
              </h2>
              <p className="text-gray-600 text-lg">Access your admin dashboard</p>
            </div>
            
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200/50 p-6 lg:p-10 relative overflow-hidden">
              {/* Subtle overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-green-600/5 rounded-3xl"></div>
              <form onSubmit={handleLogin} className="space-y-6 lg:space-y-8 relative z-10">
                <div>
                  <label htmlFor="employeeId" className="block text-sm font-bold text-gray-800 mb-3 flex items-center">
                    <span className="w-2 h-2 bg-gradient-to-r from-green-500 to-green-600 rounded-full mr-2"></span>
                    Employee ID Number
                  </label>
                  <div className="relative group">
                    <input 
                      type="text" 
                      id="employeeId" 
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                      placeholder="Enter your employee ID" 
                      required
                      disabled={isLoading}
                      className="w-full px-5 py-4 bg-white border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-400 transition-all duration-300 text-gray-900 placeholder-gray-500 font-medium shadow-sm hover:shadow-md group-hover:border-green-300 relative z-10"
                    />
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-green-50/50 to-emerald-50/50 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="password" className="block text-sm font-bold text-gray-800 mb-3 flex items-center">
                    <span className="w-2 h-2 bg-gradient-to-r from-green-500 to-green-600 rounded-full mr-2"></span>
                    Password
                  </label>
                  <div className="relative group">
                    <input 
                      type="password" 
                      id="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password" 
                      required
                      disabled={isLoading}
                      className="w-full px-5 py-4 bg-white border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-400 transition-all duration-300 text-gray-900 placeholder-gray-500 font-medium shadow-sm hover:shadow-md group-hover:border-green-300 relative z-10"
                    />
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-green-50/50 to-emerald-50/50 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  </div>
                </div>
                
                {error && (
                  <div className="bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-200/50 rounded-2xl p-5 shadow-lg backdrop-blur-sm">
                    <div className="flex items-start space-x-4">
                      <div className="h-6 w-6 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-lg">
                        <span className="text-white text-xs font-bold">!</span>
                      </div>
                      <div>
                        <p className="text-red-800 font-semibold text-sm">{error}</p>
                        {error.includes('no valid employee number') && (
                          <p className="text-red-600 text-xs mt-2 font-medium">
                            Need help? Contact your system administrator.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setShowRegisterModal(true)}
                    disabled={isLoading}
                    className="text-green-600 hover:text-green-700 font-semibold text-sm transition-all duration-300 hover:scale-105 flex items-center group"
                  >
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2 group-hover:scale-125 transition-transform duration-300"></span>
                    Register an Admin
                  </button>
                  <button
                    type="button"
                    className="text-green-600 hover:text-green-700 font-semibold text-sm transition-all duration-300 hover:scale-105 flex items-center group"
                    disabled={isLoading}
                    onClick={() => {
                      setError('');
                      setVerificationCode('');
                      setNewPassword('');
                      setCodeSent(false);
                      setResetSuccess(false);
                      setShowForgotModal(true);
                    }}
                  >
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2 group-hover:scale-125 transition-transform duration-300"></span>
                    Forgot Password?
                  </button>
                </div>
                
                <button 
                  type="submit" 
                  className="w-full px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-2xl hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-4 focus:ring-green-500/20 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.01] relative overflow-hidden group" 
                  disabled={isLoading}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative z-10">
                    {isLoading ? (
                      <div className="flex items-center justify-center space-x-3">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                        <span className="text-lg">LOGGING IN...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-2">
                        <span className="text-lg">LOGIN</span>
                        <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 text-center z-20">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-6 py-3 shadow-lg border border-gray-200/50">
          <p className="text-gray-600 text-sm font-medium">
            All rights for Casiño Clinic by <span className="text-green-600 font-semibold">CTRL + ALT + DEL</span>
          </p>
        </div>
      </div>

      {/* Modals */}
      {showRegisterModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 border border-gray-200">
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="h-10 w-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">!</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Register an Admin</h3>
            </div>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Only an existing admin can register another admin. Please get in touch with the site admin. Thank you.
            </p>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowRegisterModal(false)}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    {showForgotModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 border border-gray-200">
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="h-10 w-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">🔑</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Forgot Password</h3>
            </div>
            {!resetSuccess && (
              <p className="text-gray-600 mb-6">Enter your Employee ID to receive a verification code.</p>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="employeeIdModal" className="block text-sm font-semibold text-gray-700 mb-2">
                  Employee ID Number
                </label>
                <input
                  type="text"
                  id="employeeIdModal"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  placeholder="Enter your employee ID"
                  disabled={isLoading || isSendingCode || codeSent || resetSuccess}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-200 text-gray-900 placeholder-gray-400"
                />
              </div>

              {!codeSent && !resetSuccess && (
                <button
                  type="button"
                  className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                  disabled={isSendingCode}
                  onClick={async () => {
                    const trimmedEmployeeId = employeeId.trim();
                    if (!trimmedEmployeeId) {
                      setError('Please enter your Employee ID to reset your password.');
                      return;
                    }
                    setError('');
                    try {
                      setIsSendingCode(true);
                      const base = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000');
                      const response = await fetch(`${base}/api/auth/forgot-password/send-code`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ employeeId: trimmedEmployeeId })
                      });
                      const data = await response.json();
                      if (!response.ok || !data.success) {
                        throw new Error(data.message || 'Failed to send verification code.');
                      }
                      setCodeSent(true);
                      setShowCodeSentModal(true);
                    } catch (e) {
                      setError(e.message || 'Unable to send verification code.');
                    } finally {
                      setIsSendingCode(false);
                    }
                  }}
                >
                  {isSendingCode ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      <span>Sending…</span>
                    </div>
                  ) : (
                    'Send Code'
                  )}
                </button>
              )}

              {codeSent && !resetSuccess && (
                <>
                  <div>
                    <label htmlFor="verificationCodeModal" className="block text-sm font-semibold text-gray-700 mb-2">
                      Verification Code
                    </label>
                    <input
                      type="text"
                      id="verificationCodeModal"
                      value={verificationCode}
                      onChange={(e) => { setVerificationCode(e.target.value); setCodeFieldError(''); setError(''); }}
                      placeholder="Enter the code sent to your email"
                      disabled={isLoading}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-200 text-gray-900 placeholder-gray-400"
                    />
                    {(attemptedReset && !verificationCode.trim()) && (
                      <div className="text-red-600 text-xs mt-1">Verification code is required.</div>
                    )}
                    {codeFieldError && (
                      <div className="text-red-600 text-xs mt-1">{codeFieldError}</div>
                    )}
                  </div>
                  <div>
                    <label htmlFor="newPasswordModal" className="block text-sm font-semibold text-gray-700 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      id="newPasswordModal"
                      value={newPassword}
                      onChange={(e) => { setNewPassword(e.target.value); setPasswordFieldError(''); setError(''); }}
                      placeholder="Enter your new password"
                      disabled={isLoading}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-200 text-gray-900 placeholder-gray-400"
                    />
                    {(attemptedReset && (!newPassword.trim() || newPassword.trim().length < 4)) && (
                      <div className="text-red-600 text-xs mt-1">Password must be at least 4 characters.</div>
                    )}
                    {passwordFieldError && (
                      <div className="text-red-600 text-xs mt-1">{passwordFieldError}</div>
                    )}
                  </div>
                  <button
                    type="button"
                    className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                    disabled={isLoading || isResetting || !verificationCode || !newPassword}
                    onClick={async () => {
                      setAttemptedReset(true);
                      setCodeFieldError('');
                      setPasswordFieldError('');
                      const trimmedEmployeeId = employeeId.trim();
                      if (!trimmedEmployeeId) {
                        setError('Please enter your Employee ID.');
                        return;
                      }
                      if (!verificationCode.trim()) {
                        setCodeFieldError('Please enter the verification code.');
                        return;
                      }
                      if (!newPassword.trim() || newPassword.trim().length < 4) {
                        setPasswordFieldError('New password must be at least 4 characters.');
                        return;
                      }
                      setError('');
                      try {
                        setIsResetting(true);
                        const base = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000');
                        const response = await fetch(`${base}/api/auth/forgot-password/reset`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            employeeId: trimmedEmployeeId,
                            code: verificationCode.trim(),
                            newPassword: newPassword.trim()
                          })
                        });
                        const data = await response.json();
                        if (!response.ok || !data.success) {
                          const msg = data.message || 'Failed to reset password.';
                          // Field-level mapping
                          if (/expired/i.test(msg)) {
                            setCodeFieldError('Code has expired. Please request a new one.');
                          } else if (/invalid/i.test(msg)) {
                            setCodeFieldError('Invalid code. Please check and try again.');
                          } else if (/account not found/i.test(msg)) {
                            setError('Account not found for this Employee ID.');
                          } else if (/password/i.test(msg)) {
                            setPasswordFieldError(msg);
                          } else {
                            setError(msg);
                          }
                          throw new Error(msg);
                        }
                        setResetSuccess(true);
                        setVerificationCode('');
                        setNewPassword('');
                        setCodeSent(false);
                      } catch (e) {
                        if (!codeFieldError && !passwordFieldError) {
                          setError(e.message || 'Unable to reset password.');
                        }
                      } finally {
                        setIsResetting(false);
                      }
                    }}
                  >
                    {isResetting ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        <span>Updating…</span>
                      </div>
                    ) : (
                      'Update Password'
                    )}
                  </button>
                </>
              )}

              {resetSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-start space-x-3">
                    <div className="h-5 w-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs font-bold">✓</span>
                    </div>
                    <p className="text-green-800 font-medium">Password updated successfully. Please log in with your new password.</p>
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-start space-x-3">
                    <div className="h-5 w-5 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs font-bold">!</span>
                    </div>
                    <p className="text-red-800 font-medium">{error}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end mt-6">
              {resetSuccess ? (
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  OK
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="px-6 py-3 bg-gray-500 text-white font-semibold rounded-xl hover:bg-gray-600 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    )}
    {showCodeSentModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 border border-gray-200">
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="h-10 w-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">📧</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Verification Code Sent</h3>
            </div>
            <p className="text-gray-600 mb-6 leading-relaxed">
              We sent you a code to the email address registered to this Employee ID. Kindly fill the Verification Code field.
            </p>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowCodeSentModal(false)}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}

export default LoginPage;