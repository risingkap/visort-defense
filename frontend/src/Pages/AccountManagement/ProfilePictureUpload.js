import React, { useState } from 'react';
import { UserIcon, XMarkIcon } from '@heroicons/react/24/outline';

const ProfilePictureUpload = ({ onImageChange }) => {
  const [previewUrl, setPreviewUrl] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
        onImageChange(file);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    onImageChange(null);
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 rounded-full overflow-hidden border-2 border-gray-200">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Profile preview"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <UserIcon className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 text-gray-400" />
          </div>
        )}
      </div>
      
      <div className="flex flex-col items-center space-y-2">
        <label className="cursor-pointer">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
          <span className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 transition-colors">
            Upload Photo
          </span>
        </label>
        
        {previewUrl && (
          <button
            onClick={handleRemoveImage}
            className="flex items-center text-red-600 hover:text-red-700 text-sm"
          >
            <XMarkIcon className="w-4 h-4 mr-1" />
            Remove Photo
          </button>
        )}
      </div>
      
      <p className="text-xs text-gray-500 text-center">
        Recommended: Square image, at least 400 x 400px
      </p>
    </div>
  );
};

export default ProfilePictureUpload; 