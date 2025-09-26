import React, { useState, useEffect, useContext } from 'react';
import { documentApi } from '../../services/documentApi';
import { FileManagerContext } from '../../context/FileManagerContext';
import DocumentCard from './DocumentCard';
import UploadDocumentModal from './UploadDocumentModal';
import Notification from '../Notification'; // Import the new Notification component

const FolderContent = () => {
  const { selectedFolder, documents, setDocuments, setChatSessions, setSelectedChatSessionId } = useContext(FileManagerContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [processingStatus, setProcessingStatus] = useState(null);
  const [individualDocStatuses, setIndividualDocStatuses] = useState({}); // New state for individual doc statuses
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState(null);

  const fetchFolderContent = async () => {
    if (!selectedFolder) {
      setDocuments([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await documentApi.getFoldersAndFiles();
      const currentFolder = data.folders.find(f => f.name === selectedFolder);
      if (currentFolder && currentFolder.children) {
        setDocuments(currentFolder.children);
      } else {
        setDocuments([]);
      }
    } catch (err) {
      setError('Failed to fetch folder content.');
      console.error('Error fetching folder content:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFolderProcessingStatus = async () => {
    if (!selectedFolder) return;
    try {
      const statusData = await documentApi.getFolderProcessingStatus(selectedFolder);
      setProcessingStatus(statusData);
      // Check if any document is still processing, if so, poll again
      if (statusData.processingStatus.processing > 0 || statusData.processingStatus.queued > 0) {
        setTimeout(fetchFolderProcessingStatus, 5000); // Poll every 5 seconds
      } else {
        // If processing is complete, refresh folder content to get updated statuses
        fetchFolderContent();
      }
    } catch (err) {
      console.error('Error fetching folder processing status:', err);
    }
  };

  useEffect(() => {
    fetchFolderContent();
    fetchFolderProcessingStatus(); // Start polling for status
    // Clear chat sessions when folder changes
    setChatSessions([]);
    setSelectedChatSessionId(null);
  }, [selectedFolder]);

  const handleUploadDocuments = async (files) => {
    if (!selectedFolder) {
      alert('Please select a folder first.');
      return;
    }
    try {
      const uploadResponse = await documentApi.uploadDocuments(selectedFolder, files);
      setIsUploadModalOpen(false);
      fetchFolderContent(); // Refresh content to show new files
      fetchFolderProcessingStatus(); // Start/continue polling for folder status

      // Initialize individual document statuses and start polling for each
      if (uploadResponse && uploadResponse.uploadedFiles) {
        const newStatuses = {};
        uploadResponse.uploadedFiles.forEach(file => {
          newStatuses[file.id] = { status: 'queued', progress: 0 }; // Initial status
          pollIndividualDocumentStatus(file.id);
        });
        setIndividualDocStatuses(prev => ({ ...prev, ...newStatuses }));
      }
    } catch (err) {
      setError(`Failed to upload documents: ${err.response?.data?.details || err.message}`);
    }
  };

  const pollIndividualDocumentStatus = async (fileId) => {
    try {
      const statusData = await documentApi.getFileProcessingStatus(fileId);
      setIndividualDocStatuses(prev => ({
        ...prev,
        [fileId]: { status: statusData.status, progress: statusData.progress || 0 }
      }));

      if (statusData.status === 'processing' || statusData.status === 'queued') {
        setTimeout(() => pollIndividualDocumentStatus(fileId), 3000); // Poll every 3 seconds
      } else {
        fetchFolderContent(); // Refresh folder content once processing is complete
      }
    } catch (err) {
      console.error(`Error fetching status for file ${fileId}:`, err);
      setIndividualDocStatuses(prev => ({
        ...prev,
        [fileId]: { status: 'error', progress: 0 }
      }));
    }
  };

  const handleGetSummary = async () => {
    if (!selectedFolder) {
      alert('Please select a folder first.');
      return;
    }
    setSummaryLoading(true);
    setSummaryError(null);
    try {
      const summaryData = await documentApi.getFolderSummary(selectedFolder);
      alert(`Folder Summary: ${summaryData.summary}`);
      // Optionally, you might want to display this summary in the chat interface
      // For now, just an alert.
    } catch (err) {
      setSummaryError(`Failed to get folder summary: ${err.response?.data?.details || err.message}`);
    } finally {
      setSummaryLoading(false);
    }
  };

  if (!selectedFolder) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-900 text-gray-400 text-lg rounded-lg shadow-lg">
        Select a folder to view its contents.
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex justify-end items-center mb-4">
        <div className="space-x-3">
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold px-5 py-2.5 rounded-full text-sm transition-colors duration-200 shadow-sm"
          >
            Upload Documents
          </button>
          <button
            onClick={handleGetSummary}
            disabled={summaryLoading}
            className="bg-green-100 hover:bg-green-200 text-green-700 font-semibold px-5 py-2.5 rounded-full text-sm transition-colors duration-200 shadow-sm disabled:opacity-50"
          >
            {summaryLoading ? 'Generating Summary...' : 'Get Folder Summary'}
          </button>
        </div>
      </div>

      <Notification message={error} type="error" onClose={() => setError(null)} />
      <Notification message={summaryError} type="error" onClose={() => setSummaryError(null)} />

      {processingStatus && (
        <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200 text-sm text-blue-800 shadow-sm">
          <h3 className="font-semibold mb-2">Processing Status:</h3>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <p>Total Documents: <span className="font-medium">{processingStatus.processingStatus.total}</span></p>
            <p>Queued: <span className="font-medium">{processingStatus.processingStatus.queued}</span></p>
            <p>Processing: <span className="font-medium">{processingStatus.processingStatus.processing}</span></p>
            <p>Completed: <span className="font-medium">{processingStatus.processingStatus.completed}</span></p>
            <p>Failed: <span className="font-medium">{processingStatus.processingStatus.failed}</span></p>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${processingStatus.overallProgress || 0}%` }}
            ></div>
          </div>
          <p className="text-right text-xs mt-1 font-medium">{processingStatus.overallProgress || 0}% Complete</p>
        </div>
      )}

      <div className="flex-grow overflow-y-auto space-y-4">
        {loading ? (
          <div className="text-gray-500 text-center py-8">Loading documents...</div>
        ) : documents.length === 0 ? (
          <div className="text-gray-500 text-center py-8">No documents in this folder. Upload some to get started!</div>
        ) : (
          documents.map((doc) => (
            <DocumentCard
              key={doc.id}
              document={doc}
              individualStatus={individualDocStatuses[doc.id]}
            />
          ))
        )}
      </div>

      <UploadDocumentModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={handleUploadDocuments}
      />
    </div>
  );
};

export default FolderContent;