import React, { useState, useEffect, useCallback } from 'react';
import './ComplianceReportModule.css'
import { 
  PlusIcon, 
  TrashIcon, 
  PaperAirplaneIcon, 
  CheckIcon, 
  XMarkIcon,
  PencilIcon,
  ArrowPathIcon,
  DocumentIcon,
  EyeIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';

function ComplianceReportModule() {
  const [reports, setReports] = useState([]);
  const [deletedReports, setDeletedReports] = useState([]);
  const [activeTab, setActiveTab] = useState('sent');
  const [isAddReportFormOpen, setIsAddReportFormOpen] = useState(false);
  const [isEditReportFormOpen, setIsEditReportFormOpen] = useState(false);
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState(null);
  const [isReportDetailsOpen, setIsReportDetailsOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [editingReport, setEditingReport] = useState(null);

  const [newReport, setNewReport] = useState({
    title: '',
    message: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    category: 'General',
  });

  const filteredReports = reports.filter(report => {
    if (activeTab === 'sent') {
      return report.status === 'Sent';
    } else if (activeTab === 'draft') {
      return report.status === 'Draft';
    }
    return false;
  });


  const handleSend = async (id) => {
    const result = await updateReport(id, { status: 'Sent' });
    if (!result.success) {
      console.error('Failed to publish report:', result.error);
    }
  };

  const handleEdit = (report) => {
    setEditingReport(report);
    setNewReport({
      title: report.title,
      message: report.message,
      date: report.date,
      time: report.time,
      category: report.category || 'General'
    });
    setIsEditReportFormOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingReport) return;

    const result = await updateReport(editingReport._id, {
      title: newReport.title,
      message: newReport.message
    });

    if (result.success) {
      setIsEditReportFormOpen(false);
      setEditingReport(null);
      setNewReport({
        title: '',
        message: '',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        category: 'General'
      });
    }
  };

  const handleDelete = async (report) => {
    const result = await deleteReport(report._id);
    if (result.success) {
      // Move to deleted reports for soft delete functionality
      setDeletedReports([...deletedReports, report]);
    }
  };

  const handlePermanentDelete = (id) => {
    setDeletedReports(deletedReports.filter(report => report.id !== id));
    setIsDeleteConfirmationOpen(false);
    setReportToDelete(null);
  };

  const handleUndoDelete = (id) => {
    const reportToUndo = deletedReports.find(r => r.id === id);
    if (reportToUndo) {
      setDeletedReports(deletedReports.filter(r => r.id !== id));
      setReports(prevReports => [...prevReports, reportToUndo]);
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteConfirmationOpen(false);
    setReportToDelete(null);
  };

  const handleAddReport = () => {
    setIsAddReportFormOpen(true);
  };

  const handleCancelAddReport = () => {
    setIsAddReportFormOpen(false);
    setNewReport({
      title: '',
      message: '',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      category: 'General'
    });
  };

  const handleSaveReport = async () => {
    const result = await createReport({
      title: newReport.title,
      message: newReport.message,
      status: 'Draft'
    });

    if (result.success) {
      setIsAddReportFormOpen(false);
      setNewReport({
        title: '',
        message: '',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        category: 'General'
      });
    }
  };

  const handleInputChange = (e) => {
    setNewReport({ ...newReport, [e.target.name]: e.target.value });
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleViewReport = (report) => {
    setSelectedReport(report);
    setIsReportDetailsOpen(true);
  };

  const closeReportDetails = () => {
    setSelectedReport(null);
    setIsReportDetailsOpen(false);
  };

  // API Functions
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/api/compliance-reports`);
      const data = await response.json();
      
      if (data.success) {
        setReports(data.reports || []);
      } else {
        setError(data.error || 'Failed to fetch reports');
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError('Failed to fetch reports. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]);

  const createReport = async (reportData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/api/compliance-reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportData),
      });
      
      const data = await response.json();
      
      if (data.success) {
        await fetchReports(); // Refresh the list
        return { success: true, report: data.report };
      } else {
        setError(data.error || 'Failed to create report');
        return { success: false, error: data.error };
      }
    } catch (err) {
      console.error('Error creating report:', err);
      setError('Failed to create report. Please try again.');
      return { success: false, error: 'Failed to create report' };
    } finally {
      setLoading(false);
    }
  };

  const updateReport = async (id, reportData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/api/compliance-reports/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportData),
      });
      
      const data = await response.json();
      
      if (data.success) {
        await fetchReports(); // Refresh the list
        return { success: true, report: data.report };
      } else {
        setError(data.error || 'Failed to update report');
        return { success: false, error: data.error };
      }
    } catch (err) {
      console.error('Error updating report:', err);
      setError('Failed to update report. Please try again.');
      return { success: false, error: 'Failed to update report' };
    } finally {
      setLoading(false);
    }
  };

  const deleteReport = async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/api/compliance-reports/${id}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (data.success) {
        await fetchReports(); // Refresh the list
        return { success: true };
      } else {
        setError(data.error || 'Failed to delete report');
        return { success: false, error: data.error };
      }
    } catch (err) {
      console.error('Error deleting report:', err);
      setError('Failed to delete report. Please try again.');
      return { success: false, error: 'Failed to delete report' };
    } finally {
      setLoading(false);
    }
  };

  // Load reports on component mount
  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const getStatusBadge = (status) => {
    const baseClasses = "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold shadow-sm";
    
    switch(status) {
      case "Sent":
        return (
          <span className={`${baseClasses} bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200`}>
            <CheckIcon className="h-3 w-3 mr-1.5" />
            Sent
          </span>
        );
      case "Draft":
        return (
          <span className={`${baseClasses} bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border border-yellow-200`}>
            Draft
          </span>
        );
      default:
        return (
          <span className={`${baseClasses} bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border border-gray-200`}>
            {status}
          </span>
        );
    }
  };

  const renderReportTable = (reportList) => (
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
            Date
          </th>
            <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden lg:table-cell">
            Time
          </th>
            <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-20">
            Actions
          </th>
        </tr>
      </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {reportList.map((report, index) => (
            <tr 
              key={report.id} 
              className={`hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 transition-all duration-200 cursor-pointer ${
                index % 2 === 0 ? 'bg-white' : 'bg-gray-25'
              }`}
              onClick={() => handleViewReport(report)}
            >
              <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  checked={report.selected || false}
                  onChange={(e) => {
                    setReports(reports.map(r => 
                      r.id === report.id ? { ...r, selected: e.target.checked } : r
                    ));
                  }}
                />
              </td>
              <td className="px-6 py-4">
                <div className="flex items-start space-x-3">
                  <div className={`h-2 w-2 rounded-full mt-2 ${report.status === 'Draft' ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                  <div>
                    <div className="font-semibold text-gray-900">{report.title}</div>
                    <div className="mt-1 text-sm text-gray-600 sm:hidden line-clamp-2">
                {report.message}
              </div>
              <div className="mt-1 text-xs text-gray-500 sm:hidden">
                {report.date} {report.time}
                    </div>
                  </div>
              </div>
            </td>
              <td className="px-6 py-4 text-sm text-gray-600 hidden sm:table-cell">
              <div className="line-clamp-2 max-w-xs">{report.message}</div>
            </td>
              <td className="px-6 py-4 whitespace-nowrap">
              {getStatusBadge(report.status)}
            </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 hidden md:table-cell">
                <div className="flex items-center space-x-2">
                  <DocumentIcon className="h-4 w-4 text-gray-400" />
                  <span>{report.date}</span>
                </div>
            </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 hidden lg:table-cell">
              {report.time}
            </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-2">
                {activeTab !== 'deleted' && report.status === 'Draft' && (
                  <button
                      className="text-green-600 hover:bg-green-50 p-2 rounded-lg transition-all duration-200 hover:scale-105"
                    onClick={() => handleSend(report._id)}
                    title="Publish"
                  >
                    <GlobeAltIcon className="h-4 w-4" />
                  </button>
                )}
                {activeTab !== 'deleted' && (
                  <button
                      className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-all duration-200 hover:scale-105"
                    onClick={() => handleViewReport(report)}
                    title="View Details"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </button>
                )}
                {activeTab !== 'deleted' && (
                  <button
                      className="text-gray-600 hover:bg-gray-50 p-2 rounded-lg transition-all duration-200 hover:scale-105"
                    onClick={() => handleEdit(report)}
                    title="Edit"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                )}
                {activeTab === 'deleted' && (
                  <>
                    <button
                        className="text-green-600 hover:bg-green-50 p-2 rounded-lg transition-all duration-200 hover:scale-105"
                      onClick={() => handleUndoDelete(report.id)}
                      title="Undo"
                    >
                      <ArrowPathIcon className="h-4 w-4" />
                    </button>
                    <button
                        className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-all duration-200 hover:scale-105"
                      onClick={() => {
                        setReportToDelete(report.id);
                        setIsDeleteConfirmationOpen(true);
                      }}
                      title="Permanently Delete"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
      </div>
    </div>
  );

  const iconOptions = [
    { value: 'General', label: 'General' },
    { value: 'Maintenance', label: 'Maintenance' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-3 sm:p-4">
      {/* Modern Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="h-10 w-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
            <DocumentIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Compliance Report Module</h1>
            <p className="text-sm text-gray-600">Manage compliance reports and documentation</p>
          </div>
      </div>

        {/* Modern Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-1">
          <nav className="flex space-x-1">
            <button
              className={`flex-1 py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
                activeTab === 'sent'
                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
              onClick={() => handleTabChange('sent')}
            >
              Sent Reports
            </button>
            <button
              className={`flex-1 py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
                activeTab === 'draft'
                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
              onClick={() => handleTabChange('draft')}
            >
              Draft Reports
            </button>
            <button
              className={`flex-1 py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
                activeTab === 'deleted'
                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
              onClick={() => handleTabChange('deleted')}
            >
              Recently Deleted
            </button>
          </nav>
        </div>
      </div>

      {/* Modern Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              checked={reports.length > 0 && reports.every(report => report.selected)}
              onChange={(e) => {
                if (e.target.checked) {
                  setReports(reports.map(report => ({ ...report, selected: true })));
                } else {
                  setReports(reports.map(report => ({ ...report, selected: false })));
                }
              }}
            />
            <span className="text-sm font-medium text-gray-700">
              {reports.filter(report => report.selected).length} selected
            </span>
          </div>
          <div className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
            {reports.length} Total
        </div>
          <div className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
            {reports.filter(r => r.status === 'Sent').length} Sent
          </div>
          <div className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full">
            {reports.filter(r => r.status === 'Draft').length} Drafts
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {activeTab === 'draft' && (
            <button 
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105 flex items-center space-x-2"
              onClick={handleAddReport}
            >
              <PlusIcon className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Create Report</span>
            </button>
          )}
          <button 
            className={`px-4 py-2 rounded-lg shadow-sm transition-all duration-200 hover:scale-105 flex items-center space-x-2 ${
              reports.filter(report => report.selected).length === 0
                ? 'bg-gray-100 border border-gray-200 cursor-not-allowed' 
                : 'bg-white border border-red-200 hover:shadow-md hover:bg-red-50'
            }`}
            disabled={reports.filter(report => report.selected).length === 0}
          >
            <TrashIcon className={`h-4 w-4 ${reports.filter(report => report.selected).length === 0 ? 'text-gray-400' : 'text-red-600'}`} />
            <span className={`text-sm font-medium ${reports.filter(report => report.selected).length === 0 ? 'text-gray-400' : 'text-red-700'}`}>
              Delete Selected
            </span>
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      )}


      {/* Modern Table Section */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-green-200 border-t-green-600"></div>
            <span className="ml-2 text-gray-600">Loading reports...</span>
          </div>
        ) : activeTab === 'deleted' ? (
          deletedReports.length > 0 ? (
            renderReportTable(deletedReports)
          ) : (
            <div className="text-center py-12 text-gray-500">
              <DocumentIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No recently deleted reports</p>
              <p className="text-sm">Deleted reports will appear here for recovery</p>
            </div>
          )
        ) : reports.length > 0 ? (
          renderReportTable(filteredReports)
        ) : (
          <div className="text-center py-12 text-gray-500">
            <DocumentIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No compliance reports found</p>
            <p className="text-sm">Create your first report to get started</p>
          </div>
        )}
      </div>


      {/* Add Report Form Modal - Modern Design */}
      {isAddReportFormOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-gray-100 my-4">
            {/* Modern Header with Gradient */}
            <div className="bg-gradient-to-r from-[#294B29] to-[#1a3a1a] p-6 text-white">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <DocumentIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Create New Compliance Report</h2>
                    <p className="text-green-100 text-sm">Document and track compliance activities</p>
                  </div>
                </div>
                <button 
                  onClick={handleCancelAddReport} 
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
                  Report Title
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="title"
                    value={newReport.title}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-[#294B29]/20 focus:border-[#294B29] transition-all duration-200 text-gray-900 placeholder-gray-400"
                    placeholder="Enter a descriptive title for your compliance report"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <DocumentIcon className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
                <p className="text-xs text-gray-500">Choose a clear, descriptive title that summarizes the compliance activity</p>
              </div>
              
              {/* Message Input with Modern Styling */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-900">
                  Report Details
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="relative">
                  <textarea
                    name="message"
                    value={newReport.message}
                    onChange={handleInputChange}
                    rows={5}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-[#294B29]/20 focus:border-[#294B29] transition-all duration-200 text-gray-900 placeholder-gray-400 resize-none"
                    placeholder="Provide detailed information about the compliance activity, findings, recommendations, and any relevant documentation..."
                  />
                  <div className="absolute top-3 right-3">
                    <div className="bg-gray-50 rounded-lg px-2 py-1">
                      <span className="text-xs text-gray-500">{newReport.message.length}/1000</span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500">Include specific details, observations, and any recommendations for improvement</p>
              </div>

              {/* Category Selection with Modern Cards */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-900">
                  Report Category
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {iconOptions.map(option => (
                    <div 
                      key={option.value}
                      className={`p-2 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                        newReport.category === option.value 
                          ? 'border-[#294B29] bg-[#294B29]/5' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setNewReport({...newReport, category: option.value})}
                    >
                      <div className="flex items-center space-x-2">
                        <div className={`h-3 w-3 rounded-full border-2 ${
                          newReport.category === option.value 
                            ? 'border-[#294B29] bg-[#294B29]' 
                            : 'border-gray-300'
                        }`}>
                          {newReport.category === option.value && (
                            <div className="h-1 w-1 bg-white rounded-full m-0.5"></div>
                          )}
                        </div>
                        <span className="text-sm font-medium text-gray-900">{option.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
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
                  onClick={handleCancelAddReport}
                  className="px-6 py-3 text-gray-700 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveReport}
                  disabled={!newReport.title.trim() || !newReport.message.trim()}
                  className="px-8 py-3 bg-gradient-to-r from-[#294B29] to-[#1a3a1a] text-white rounded-xl hover:from-[#1a3a1a] hover:to-[#0f2a0f] transition-all duration-200 font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg"
                >
                  <div className="flex items-center space-x-2">
                    <DocumentIcon className="h-5 w-5" />
                    <span>Create Report</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Report Form Modal */}
      {isEditReportFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Edit Report</h2>
              <button
                onClick={() => {
                  setIsEditReportFormOpen(false);
                  setEditingReport(null);
                  setNewReport({
                    title: '',
                    message: '',
                    date: new Date().toISOString().split('T')[0],
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    category: 'General'
                  });
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={newReport.title}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#294B29] focus:border-transparent"
                  placeholder="Enter report title"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={newReport.message}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#294B29] focus:border-transparent"
                  placeholder="Enter report message"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    value={newReport.date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#294B29] focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-2">
                    Time
                  </label>
                  <input
                    type="time"
                    id="time"
                    name="time"
                    value={newReport.time}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#294B29] focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  Report Category
                </label>
                <select
                  id="category"
                  name="category"
                  value={newReport.category}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#294B29] focus:border-transparent"
                >
                  {iconOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-between gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setIsEditReportFormOpen(false);
                  setEditingReport(null);
                  setNewReport({
                    title: '',
                    message: '',
                    date: new Date().toISOString().split('T')[0],
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    category: 'General'
                  });
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-[#294B29] text-white rounded-md hover:bg-[#1a3a1a] transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmationOpen && activeTab === 'deleted' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Permanently Delete Report</h2>
              <button
                onClick={handleCancelDelete}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                    <TrashIcon className="h-5 w-5 text-red-600" />
                  </div>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900">
                    Confirm Permanent Deletion
                  </h3>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Are you sure you want to permanently delete this report? This action cannot be undone and the report will be completely removed from the system.
              </p>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-between gap-3 p-6 border-t border-gray-200">
              <button
                onClick={handleCancelDelete}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (reportToDelete) {
                    handlePermanentDelete(reportToDelete);
                  }
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Details Modal - Floating Format */}
      {isReportDetailsOpen && selectedReport && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-gray-200 overflow-hidden">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                <DocumentIcon className="h-5 w-5 text-green-600" />
                <span>Report Details</span>
              </h2>
              <button 
                onClick={closeReportDetails} 
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="p-6">
              <div className="space-y-6">
                {/* Report Header */}
                <div className="flex items-start space-x-4">
                  <div className="h-12 w-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                    <DocumentIcon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900">{selectedReport.title}</h2>
                    <div className="flex items-center space-x-4 mt-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">Status:</span>
                        {getStatusBadge(selectedReport.status)}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">Date:</span>
                        <span className="text-sm font-medium text-gray-900">{selectedReport.date}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">Time:</span>
                        <span className="text-sm font-medium text-gray-900">{selectedReport.time}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Report Content */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Content</h3>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {selectedReport.message}
                  </p>
                </div>

                {/* Report Information */}
                <div className="bg-blue-50 rounded-xl p-6 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-blue-900 mb-4">Report Information</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-blue-700 font-medium">Category:</span>
                      <span className="text-blue-900 font-semibold">{selectedReport.category || 'General'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700 font-medium">Created:</span>
                      <span className="text-blue-900 font-semibold">{selectedReport.date} at {selectedReport.time}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700 font-medium">Status:</span>
                      <span className="text-blue-900 font-semibold">{selectedReport.status}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ComplianceReportModule;