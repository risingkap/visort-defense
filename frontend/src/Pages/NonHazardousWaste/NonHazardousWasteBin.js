//NonHazardousWasteBin.js

import React, { useState, useEffect } from 'react';
import { 
  BeakerIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const NonHazardousWasteBin = () => {
  const [bins, setBins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBin, setSelectedBin] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchBinData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Calculate 30 days ago for consistent filtering with Waste Chart
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const startDate = thirtyDaysAgo.toISOString().split('T')[0];
      
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/disposals?binId=ESP32CAM-01&types=Non-Hazardous&startDate=${startDate}&requireDate=true&requireFileSize=true&fields=summary`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const { data } = await response.json();

      // Server already filters by binId and type; keep a defensive check
      const filtered = (Array.isArray(data) ? data : []).filter(item => 
        (item.binId || '') === 'ESP32CAM-01' && (item.binType || '') === 'Non-Hazardous'
      );

      const transformedData = filtered.map(item => ({
        id: item._id,
        type: item.binType || "Non-Hazardous",
        binId: item.binId || '',
        createdAt: item.createdAt ? new Date(item.createdAt).toLocaleString() : (item.disposalDate ? new Date(item.disposalDate).toLocaleString() : 'Unknown')
      }));
      
      setBins(transformedData);
      if (transformedData.length > 0 && !selectedBin) {
        setSelectedBin(transformedData[0]);
      }
    } catch (err) {
      setError(err.message);
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBinData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchBinData();
  };

  const handleDelete = async (binId) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/disposals/${binId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete record');
      }

      // Refresh the data after successful deletion
      await fetchBinData();
      setDeleteConfirm(null);
      
      // Show success message (you could add a toast notification here)
      console.log('Record deleted successfully');
    } catch (err) {
      setError(err.message);
      console.error("Delete error:", err);
    }
  };

  // Removed status badges; simplified UI to reflect summary data only

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(16);
    doc.text('Non-Hazardous Disposals Report (ESP32CAM-01)', 14, 22);
    
    // Add date
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
    
    // Prepare table data
    const tableData = bins.map(bin => [
      bin.binId || '-',
      bin.type || '-',
      bin.createdAt || '-'
    ]);
    
    // Add table
    autoTable(doc, {
      head: [['Bin ID', 'Type', 'Created At']],
      body: tableData,
      startY: 40,
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [41, 75, 41], // #294B29 color
        textColor: 255,
        fontStyle: 'bold'
      }
    });
    
    // Save the PDF
    doc.save('non-hazardous-waste-bins-report.pdf');
  };

  if (loading && !refreshing) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-200 border-t-green-600 mx-auto mb-4"></div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Non-Hazardous Waste Data</h3>
        <p className="text-gray-600">Please wait while we fetch the latest information...</p>
      </div>
    </div>
  );
  
  if (error) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border-l-4 border-red-500 p-8 max-w-md w-full">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <div className="h-12 w-12 bg-red-100 rounded-xl flex items-center justify-center">
              <ExclamationCircleIcon className="h-7 w-7 text-red-600" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-red-800 mb-2">Error Loading Data</h3>
            <p className="text-red-700 mb-4">{error}</p>
            <button
              onClick={handleRefresh}
              className="inline-flex items-center px-4 py-2 border-2 border-red-300 text-sm font-semibold rounded-xl text-red-700 bg-red-50 hover:bg-red-100 hover:border-red-400 focus:outline-none transition-all duration-200"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Retry
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (!loading && bins.length === 0) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md w-full">
        <div className="h-16 w-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <BeakerIcon className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">No Non-Hazardous Waste Bins</h3>
        <p className="text-gray-600 mb-6">No bins have been registered in the system yet.</p>
        <button
          onClick={handleRefresh}
          className="inline-flex items-center px-6 py-3 border-2 border-transparent text-sm font-semibold rounded-xl shadow-lg text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 focus:outline-none transition-all duration-200 hover:shadow-xl"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-3 sm:p-4">
      <div className="max-w-7xl mx-auto">
        {/* Balanced Title Section */}
        <div className="mb-3">
          <div className="flex items-center space-x-3 mb-1">
            <div className="h-9 w-9 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-lg">
              <BeakerIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Non-Hazardous Waste Management
              </h1>
              <p className="text-gray-600 text-sm">Monitor and track non-hazardous waste bin status</p>
            </div>
          </div>
        </div>

        {/* Balanced Bin Selector */}
        <div className="mb-3">
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
            <label htmlFor="bin-select" className="block text-sm font-semibold text-gray-900 mb-2">
              Select Bin to Monitor
            </label>
            <div className="relative">
              <select
                id="bin-select"
                className="block w-full pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all duration-200 bg-white shadow-sm"
                value={selectedBin?.id || ''}
                onChange={(e) => {
                  const selected = bins.find(bin => bin.id === e.target.value);
                  setSelectedBin(selected);
                }}
              >
                {bins.map(bin => (
                  <option key={bin.id} value={bin.id}>
                    Non-Hazardous Bin {bin.binId || '-'}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <BeakerIcon className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Balanced Bin Information Card */}
        {selectedBin && (
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden mb-3">
            <div className="bg-gradient-to-r from-green-50 to-green-100 px-4 py-3 border-b border-green-200">
              <div className="flex items-center space-x-3">
                <div className="h-7 w-7 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-lg">
                  <BeakerIcon className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    Bin ID: {selectedBin.binId || '-'}
                  </h3>
                  <p className="text-green-600 font-medium text-sm">Non-Hazardous Waste Container</p>
                </div>
              </div>
            </div>
            
            <div className="px-4 py-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Left Column */}
                <div className="space-y-2">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <dt className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Bin Type</dt>
                    <dd className="text-sm font-bold text-gray-900 flex items-center">
                      <div className="h-2 w-2 bg-green-500 rounded-full mr-2"></div>
                      {selectedBin.type}
                    </dd>
                  </div>
                </div>
                
                {/* Right Column */}
                <div className="space-y-2">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <dt className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Created At</dt>
                    <dd className="text-sm font-bold text-gray-900">
                      {selectedBin.createdAt || 'Unknown'}
                    </dd>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Balanced All Bins Table */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="h-6 w-6 bg-gradient-to-br from-gray-600 to-gray-700 rounded-lg flex items-center justify-center">
                <BeakerIcon className="h-4 w-4 text-white" />
              </div>
              <h3 className="text-base font-bold text-gray-900">All Non-Hazardous Disposals (ESP32CAM-01)</h3>
            </div>
          </div>
          
          <div className="overflow-x-auto" style={{ 
            maxHeight: '280px', 
            overflowY: 'scroll',
            border: '1px solid #e5e7eb',
            borderRadius: '0.5rem'
          }}>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0 z-10">
                <tr>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Bin ID</th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Type</th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Created At</th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bins.map((bin) => (
                  <tr 
                    key={bin.id} 
                    className={bin.id === selectedBin?.id ? 'bg-green-50 border-l-4 border-green-500' : 'hover:bg-gray-50 cursor-pointer transition-colors duration-200'}
                    onClick={() => setSelectedBin(bin)}
                  >
                    <td className="px-3 py-2 whitespace-nowrap text-sm font-semibold text-gray-900">{bin.binId || '-'}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-600">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {bin.type || '-'}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-600">{bin.createdAt || '-'}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-600">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirm(bin);
                        }}
                        className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Balanced Table Controls */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-3 py-2 border-t border-gray-200 flex justify-between items-center">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className={`inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-semibold rounded-md text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none transition-all duration-200 shadow-sm ${refreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {refreshing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-1.5 h-3 w-3 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Refreshing...
                </>
              ) : (
                <>
                  <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh Data
                </>
              )}
            </button>
            <button
              type="button"
              onClick={exportToPDF}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-semibold rounded-md shadow-lg text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 focus:outline-none transition-all duration-200 hover:shadow-xl"
            >
              <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export PDF
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-2">Delete Non-Hazardous Waste Record</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete this non-hazardous waste record? This action cannot be undone.
                </p>
                <div className="mt-3 text-sm text-gray-600">
                  <p><strong>Bin ID:</strong> {deleteConfirm.binId}</p>
                  <p><strong>Type:</strong> {deleteConfirm.type}</p>
                  <p><strong>Created:</strong> {deleteConfirm.createdAt}</p>
                </div>
              </div>
              <div className="items-center px-4 py-3">
                <button
                  onClick={() => handleDelete(deleteConfirm.id)}
                  className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 mr-2"
                >
                  Delete
                </button>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="mt-3 px-4 py-2 bg-gray-300 text-gray-800 text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NonHazardousWasteBin;