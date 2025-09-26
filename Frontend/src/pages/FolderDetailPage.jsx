import React, { useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import FolderContent from '../components/FolderContent/FolderContent';
import ChatInterface from '../components/ChatInterface/ChatInterface';
import ChatSearchBox from '../components/ChatInterface/ChatSearchBox';
import { FileManagerContext } from '../context/FileManagerContext';
import { ArrowLeft } from 'lucide-react';

const FolderDetailPage = () => {
  const { folderName } = useParams();
  const navigate = useNavigate();
  const { setSelectedFolder, selectedFolder, loadFoldersAndFiles } = useContext(FileManagerContext);

  useEffect(() => {
    if (folderName) {
      setSelectedFolder(folderName);
    }
  }, [folderName, setSelectedFolder]);

  // Ensure folders are loaded so context can find the selected folder
  useEffect(() => {
    loadFoldersAndFiles();
  }, [loadFoldersAndFiles]);

  return (
      <div className="flex-1 flex flex-col bg-gray-50 text-gray-900 min-h-screen">
        {/* Top Bar: Project Title and Back Button */}
        <div className="flex items-center p-4 border-b border-gray-200 bg-white shadow-sm">
          <button
            onClick={() => navigate('/documents')}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors duration-200 mr-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span className="text-sm font-medium">Back to Projects</span>
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{folderName || 'Loading...'}</h1>
        </div>

        {/* Main Content Area: Center Panel (Conversations/Summaries) and Right Panel (Instructions/Files) */}
        <div className="flex flex-1 overflow-hidden">
          {/* Center Panel: Conversations, Summaries, Activities */}
          <div className="flex-1 flex flex-col p-6 overflow-y-auto">
            {/* Folder Content Section - Commented out as per requirements
            <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-gray-100">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Folder Content</h2>
              <FolderContent />
            </div>
            */}
            <ChatSearchBox />
            {/* Chat Sessions Section - Commented out as per requirements
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <ChatInterface />
            </div>
            */}
          </div>

          {/* Right Panel: Instructions and Files */}
          <div className="w-96 bg-white border-l border-gray-200 p-6 flex flex-col shadow-sm overflow-y-auto">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Instructions</h2>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-gray-700 text-sm">
                <p className="mb-2">
                  Welcome to your project folder! Here you can manage your documents,
                  chat with the AI, and get summaries.
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Upload documents using the drag-and-drop area below.</li>
                  <li>Get a summary of your folder's content.</li>
                  <li>Start a new chat session to discuss your documents.</li>
                </ul>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Files</h2>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center text-gray-500 hover:border-gray-400 transition-colors duration-200">
                <p className="mb-2">Drag and drop documents here</p>
                <p className="text-sm">or click to upload</p>
                {/* Placeholder for actual file upload input */}
                <input type="file" className="hidden" multiple />
              </div>
              {/* Placeholder for uploaded file list */}
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <span className="text-sm text-gray-700">document_example.pdf</span>
                  <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">Completed</span>
                </div>
                <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <span className="text-sm text-gray-700">another_doc.docx</span>
                  <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full">Processing</span>
                </div>
              </div>
            </div>
          </div>
        </div>
    </div>
  );
};

export default FolderDetailPage;