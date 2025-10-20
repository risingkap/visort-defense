import React, { useState, useEffect, useCallback } from 'react';
import { 
  PhotoIcon,
  BeakerIcon,
  ShieldExclamationIcon,
  TrashIcon,
  TableCellsIcon,
  Squares2X2Icon,
  ArrowPathIcon,
  ExclamationCircleIcon,
  XMarkIcon,
  CalendarIcon,
  UserIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';

const DisposalHistory = () => {
  const [disposals, setDisposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('table');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [isSelectMode, setIsSelectMode] = useState(false);

  const fetchDisposals = useCallback(async () => {
    try {
      setRefreshing(true);
      setError(null);
      
      const base = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000');
      const [hazRes, nonHazRes] = await Promise.all([
        fetch(`${base}/api/disposals?binId=ESP32CAM-01&types=Hazardous&requireDate=true&requireFileSize=true&limit=100`),
        fetch(`${base}/api/disposals?binId=ESP32CAM-01&types=Non-Hazardous&requireDate=true&requireFileSize=true&limit=100`)
      ]);
      if (!hazRes.ok || !nonHazRes.ok) {
        throw new Error(`HTTP error! hazards: ${hazRes.status}, nonhaz: ${nonHazRes.status}`);
      }
      const [{ data: hazData }, { data: nonHazData }] = await Promise.all([hazRes.json(), nonHazRes.json()]);
      
      // Removed debug logs for better performance
      const combined = [
        ...(Array.isArray(hazData) ? hazData : []),
        ...(Array.isArray(nonHazData) ? nonHazData : [])
      ];

      // Sort by date desc when available
      const dateOf = (it) => it.createdAt || it.lastUpdated || it.date || null;
      combined.sort((a, b) => {
        const da = dateOf(a) ? new Date(dateOf(a)).getTime() : 0;
        const db = dateOf(b) ? new Date(dateOf(b)).getTime() : 0;
        return db - da;
      });

      // Prefer backend-provided imageUrl when available, fallback to defaults

      const transformedData = combined.map(item => {
        const rawDate = item.createdAt || item.lastUpdated || item.date;
        const parsed = rawDate ? new Date(rawDate) : null;
        const safeDateStr = parsed && !isNaN(parsed.getTime()) ? parsed.toLocaleString() : 'Not Recorded';
        const imgPath = item.imageUrl || item.image || null;
        // If image path is relative, prefix with API base; otherwise use as-is
        const normalizedPath = typeof imgPath === 'string' && imgPath.length > 0
          ? (imgPath.startsWith('http') ? imgPath : `${base}/${imgPath.replace(/^\//, '')}`)
          : null;
        
        // Removed debug logging for better performance
        return ({
          id: item._id,
          binId: item.binId,
          binType: item.binType,
          garbageName: item.garbageType || 'Unknown Waste',
          image: normalizedPath || getDefaultImage(item.binType),
          rawDate: rawDate || null,
          disposalDateTime: safeDateStr,
          description: ``
        });
      });
      
      setDisposals(transformedData);
    } catch (err) {
      setError(err.message);
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const getDefaultImage = (binType) => {
    const images = {
      'Hazardous': '/hazardous-default.jpg',
      'Non-Hazardous': '/nonhazardous-default.jpg',
      'Infectious': '/infectious-default.jpg',
      'General': '/general-default.jpg'
    };
    return images[binType] || '/waste-default.jpg';
  };

  useEffect(() => {
    fetchDisposals();
    
    // Cleanup function to prevent memory leaks
    return () => {
      setDisposals([]);
      setError(null);
    };
  }, [fetchDisposals]);

  const handleRefresh = () => {
    fetchDisposals();
  };

  const handleDelete = async (disposalId) => {
    try {
      const base = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000');
      const response = await fetch(`${base}/api/disposals/${disposalId}`, {
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
      await fetchDisposals();
      setDeleteConfirm(null);
      
      console.log('Record deleted successfully');
    } catch (err) {
      setError(err.message);
      console.error("Delete error:", err);
    }
  };

  const handleSelectItem = (item) => {
    if (selectedItems.find(selected => selected.id === item.id)) {
      setSelectedItems(selectedItems.filter(selected => selected.id !== item.id));
    } else {
      setSelectedItems([...selectedItems, item]);
    }
  };

  const handleSelectAll = () => {
    if (selectedItems.length === disposals.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems([...disposals]);
    }
  };

  const handleBulkDelete = async () => {
    try {
      const base = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000');
      
      // Delete each selected item
      const deletePromises = selectedItems.map(item => 
        fetch(`${base}/api/disposals/${item.id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );

      const responses = await Promise.all(deletePromises);
      const failedDeletes = responses.filter(response => !response.ok);

      if (failedDeletes.length > 0) {
        throw new Error(`Failed to delete ${failedDeletes.length} records`);
      }

      // Refresh the data after successful deletion
      await fetchDisposals();
      setSelectedItems([]);
      setIsSelectMode(false);
      
      console.log(`${selectedItems.length} records deleted successfully`);
    } catch (err) {
      setError(err.message);
      console.error("Bulk delete error:", err);
    }
  };

  const handleImageClick = (item) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  const getCategoryBadge = (binType) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    
    switch(binType) {
      case "Hazardous":
        return (
          <span className={`${baseClasses} bg-red-100 text-red-800`}>
            <ShieldExclamationIcon className="h-3 w-3 mr-1" />
            Hazardous
          </span>
        );
      case "Infectious":
        return (
          <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>
            <BeakerIcon className="h-3 w-3 mr-1" />
            Infectious
          </span>
        );
      case "Non-Hazardous":
        return (
          <span className={`${baseClasses} bg-green-100 text-green-800`}>
            <TrashIcon className="h-3 w-3 mr-1" />
            Non-Hazardous
          </span>
        );
      default:
        return (
          <span className={`${baseClasses} bg-blue-100 text-blue-800`}>
            <TrashIcon className="h-3 w-3 mr-1" />
            General
          </span>
        );
    }
  };

  const renderImage = (item, size = 'w-full', clickable = false) => {
    console.log('Rendering image for item:', {
      id: item.id,
      imageUrl: item.image,
      garbageName: item.garbageName,
      hasImage: !!item.image
    });
    
    const imageElement = (
      <div className={`relative ${size === 'w-full' ? 'h-24' : 'h-12'} rounded-md bg-gray-100`}>
        {item.image ? (
          <>
            <img 
              src={item.image} 
              alt={item.garbageName}
              className={`h-full ${size} object-cover rounded-md ${clickable ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
              style={{ display: 'block' }}
              onError={(e) => {
                console.error('❌ Image failed to load:', item.image);
                console.error('Error details:', e);
                e.target.style.display = 'none';
                e.target.nextElementSibling.classList.remove('hidden');
              }}
              onLoad={() => {
                console.log('✅ Image loaded successfully:', item.image);
              }}
              onClick={clickable ? () => handleImageClick(item) : undefined}
            />
            <PhotoIcon className="absolute h-6 w-6 text-gray-400 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 hidden" />
          </>
        ) : (
          <PhotoIcon className="absolute h-6 w-6 text-gray-400 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
        )}
      </div>
    );

    return imageElement;
  };

  if (loading && !refreshing) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-3 sm:p-4 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Disposal History</h3>
        <p className="text-sm text-gray-600">Fetching waste disposal records...</p>
      </div>
    </div>
  );
  
  if (error) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-3 sm:p-4 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center">
          <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ExclamationCircleIcon className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Data</h3>
          <p className="text-sm text-gray-600 mb-6">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 hover:scale-105 shadow-lg"
          >
            Retry
          </button>
        </div>
      </div>
    </div>
  );

  if (!loading && disposals.length === 0) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-3 sm:p-4 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md w-full">
        <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <TrashIcon className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Disposal Records</h3>
        <p className="text-sm text-gray-600 mb-6">No waste disposals have been recorded yet.</p>
        <button
          onClick={handleRefresh}
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 hover:scale-105 shadow-lg"
        >
          Refresh
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-3 sm:p-4">
      {/* Modern Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-2">
          <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <TrashIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Disposal History Log</h1>
            <p className="text-sm text-gray-600">Track and monitor waste disposal activities</p>
          </div>
        </div>
        
        {/* Modern Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center space-x-2">
            <div className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
              {disposals.length} Records
            </div>
            <div className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
              {disposals.filter(d => d.binType === 'Non-Hazardous').length} Non-Hazardous
            </div>
            <div className="px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full">
              {disposals.filter(d => d.binType === 'Hazardous').length} Hazardous
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Selection Controls */}
            {isSelectMode ? (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsSelectMode(false)}
                  className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200 text-sm font-medium"
                >
                  Cancel
                </button>
                <span className="text-sm text-gray-600">
                  {selectedItems.length} selected
                </span>
                {selectedItems.length > 0 && (
                  <button
                    onClick={handleBulkDelete}
                    className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 text-sm font-medium flex items-center space-x-1"
                  >
                    <TrashIcon className="h-4 w-4" />
                    <span>Delete Selected</span>
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={() => setIsSelectMode(true)}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm font-medium"
              >
                Select Items
              </button>
            )}

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105 flex items-center space-x-2"
            >
              <ArrowPathIcon className={`h-4 w-4 ${refreshing ? 'animate-spin text-blue-600' : 'text-gray-600'}`} />
              <span className="text-sm font-medium text-gray-700">Refresh</span>
            </button>
            
            <div className="flex bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
              <button
                onClick={() => setViewMode('table')}
                className={`px-4 py-2 flex items-center space-x-2 transition-all duration-200 ${
                  viewMode === 'table' 
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
                aria-label="Table view"
              >
                <TableCellsIcon className="h-4 w-4" />
                <span className="text-sm font-medium">Table</span>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2 flex items-center space-x-2 transition-all duration-200 ${
                  viewMode === 'grid' 
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
                aria-label="Grid view"
              >
                <Squares2X2Icon className="h-4 w-4" />
                <span className="text-sm font-medium">Grid</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Table View */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0 z-10">
                <tr>
                  {isSelectMode && (
                    <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={selectedItems.length === disposals.length && disposals.length > 0}
                        onChange={handleSelectAll}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </th>
                  )}
                  <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Image
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Bin ID
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Category
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden md:table-cell">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {disposals.map((item, index) => (
                  <tr key={item.id} className={`hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                    {isSelectMode && (
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <input
                          type="checkbox"
                          checked={selectedItems.find(selected => selected.id === item.id) ? true : false}
                          onChange={() => handleSelectItem(item)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex justify-center">
                        <div className="relative group">
                          {renderImage(item, 'w-12')}
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 rounded-md transition-all duration-200 flex items-center justify-center">
                            <PhotoIcon className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{item.binId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getCategoryBadge(item.binType)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 hidden md:table-cell">
                      <div className="flex items-center space-x-2">
                        <CalendarIcon className="h-4 w-4 text-gray-400" />
                        <span>{item.disposalDateTime}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {!isSelectMode && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirm(item);
                          }}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                        >
                          <TrashIcon className="w-3 h-3 mr-1" />
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="max-h-[500px] overflow-y-auto p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {disposals.map((item) => (
                <div key={item.id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
                  <div className="relative">
                    {renderImage(item, 'w-full', true)}
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      {getCategoryBadge(item.binType)}
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-lg mb-1">{item.garbageName}</h3>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <MapPinIcon className="h-4 w-4 text-gray-400" />
                          <span>Bin: {item.binId}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <CalendarIcon className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">Disposed:</span>
                        <span>{item.disposalDateTime}</span>
                      </div>
                      
                      <div className="pt-2 border-t border-gray-100">
                        <p className="text-xs text-gray-500 line-clamp-2">{item.description}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modern Image Detail Modal */}
      {isModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            {/* Modern Modal Header */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-8 py-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                    <TrashIcon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Waste Disposal Details</h2>
                    <p className="text-blue-100 text-sm">Complete disposal information</p>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="text-white hover:text-blue-200 transition-colors p-2 hover:bg-white hover:bg-opacity-10 rounded-lg"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Modern Modal Content */}
            <div className="p-8 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Image Section */}
                <div className="space-y-6">
                  <div className="relative group">
                    <img
                      src={selectedItem.image}
                      alt={selectedItem.garbageName}
                      className="w-full h-80 object-cover rounded-xl border border-gray-200 shadow-lg"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextElementSibling.classList.remove('hidden');
                      }}
                    />
                    <div className="hidden absolute inset-0 flex items-center justify-center bg-gray-100 rounded-xl">
                      <PhotoIcon className="h-20 w-20 text-gray-400" />
                    </div>
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 rounded-xl transition-all duration-200"></div>
                  </div>
                  <div className="flex justify-center">
                    {getCategoryBadge(selectedItem.binType)}
                  </div>
                </div>

                {/* Details Section */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">Disposal Information</h3>
                    <div className="space-y-6">
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
                        <div className="flex items-start space-x-4">
                          <div className="h-10 w-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                            <TrashIcon className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-blue-900">Waste Type</p>
                            <p className="text-lg font-medium text-blue-800">{selectedItem.binType}</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-100">
                        <div className="flex items-start space-x-4">
                          <div className="h-10 w-10 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                            <CalendarIcon className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-green-900">Disposal Date</p>
                            <p className="text-lg font-medium text-green-800">{selectedItem.disposalDateTime}</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-4 rounded-xl border border-purple-100">
                        <div className="flex items-start space-x-4">
                          <div className="h-10 w-10 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                            <MapPinIcon className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-purple-900">Bin ID</p>
                            <p className="text-lg font-medium text-purple-800">{selectedItem.binId}</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-gray-50 to-slate-50 p-4 rounded-xl border border-gray-100">
                        <div className="flex items-start space-x-4">
                          <div className="h-10 w-10 bg-gray-500 rounded-lg flex items-center justify-center flex-shrink-0">
                            <UserIcon className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">Description</p>
                            <p className="text-sm text-gray-700 mt-1">{selectedItem.description}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modern Modal Footer */}
            <div className="bg-gray-50 px-8 py-6 border-t border-gray-200">
              <div className="flex justify-end">
                <button
                  onClick={closeModal}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 hover:scale-105 shadow-lg"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <ExclamationCircleIcon className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-2">Delete Disposal Record</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete this disposal record? This action cannot be undone.
                </p>
                <div className="mt-3 text-sm text-gray-600">
                  <p><strong>Bin ID:</strong> {deleteConfirm.binId}</p>
                  <p><strong>Type:</strong> {deleteConfirm.binType}</p>
                  <p><strong>Date:</strong> {deleteConfirm.disposalDateTime}</p>
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

export default DisposalHistory;