// import React, { useEffect, useContext } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import FolderContent from '../components/FolderContent/FolderContent';
// import ChatInterface from '../components/ChatInterface/ChatInterface';
// import ChatSearchBox from '../components/ChatInterface/ChatSearchBox';
// import { FileManagerContext } from '../context/FileManagerContext';
// import { ArrowLeft } from 'lucide-react';

// const FolderDetailPage = () => {
//   const { folderName } = useParams();
//   const navigate = useNavigate();
//   const { setSelectedFolder, selectedFolder, loadFoldersAndFiles } = useContext(FileManagerContext);

//   useEffect(() => {
//     if (folderName) {
//       setSelectedFolder(folderName);
//     }
//   }, [folderName, setSelectedFolder]);

//   // Ensure folders are loaded so context can find the selected folder
//   useEffect(() => {
//     loadFoldersAndFiles();
//   }, [loadFoldersAndFiles]);

//   return (
//       <div className="flex-1 flex flex-col bg-gray-50 text-gray-900 min-h-screen">
//         {/* Top Bar: Project Title and Back Button */}
//         <div className="flex items-center p-4 border-b border-gray-200 bg-white shadow-sm">
//           <button
//             onClick={() => navigate('/documents')}
//             className="flex items-center text-gray-600 hover:text-gray-900 transition-colors duration-200 mr-4"
//           >
//             <ArrowLeft className="w-5 h-5 mr-2" />
//             <span className="text-sm font-medium">Back to Projects</span>
//           </button>
//           <h1 className="text-2xl font-bold text-gray-900">{folderName || 'Loading...'}</h1>
//         </div>

//         {/* Main Content Area: Center Panel (Conversations/Summaries) and Right Panel (Instructions/Files) */}
//         <div className="flex flex-1 overflow-hidden">
//           {/* Center Panel: Conversations, Summaries, Activities */}
//           <div className="flex-1 flex flex-col p-6 overflow-y-auto">
//             {/* Folder Content Section - Commented out as per requirements
//             <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-gray-100">
//               <h2 className="text-xl font-semibold text-gray-800 mb-4">Folder Content</h2>
//               <FolderContent />
//             </div>
//             */}
//             <ChatSearchBox />
//             {/* Chat Sessions Section - Commented out as per requirements
//             <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
//               <ChatInterface />
//             </div>
//             */}
//           </div>

//           {/* Right Panel: Instructions and Files */}
//           <div className="w-96 bg-white border-l border-gray-200 p-6 flex flex-col shadow-sm overflow-y-auto">
//             <div className="mb-6">
//               <h2 className="text-xl font-semibold text-gray-800 mb-4">Instructions</h2>
//               <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-gray-700 text-sm">
//                 <p className="mb-2">
//                   Welcome to your project folder! Here you can manage your documents,
//                   chat with the AI, and get summaries.
//                 </p>
//                 <ul className="list-disc list-inside space-y-1">
//                   <li>Upload documents using the drag-and-drop area below.</li>
//                   <li>Get a summary of your folder's content.</li>
//                   <li>Start a new chat session to discuss your documents.</li>
//                 </ul>
//               </div>
//             </div>

//             <div>
//               <h2 className="text-xl font-semibold text-gray-800 mb-4">Files</h2>
//               <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center text-gray-500 hover:border-gray-400 transition-colors duration-200">
//                 <p className="mb-2">Drag and drop documents here</p>
//                 <p className="text-sm">or click to upload</p>
//                 {/* Placeholder for actual file upload input */}
//                 <input type="file" className="hidden" multiple />
//               </div>
//               {/* Placeholder for uploaded file list */}
//               <div className="mt-4 space-y-2">
//                 <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200">
//                   <span className="text-sm text-gray-700">document_example.pdf</span>
//                   <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">Completed</span>
//                 </div>
//                 <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200">
//                   <span className="text-sm text-gray-700">another_doc.docx</span>
//                   <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full">Processing</span>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//     </div>
//   );
// };

// export default FolderDetailPage;


// import React, { useEffect, useContext, useState, useRef } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import FolderContent from '../components/FolderContent/FolderContent';
// import ChatInterface from '../components/ChatInterface/ChatInterface';
// import ChatSearchBox from '../components/ChatInterface/ChatSearchBox';
// import { FileManagerContext } from '../context/FileManagerContext';
// import { documentApi } from '../services/documentApi';
// import { ArrowLeft, Upload, File, X, CheckCircle, Clock, AlertCircle, RefreshCw, FolderOpen } from 'lucide-react';

// const FolderDetailPage = () => {
//   const { folderName } = useParams();
//   const navigate = useNavigate();
//   const { 
//     setSelectedFolder, 
//     selectedFolder, 
//     loadFoldersAndFiles, 
//     loadSelectedFolderDocuments,
//     refreshCurrentFolder,
//     documents,
//     setDocuments,
//     loading,
//     error,
//     success,
//     setError,
//     setSuccess,
//     getFolderProcessingStatus
//   } = useContext(FileManagerContext);
  
//   const [isDragging, setIsDragging] = useState(false);
//   const [uploadingFiles, setUploadingFiles] = useState([]);
//   const [isUploading, setIsUploading] = useState(false);
//   const [uploadProgress, setUploadProgress] = useState({});
//   const [recentUploads, setRecentUploads] = useState([]);
//   const [processingIntervals, setProcessingIntervals] = useState(new Map());
//   const fileInputRef = useRef(null);

//   // API Configuration
//   const API_BASE_URL = 'http://localhost:5000';

//   // Get auth token
//   const getAuthToken = () => {
//     const tokenKeys = [
//       'token', 'authToken', 'accessToken', 'jwt', 'bearerToken',
//       'auth_token', 'access_token', 'api_token', 'userToken'
//     ];

//     for (const key of tokenKeys) {
//       const token = localStorage.getItem(key);
//       if (token) {
//         return token;
//       }
//     }
//     return null;
//   };

//   // Set selected folder when component mounts or folder name changes
//   useEffect(() => {
//     if (folderName) {
//       setSelectedFolder(folderName);
//     }
//   }, [folderName, setSelectedFolder]);

//   // Load folders initially
//   useEffect(() => {
//     loadFoldersAndFiles();
//   }, [loadFoldersAndFiles]);

//   // Load documents when selected folder changes
//   useEffect(() => {
//     if (selectedFolder && selectedFolder === folderName) {
//       loadSelectedFolderDocuments(selectedFolder);
//     }
//   }, [selectedFolder, folderName, loadSelectedFolderDocuments]);

//   // Cleanup intervals on unmount
//   useEffect(() => {
//     return () => {
//       processingIntervals.forEach(interval => clearInterval(interval));
//     };
//   }, [processingIntervals]);

//   // Handle file drop
//   const handleDrop = async (e) => {
//     e.preventDefault();
//     setIsDragging(false);
    
//     const files = Array.from(e.dataTransfer.files);
//     if (files.length > 0) {
//       await handleFileUpload(files);
//     }
//   };

//   // Handle drag over
//   const handleDragOver = (e) => {
//     e.preventDefault();
//     setIsDragging(true);
//   };

//   // Handle drag leave
//   const handleDragLeave = (e) => {
//     e.preventDefault();
//     if (!e.currentTarget.contains(e.relatedTarget)) {
//       setIsDragging(false);
//     }
//   };

//   // Handle file input change
//   const handleFileInputChange = async (e) => {
//     const files = Array.from(e.target.files);
//     if (files.length > 0) {
//       await handleFileUpload(files);
//     }
//     e.target.value = '';
//   };

//   // Validate file function
//   const validateFile = (file) => {
//     const maxSize = 50 * 1024 * 1024; // 50MB
//     const allowedTypes = [
//       'application/pdf',
//       'application/msword',
//       'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
//       'text/plain',
//       'text/csv',
//       'application/vnd.ms-excel',
//       'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
//       'image/jpeg',
//       'image/png',
//       'image/gif',
//       'application/rtf'
//     ];

//     if (file.size > maxSize) {
//       return { valid: false, error: `File "${file.name}" is too large. Maximum size is 50MB.` };
//     }

//     if (!allowedTypes.includes(file.type)) {
//       return { valid: false, error: `File "${file.name}" has unsupported format. Supported formats: PDF, DOC, DOCX, TXT, CSV, XLS, XLSX, JPG, PNG, GIF, RTF.` };
//     }

//     return { valid: true };
//   };

//   // Batch upload individual file using your API structure
//   const batchUploadDocument = async (file) => {
//     return new Promise((resolve, reject) => {
//       const formData = new FormData();
//       formData.append('document', file); // Use 'document' as per your API

//       const xhr = new XMLHttpRequest();

//       xhr.upload.onprogress = (event) => {
//         if (event.lengthComputable) {
//           const progress = Math.round((event.loaded / event.total) * 100);
//           return progress;
//         }
//       };

//       xhr.onload = () => {
//         if (xhr.status >= 200 && xhr.status < 300) {
//           try {
//             const data = JSON.parse(xhr.responseText);
//             resolve(data);
//           } catch (error) {
//             reject(new Error('Failed to parse server response'));
//           }
//         } else {
//           reject(new Error(`Upload failed with status ${xhr.status}`));
//         }
//       };

//       xhr.onerror = () => reject(new Error('Network error occurred during upload'));
//       xhr.ontimeout = () => reject(new Error('Upload timeout'));

//       const token = getAuthToken();
//       // Use your batch upload endpoint
//       xhr.open('POST', `${API_BASE_URL}/files/batch-upload`);

//       if (token) {
//         xhr.setRequestHeader('Authorization', `Bearer ${token}`);
//       }

//       xhr.timeout = 300000; // 5 minutes
//       xhr.send(formData);
//     });
//   };

//   // File processing status polling using your API
//   const startProcessingStatusPolling = (fileId, fileName) => {
//     let pollCount = 0;
//     const maxPolls = 50; // Increased for longer processing times
    
//     console.log(`Starting status polling for file ${fileName} (ID: ${fileId})`);

//     const pollInterval = setInterval(async () => {
//       pollCount++;
      
//       try {
//         // Use your status API endpoint
//         const status = await documentApi.getFileProcessingStatus(fileId);
        
//         console.log(`Status update for ${fileName}:`, status);
        
//         // Update recent uploads with new status
//         setRecentUploads(prev => 
//           prev.map(upload => 
//             upload.id === fileId 
//               ? { 
//                   ...upload, 
//                   status: status.status || 'processing',
//                   processing_progress: status.processing_progress || status.progress,
//                   error: status.error
//                 }
//               : upload
//           )
//         );

//         // Also update main documents list
//         setDocuments(prev => 
//           prev.map(doc => 
//             doc.id === fileId 
//               ? { 
//                   ...doc, 
//                   status: status.status || 'processing',
//                   processing_progress: status.processing_progress || status.progress,
//                   error: status.error
//                 }
//               : doc
//           )
//         );

//         // Check if processing is complete
//         if (status.status === 'processed' || status.status === 'completed') {
//           clearInterval(pollInterval);
//           setProcessingIntervals(prev => {
//             const newMap = new Map(prev);
//             newMap.delete(fileId);
//             return newMap;
//           });
          
//           console.log(`File ${fileName} processing completed successfully`);
          
//           // Refresh folder contents after a delay
//           setTimeout(() => {
//             refreshCurrentFolder();
//           }, 2000);
          
//         } else if (status.status === 'failed' || status.status === 'error') {
//           clearInterval(pollInterval);
//           setProcessingIntervals(prev => {
//             const newMap = new Map(prev);
//             newMap.delete(fileId);
//             return newMap;
//           });
          
//           console.log(`File ${fileName} processing failed:`, status.error);
          
//           // Update status to failed with error message
//           setRecentUploads(prev => 
//             prev.map(upload => 
//               upload.id === fileId 
//                 ? { ...upload, status: 'failed', error: status.error || 'Processing failed' }
//                 : upload
//             )
//           );
//         }
//       } catch (error) {
//         console.error(`Error polling status for ${fileName}:`, error);
        
//         // If polling fails consistently, stop after max attempts
//         if (pollCount >= maxPolls) {
//           console.log(`Status polling timeout for ${fileName} - assuming processed`);
          
//           clearInterval(pollInterval);
//           setProcessingIntervals(prev => {
//             const newMap = new Map(prev);
//             newMap.delete(fileId);
//             return newMap;
//           });
          
//           setRecentUploads(prev => 
//             prev.map(upload => 
//               upload.id === fileId 
//                 ? { ...upload, status: 'processed' }
//                 : upload
//             )
//           );
//         }
//       }

//       if (pollCount >= maxPolls) {
//         clearInterval(pollInterval);
//         setProcessingIntervals(prev => {
//           const newMap = new Map(prev);
//           newMap.delete(fileId);
//           return newMap;
//         });
//       }
//     }, 5000); // Poll every 5 seconds (reduced frequency)

//     // Store interval for cleanup
//     setProcessingIntervals(prev => new Map(prev.set(fileId, pollInterval)));
    
//     return pollInterval;
//   };

//   // Main file upload handler
//   const handleFileUpload = async (files) => {
//     if (!folderName) {
//       setError('No folder selected for upload');
//       return;
//     }

//     if (isUploading) {
//       setError('Upload already in progress. Please wait for the current upload to complete.');
//       return;
//     }

//     // Clear previous messages
//     setError('');
//     setSuccess('');

//     // Validate files
//     const validationResults = files.map(validateFile);
//     const invalidFiles = validationResults.filter(result => !result.valid);
    
//     if (invalidFiles.length > 0) {
//       const errorMessages = invalidFiles.map(result => result.error);
//       setError(errorMessages.join(' '));
//       return;
//     }

//     // Check for duplicate files
//     const duplicateFiles = files.filter(file => 
//       uploadingFiles.some(uploadingFile => uploadingFile.name === file.name) ||
//       recentUploads.some(recentFile => recentFile.name === file.name)
//     );

//     if (duplicateFiles.length > 0) {
//       setError(`The following files are already being uploaded or recently uploaded: ${duplicateFiles.map(f => f.name).join(', ')}`);
//       return;
//     }

//     setIsUploading(true);

//     // Add files to uploading state
//     const newUploadingFiles = files.map(file => ({
//       id: `uploading-${file.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
//       name: file.name,
//       size: file.size,
//       status: 'uploading',
//       progress: 0,
//       uploadedAt: new Date().toISOString(),
//       type: file.type
//     }));

//     setUploadingFiles(prev => [...prev, ...newUploadingFiles]);

//     try {
//       console.log(`Starting batch upload of ${files.length} files`);

//       // Upload files individually using batch upload API
//       const uploadPromises = files.map(async (file, index) => {
//         const fileUploadState = newUploadingFiles[index];
        
//         try {
//           // Update progress to show upload starting
//           setUploadProgress(prev => ({ ...prev, [fileUploadState.id]: 10 }));
//           setUploadingFiles(prev => 
//             prev.map(f => 
//               f.id === fileUploadState.id 
//                 ? { ...f, progress: 10, status: 'uploading' }
//                 : f
//             )
//           );

//           console.log(`Uploading file: ${file.name}`);
//           const uploadResponse = await batchUploadDocument(file);
          
//           console.log(`Upload response for ${file.name}:`, uploadResponse);

//           // Update progress to completed
//           setUploadProgress(prev => ({ ...prev, [fileUploadState.id]: 100 }));
//           setUploadingFiles(prev => 
//             prev.map(f => 
//               f.id === fileUploadState.id 
//                 ? { ...f, progress: 100, status: 'completed' }
//                 : f
//             )
//           );

//           return {
//             file,
//             response: uploadResponse,
//             uploadId: fileUploadState.id
//           };

//         } catch (error) {
//           console.error(`Upload failed for ${file.name}:`, error);
          
//           setUploadingFiles(prev => 
//             prev.map(f => 
//               f.id === fileUploadState.id 
//                 ? { ...f, progress: 0, status: 'failed', error: error.message }
//                 : f
//             )
//           );

//           throw error;
//         }
//       });

//       // Wait for all uploads to complete
//       const results = await Promise.allSettled(uploadPromises);
//       const successfulUploads = results.filter(result => result.status === 'fulfilled').map(result => result.value);
//       const failedUploads = results.filter(result => result.status === 'rejected');

//       console.log(`Upload results: ${successfulUploads.length} successful, ${failedUploads.length} failed`);

//       if (successfulUploads.length > 0) {
//         // Add successful uploads to recent uploads for immediate display and status tracking
//         const newDocuments = successfulUploads.map(({ file, response, uploadId }) => {
//           const fileId = response.file_id || response.document_id || response.id || `processed-${file.name}-${Date.now()}`;
          
//           return {
//             id: fileId,
//             name: file.name,
//             size: file.size,
//             uploadedAt: new Date().toISOString(),
//             status: 'processing', // Start as processing
//             type: file.type,
//             folder: folderName,
//             uploadId: uploadId // Keep reference to upload state
//           };
//         });

//         setRecentUploads(prev => [...newDocuments, ...prev]);

//         // Show success message
//         const fileCount = successfulUploads.length;
//         const fileNames = successfulUploads.length <= 3 
//           ? successfulUploads.map(({ file }) => file.name).join(', ')
//           : `${successfulUploads.slice(0, 2).map(({ file }) => file.name).join(', ')} and ${successfulUploads.length - 2} more`;
        
//         setSuccess(`Successfully uploaded ${fileCount} file${fileCount > 1 ? 's' : ''}: ${fileNames}`);

//         // Start processing status polling for successful uploads
//         setTimeout(() => {
//           newDocuments.forEach(doc => {
//             console.log(`Starting status polling for ${doc.name} with ID ${doc.id}`);
//             startProcessingStatusPolling(doc.id, doc.name);
//           });
//         }, 3000); // Wait 3 seconds before starting polling to allow backend processing to begin
//       }

//       if (failedUploads.length > 0) {
//         const errorMessage = failedUploads.map(result => result.reason.message).join('; ');
//         setError(`${failedUploads.length} file(s) failed to upload: ${errorMessage}`);
//       }

//       // Clear uploading files after delay
//       setTimeout(() => {
//         setUploadingFiles(prev => 
//           prev.filter(file => 
//             !newUploadingFiles.some(newFile => newFile.id === file.id)
//           )
//         );
        
//         // Clean up progress state
//         newUploadingFiles.forEach(file => {
//           setUploadProgress(prev => {
//             const newProgress = { ...prev };
//             delete newProgress[file.id];
//             return newProgress;
//           });
//         });
//       }, 8000); // Show upload results for 8 seconds

//     } catch (err) {
//       console.error('Batch upload process failed:', err);
//       setError(`Upload process failed: ${err.message}`);
      
//     } finally {
//       setIsUploading(false);
//     }
//   };

//   // Remove file from uploading list
//   const removeUploadingFile = (fileId) => {
//     setUploadingFiles(prev => prev.filter(file => file.id !== fileId));
//     setUploadProgress(prev => {
//       const newProgress = { ...prev };
//       delete newProgress[fileId];
//       return newProgress;
//     });
//   };

//   // Remove recent upload and stop polling
//   const removeRecentUpload = (fileId) => {
//     setRecentUploads(prev => prev.filter(file => file.id !== fileId));
    
//     // Stop polling for this file
//     const interval = processingIntervals.get(fileId);
//     if (interval) {
//       clearInterval(interval);
//       setProcessingIntervals(prev => {
//         const newMap = new Map(prev);
//         newMap.delete(fileId);
//         return newMap;
//       });
//     }
//   };

//   // Refresh documents manually
//   const handleRefreshDocuments = async () => {
//     setError('');
//     setSuccess('');
//     await refreshCurrentFolder();
//     setSuccess('File list refreshed successfully');
//   };

//   // Check processing status for folder
//   const checkProcessingStatus = async () => {
//     if (!folderName) return;
    
//     setError('');
//     try {
//       const status = await getFolderProcessingStatus(folderName);
//       console.log('Folder processing status:', status);
      
//       if (status) {
//         const { total, completed, processing, failed } = status;
//         if (processing > 0) {
//           setSuccess(`Processing Status: ${completed}/${total} completed, ${processing} processing, ${failed} failed`);
//         } else if (failed > 0) {
//           setError(`Processing Status: ${completed}/${total} completed, ${failed} failed`);
//         } else {
//           setSuccess(`All ${total} files have been processed successfully`);
//         }
//       } else {
//         setSuccess('No processing status information available');
//       }
//     } catch (err) {
//       console.error('Error checking processing status:', err);
//       setError('Failed to check processing status');
//     }
//   };

//   // Format file size
//   const formatFileSize = (bytes) => {
//     if (bytes === 0) return '0 Bytes';
//     const k = 1024;
//     const sizes = ['Bytes', 'KB', 'MB', 'GB'];
//     const i = Math.floor(Math.log(bytes) / Math.log(k));
//     return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
//   };

//   // Get status display configuration
//   const getStatusDisplay = (status, progress = 0, processing_progress = null) => {
//     switch (status) {
//       case 'completed':
//       case 'processed':
//         return {
//           color: 'text-green-600 bg-green-100 border-green-200',
//           icon: <CheckCircle className="w-4 h-4" />,
//           text: 'Processed'
//         };
//       case 'processing':
//         let progressText = 'Processing';
//         if (processing_progress && processing_progress > 0) {
//           progressText = `Processing ${Math.round(processing_progress)}%`;
//         }
//         return {
//           color: 'text-yellow-600 bg-yellow-100 border-yellow-200',
//           icon: <Clock className="w-4 h-4 animate-pulse" />,
//           text: progressText
//         };
//       case 'uploading':
//         return {
//           color: 'text-blue-600 bg-blue-100 border-blue-200',
//           icon: <RefreshCw className="w-4 h-4 animate-spin" />,
//           text: `Uploading ${progress}%`
//         };
//       case 'failed':
//       case 'error':
//         return {
//           color: 'text-red-600 bg-red-100 border-red-200',
//           icon: <AlertCircle className="w-4 h-4" />,
//           text: 'Failed'
//         };
//       default:
//         return {
//           color: 'text-green-600 bg-green-100 border-green-200',
//           icon: <CheckCircle className="w-4 h-4" />,
//           text: 'Ready'
//         };
//     }
//   };

//   // Combine all files for display
//   const allFiles = [
//     ...recentUploads,
//     ...documents.filter(doc => 
//       !recentUploads.some(recent => 
//         recent.name === doc.name || recent.id === doc.id
//       )
//     )
//   ];

//   return (
//     <div className="flex-1 flex flex-col bg-gray-50 text-gray-900 min-h-screen">
//       {/* Top Bar */}
//       <div className="flex items-center p-4 border-b border-gray-200 bg-white shadow-sm">
//         <button
//           onClick={() => navigate('/documents')}
//           className="flex items-center text-gray-600 hover:text-gray-900 transition-colors duration-200 mr-4"
//         >
//           <ArrowLeft className="w-5 h-5 mr-2" />
//           <span className="text-sm font-medium">Back to Projects</span>
//         </button>
//         <FolderOpen className="w-6 h-6 mr-2 text-gray-600" />
//         <h1 className="text-2xl font-bold text-gray-900">{folderName || 'Loading...'}</h1>
//       </div>

//       {/* Error and Success Messages */}
//       {error && (
//         <div className="mx-4 mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
//           <div className="flex items-center">
//             <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
//             <div className="flex-1">
//               <p className="text-sm font-medium">Error</p>
//               <p className="text-sm">{error}</p>
//             </div>
//             <button 
//               onClick={() => setError('')}
//               className="ml-2 text-red-600 hover:text-red-800"
//             >
//               <X className="w-4 h-4" />
//             </button>
//           </div>
//         </div>
//       )}
      
//       {success && (
//         <div className="mx-4 mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-md">
//           <div className="flex items-center">
//             <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
//             <div className="flex-1">
//               <p className="text-sm font-medium">Success</p>
//               <p className="text-sm">{success}</p>
//             </div>
//             <button 
//               onClick={() => setSuccess('')}
//               className="ml-2 text-green-600 hover:text-green-800"
//             >
//               <X className="w-4 h-4" />
//             </button>
//           </div>
//         </div>
//       )}

//       {/* Main Content Area */}
//       <div className="flex flex-1 overflow-hidden">
//         {/* Center Panel */}
//         <div className="flex-1 flex flex-col p-6 overflow-y-auto">
//           <ChatSearchBox />
//         </div>

//         {/* Right Panel */}
//         <div className="w-96 bg-white border-l border-gray-200 p-6 flex flex-col shadow-sm overflow-y-auto">
//           <div className="mb-6">
//             <h2 className="text-xl font-semibold text-gray-800 mb-4">Instructions</h2>
//             <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-gray-700 text-sm">
//               <p className="mb-2">
//                 Welcome to your project folder! Here you can manage your documents,
//                 chat with the AI, and get summaries.
//               </p>
//               <ul className="list-disc list-inside space-y-1 text-xs">
//                 <li>Upload multiple documents using drag-and-drop or the upload button</li>
//                 <li>Supported formats: PDF, DOC, DOCX, TXT, CSV, XLS, XLSX, images</li>
//                 <li>Maximum file size: 50MB per file</li>
//                 <li>Files will be processed automatically after upload</li>
//                 <li>Processing status updates in real-time</li>
//                 <li>Use the chat feature to ask questions about your documents</li>
//               </ul>
//             </div>
//           </div>

//           <div className="flex-1">
//             <div className="flex items-center justify-between mb-4">
//               <h2 className="text-xl font-semibold text-gray-800">
//                 Files ({allFiles.length})
//               </h2>
//               <button
//                 onClick={handleRefreshDocuments}
//                 disabled={loading}
//                 className="flex items-center px-3 py-1 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50"
//               >
//                 <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
//                 Refresh
//               </button>
//             </div>
            
//             {/* File Upload Area */}
//             <div
//               className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors duration-200 cursor-pointer mb-4 ${
//                 isDragging
//                   ? 'border-blue-400 bg-blue-50'
//                   : 'border-gray-300 hover:border-gray-400'
//               } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
//               onDrop={handleDrop}
//               onDragOver={handleDragOver}
//               onDragLeave={handleDragLeave}
//               onClick={() => !isUploading && fileInputRef.current?.click()}
//             >
//               <Upload className={`w-8 h-8 mx-auto mb-2 text-gray-400 ${isUploading ? 'animate-pulse' : ''}`} />
//               <p className="mb-2 text-gray-500 font-medium">
//                 {isUploading 
//                   ? 'Uploading files...' 
//                   : isDragging 
//                     ? 'Drop files here' 
//                     : 'Upload Documents'
//                 }
//               </p>
//               <p className="text-sm text-gray-400">
//                 {isUploading ? 'Please wait...' : 'Drag & drop files or click to browse'}
//               </p>
//               <p className="text-xs text-gray-400 mt-1">
//                 Max 50MB per file • PDF, DOC, TXT, CSV, XLS, Images
//               </p>
//               <input
//                 ref={fileInputRef}
//                 type="file"
//                 className="hidden"
//                 multiple
//                 accept=".pdf,.doc,.docx,.txt,.csv,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.rtf"
//                 onChange={handleFileInputChange}
//                 disabled={isUploading}
//               />
//             </div>

//             {/* Currently Uploading Files */}
//             {uploadingFiles.length > 0 && (
//               <div className="mb-4">
//                 <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
//                   <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
//                   Currently Uploading ({uploadingFiles.length})
//                 </h3>
//                 <div className="space-y-2 max-h-48 overflow-y-auto">
//                   {uploadingFiles.map((file) => {
//                     const progress = uploadProgress[file.id] || 0;
//                     const statusDisplay = getStatusDisplay(file.status, progress);
//                     return (
//                       <div key={file.id} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
//                         <div className="flex items-center justify-between mb-2">
//                           <div className="flex items-center flex-1 min-w-0">
//                             <File className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
//                             <div className="flex-1 min-w-0">
//                               <p className="text-sm text-gray-700 truncate font-medium">{file.name}</p>
//                               <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
//                             </div>
//                           </div>
//                           <div className="flex items-center ml-2">
//                             <span className={`text-xs px-2 py-1 rounded-full border flex items-center ${statusDisplay.color}`}>
//                               {statusDisplay.icon}
//                               <span className="ml-1">{statusDisplay.text}</span>
//                             </span>
//                             {(file.status === 'failed' || file.status === 'completed') && (
//                               <button
//                                 onClick={(e) => {
//                                   e.stopPropagation();
//                                   removeUploadingFile(file.id);
//                                 }}
//                                 className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
//                               >
//                                 <X className="w-4 h-4" />
//                               </button>
//                             )}
//                           </div>
//                         </div>
//                         {file.status === 'uploading' && (
//                           <div className="w-full bg-gray-200 rounded-full h-1.5">
//                             <div 
//                               className="bg-blue-500 h-1.5 rounded-full transition-all duration-300" 
//                               style={{ width: `${progress}%` }}
//                             ></div>
//                           </div>
//                         )}
//                         {file.error && (
//                           <p className="text-xs text-red-600 mt-1">{file.error}</p>
//                         )}
//                       </div>
//                     );
//                   })}
//                 </div>
//               </div>
//             )}

//             {/* All Files List */}
//             <div className="flex-1">
//               <h3 className="text-sm font-medium text-gray-700 mb-3">
//                 All Files 
//                 {allFiles.length > 0 && (
//                   <span className="ml-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
//                     {allFiles.length}
//                   </span>
//                 )}
//               </h3>
              
//               {loading ? (
//                 <div className="text-center py-8">
//                   <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mb-2"></div>
//                   <p className="text-sm text-gray-500">Loading files...</p>
//                 </div>
//               ) : allFiles.length > 0 ? (
//                 <div className="space-y-2 max-h-96 overflow-y-auto">
//                   {allFiles.map((doc, index) => {
//                     const statusDisplay = getStatusDisplay(doc.status || 'processed', 0, doc.processing_progress);
//                     return (
//                       <div key={doc.id || `${doc.name}-${index}`} className="bg-white p-3 rounded-lg border border-gray-200 hover:shadow-sm transition-shadow">
//                         <div className="flex items-center justify-between">
//                           <div className="flex items-center flex-1 min-w-0">
//                             <File className="w-4 h-4 text-gray-400 mr-3 flex-shrink-0" />
//                             <div className="flex-1 min-w-0">
//                               <p className="text-sm text-gray-700 truncate font-medium">{doc.name}</p>
//                               <div className="flex items-center space-x-2 mt-1">
//                                 {doc.size && (
//                                   <span className="text-xs text-gray-500">{formatFileSize(doc.size)}</span>
//                                 )}
//                                 {doc.uploadedAt && (
//                                   <span className="text-xs text-gray-400">
//                                     • {new Date(doc.uploadedAt).toLocaleDateString()}
//                                   </span>
//                                 )}
//                               </div>
//                             </div>
//                           </div>
//                           <div className="flex items-center">
//                             <span className={`text-xs px-2 py-1 rounded-full border flex items-center ${statusDisplay.color}`}>
//                               {statusDisplay.icon}
//                               <span className="ml-1">{statusDisplay.text}</span>
//                             </span>
//                             {/* Remove button for failed files */}
//                             {recentUploads.some(recent => recent.id === doc.id) && doc.status === 'failed' && (
//                               <button
//                                 onClick={(e) => {
//                                   e.stopPropagation();
//                                   removeRecentUpload(doc.id);
//                                 }}
//                                 className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
//                               >
//                                 <X className="w-4 h-4" />
//                               </button>
//                             )}
//                           </div>
//                         </div>
//                         {/* Show error message if file failed */}
//                         {doc.error && (
//                           <p className="text-xs text-red-600 mt-2">{doc.error}</p>
//                         )}
//                         {/* Show processing progress bar */}
//                         {doc.status === 'processing' && doc.processing_progress && (
//                           <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
//                             <div 
//                               className="bg-yellow-500 h-1.5 rounded-full transition-all duration-300" 
//                               style={{ width: `${Math.round(doc.processing_progress)}%` }}
//                             ></div>
//                           </div>
//                         )}
//                       </div>
//                     );
//                   })}
//                 </div>
//               ) : (
//                 <div className="text-center py-12 text-gray-500">
//                   <File className="w-16 h-16 mx-auto mb-4 text-gray-300" />
//                   <p className="text-lg font-medium mb-1">No files uploaded yet</p>
//                   <p className="text-sm">Upload your first document to get started</p>
//                 </div>
//               )}
//             </div>

//             {/* Processing Status Check Button */}
//             {allFiles.length > 0 && (
//               <div className="mt-6 pt-4 border-t border-gray-200">
//                 <button
//                   onClick={checkProcessingStatus}
//                   disabled={loading}
//                   className="w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 flex items-center justify-center"
//                 >
//                   <Clock className="w-4 h-4 mr-2" />
//                   Check Processing Status
//                 </button>
                
//                 {/* Active polling indicator */}
//                 {processingIntervals.size > 0 && (
//                   <div className="mt-2 text-center">
//                     <p className="text-xs text-blue-600 flex items-center justify-center">
//                       <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
//                       Monitoring {processingIntervals.size} file{processingIntervals.size > 1 ? 's' : ''}
//                     </p>
//                   </div>
//                 )}
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default FolderDetailPage;




import React, { useEffect, useContext, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import FolderContent from '../components/FolderContent/FolderContent';
import ChatInterface from '../components/ChatInterface/ChatInterface';
import ChatSearchBox from '../components/ChatInterface/ChatSearchBox';
import { FileManagerContext } from '../context/FileManagerContext';
import { documentApi } from '../services/documentApi';
import { ArrowLeft, Upload, File, X, CheckCircle, Clock, AlertCircle, RefreshCw, FolderOpen } from 'lucide-react';

const FolderDetailPage = () => {
  const { folderName } = useParams();
  const navigate = useNavigate();
  const { 
    setSelectedFolder, 
    selectedFolder, 
    loadFoldersAndFiles, 
    loadSelectedFolderDocuments,
    refreshCurrentFolder,
    documents,
    setDocuments,
    loading,
    error,
    success,
    setError,
    setSuccess,
    getFolderProcessingStatus
  } = useContext(FileManagerContext);
  
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [recentUploads, setRecentUploads] = useState([]);
  const [processingIntervals, setProcessingIntervals] = useState(new Map());
  const fileInputRef = useRef(null);

  // API Configuration
  const API_BASE_URL = 'http://localhost:5000';

  // Get auth token
  const getAuthToken = () => {
    const tokenKeys = [
      'token', 'authToken', 'accessToken', 'jwt', 'bearerToken',
      'auth_token', 'access_token', 'api_token', 'userToken'
    ];

    for (const key of tokenKeys) {
      const token = localStorage.getItem(key);
      if (token) {
        return token;
      }
    }
    return null;
  };

  // Set selected folder when component mounts or folder name changes
  useEffect(() => {
    if (folderName) {
      setSelectedFolder(folderName);
    }
  }, [folderName, setSelectedFolder]);

  // Load folders initially
  useEffect(() => {
    loadFoldersAndFiles();
  }, [loadFoldersAndFiles]);

  // Load documents when selected folder changes
  useEffect(() => {
    if (selectedFolder && selectedFolder === folderName) {
      loadSelectedFolderDocuments(selectedFolder);
    }
  }, [selectedFolder, folderName, loadSelectedFolderDocuments]);

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      processingIntervals.forEach(interval => clearInterval(interval));
    };
  }, [processingIntervals]);

  // Handle file drop
  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await handleFileUpload(files);
    }
  };

  // Handle drag over
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  // Handle drag leave
  const handleDragLeave = (e) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragging(false);
    }
  };

  // Handle file input change
  const handleFileInputChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      await handleFileUpload(files);
    }
    e.target.value = '';
  };

  // Validate file function
  const validateFile = (file) => {
    const maxSize = 50 * 1024 * 1024; // 50MB
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/rtf'
    ];

    if (file.size > maxSize) {
      return { valid: false, error: `File "${file.name}" is too large. Maximum size is 50MB.` };
    }

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: `File "${file.name}" has unsupported format. Supported formats: PDF, DOC, DOCX, TXT, CSV, XLS, XLSX, JPG, PNG, GIF, RTF.` };
    }

    return { valid: true };
  };

  // Batch upload individual file using your API structure
  const batchUploadDocument = async (file) => {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('document', file); // Use 'document' as per your API

      const xhr = new XMLHttpRequest();

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          return progress;
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            resolve(data);
          } catch (error) {
            reject(new Error('Failed to parse server response'));
          }
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      };

      xhr.onerror = () => reject(new Error('Network error occurred during upload'));
      xhr.ontimeout = () => reject(new Error('Upload timeout'));

      const token = getAuthToken();
      // Use your batch upload endpoint
      xhr.open('POST', `${API_BASE_URL}/files/batch-upload`);

      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      xhr.timeout = 300000; // 5 minutes
      xhr.send(formData);
    });
  };

  // File processing status polling using your API - FIXED VERSION
  const startProcessingStatusPolling = (fileId, fileName) => {
    let pollCount = 0;
    const maxPolls = 60; // Increased for longer processing times (5 minutes total)
    
    console.log(`Starting status polling for file ${fileName} (ID: ${fileId})`);

    const pollInterval = setInterval(async () => {
      pollCount++;
      
      try {
        console.log(`Polling status for ${fileName} (attempt ${pollCount}/${maxPolls})`);
        
        // Use the documentApi to get file processing status
        const statusResponse = await documentApi.getFileProcessingStatus(fileId);
        
        console.log(`Status response for ${fileName}:`, statusResponse);
        
        // Extract status information from response
        const status = statusResponse.status || statusResponse.processing_status || 'processing';
        const progress = statusResponse.processing_progress || statusResponse.progress || 0;
        const errorMessage = statusResponse.error || statusResponse.error_message;
        
        // Update recent uploads with new status
        setRecentUploads(prev => 
          prev.map(upload => 
            upload.id === fileId 
              ? { 
                  ...upload, 
                  status: status,
                  processing_progress: progress,
                  error: errorMessage
                }
              : upload
          )
        );

        // Also update main documents list
        setDocuments(prev => 
          prev.map(doc => 
            doc.id === fileId 
              ? { 
                  ...doc, 
                  status: status,
                  processing_progress: progress,
                  error: errorMessage
                }
              : doc
          )
        );

        // Check if processing is complete
        if (status === 'processed' || status === 'completed' || status === 'ready') {
          console.log(`File ${fileName} processing completed successfully`);
          
          clearInterval(pollInterval);
          setProcessingIntervals(prev => {
            const newMap = new Map(prev);
            newMap.delete(fileId);
            return newMap;
          });
          
          // Refresh folder contents after a delay
          setTimeout(() => {
            refreshCurrentFolder();
          }, 2000);
          
        } else if (status === 'failed' || status === 'error') {
          console.log(`File ${fileName} processing failed:`, errorMessage);
          
          clearInterval(pollInterval);
          setProcessingIntervals(prev => {
            const newMap = new Map(prev);
            newMap.delete(fileId);
            return newMap;
          });
          
          // Update status to failed with error message
          setRecentUploads(prev => 
            prev.map(upload => 
              upload.id === fileId 
                ? { ...upload, status: 'failed', error: errorMessage || 'Processing failed' }
                : upload
            )
          );
          
          setDocuments(prev => 
            prev.map(doc => 
              doc.id === fileId 
                ? { ...doc, status: 'failed', error: errorMessage || 'Processing failed' }
                : doc
            )
          );
        }
        
      } catch (error) {
        console.error(`Error polling status for ${fileName}:`, error);
        
        // If this is a 404 or the file is not found, it might mean processing hasn't started yet
        if (error.response?.status === 404 && pollCount < 10) {
          console.log(`File ${fileName} not found yet, continuing to poll...`);
          return; // Continue polling
        }
        
        // If polling fails consistently, stop after max attempts
        if (pollCount >= maxPolls) {
          console.log(`Status polling timeout for ${fileName} - stopping polling`);
          
          clearInterval(pollInterval);
          setProcessingIntervals(prev => {
            const newMap = new Map(prev);
            newMap.delete(fileId);
            return newMap;
          });
          
          // Mark as timeout/unknown status
          setRecentUploads(prev => 
            prev.map(upload => 
              upload.id === fileId 
                ? { ...upload, status: 'timeout', error: 'Status check timed out' }
                : upload
            )
          );
        }
      }

      // Stop polling if max attempts reached
      if (pollCount >= maxPolls) {
        clearInterval(pollInterval);
        setProcessingIntervals(prev => {
          const newMap = new Map(prev);
          newMap.delete(fileId);
          return newMap;
        });
      }
    }, 5000); // Poll every 5 seconds

    // Store interval for cleanup
    setProcessingIntervals(prev => new Map(prev.set(fileId, pollInterval)));
    
    return pollInterval;
  };

  // Main file upload handler
  const handleFileUpload = async (files) => {
    if (!folderName) {
      setError('No folder selected for upload');
      return;
    }

    if (isUploading) {
      setError('Upload already in progress. Please wait for the current upload to complete.');
      return;
    }

    // Clear previous messages
    setError('');
    setSuccess('');

    // Validate files
    const validationResults = files.map(validateFile);
    const invalidFiles = validationResults.filter(result => !result.valid);
    
    if (invalidFiles.length > 0) {
      const errorMessages = invalidFiles.map(result => result.error);
      setError(errorMessages.join(' '));
      return;
    }

    // Check for duplicate files
    const duplicateFiles = files.filter(file => 
      uploadingFiles.some(uploadingFile => uploadingFile.name === file.name) ||
      recentUploads.some(recentFile => recentFile.name === file.name)
    );

    if (duplicateFiles.length > 0) {
      setError(`The following files are already being uploaded or recently uploaded: ${duplicateFiles.map(f => f.name).join(', ')}`);
      return;
    }

    setIsUploading(true);

    // Add files to uploading state
    const newUploadingFiles = files.map(file => ({
      id: `uploading-${file.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      size: file.size,
      status: 'uploading',
      progress: 0,
      uploadedAt: new Date().toISOString(),
      type: file.type
    }));

    setUploadingFiles(prev => [...prev, ...newUploadingFiles]);

    try {
      console.log(`Starting batch upload of ${files.length} files`);

      // Upload files individually using batch upload API
      const uploadPromises = files.map(async (file, index) => {
        const fileUploadState = newUploadingFiles[index];
        
        try {
          // Update progress to show upload starting
          setUploadProgress(prev => ({ ...prev, [fileUploadState.id]: 10 }));
          setUploadingFiles(prev => 
            prev.map(f => 
              f.id === fileUploadState.id 
                ? { ...f, progress: 10, status: 'uploading' }
                : f
            )
          );

          console.log(`Uploading file: ${file.name}`);
          const uploadResponse = await batchUploadDocument(file);
          
          console.log(`Upload response for ${file.name}:`, uploadResponse);

          // Update progress to completed
          setUploadProgress(prev => ({ ...prev, [fileUploadState.id]: 100 }));
          setUploadingFiles(prev => 
            prev.map(f => 
              f.id === fileUploadState.id 
                ? { ...f, progress: 100, status: 'completed' }
                : f
            )
          );

          return {
            file,
            response: uploadResponse,
            uploadId: fileUploadState.id
          };

        } catch (error) {
          console.error(`Upload failed for ${file.name}:`, error);
          
          setUploadingFiles(prev => 
            prev.map(f => 
              f.id === fileUploadState.id 
                ? { ...f, progress: 0, status: 'failed', error: error.message }
                : f
            )
          );

          throw error;
        }
      });

      // Wait for all uploads to complete
      const results = await Promise.allSettled(uploadPromises);
      const successfulUploads = results.filter(result => result.status === 'fulfilled').map(result => result.value);
      const failedUploads = results.filter(result => result.status === 'rejected');

      console.log(`Upload results: ${successfulUploads.length} successful, ${failedUploads.length} failed`);

      if (successfulUploads.length > 0) {
        // Add successful uploads to recent uploads for immediate display and status tracking
        const newDocuments = successfulUploads.map(({ file, response, uploadId }) => {
          // Extract file ID from different possible response formats
          const fileId = response.file_id || 
                        response.document_id || 
                        response.id || 
                        response.data?.file_id || 
                        response.data?.document_id || 
                        response.data?.id ||
                        `uploaded-${file.name}-${Date.now()}`;
          
          console.log(`Extracted file ID for ${file.name}: ${fileId}`);
          
          return {
            id: fileId,
            name: file.name,
            size: file.size,
            uploadedAt: new Date().toISOString(),
            status: 'processing', // Start as processing
            processing_progress: 0,
            type: file.type,
            folder: folderName,
            uploadId: uploadId // Keep reference to upload state
          };
        });

        setRecentUploads(prev => [...newDocuments, ...prev]);

        // Show success message
        const fileCount = successfulUploads.length;
        const fileNames = successfulUploads.length <= 3 
          ? successfulUploads.map(({ file }) => file.name).join(', ')
          : `${successfulUploads.slice(0, 2).map(({ file }) => file.name).join(', ')} and ${successfulUploads.length - 2} more`;
        
        setSuccess(`Successfully uploaded ${fileCount} file${fileCount > 1 ? 's' : ''}: ${fileNames}. Processing will begin shortly.`);

        // Start processing status polling for successful uploads after a delay
        setTimeout(() => {
          newDocuments.forEach(doc => {
            console.log(`Starting status polling for ${doc.name} with ID ${doc.id}`);
            startProcessingStatusPolling(doc.id, doc.name);
          });
        }, 2000); // Wait 2 seconds before starting polling to allow backend processing to begin
      }

      if (failedUploads.length > 0) {
        const errorMessage = failedUploads.map(result => result.reason.message).join('; ');
        setError(`${failedUploads.length} file(s) failed to upload: ${errorMessage}`);
      }

      // Clear uploading files after delay
      setTimeout(() => {
        setUploadingFiles(prev => 
          prev.filter(file => 
            !newUploadingFiles.some(newFile => newFile.id === file.id)
          )
        );
        
        // Clean up progress state
        newUploadingFiles.forEach(file => {
          setUploadProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[file.id];
            return newProgress;
          });
        });
      }, 8000); // Show upload results for 8 seconds

    } catch (err) {
      console.error('Batch upload process failed:', err);
      setError(`Upload process failed: ${err.message}`);
      
    } finally {
      setIsUploading(false);
    }
  };

  // Remove file from uploading list
  const removeUploadingFile = (fileId) => {
    setUploadingFiles(prev => prev.filter(file => file.id !== fileId));
    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[fileId];
      return newProgress;
    });
  };

  // Remove recent upload and stop polling
  const removeRecentUpload = (fileId) => {
    setRecentUploads(prev => prev.filter(file => file.id !== fileId));
    
    // Stop polling for this file
    const interval = processingIntervals.get(fileId);
    if (interval) {
      clearInterval(interval);
      setProcessingIntervals(prev => {
        const newMap = new Map(prev);
        newMap.delete(fileId);
        return newMap;
      });
    }
  };

  // Refresh documents manually
  const handleRefreshDocuments = async () => {
    setError('');
    setSuccess('');
    await refreshCurrentFolder();
    setSuccess('File list refreshed successfully');
  };

  // Check processing status for folder
  const checkProcessingStatus = async () => {
    if (!folderName) return;
    
    setError('');
    try {
      const status = await getFolderProcessingStatus(folderName);
      console.log('Folder processing status:', status);
      
      if (status) {
        const { total, completed, processing, failed } = status;
        if (processing > 0) {
          setSuccess(`Processing Status: ${completed}/${total} completed, ${processing} processing, ${failed} failed`);
        } else if (failed > 0) {
          setError(`Processing Status: ${completed}/${total} completed, ${failed} failed`);
        } else {
          setSuccess(`All ${total} files have been processed successfully`);
        }
      } else {
        setSuccess('No processing status information available');
      }
    } catch (err) {
      console.error('Error checking processing status:', err);
      setError('Failed to check processing status');
    }
  };

  // Manual status check for a specific file
  const checkFileStatus = async (fileId, fileName) => {
    try {
      console.log(`Manually checking status for ${fileName} (ID: ${fileId})`);
      const statusResponse = await documentApi.getFileProcessingStatus(fileId);
      
      console.log(`Manual status check result for ${fileName}:`, statusResponse);
      
      const status = statusResponse.status || statusResponse.processing_status || 'unknown';
      const progress = statusResponse.processing_progress || statusResponse.progress || 0;
      const errorMessage = statusResponse.error || statusResponse.error_message;
      
      // Update the file status
      setRecentUploads(prev => 
        prev.map(upload => 
          upload.id === fileId 
            ? { 
                ...upload, 
                status: status,
                processing_progress: progress,
                error: errorMessage
              }
            : upload
        )
      );

      setDocuments(prev => 
        prev.map(doc => 
          doc.id === fileId 
            ? { 
                ...doc, 
                status: status,
                processing_progress: progress,
                error: errorMessage
              }
            : doc
        )
      );
      
      setSuccess(`Status updated for ${fileName}: ${status}${progress > 0 ? ` (${Math.round(progress)}%)` : ''}`);
      
    } catch (error) {
      console.error(`Error checking status for ${fileName}:`, error);
      setError(`Failed to check status for ${fileName}: ${error.message}`);
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get status display configuration
  const getStatusDisplay = (status, progress = 0, processing_progress = null) => {
    switch (status) {
      case 'completed':
      case 'processed':
      case 'ready':
        return {
          color: 'text-green-600 bg-green-100 border-green-200',
          icon: <CheckCircle className="w-4 h-4" />,
          text: 'Processed'
        };
      case 'processing':
        let progressText = 'Processing';
        if (processing_progress && processing_progress > 0) {
          progressText = `Processing ${Math.round(processing_progress)}%`;
        }
        return {
          color: 'text-yellow-600 bg-yellow-100 border-yellow-200',
          icon: <Clock className="w-4 h-4 animate-pulse" />,
          text: progressText
        };
      case 'uploading':
        return {
          color: 'text-blue-600 bg-blue-100 border-blue-200',
          icon: <RefreshCw className="w-4 h-4 animate-spin" />,
          text: `Uploading ${progress}%`
        };
      case 'failed':
      case 'error':
        return {
          color: 'text-red-600 bg-red-100 border-red-200',
          icon: <AlertCircle className="w-4 h-4" />,
          text: 'Failed'
        };
      case 'timeout':
        return {
          color: 'text-orange-600 bg-orange-100 border-orange-200',
          icon: <Clock className="w-4 h-4" />,
          text: 'Timeout'
        };
      default:
        return {
          color: 'text-gray-600 bg-gray-100 border-gray-200',
          icon: <Clock className="w-4 h-4" />,
          text: status || 'Unknown'
        };
    }
  };

  // Combine all files for display
  const allFiles = [
    ...recentUploads,
    ...documents.filter(doc => 
      !recentUploads.some(recent => 
        recent.name === doc.name || recent.id === doc.id
      )
    )
  ];

  return (
    <div className="flex-1 flex flex-col bg-gray-50 text-gray-900 min-h-screen">
      {/* Top Bar */}
      <div className="flex items-center p-4 border-b border-gray-200 bg-white shadow-sm">
        <button
          onClick={() => navigate('/documents')}
          className="flex items-center text-gray-600 hover:text-gray-900 transition-colors duration-200 mr-4"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          <span className="text-sm font-medium">Back to Projects</span>
        </button>
        <FolderOpen className="w-6 h-6 mr-2 text-gray-600" />
        <h1 className="text-2xl font-bold text-gray-900">{folderName || 'Loading...'}</h1>
      </div>

      {/* Error and Success Messages */}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">Error</p>
              <p className="text-sm">{error}</p>
            </div>
            <button 
              onClick={() => setError('')}
              className="ml-2 text-red-600 hover:text-red-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      
      {success && (
        <div className="mx-4 mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-md">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">Success</p>
              <p className="text-sm">{success}</p>
            </div>
            <button 
              onClick={() => setSuccess('')}
              className="ml-2 text-green-600 hover:text-green-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Center Panel */}
        <div className="flex-1 flex flex-col p-6 overflow-y-auto">
          <ChatSearchBox />
        </div>

        {/* Right Panel */}
        <div className="w-96 bg-white border-l border-gray-200 p-6 flex flex-col shadow-sm overflow-y-auto">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Instructions</h2>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-gray-700 text-sm">
              <p className="mb-2">
                Welcome to your project folder! Here you can manage your documents,
                chat with the AI, and get summaries.
              </p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Upload multiple documents using drag-and-drop or the upload button</li>
                <li>Supported formats: PDF, DOC, DOCX, TXT, CSV, XLS, XLSX, images</li>
                <li>Maximum file size: 50MB per file</li>
                <li>Files will be processed automatically after upload</li>
                <li>Processing status updates in real-time</li>
                <li>Use the chat feature to ask questions about your documents</li>
              </ul>
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Files ({allFiles.length})
              </h2>
              <button
                onClick={handleRefreshDocuments}
                disabled={loading}
                className="flex items-center px-3 py-1 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
            
            {/* File Upload Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors duration-200 cursor-pointer mb-4 ${
                isDragging
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => !isUploading && fileInputRef.current?.click()}
            >
              <Upload className={`w-8 h-8 mx-auto mb-2 text-gray-400 ${isUploading ? 'animate-pulse' : ''}`} />
              <p className="mb-2 text-gray-500 font-medium">
                {isUploading 
                  ? 'Uploading files...' 
                  : isDragging 
                    ? 'Drop files here' 
                    : 'Upload Documents'
                }
              </p>
              <p className="text-sm text-gray-400">
                {isUploading ? 'Please wait...' : 'Drag & drop files or click to browse'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Max 50MB per file • PDF, DOC, TXT, CSV, XLS, Images
              </p>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                multiple
                accept=".pdf,.doc,.docx,.txt,.csv,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.rtf"
                onChange={handleFileInputChange}
                disabled={isUploading}
              />
            </div>

            {/* Currently Uploading Files */}
            {uploadingFiles.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                  Currently Uploading ({uploadingFiles.length})
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {uploadingFiles.map((file) => {
                    const progress = uploadProgress[file.id] || 0;
                    const statusDisplay = getStatusDisplay(file.status, progress);
                    return (
                      <div key={file.id} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center flex-1 min-w-0">
                            <File className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-700 truncate font-medium">{file.name}</p>
                              <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                            </div>
                          </div>
                          <div className="flex items-center ml-2">
                            <span className={`text-xs px-2 py-1 rounded-full border flex items-center ${statusDisplay.color}`}>
                              {statusDisplay.icon}
                              <span className="ml-1">{statusDisplay.text}</span>
                            </span>
                            {(file.status === 'failed' || file.status === 'completed') && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeUploadingFile(file.id);
                                }}
                                className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                        {file.status === 'uploading' && (
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div 
                              className="bg-blue-500 h-1.5 rounded-full transition-all duration-300" 
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                        )}
                        {file.error && (
                          <p className="text-xs text-red-600 mt-1">{file.error}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* All Files List */}
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                All Files 
                {allFiles.length > 0 && (
                  <span className="ml-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                    {allFiles.length}
                  </span>
                )}
              </h3>
              
              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mb-2"></div>
                  <p className="text-sm text-gray-500">Loading files...</p>
                </div>
              ) : allFiles.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {allFiles.map((doc, index) => {
                    const statusDisplay = getStatusDisplay(doc.status || 'processed', 0, doc.processing_progress);
                    const isProcessing = doc.status === 'processing';
                    const canCheckStatus = doc.id && !doc.id.startsWith('uploading-');
                    
                    return (
                      <div key={doc.id || `${doc.name}-${index}`} className="bg-white p-3 rounded-lg border border-gray-200 hover:shadow-sm transition-shadow">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center flex-1 min-w-0">
                            <File className="w-4 h-4 text-gray-400 mr-3 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-700 truncate font-medium">{doc.name}</p>
                              <div className="flex items-center space-x-2 mt-1">
                                {doc.size && (
                                  <span className="text-xs text-gray-500">{formatFileSize(doc.size)}</span>
                                )}
                                {doc.uploadedAt && (
                                  <span className="text-xs text-gray-400">
                                    • {new Date(doc.uploadedAt).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <span className={`text-xs px-2 py-1 rounded-full border flex items-center ${statusDisplay.color}`}>
                              {statusDisplay.icon}
                              <span className="ml-1">{statusDisplay.text}</span>
                            </span>
                            
                            {/* Manual status check button for processing files */}
                            {isProcessing && canCheckStatus && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  checkFileStatus(doc.id, doc.name);
                                }}
                                className="ml-2 text-gray-400 hover:text-blue-600 transition-colors"
                                title="Check status manually"
                              >
                                <RefreshCw className="w-4 h-4" />
                              </button>
                            )}
                            
                            {/* Remove button for failed files or recent uploads */}
                            {(recentUploads.some(recent => recent.id === doc.id) && (doc.status === 'failed' || doc.status === 'timeout')) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeRecentUpload(doc.id);
                                }}
                                className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
                                title="Remove from list"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                        
                        {/* Show error message if file failed */}
                        {doc.error && (
                          <p className="text-xs text-red-600 mt-2">{doc.error}</p>
                        )}
                        
                        {/* Show processing progress bar */}
                        {doc.status === 'processing' && doc.processing_progress && doc.processing_progress > 0 && (
                          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                            <div 
                              className="bg-yellow-500 h-1.5 rounded-full transition-all duration-300" 
                              style={{ width: `${Math.round(doc.processing_progress)}%` }}
                            ></div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <File className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-1">No files uploaded yet</p>
                  <p className="text-sm">Upload your first document to get started</p>
                </div>
              )}
            </div>

            {/* Processing Status Check Button */}
            {allFiles.length > 0 && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={checkProcessingStatus}
                  disabled={loading}
                  className="w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 flex items-center justify-center"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Check Processing Status
                </button>
                
                {/* Active polling indicator */}
                {processingIntervals.size > 0 && (
                  <div className="mt-2 text-center">
                    <p className="text-xs text-blue-600 flex items-center justify-center">
                      <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                      Monitoring {processingIntervals.size} file{processingIntervals.size > 1 ? 's' : ''}
                    </p>
                  </div>
                )}
                
                {/* Debug info for development */}
                {process.env.NODE_ENV === 'development' && recentUploads.length > 0 && (
                  <div className="mt-2 text-center">
                    <details className="text-xs text-gray-500">
                      <summary className="cursor-pointer">Debug Info</summary>
                      <div className="mt-2 text-left bg-gray-50 p-2 rounded">
                        <p>Recent uploads: {recentUploads.length}</p>
                        <p>Processing intervals: {processingIntervals.size}</p>
                        {recentUploads.map(upload => (
                          <div key={upload.id} className="mt-1">
                            {upload.name}: {upload.status} ({upload.id})
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FolderDetailPage;