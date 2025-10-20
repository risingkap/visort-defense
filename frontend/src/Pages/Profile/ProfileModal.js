import React, { useState, useEffect } from 'react';
import { 
  XMarkIcon,
  EnvelopeIcon,
  IdentificationIcon,
  UserIcon
} from '@heroicons/react/24/outline';

const ProfileModal = ({ isOpen, onClose }) => {
  const [user, setUser] = useState({
    profilePicture: 'U',
    employeeNumber: 'N/A',
    firstName: 'N/A',
    lastName: 'N/A',
    email: 'N/A',
    role: 'N/A'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchUserData();
    }
  }, [isOpen]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      // Get user data from localStorage (stored during login)
      const storedUserData = localStorage.getItem('userData');
      console.log('Raw stored user data:', storedUserData);
      
      if (storedUserData) {
        const userData = JSON.parse(storedUserData);
        console.log('Parsed user data from localStorage:', userData);
        
        // Generate initials from first and last name
        const firstName = userData.firstName || 'User';
        const lastName = userData.lastName || '';
        const initials = firstName && lastName 
          ? `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
          : 'U';

        const userInfo = {
          profilePicture: initials,
          employeeNumber: userData.employeeId || 'N/A',
          firstName: userData.firstName || 'N/A',
          lastName: userData.lastName || 'N/A',
          email: userData.email || 'N/A',
          role: userData.role || 'N/A'
        };

        console.log('Setting user info from localStorage:', userInfo);
        setUser(userInfo);
      } else {
        console.log('No user data found in localStorage, fetching from database...');
        
        // If no data in localStorage, fetch from database using the token
        const token = localStorage.getItem('authToken');
        if (token) {
          try {
            const decodedToken = JSON.parse(atob(token));
            console.log('Decoded token data:', decodedToken);
            
            // Fetch user data from database using the employee ID from token
            const response = await fetch(`${process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000')}/api/auth/user/${decodedToken.employeeId}`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (response.ok) {
              const userData = await response.json();
              console.log('User data from database:', userData);
              
              // Generate initials from first and last name
              const firstName = userData.firstName || 'User';
              const lastName = userData.lastName || '';
              const initials = firstName && lastName 
                ? `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
                : 'U';

              const userInfo = {
                profilePicture: initials,
                employeeNumber: userData.employeeId || 'N/A',
                firstName: userData.firstName || 'N/A',
                lastName: userData.lastName || 'N/A',
                email: userData.email || 'N/A',
                role: userData.role || 'N/A'
              };

              console.log('Setting user info from database:', userInfo);
              setUser(userInfo);
            } else {
              throw new Error('Failed to fetch user data from database');
            }
          } catch (tokenError) {
            console.error('Error fetching from database:', tokenError);
            setUser({
              profilePicture: 'U',
              employeeNumber: 'N/A',
              firstName: 'N/A',
              lastName: 'N/A',
              email: 'N/A',
              role: 'N/A'
            });
          }
        } else {
          console.log('No token found');
          setUser({
            profilePicture: 'U',
            employeeNumber: 'N/A',
            firstName: 'N/A',
            lastName: 'N/A',
            email: 'N/A',
            role: 'N/A'
          });
        }
      }
    } catch (error) {
      console.error('Error getting user data:', error);
      setUser({
        profilePicture: 'U',
        employeeNumber: 'N/A',
        firstName: 'N/A',
        lastName: 'N/A',
        email: 'N/A',
        role: 'N/A'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      {/* Modal Container */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4">
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <XMarkIcon className="h-6 w-6 text-gray-500" />
        </button>

        {loading ? (
          <div className="p-8 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#294B29]"></div>
          </div>
        ) : (
          <div>
            {/* Profile Header */}
            <div className="bg-gradient-to-r from-[#294b29] to-[#3a5c3a] p-8 text-white text-center">
              <div className="flex justify-center">
                <div className="h-32 w-32 rounded-full bg-[#3a5c3a] flex items-center justify-center text-4xl font-bold border-[6px] border-white shadow-lg">
                  {user.profilePicture}
                </div>
              </div>
              <h1 className="text-3xl font-bold mt-6">{user.firstName} {user.lastName}</h1>
              <p className="text-[#c6e0c6] text-xl mt-2">{user.role}</p>
            </div>

            {/* Profile Details */}
            <div className="p-8 space-y-8">
              <div className="space-y-6">
                {/* Employee Number */}
                <div className="flex items-start">
                  <div className="bg-gray-100 p-4 rounded-xl mr-6">
                    <IdentificationIcon className="h-6 w-6 text-[#3a5c3a]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-medium text-gray-500">Employee Number</h3>
                    <p className="text-gray-900 font-medium text-xl mt-1">{user.employeeNumber}</p>
                  </div>
                </div>

                {/* Name Fields */}
                <div className="flex items-start">
                  <div className="bg-gray-100 p-4 rounded-xl mr-6">
                    <UserIcon className="h-6 w-6 text-[#3a5c3a]" />
                  </div>
                  <div className="grid grid-cols-2 gap-6 w-full">
                    <div>
                      <h3 className="text-base font-medium text-gray-500">First Name</h3>
                      <p className="text-gray-900 text-xl mt-1">{user.firstName}</p>
                    </div>
                    <div>
                      <h3 className="text-base font-medium text-gray-500">Last Name</h3>
                      <p className="text-gray-900 text-xl mt-1">{user.lastName}</p>
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start">
                  <div className="bg-gray-100 p-4 rounded-xl mr-6">
                    <EnvelopeIcon className="h-6 w-6 text-[#3a5c3a]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-medium text-gray-500">Email Address</h3>
                    <p className="text-gray-900 text-xl mt-1">{user.email}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileModal;