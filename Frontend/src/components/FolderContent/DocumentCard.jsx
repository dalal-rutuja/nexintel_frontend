import React from 'react';
import { FileTextIcon } from 'lucide-react'; // Using lucide-react for cleaner icons

const DocumentCard = ({ document, individualStatus }) => {
  const status = individualStatus?.status || document.status;
  const progress = individualStatus?.progress || 0;

  const getStatusClasses = (currentStatus) => {
    switch (currentStatus) {
      case 'processed':
        return 'bg-green-100 text-green-700';
      case 'processing':
      case 'batch_processing':
        return 'bg-yellow-100 text-yellow-700';
      case 'queued':
      case 'batch_queued':
        return 'bg-blue-100 text-blue-700';
      case 'error':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm flex items-center justify-between border border-gray-100">
      <div className="flex items-center">
        <FileTextIcon className="h-6 w-6 mr-3 text-gray-400" />
        <div>
          <p className="font-medium text-gray-800">{document.name}</p>
          <p className="text-gray-500 text-sm">
            {document.size ? `${(document.size / 1024).toFixed(2)} KB` : 'N/A'} - {new Date(document.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-3">
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusClasses(status)}`}
        >
          {status.replace(/_/g, ' ')}
        </span>
        {(status === 'processing' || status === 'batch_processing' || status === 'queued' || status === 'batch_queued') && (
          <div className="w-24 bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        )}
        {document.url && status === 'processed' && (
          <a
            href={document.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            View
          </a>
        )}
      </div>
    </div>
  );
};

export default DocumentCard;