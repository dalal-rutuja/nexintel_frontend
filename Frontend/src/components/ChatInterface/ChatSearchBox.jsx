import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Plus, Upload, Camera, Folder, HardDrive, Github, Paperclip } from 'lucide-react';

const ChatSearchBox = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchScope, setSearchScope] = useState('both');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          triggerRef.current && !triggerRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => {
    setIsDropdownOpen((prev) => !prev);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    if (event.target.value.length > 2) {
      setSearchResults([
        `Result for "${event.target.value}" in documents`,
        `Result for "${event.target.value}" in chats`,
      ]);
    } else {
      setSearchResults([]);
    }
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
  };

  const handleScopeChange = (scope) => {
    setSearchScope(scope);
  };

  const handleFileUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = '*/*';
    input.onchange = (e) => {
      const files = Array.from(e.target.files);
      console.log('Files selected:', files);
    };
    input.click();
    setIsDropdownOpen(false);
  };

  const handleScreenshot = () => {
    console.log('Taking screenshot...');
    setIsDropdownOpen(false);
  };

  const handleGitHubConnect = () => {
    console.log('Connecting to GitHub...');
    setIsDropdownOpen(false);
  };

  const handleGoogleDriveConnect = () => {
    console.log('Connecting to Google Drive...');
    setIsDropdownOpen(false);
  };

  const handleUseProject = () => {
    console.log('Using project...');
    setIsDropdownOpen(false);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Main Chat Input Container - Claude AI Style */}
      <div className="relative">
        {/* Search Input Box */}
        <div className="relative bg-white border border-gray-300 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 focus-within:border-orange-500 focus-within:shadow-md">
          <div className="flex items-center px-4 py-3">
            {/* Attachment Button */}
            <button
              ref={triggerRef}
              onClick={toggleDropdown}
              className="flex items-center justify-center w-8 h-8 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-all duration-200 mr-3"
              aria-label="Attach files"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            
            {/* Search Input */}
            <div className="flex-1 flex items-center">
              <input
                type="text"
                placeholder="Message Claude..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full text-gray-900 placeholder-gray-500 bg-transparent border-none outline-none text-base resize-none"
                style={{ minHeight: '24px' }}
              />
            </div>
            
            {/* Clear Button */}
            {searchTerm && (
              <button
                onClick={handleClearSearch}
                className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200 ml-2"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Attachment Dropdown */}
        {isDropdownOpen && (
          <div
            ref={dropdownRef}
            className="absolute left-4 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-50"
            style={{
              animation: 'fadeIn 0.15s ease-out',
              transformOrigin: 'top left'
            }}
          >
            <div
              onClick={handleFileUpload}
              className="flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors duration-150"
            >
              <div className="flex items-center justify-center w-8 h-8 bg-blue-50 rounded-full mr-3">
                <Upload className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">Upload from computer</div>
                <div className="text-xs text-gray-500">Images, documents, spreadsheets...</div>
              </div>
            </div>
            
            <div
              onClick={handleScreenshot}
              className="flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors duration-150"
            >
              <div className="flex items-center justify-center w-8 h-8 bg-green-50 rounded-full mr-3">
                <Camera className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">Use camera</div>
                <div className="text-xs text-gray-500">Take a photo</div>
              </div>
            </div>
            
            <hr className="my-1 border-gray-100" />
            
            <div
              onClick={handleGitHubConnect}
              className="flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors duration-150"
            >
              <div className="flex items-center justify-center w-8 h-8 bg-gray-50 rounded-full mr-3">
                <Github className="w-4 h-4 text-gray-700" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">Connect GitHub</div>
                <div className="text-xs text-gray-500">Access your repositories</div>
              </div>
              <div className="text-xs text-blue-600 font-medium">Connect</div>
            </div>
            
            <div
              onClick={handleGoogleDriveConnect}
              className="flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors duration-150"
            >
              <div className="flex items-center justify-center w-8 h-8 bg-blue-50 rounded-full mr-3">
                <HardDrive className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">Connect Google Drive</div>
                <div className="text-xs text-gray-500">Access your files and folders</div>
              </div>
              <div className="text-xs text-blue-600 font-medium">Connect</div>
            </div>
            
            <hr className="my-1 border-gray-100" />
            
            <div
              onClick={handleUseProject}
              className="flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors duration-150"
            >
              <div className="flex items-center justify-center w-8 h-8 bg-purple-50 rounded-full mr-3">
                <Folder className="w-4 h-4 text-purple-600" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">Create Project</div>
                <div className="text-xs text-gray-500">Work with Claude around a set of docs, code, or ideas</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Search Functionality (when search term exists) */}
      {searchTerm && (
        <div className="mt-4">
          {/* Search Scope Tabs */}
          <div className="flex items-center space-x-1 mb-4">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => handleScopeChange('both')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                  searchScope === 'both'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                All
              </button>
              <button
                onClick={() => handleScopeChange('chats')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                  searchScope === 'chats'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Chats
              </button>
              <button
                onClick={() => handleScopeChange('documents')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                  searchScope === 'documents'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Projects
              </button>
            </div>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="space-y-2">
              {searchResults.map((result, index) => (
                <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors duration-150 cursor-pointer">
                  <div className="flex items-start space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full">
                      <Search className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{result}</div>
                      <div className="text-xs text-gray-500 mt-1">Found in recent conversations</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-8px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default ChatSearchBox;
