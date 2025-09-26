import React, { useState, useEffect, useRef } from 'react';
import {
  ChartBarIcon,
  DocumentTextIcon,
  MagnifyingGlassCircleIcon,
  PencilSquareIcon,
  CreditCardIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import {
  Home,
  Folder,
  MessageSquare,
  FileText,
  DollarSign,
  Settings,
  HelpCircle,
  LogOut,
  User,
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import NexintelLogo from '../assets/nexintel.jpg';
import { useFileManager } from '../context/FileManagerContext';
import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';

const Sidebar = () => {
  const { isSidebarCollapsed, setIsSidebarCollapsed } = useSidebar();
  const [currentFileId, setCurrentFileId] = useState(null);
  const [userData, setUserData] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  const { user, logout } = useAuth();

  useEffect(() => {
    const loadUserData = () => {
      try {
        const storedUserData = localStorage.getItem('user');
        if (storedUserData) {
          const parsedUserData = JSON.parse(storedUserData);
          setUserData(parsedUserData);
        }
      } catch (error) {
        console.error('Error parsing user data from localStorage:', error);
      }
    };

    loadUserData();

    const handleStorageChange = (e) => {
      if (e.key === 'user') {
        loadUserData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const getDisplayName = (userInfo) => {
    if (userData?.username) {
      return userData.username;
    }
    if (userInfo?.username) {
      return userInfo.username;
    }
    if (userData?.email) {
      const emailPart = userData.email.split('@')[0];
      return emailPart.replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    if (userInfo?.email) {
      const emailPart = userInfo.email.split('@')[0];
      return emailPart.replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    return 'User';
  };

  const getInitials = (userInfo) => {
    if (userData?.username) {
      const username = userData.username.trim();
      if (username.includes(' ')) {
        const parts = username.split(' ').filter(part => part.length > 0);
        if (parts.length >= 2) {
          return parts[0].charAt(0).toUpperCase() + parts[parts.length - 1].charAt(0).toUpperCase();
        }
        return username.charAt(0).toUpperCase();
      }
      return username.charAt(0).toUpperCase();
    }
    if (userInfo?.username) {
      const username = userInfo.username.trim();
      if (username.includes(' ')) {
        const parts = username.split(' ').filter(part => part.length > 0);
        if (parts.length >= 2) {
          return parts[0].charAt(0).toUpperCase() + parts[parts.length - 1].charAt(0).toUpperCase();
        }
        return username.charAt(0).toUpperCase();
      }
      return username.charAt(0).toUpperCase();
    }
    if (userData?.email) {
      const emailPart = userData.email.split('@')[0];
      if (emailPart.includes('.')) {
        const parts = emailPart.split('.');
        return parts[0].charAt(0).toUpperCase() + parts[parts.length - 1].charAt(0).toUpperCase();
      } else if (emailPart.includes('_')) {
        const parts = emailPart.split('_');
        return parts[0].charAt(0).toUpperCase() + parts[parts.length - 1].charAt(0).toUpperCase();
      } else {
        return emailPart.charAt(0).toUpperCase();
      }
    }
    if (userInfo?.email) {
      const emailPart = userInfo.email.split('@')[0];
      if (emailPart.includes('.')) {
        const parts = emailPart.split('.');
        return parts[0].charAt(0).toUpperCase() + parts[parts.length - 1].charAt(0).toUpperCase();
      } else if (emailPart.includes('_')) {
        const parts = emailPart.split('_');
        return parts[0].charAt(0).toUpperCase() + parts[parts.length - 1].charAt(0).toUpperCase();
      } else {
        return emailPart.charAt(0).toUpperCase();
      }
    }
    return 'U';
  };

  const displayName = getDisplayName(user);
  const userInitials = getInitials(user);

  useEffect(() => {
    const loadCurrentFileId = () => {
      const fileId = localStorage.getItem('currentFileId');
      setCurrentFileId(fileId);
    };
    loadCurrentFileId();
    const handleStorageChange = (e) => {
      if (e.key === 'currentFileId') {
        setCurrentFileId(e.newValue);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    const handleCurrentFileChange = (e) => {
      setCurrentFileId(e.detail.fileId);
    };
    window.addEventListener('currentFileIdChanged', handleCurrentFileChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('currentFileIdChanged', handleCurrentFileChange);
    };
  }, []);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => !prev);
  };

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const navigationItems = [
    { name: 'Dashboard', path: '/dashboard', icon: Home },
    { name: 'Projects', path: '/documents', icon: Folder },
    { name: 'ICOM', path: '/analysis', icon: MagnifyingGlassCircleIcon },
    { name: 'Chats', path: '/chats', icon: MessageSquare, isSpecial: true },
    { name: 'Document Drafting', path: '/drafting', icon: FileText },
    { name: 'Billing & Usage', path: '/billing-usage', icon: DollarSign },
  ];

  const bottomNavigationItems = [
    { name: 'Settings', path: '/settings', icon: Settings },
    { name: 'Help', path: '/help', icon: HelpCircle },
    { name: 'Logout', onClick: logout, icon: LogOut },
  ];

  return (
    <div
      className={`hidden lg:flex bg-white border-r border-gray-200 flex-col transition-all duration-300 ease-in-out shadow-sm ${
        isSidebarCollapsed ? 'w-20' : 'w-64'
      } relative h-screen`}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 relative flex items-center justify-between">
          {!isSidebarCollapsed && (
            <img src={NexintelLogo} alt="Nexintel AI Logo" className="h-8 w-auto" />
          )}
          <button
            onClick={toggleSidebar}
            className={`p-1.5 rounded-full hover:bg-gray-100 transition-colors duration-200 ${
              isSidebarCollapsed ? 'mx-auto' : ''
            }`}
          >
            {isSidebarCollapsed ? (
              <ChevronRightIcon className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronLeftIcon className="h-5 w-5 text-gray-500" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-2 py-4">
          <nav className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              const isChats = item.name === 'Chats';

              return (
                <div key={item.name}>
                  {isChats ? (
                    <Link
                      to={currentFileId ? `/chats/${currentFileId}` : '/chats'}
                      className={`group flex items-center w-full ${isSidebarCollapsed ? 'justify-center px-2' : 'px-3'} py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                        active
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                      title={isSidebarCollapsed ? item.name : undefined}
                    >
                      <Icon
                        className={`h-5 w-5 ${isSidebarCollapsed ? '' : 'mr-3'} transition-colors duration-200 ${
                          active
                            ? 'text-blue-700'
                            : 'text-gray-500 group-hover:text-gray-700'
                        }`}
                      />
                      <span className={`${isSidebarCollapsed ? 'hidden' : 'inline'} transition-all duration-200`}>
                        {item.name}
                      </span>
                      {active && !isSidebarCollapsed && (
                        <div className="ml-auto w-2 h-2 bg-blue-600 rounded-full"></div>
                      )}
                    </Link>
                  ) : (
                    <Link
                      to={item.path}
                      className={`group flex items-center w-full ${isSidebarCollapsed ? 'justify-center px-2' : 'px-3'} py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                        active
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                      title={isSidebarCollapsed ? item.name : undefined}
                    >
                      <Icon
                        className={`h-5 w-5 ${isSidebarCollapsed ? '' : 'mr-3'} transition-colors duration-200 ${
                          active
                            ? 'text-blue-700'
                            : 'text-gray-500 group-hover:text-gray-700'
                        }`}
                      />
                      <span className={`${isSidebarCollapsed ? 'hidden' : 'inline'} transition-all duration-200`}>
                        {item.name}
                      </span>
                      {active && !isSidebarCollapsed && (
                        <div className="ml-auto w-2 h-2 bg-blue-600 rounded-full"></div>
                      )}
                    </Link>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* User Profile and Bottom Navigation */}
        <div className="p-4 border-t border-gray-200 bg-white">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {userInitials}
            </div>
            {!isSidebarCollapsed && (
              <div className="text-left min-w-0 flex-1">
                <div className="text-sm font-medium text-gray-900 truncate">{displayName}</div>
                {userData?.email && (
                  <div className="text-xs text-gray-500 truncate">{userData.email}</div>
                )}
              </div>
            )}
          </div>
          <nav className="space-y-1">
            {bottomNavigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.name}
                  onClick={item.onClick || (() => navigate(item.path))}
                  className={`group flex items-center w-full ${isSidebarCollapsed ? 'justify-center px-2' : 'px-3'} py-2.5 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200`}
                  title={isSidebarCollapsed ? item.name : undefined}
                >
                  <Icon
                    className={`h-5 w-5 ${isSidebarCollapsed ? '' : 'mr-3'} text-gray-500 group-hover:text-gray-700 transition-colors duration-200`}
                  />
                  <span className={`${isSidebarCollapsed ? 'hidden' : 'inline'} transition-all duration-200`}>
                    {item.name}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
};

const FolderTreeComponent = ({ items, level = 0, parentPath = '', expandedFolders, toggleFolder, selectFolder, selectedFolder, searchQuery = '' }) => {
  return items
    .filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .map((item, index) => {
      const itemPath = parentPath ? `${parentPath}/${item.name}` : item.name;
      const isExpanded = expandedFolders.has(itemPath);
      const hasChildren = item.children && item.children.length > 0;
      const isSelected = selectedFolder?.id === item.id;
      
      return (
        <div key={`${itemPath}-${index}`} className="select-none">
          <button
            onClick={() => selectFolder(item)}
            className={`group flex items-center w-full py-1.5 px-3 mx-1 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors ${
              isSelected ? 'bg-indigo-600 text-white' : 'text-gray-700'
            }`}
            style={{ paddingLeft: `${(level * 16) + 12}px` }}
          >
            {hasChildren && (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFolder(itemPath);
                }}
                className="mr-2 p-0.5 rounded hover:bg-gray-100 transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                )}
              </span>
            )}
            {!hasChildren && <span className="w-4 h-4 mr-2" />}
            <Folder className={`h-4 w-4 mr-2 flex-shrink-0 ${
              isSelected ? 'text-white' : 'text-gray-500'
            }`} />
            <span className="text-sm truncate">{item.name}</span>
          </button>
          
          {hasChildren && isExpanded && (
            <div className="mt-0.5">
              <FolderTreeComponent
                items={item.children}
                level={level + 1}
                parentPath={itemPath}
                expandedFolders={expandedFolders}
                toggleFolder={toggleFolder}
                selectFolder={selectFolder}
                selectedFolder={selectedFolder}
                searchQuery={searchQuery}
              />
            </div>
          )}
        </div>
      );
    });
};

export default Sidebar;