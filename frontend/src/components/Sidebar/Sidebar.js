import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { 
  ChevronRightIcon,
  ChevronLeftIcon,
  DocumentTextIcon,
  ClockIcon,
  BellIcon,
  ChartBarIcon,
  ArrowLeftOnRectangleIcon,
  FireIcon,
  BugAntIcon,
  Cog6ToothIcon,
  UserIcon,
} from "@heroicons/react/24/outline";

const Sidebar = ({ isCollapsed, setIsCollapsed, onLogout }) => {
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [userProfile, setUserProfile] = useState({
    profilePicture: 'U',
    firstName: 'User',
    lastName: '',
    role: 'User'
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      // Get user data from localStorage (stored during login)
      const storedUserData = localStorage.getItem('userData');
      
      if (storedUserData) {
        const userData = JSON.parse(storedUserData);
        
        // Generate initials from first and last name
        const firstName = userData.firstName || 'User';
        const lastName = userData.lastName || '';
        const initials = firstName && lastName 
          ? `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
          : 'U';

        setUserProfile({
          profilePicture: initials,
          firstName: firstName || 'User',
          lastName: lastName || '',
          role: userData.role || 'User'
        });
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // Keep default values if localStorage fails
    }
  };

  const menuItems = [
    { 
      name: "ACCOUNT MANAGEMENT", 
      path: "/account-management",
      icon: <UserIcon className={isCollapsed ? "h-7 w-7" : "h-6 w-6"} />
    },
    { 
      name: "HAZARDOUS WASTE", 
      path: "/hazardous-waste-bin",
      icon: <FireIcon className={isCollapsed ? "h-7 w-7" : "h-6 w-6"} />
    },
    { 
      name: "NON-HAZARDOUS WASTE", 
      path: "/non-hazardous-waste-bin",
      icon: <BugAntIcon className={isCollapsed ? "h-7 w-7" : "h-6 w-6"} />
    },
    { 
      name: "WASTE REPORTS", 
      path: "/waste-log",
      icon: <DocumentTextIcon className={isCollapsed ? "h-7 w-7" : "h-6 w-6"} />
    },
    { 
      name: "DISPOSAL HISTORY LOG", 
      path: "/disposal-history",
      icon: <ClockIcon className={isCollapsed ? "h-7 w-7" : "h-6 w-6"} />
    },
    { 
      name: "ANNOUNCEMENT", 
      path: "/notifications",
      icon: <BellIcon className={isCollapsed ? "h-7 w-7" : "h-6 w-6"} />
    },
    { 
      name: "COMPLIANCE REPORT", 
      path: "/compliance-reports",
      icon: <ChartBarIcon className={isCollapsed ? "h-7 w-7" : "h-6 w-6"} />
    }
  ];

  const toggleSettingsDropdown = () => {
    setShowSettingsDropdown(!showSettingsDropdown);
  };

  const handleLogout = () => {
    // Clear all authentication data
    localStorage.removeItem("authToken");
    localStorage.removeItem("isLoggedIn");
    sessionStorage.clear();
    
    // Use the onLogout prop if provided, otherwise navigate directly
    if (onLogout) {
      onLogout();
    } else {
      navigate("/login");
    }
    
    // Close the dropdown
    setShowSettingsDropdown(false);
  };

  // Simple Profile Modal Component
  const SimpleProfileModal = ({ isOpen, onClose }) => {
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
        console.log('Sidebar - Raw stored user data:', storedUserData);
        
        if (storedUserData) {
          const userData = JSON.parse(storedUserData);
          console.log('Sidebar - Parsed user data from localStorage:', userData);
          
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

          console.log('Sidebar - Setting user info from localStorage:', userInfo);
          setUser(userInfo);
        } else {
          console.log('Sidebar - No user data found in localStorage, fetching from database...');
          
          // If no data in localStorage, fetch from database using the token
          const token = localStorage.getItem('authToken');
          if (token) {
            try {
              const decodedToken = JSON.parse(atob(token));
              console.log('Sidebar - Decoded token data:', decodedToken);
              
              // Fetch user data from database using the employee ID from token
              const response = await fetch(`http://localhost:5000/api/auth/user/${decodedToken.employeeId}`, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              });
              
              if (response.ok) {
                const userData = await response.json();
                console.log('Sidebar - User data from database:', userData);
                
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

                console.log('Sidebar - Setting user info from database:', userInfo);
                setUser(userInfo);
              } else {
                throw new Error('Failed to fetch user data from database');
              }
            } catch (tokenError) {
              console.error('Sidebar - Error fetching from database:', tokenError);
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
            console.log('Sidebar - No token found');
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
        console.error('Sidebar - Error getting user data:', error);
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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 border border-gray-200">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-all duration-200 hover:scale-110"
          >
            <svg className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {loading ? (
            <div className="p-8 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-200 border-t-green-600"></div>
            </div>
          ) : (
          <div>
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-8 text-white text-center">
              <div className="flex justify-center">
                <div className="h-32 w-32 rounded-2xl bg-white/20 flex items-center justify-center text-4xl font-bold border-4 border-white/30 shadow-xl backdrop-blur-sm">
                  {user.profilePicture}
                </div>
              </div>
              <h1 className="text-3xl font-bold mt-6">{user.firstName} {user.lastName}</h1>
              <p className="text-green-100 text-xl mt-2">{user.role}</p>
            </div>

            <div className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="bg-gradient-to-br from-green-100 to-green-200 p-4 rounded-xl mr-6">
                    <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Employee Number</h3>
                    <p className="text-gray-900 font-bold text-xl mt-1">{user.employeeNumber}</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="bg-gradient-to-br from-green-100 to-green-200 p-4 rounded-xl mr-6">
                    <UserIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="grid grid-cols-2 gap-6 w-full">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">First Name</h3>
                      <p className="text-gray-900 font-semibold text-lg mt-1">{user.firstName}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Last Name</h3>
                      <p className="text-gray-900 font-semibold text-lg mt-1">{user.lastName}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="bg-gradient-to-br from-green-100 to-green-200 p-4 rounded-xl mr-6">
                    <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Email Address</h3>
                    <p className="text-gray-900 font-semibold text-lg mt-1">{user.email}</p>
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

  return (
    <>
      {/* Modern Toggle Button */}
      <div 
        className={`fixed top-1/2 z-40 transform -translate-y-1/2 transition-all duration-300 ease-out ${
          isCollapsed ? "left-20" : "left-80"
        }`}
        style={{ pointerEvents: 'none' }}
      >
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-10 w-10 flex items-center justify-center bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 ease-out border-2 border-white"
          style={{ pointerEvents: 'auto' }}
          aria-expanded={!isCollapsed}
        >
          {isCollapsed ? (
            <ChevronRightIcon className="h-4 w-4 transition-transform duration-300 ease-out" />
          ) : (
            <ChevronLeftIcon className="h-4 w-4 transition-transform duration-300 ease-out" />
          )}
          <span className="sr-only">Toggle Sidebar</span>
        </button>
      </div>

      {/* Modern White Sidebar Container */}
      <div
        className={`fixed top-0 left-0 h-full bg-white text-gray-900 transition-all duration-300 ease-out z-30 font-inter shadow-2xl border-r border-gray-200
          ${isCollapsed ? "w-20" : "w-80"} 
          max-md:${isCollapsed ? "-translate-x-full" : "translate-x-0"}`}
      >
        <div className="p-4 h-full flex flex-col overflow-y-auto overflow-x-hidden">
          {/* Modern Logo section */}
          <div className="flex flex-col items-center mb-8">
            <div className={`${isCollapsed ? "h-10 w-10" : "h-14 w-14"} flex items-center justify-center transition-all duration-300 ease-out overflow-hidden bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg`}>
              <img 
                src="/viSORT_logo.png" 
                alt="ViSORT Logo" 
                className={`${isCollapsed ? "h-6 w-6" : "h-10 w-10"} object-contain transition-all duration-300 ease-out`}
              />
            </div>
            {!isCollapsed && (
              <>
                <h1 className="text-lg font-bold mt-3 font-inter text-center transition-opacity duration-300 ease-out text-gray-900">
                  Admin Dashboard
                </h1>
                <div className="w-16 h-0.5 bg-gradient-to-r from-green-400 to-green-600 rounded-full my-3 transition-opacity duration-300 ease-out"></div>
              </>
            )}
          </div>

          {/* Modern Menu Items */}
          <nav className="flex-1">
            <ul className="space-y-1">
              {menuItems.map((item) => (
                <li key={item.name}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `group flex items-center p-3 rounded-xl font-inter transition-all duration-300 ease-out ${
                        isActive 
                          ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/25" 
                          : "hover:bg-gray-100 hover:shadow-md text-gray-700"
                      } ${isCollapsed ? "justify-center" : "px-4"}`
                    }
                  >
                    <span className={`${isCollapsed ? "" : "mr-3"} transition-all duration-300 ease-out ${
                      ({ isActive }) => isActive ? "text-white" : "text-gray-500 group-hover:text-gray-700"
                    }`}>
                      {item.icon}
                    </span>
                    {!isCollapsed && (
                      <span className="whitespace-nowrap text-sm font-medium transition-opacity duration-300 ease-out">
                        {item.name}
                      </span>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          {/* Modern Profile Section */}
          <div className={`mt-auto pt-4 border-t border-gray-200 transition-colors duration-300 ease-out ${isCollapsed ? "px-2" : "px-2"}`}>
            {/* Modern Settings Dropdown */}
            <div 
              className={`transition-all duration-300 ease-out ${
                showSettingsDropdown && !isCollapsed ? 
                  "opacity-100 translate-y-0 visible" : 
                  "opacity-0 -translate-y-2 invisible"
              }`}
            >
              {!isCollapsed && (
                <div className="relative mb-3">
                  <div className="absolute bottom-full right-0 mb-2 w-48 bg-white rounded-xl shadow-xl z-50 overflow-hidden border border-gray-200">
                    <div className="py-2">
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-all duration-300"
                      >
                        <ArrowLeftOnRectangleIcon className="h-4 w-4 mr-3" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className={`flex items-center ${isCollapsed ? "justify-center" : "justify-between"}`}>
              {/* Modern Profile Button */}
              <button
                onClick={() => setShowProfileModal(true)}
                className={`flex items-center rounded-xl transition-all duration-300 hover:scale-105 ${
                  isCollapsed ? "p-2 hover:bg-gray-100" : "p-3 hover:bg-gray-100 w-full"
                }`}
              >
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center overflow-hidden shadow-lg">
                  <div className="text-white font-semibold text-sm">{userProfile.profilePicture}</div>
                </div>
                {!isCollapsed && (
                  <div className="text-left ml-3">
                    <div className="font-semibold text-gray-900 text-sm">{userProfile.firstName} {userProfile.lastName}</div>
                    <div className="text-xs text-gray-500">{userProfile.role}</div>
                  </div>
                )}
              </button>

              {/* Modern Settings Button */}
              {!isCollapsed && (
                <button 
                  onClick={toggleSettingsDropdown}
                  className="ml-2 p-2 rounded-xl hover:bg-gray-100 transition-all duration-300 hover:scale-110"
                >
                  <Cog6ToothIcon className="h-5 w-5 text-gray-500 hover:text-gray-700 transition-colors duration-300" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Profile Modal */}
      <SimpleProfileModal 
        isOpen={showProfileModal} 
        onClose={() => setShowProfileModal(false)} 
      />
    </>
  );
};

export default Sidebar;