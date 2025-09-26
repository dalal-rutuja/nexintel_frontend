import React from 'react';
import { XCircleIcon, CheckCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

const Notification = ({ message, type = 'info', onClose }) => {
  if (!message) return null;

  const baseStyle = "p-3 rounded-lg flex items-center shadow-md text-sm";
  let typeStyle = "";
  let Icon = InformationCircleIcon;

  switch (type) {
    case 'success':
      typeStyle = "bg-green-50 border border-green-200 text-green-800";
      Icon = CheckCircleIcon;
      break;
    case 'error':
      typeStyle = "bg-red-50 border border-red-200 text-red-800";
      Icon = XCircleIcon;
      break;
    case 'info':
    default:
      typeStyle = "bg-blue-50 border border-blue-200 text-blue-800";
      Icon = InformationCircleIcon;
      break;
  }

  return (
    <div className={`${baseStyle} ${typeStyle} mb-4`} role="alert">
      <Icon className="h-5 w-5 mr-2 flex-shrink-0" />
      <div className="flex-1">{message}</div>
      {onClose && (
        <button
          onClick={onClose}
          className="ml-auto p-1 rounded-full hover:bg-opacity-75 transition-colors duration-200"
          aria-label="Close notification"
        >
          <XCircleIcon className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

export default Notification;