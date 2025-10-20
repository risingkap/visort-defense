import React, { useState, useEffect, useCallback } from 'react';
import { 
  PlusIcon, 
  TrashIcon, 
  PaperAirplaneIcon, 
  CheckIcon, 
  PencilSquareIcon,
  XMarkIcon,
  DocumentIcon
} from '@heroicons/react/24/outline';

const NotificationPage = () => {
  const [selectedNotifications, setSelectedNotifications] = React.useState([]);
  const [notifications, setNotifications] = React.useState([
    {
      id: 1,
      title: "Hazardous Waste Alert",
      message: "Immediate disposal required for chemical waste in Lab B12. All personnel must evacuate the area immediately.",
      status: "sent",
      date: "2023-06-15 10:30",
      read: false,
      createdBy: { name: "Dr. Sarah Johnson", email: "sarah.johnson@hospital.com" },
      recipients: [
        { id: "1", name: "John Doe", email: "john@clinic.com" },
        { id: "2", name: "Jane Smith", email: "jane@clinic.com" }
      ]
    },
    {
      id: 2,
      title: "Weekly Waste Report",
      message: "General waste collection summary for week 24 shows a 15% increase in recyclable materials.",
      status: "sent",
      date: "2023-06-14 14:15",
      read: true,
      createdBy: { name: "Admin Manager", email: "admin@hospital.com" },
      recipients: [
        { id: "1", name: "John Doe", email: "john@clinic.com" },
        { id: "3", name: "Mike Johnson", email: "mike@clinic.com" },
        { id: "4", name: "Sarah Wilson", email: "sarah@clinic.com" }
      ]
    },
    {
      id: 3,
      title: "Disposal Schedule Update",
      message: "New schedule for biohazard waste collection effective next Monday. All departments must comply.",
      status: "draft",
      date: "2023-06-13 09:00",
      read: true,
      createdBy: { name: "Waste Coordinator", email: "waste.coord@hospital.com" }
    },
    {
      id: 4,
      title: "Emergency Drill Notification",
      message: "Safety drill scheduled for tomorrow at 11 AM. All staff must participate.",
      status: "sent",
      date: "2023-06-12 16:45",
      read: false,
      createdBy: { name: "Safety Officer", email: "safety@hospital.com" }
    },
    {
      id: 5,
      title: "New Waste Disposal Guidelines",
      message: "Updated guidelines for electronic waste disposal. Please review the attached document.",
      status: "draft",
      date: "2023-06-11 13:20",
      read: true,
      createdBy: { name: "Policy Manager", email: "policy@hospital.com" }
    },
    {
      id: 6,
      title: "Chemical Spill Protocol Reminder",
      message: "Reminder of proper procedures for chemical spill containment and reporting.",
      status: "sent",
      date: "2023-06-10 08:15",
      read: true,
      createdBy: { name: "Lab Supervisor", email: "lab.supervisor@hospital.com" }
    },
    {
      id: 7,
      title: "Annual Safety Training",
      message: "Mandatory safety training sessions for all lab personnel next week.",
      status: "draft",
      date: "2023-06-09 11:30",
      read: false,
      createdBy: { name: "Training Coordinator", email: "training@hospital.com" }
    },
    {
      id: 8,
      title: "Facility Maintenance Notice",
      message: "Scheduled maintenance for waste compactors on Friday from 2-4 PM.",
      status: "sent",
      date: "2023-06-08 09:45",
      read: true,
      createdBy: { name: "Facilities Manager", email: "facilities@hospital.com" }
    }
  ]);

  // New state for creating announcements
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    message: '',
    status: 'draft'
  });
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [announcementStatus, setAnnouncementStatus] = useState('');
  const [showSendConfirmModal, setShowSendConfirmModal] = useState(false);
  const [announcementToSend, setAnnouncementToSend] = useState(null);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [announcementsToDelete, setAnnouncementsToDelete] = useState([]);
  const [showDeleteSuccessModal, setShowDeleteSuccessModal] = useState(false);
  const [deletedCount, setDeletedCount] = useState(0);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');
  const [employees, setEmployees] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  const toggleNotificationSelection = (id) => {
    setSelectedNotifications(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id) 
        : [...prev, id]
    );
  };

  // Function to show delete confirmation modal
  const showDeleteConfirmation = () => {
    if (selectedNotifications.length === 0) return;
    setAnnouncementsToDelete(selectedNotifications);
    setShowDeleteConfirmModal(true);
  };

  const deleteSelectedNotifications = async () => {
    if (announcementsToDelete.length === 0) return;

    setLoading(true);
    setShowDeleteConfirmModal(false);
    
    try {
      const base = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000');
      
      // Delete each selected announcement from the database
      const deletePromises = announcementsToDelete.map(async (id) => {
        const response = await fetch(`${base}/api/announcements/${id}`, {
          method: 'DELETE'
        });
        
        if (!response.ok) {
          throw new Error(`Failed to delete announcement ${id}`);
        }
        
        return response.json();
      });

      await Promise.all(deletePromises);
      
      // Remove from local state
    setNotifications(prev => 
        prev.filter(notification => !announcementsToDelete.includes(notification.id))
    );
    setSelectedNotifications([]);
      
      // Show success modal
      setDeletedCount(announcementsToDelete.length);
      setShowDeleteSuccessModal(true);
    } catch (error) {
      console.error('Error deleting announcements:', error);
      alert('Failed to delete some announcements. Please try again.');
    } finally {
      setLoading(false);
      setAnnouncementsToDelete([]);
    }
  };

  // Function to cancel delete confirmation
  const cancelDeleteConfirmation = () => {
    setShowDeleteConfirmModal(false);
    setAnnouncementsToDelete([]);
  };

  // Function to close delete success modal
  const closeDeleteSuccessModal = () => {
    setShowDeleteSuccessModal(false);
    setDeletedCount(0);
  };

  // Function to get current admin info from logged-in user
  const getCurrentAdminInfo = () => {
    // Get user data from localStorage (stored during login)
    const storedUserData = localStorage.getItem('userData');
    
    if (storedUserData) {
      try {
        const userData = JSON.parse(storedUserData);
        console.log('Getting admin info from logged-in user:', userData);
        
        // Create full name from firstName and lastName
        const fullName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim();
        
        return {
          name: fullName || userData.employeeId || 'Admin',
          email: userData.email || 'admin@hospital.com'
        };
      } catch (e) {
        console.warn('Failed to parse stored user data:', e);
      }
    }
    
    // Fallback to default admin info if no user data found
    console.warn('No user data found in localStorage, using fallback admin info');
    return {
      name: 'System Admin',
      email: 'admin@hospital.com'
    };
  };

  // Function to fetch employees
  const fetchEmployees = async () => {
    setLoadingEmployees(true);
    try {
      const base = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000');
      const response = await fetch(`${base}/api/accounts`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch employees');
      }
      
      const accounts = await response.json();
      // Filter employees and admins (exclude managers) and active accounts
      const employeeList = accounts
        .filter(account => (account.role === 'employee' || account.role === 'admin') && account.isActive)
        .map(account => ({
          id: account._id,
          name: `${account.firstName} ${account.lastName}`,
          email: account.email,
          employeeNumber: account.employeeNumber,
          role: account.role
        }));
      
      setEmployees(employeeList);
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoadingEmployees(false);
    }
  };

  // Function to handle employee selection
  const toggleEmployeeSelection = (employeeId) => {
    setSelectedEmployees(prev => 
      prev.includes(employeeId) 
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  // Function to select all employees
  const selectAllEmployees = () => {
    setSelectedEmployees(employees.map(emp => emp.id));
  };

  // Function to clear all selections
  const clearAllSelections = () => {
    setSelectedEmployees([]);
  };

  // Function to create a draft announcement
  const createDraftAnnouncement = async () => {
    if (!newAnnouncement.title.trim() || !newAnnouncement.message.trim()) {
      setValidationMessage('Please fill in both title and message');
      setShowValidationModal(true);
      return;
    }
    
    if (selectedEmployees.length === 0) {
      setValidationMessage('Please select at least one recipient');
      setShowValidationModal(true);
      return;
    }

    setLoading(true);
    try {
      const base = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000');
      const announcementData = {
        ...newAnnouncement,
        status: 'draft',
        createdBy: getCurrentAdminInfo(),
        recipients: selectedEmployees.map(id => {
          const employee = employees.find(emp => emp.id === id);
          return {
            id: employee.id,
            name: employee.name,
            email: employee.email
          };
        })
      };

      const response = await fetch(`${base}/api/announcements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(announcementData)
      });

      if (!response.ok) {
        throw new Error('Failed to create draft');
      }

      const result = await response.json();
      
      // Add the new announcement to the list
      const newAnnouncementWithId = {
        id: result.data.id,
        title: newAnnouncement.title,
        message: newAnnouncement.message,
        status: 'draft',
        date: new Date().toLocaleString(),
        read: false,
        createdBy: getCurrentAdminInfo()
      };

      setNotifications(prev => [newAnnouncementWithId, ...prev]);
      
      // Reset form and close modal
      setNewAnnouncement({ title: '', message: '', status: 'draft' });
      setShowCreateModal(false);
      
      // Show success modal
      setSuccessMessage(newAnnouncement.title);
      setAnnouncementStatus('draft');
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error creating draft:', error);
      alert('Failed to create draft. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Function to send announcement directly
  const sendAnnouncement = async () => {
    if (!newAnnouncement.title.trim() || !newAnnouncement.message.trim()) {
      setValidationMessage('Please fill in both title and message');
      setShowValidationModal(true);
      return;
    }
    
    if (selectedEmployees.length === 0) {
      setValidationMessage('Please select at least one recipient');
      setShowValidationModal(true);
      return;
    }

    setLoading(true);
    try {
      const base = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000');
      const announcementData = {
        ...newAnnouncement,
        status: 'sent',
        createdBy: getCurrentAdminInfo(),
        recipients: selectedEmployees.map(id => {
          const employee = employees.find(emp => emp.id === id);
          return {
            id: employee.id,
            name: employee.name,
            email: employee.email
          };
        })
      };

      const response = await fetch(`${base}/api/announcements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(announcementData)
      });

      if (!response.ok) {
        throw new Error('Failed to send announcement');
      }

      const result = await response.json();
      
      // Add the new announcement to the list
      const newAnnouncementWithId = {
        id: result.data.id,
        title: newAnnouncement.title,
        message: newAnnouncement.message,
        status: 'sent',
        date: new Date().toLocaleString(),
        read: false,
        createdBy: getCurrentAdminInfo()
      };

      setNotifications(prev => [newAnnouncementWithId, ...prev]);
      
      // Reset form and close modal
      setNewAnnouncement({ title: '', message: '', status: 'draft' });
      setShowCreateModal(false);
      
      // Show success modal
      setSuccessMessage(newAnnouncement.title);
      setAnnouncementStatus('sent');
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error sending announcement:', error);
      alert('Failed to send announcement. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setNewAnnouncement({ title: '', message: '', status: 'draft' });
    setSelectedEmployees([]);
  };

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
    setSuccessMessage('');
    setAnnouncementStatus('');
  };

  // Function to show send confirmation modal
  const showSendConfirmation = (id, title) => {
    setAnnouncementToSend({ id, title });
    setShowSendConfirmModal(true);
  };

  // Function to send a draft announcement
  const sendDraftAnnouncement = async () => {
    if (!announcementToSend) return;

    setLoading(true);
    setShowSendConfirmModal(false);
    
    try {
      const base = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000');
      const response = await fetch(`${base}/api/announcements/${announcementToSend.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'sent' })
      });

      if (!response.ok) {
        throw new Error('Failed to send announcement');
      }

      // Update the local state
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === announcementToSend.id
            ? { ...notification, status: 'sent' }
            : notification
        )
      );

      // Show success modal
      setSuccessMessage(announcementToSend.title);
      setAnnouncementStatus('sent');
      setShowSuccessModal(true);

    } catch (error) {
      console.error('Error sending announcement:', error);
      alert('Failed to send announcement. Please try again.');
    } finally {
      setLoading(false);
      setAnnouncementToSend(null);
    }
  };

  // Function to cancel send confirmation
  const cancelSendConfirmation = () => {
    setShowSendConfirmModal(false);
    setAnnouncementToSend(null);
  };

  // Function to load announcements from the database
  const loadAnnouncements = useCallback(async () => {
    try {
      const base = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000');
      const response = await fetch(`${base}/api/announcements`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch announcements');
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        // Transform the data to match the expected format
        const transformedData = result.data.map(announcement => ({
          id: announcement.id,
          title: announcement.title,
          message: announcement.message,
          status: announcement.status,
          date: announcement.date,
          read: announcement.read,
          createdBy: announcement.createdBy || { name: 'Unknown Admin', email: 'unknown@example.com' },
          recipients: announcement.recipients || []
        }));
        
        setNotifications(transformedData);
      }
    } catch (error) {
      console.error('Error loading announcements:', error);
      // Keep the hardcoded data as fallback
    }
  }, []);

  // Load announcements when component mounts
  useEffect(() => {
    loadAnnouncements();
    fetchEmployees();
  }, [loadAnnouncements]);

  const handleNotificationClick = (id) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const getStatusBadge = (status) => {
    const baseClasses = "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold shadow-sm";
    
    switch(status) {
      case "sent":
        return (
          <span className={`${baseClasses} bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200`}>
            <CheckIcon className="h-3 w-3 mr-1.5" />
            Sent
          </span>
        );
      case "draft":
        return (
          <span className={`${baseClasses} bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border border-gray-200`}>
            <PencilSquareIcon className="h-3 w-3 mr-1.5" />
            Draft
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-3 sm:p-4">
      {/* Modern Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <PaperAirplaneIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Announcement Module</h1>
            <p className="text-sm text-gray-600">Manage and send announcements to your team</p>
          </div>
        </div>
        
        {/* Modern Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                checked={selectedNotifications.length === notifications.length && notifications.length > 0}
                onChange={() => {
                  if (selectedNotifications.length === notifications.length) {
                    setSelectedNotifications([]);
                  } else {
                    setSelectedNotifications(notifications.map(n => n.id));
                  }
                }}
              />
              <span className="text-sm font-medium text-gray-700">
                {selectedNotifications.length} selected
              </span>
            </div>
            <div className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
              {notifications.length} Total
            </div>
            <div className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
              {notifications.filter(n => n.status === 'sent').length} Sent
            </div>
            <div className="px-3 py-1 bg-gray-100 text-gray-800 text-sm font-medium rounded-full">
              {notifications.filter(n => n.status === 'draft').length} Drafts
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button 
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105 flex items-center space-x-2"
              onClick={openCreateModal}
            >
              <PlusIcon className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Create Announcement</span>
            </button>
            <button 
              className={`px-4 py-2 rounded-lg shadow-sm transition-all duration-200 hover:scale-105 flex items-center space-x-2 ${
                selectedNotifications.length === 0 || loading
                  ? 'bg-gray-100 border border-gray-200 cursor-not-allowed' 
                  : 'bg-white border border-red-200 hover:shadow-md hover:bg-red-50'
              }`}
              onClick={showDeleteConfirmation}
              disabled={selectedNotifications.length === 0 || loading}
            >
              <TrashIcon className={`h-4 w-4 ${selectedNotifications.length === 0 ? 'text-gray-400' : 'text-red-600'}`} />
              <span className={`text-sm font-medium ${selectedNotifications.length === 0 ? 'text-gray-400' : 'text-red-700'}`}>
                Delete Selected
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Modern Table Section */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0 z-10">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-12">
                  {/* Checkbox column */}
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Title
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden sm:table-cell">
                  Message
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden md:table-cell">
                  Date Added
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden lg:table-cell">
                  Created By
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-20">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {notifications.map((notification, index) => (
                <tr 
                  key={notification.id} 
                  className={`hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 cursor-pointer ${
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-25'
                  } ${!notification.read ? 'border-l-4 border-l-blue-500' : ''}`}
                  onClick={() => handleNotificationClick(notification.id)}
                >
                  <td 
                    className="px-6 py-4 whitespace-nowrap"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      checked={selectedNotifications.includes(notification.id)}
                      onChange={() => toggleNotificationSelection(notification.id)}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-start space-x-3">
                      <div className={`h-2 w-2 rounded-full mt-2 ${!notification.read ? 'bg-blue-500' : 'bg-transparent'}`}></div>
                      <div>
                        <div className={`font-semibold ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                          {notification.title}
                        </div>
                        <div className="mt-1 text-sm text-gray-600 sm:hidden line-clamp-2">
                          {notification.message}
                        </div>
                        <div className="mt-1 text-xs text-gray-500 sm:hidden">
                          {notification.date}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 hidden sm:table-cell">
                    <div className="line-clamp-2 max-w-xs">{notification.message}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(notification.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 hidden md:table-cell">
                    <div className="flex items-center space-x-2">
                      <DocumentIcon className="h-4 w-4 text-gray-400" />
                      <span>{notification.date}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 hidden lg:table-cell">
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900">{notification.createdBy?.name || 'Unknown Admin'}</span>
                      <span className="text-xs text-gray-500">{notification.createdBy?.email || 'unknown@example.com'}</span>
                    </div>
                  </td>
                  <td 
                    className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      className={`inline-flex items-center p-2 rounded-lg transition-all duration-200 ${
                        notification.status === 'sent' || loading
                          ? 'text-gray-400 cursor-not-allowed bg-gray-100'
                          : 'text-blue-600 hover:bg-blue-50 hover:scale-105'
                      }`}
                      onClick={() => showSendConfirmation(notification.id, notification.title)}
                      disabled={notification.status === 'sent' || loading}
                    >
                      <PaperAirplaneIcon className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Announcement Modal - Modern Design */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-gray-100 my-4">
            {/* Modern Header with Gradient */}
            <div className="bg-gradient-to-r from-[#294B29] to-[#1a3a1a] p-6 text-white">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <PaperAirplaneIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Create New Announcement</h2>
                    <p className="text-green-100 text-sm">Share important updates with your team</p>
                  </div>
                </div>
                <button 
                  onClick={closeCreateModal} 
                  className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-all duration-200"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            {/* Modern Form Content */}
            <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {/* Title Input with Modern Styling */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-900">
                  Announcement Title
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={newAnnouncement.title}
                    onChange={(e) => setNewAnnouncement(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-[#294B29]/20 focus:border-[#294B29] transition-all duration-200 text-gray-900 placeholder-gray-400"
                    placeholder="Enter a clear, descriptive title for your announcement"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <PaperAirplaneIcon className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
                <p className="text-xs text-gray-500">Choose a title that clearly communicates the purpose of your announcement</p>
              </div>
              
              {/* Message Input with Modern Styling */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-900">
                  Announcement Message
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="relative">
                  <textarea
                    value={newAnnouncement.message}
                    onChange={(e) => setNewAnnouncement(prev => ({ ...prev, message: e.target.value }))}
                    rows={5}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-[#294B29]/20 focus:border-[#294B29] transition-all duration-200 text-gray-900 placeholder-gray-400 resize-none"
                    placeholder="Provide detailed information about your announcement, including any important details, deadlines, or action items..."
                  />
                  <div className="absolute top-3 right-3">
                    <div className="bg-gray-50 rounded-lg px-2 py-1">
                      <span className="text-xs text-gray-500">{newAnnouncement.message.length}/1000</span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500">Include all relevant details, deadlines, and any action items for recipients</p>
              </div>

              {/* Recipients Selection with Modern Styling */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-900">
                  Select Recipients
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="border-2 border-gray-200 rounded-xl p-4 max-h-48 overflow-y-auto bg-gray-50/50">
                  {loadingEmployees ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#294B29]"></div>
                      <span className="ml-2 text-gray-500">Loading recipients...</span>
                    </div>
                  ) : employees.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No recipients found</div>
                  ) : (
                    <>
                      {/* Select All / Clear All buttons */}
                      <div className="flex gap-2 mb-4 pb-3 border-b border-gray-200">
                        <button
                          type="button"
                          onClick={selectAllEmployees}
                          className="text-xs px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all duration-200 font-medium"
                        >
                          Select All
                        </button>
                        <button
                          type="button"
                          onClick={clearAllSelections}
                          className="text-xs px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 font-medium"
                        >
                          Clear All
                        </button>
                        <div className="ml-auto flex items-center space-x-2">
                          <div className="h-2 w-2 bg-[#294B29] rounded-full"></div>
                          <span className="text-xs text-gray-600 font-medium">
                            {selectedEmployees.length} selected
                          </span>
                        </div>
                      </div>
                      
                      {/* Employee list */}
                      <div className="space-y-2">
                        {employees.map((employee) => (
                          <label key={employee.id} className="flex items-center space-x-3 cursor-pointer hover:bg-white p-3 rounded-lg transition-all duration-200 border border-transparent hover:border-gray-200">
                            <input
                              type="checkbox"
                              checked={selectedEmployees.includes(employee.id)}
                              onChange={() => toggleEmployeeSelection(employee.id)}
                              className="h-4 w-4 text-[#294B29] focus:ring-[#294B29] border-gray-300 rounded"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                              <div className="text-xs text-gray-500">{employee.email}</div>
                              <div className="text-xs mt-1">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                  employee.role === 'admin' 
                                    ? 'bg-purple-100 text-purple-800' 
                                    : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {employee.role === 'admin' ? 'Admin' : 'Employee'}
                                </span>
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </>
                  )}
                </div>
                {selectedEmployees.length === 0 && (
                  <p className="text-xs text-red-500 mt-1 flex items-center">
                    <span className="mr-1">⚠️</span>
                    Please select at least one recipient
                  </p>
                )}
              </div>
            </div>
            
            {/* Modern Footer with Enhanced Buttons */}
            <div className="bg-gray-50 px-6 py-4 flex justify-between items-center">
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <span>All fields marked with * are required</span>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={closeCreateModal}
                  className="px-6 py-3 text-gray-700 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={createDraftAnnouncement}
                  disabled={loading || !newAnnouncement.title.trim() || !newAnnouncement.message.trim() || selectedEmployees.length === 0}
                  className="px-6 py-3 text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center space-x-2">
                    <DocumentIcon className="h-4 w-4" />
                    <span>{loading ? 'Creating...' : 'Create Draft'}</span>
                  </div>
                </button>
                <button
                  onClick={sendAnnouncement}
                  disabled={loading || !newAnnouncement.title.trim() || !newAnnouncement.message.trim() || selectedEmployees.length === 0}
                  className="px-8 py-3 bg-gradient-to-r from-[#294B29] to-[#1a3a1a] text-white rounded-xl hover:from-[#1a3a1a] hover:to-[#0f2a0f] transition-all duration-200 font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg"
                >
                  <div className="flex items-center space-x-2">
                    <PaperAirplaneIcon className="h-5 w-5" />
                    <span>{loading ? 'Sending...' : 'Send Announcement'}</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full overflow-hidden">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Success!</h2>
              <button
                onClick={closeSuccessModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <CheckIcon className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {announcementStatus === 'draft' ? 'Draft Created Successfully!' : 'Announcement Sent Successfully!'}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {announcementStatus === 'draft' 
                  ? <>You have successfully created a draft for <strong>"{successMessage}"</strong>.</>
                  : <>You have successfully announced <strong>"{successMessage}"</strong> to medical staff.</>
                }
              </p>
              <p className="text-xs text-gray-500">
                {announcementStatus === 'draft' 
                  ? 'The draft has been saved and can be edited or sent later.'
                  : 'The announcement has been delivered to all medical personnel in the system.'
                }
              </p>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-center p-6 border-t border-gray-200">
              <button
                onClick={closeSuccessModal}
                className="px-6 py-2 bg-[#294B29] text-white rounded-md hover:bg-[#1a3a1a] transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send Confirmation Modal */}
      {showSendConfirmModal && announcementToSend && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Send Announcement</h2>
              <button
                onClick={cancelSendConfirmation}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <PaperAirplaneIcon className="h-8 w-8 text-[#294B29]" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900">
                    Confirm Send
                  </h3>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Are you sure you want to send <strong>"{announcementToSend.title}"</strong> to medical staff?
              </p>
              <p className="text-xs text-gray-500">
                This action will change the announcement status from draft to sent and notify all medical personnel.
              </p>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={cancelSendConfirmation}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#294B29]"
              >
                Cancel
              </button>
              <button
                onClick={sendDraftAnnouncement}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-[#294B29] border border-transparent rounded-md hover:bg-[#1a3a1a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#294B29] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send Announcement'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmModal && announcementsToDelete.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Delete Announcements</h2>
              <button
                onClick={cancelDeleteConfirmation}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <TrashIcon className="h-8 w-8 text-red-500" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900">
                    Confirm Deletion
                  </h3>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Are you sure you want to delete <strong>{announcementsToDelete.length} announcement(s)</strong>?
              </p>
              <p className="text-xs text-gray-500">
                This action cannot be undone. The selected announcements will be permanently removed from the system.
              </p>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={cancelDeleteConfirmation}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Cancel
              </button>
              <button
                onClick={deleteSelectedNotifications}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Deleting...' : 'Delete Announcements'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Success Modal */}
      {showDeleteSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Deletion Successful</h2>
              <button
                onClick={closeDeleteSuccessModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900">
                    Announcements Deleted Successfully!
                  </h3>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                <strong>{deletedCount} announcement(s)</strong> have been permanently removed from the system.
              </p>
              <p className="text-xs text-gray-500">
                The selected announcements are no longer visible to medical staff and cannot be recovered.
              </p>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-center p-6 border-t border-gray-200">
              <button
                onClick={closeDeleteSuccessModal}
                className="px-6 py-2 bg-[#294B29] text-white rounded-md hover:bg-[#1a3a1a] transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Validation Modal */}
      {showValidationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Validation Required</h2>
              <button
                onClick={() => setShowValidationModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <svg className="h-5 w-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900">
                    Missing Information
                  </h3>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                {validationMessage}
              </p>
              <p className="text-xs text-gray-500">
                Please fill in all required fields before proceeding.
              </p>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-center p-6 border-t border-gray-200">
              <button
                onClick={() => setShowValidationModal(false)}
                className="px-6 py-2 bg-[#294B29] text-white rounded-md hover:bg-[#1a3a1a] transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationPage;