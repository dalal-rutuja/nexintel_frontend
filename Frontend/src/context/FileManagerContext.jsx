// import React, { createContext, useState, useEffect, useCallback, useMemo, useContext } from 'react';
// import { documentApi } from '../services/documentApi'; // Import the new API service

// export const FileManagerContext = createContext();

// export const FileManagerProvider = ({ children }) => {
//   const [folders, setFolders] = useState([]);
//   const [selectedFolder, setSelectedFolder] = useState(null); // Stores folder name
//   const [documents, setDocuments] = useState([]); // Files within the selected folder
//   const [chatSessions, setChatSessions] = useState([]); // Chat sessions for the selected folder
//   const [selectedChatSessionId, setSelectedChatSessionId] = useState(null); // Active chat session ID
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
//   const [success, setSuccess] = useState('');

//   // Auto-clear messages after 5 seconds
//   useEffect(() => {
//     if (error) {
//       const timer = setTimeout(() => setError(''), 5000);
//       return () => clearTimeout(timer);
//     }
//   }, [error]);

//   useEffect(() => {
//     if (success) {
//       const timer = setTimeout(() => setSuccess(''), 5000);
//       return () => clearTimeout(timer);
//     }
//   }, [success]);

//   // Load user files/folders on component mount
//   useEffect(() => {
//     loadFoldersAndFiles();
//   }, []);

//   const loadFoldersAndFiles = useCallback(async () => {
//     setLoading(true);
//     setError('');
//     try {
//       const data = await documentApi.getFoldersAndFiles();
//       setFolders(data.folders);
//       // If a folder is already selected, update its documents
//       if (selectedFolder) {
//         const currentFolder = data.folders.find(f => f.name === selectedFolder);
//         setDocuments(currentFolder ? currentFolder.children || [] : []);
//       }
//     } catch (err) {
//       console.error('Error loading folders and files:', err);
//       setError(`Error loading folders and files: ${err.message}`);
//       setFolders([]);
//       setDocuments([]);
//     } finally {
//       setLoading(false);
//     }
//   }, [selectedFolder]);

//   const createFolder = useCallback(async (folderName) => {
//     setError('');
//     try {
//       await documentApi.createFolder(folderName);
//       setSuccess('Folder created successfully');
//       await loadFoldersAndFiles(); // Refresh folders after creation
//     } catch (err) {
//       setError(`Error creating folder: ${err.response?.data?.details || err.message}`);
//       console.error('Error creating folder:', err);
//     }
//   }, [loadFoldersAndFiles]);

//   const uploadDocuments = useCallback(async (folderName, files) => {
//     setError('');
//     try {
//       await documentApi.uploadDocuments(folderName, files);
//       setSuccess('Documents uploaded and processing started');
//       await loadFoldersAndFiles(); // Refresh files in the selected folder
//     } catch (err) {
//       setError(`Error uploading documents: ${err.response?.data?.details || err.message}`);
//       console.error('Error uploading documents:', err);
//     }
//   }, [loadFoldersAndFiles]);

//   const value = useMemo(() => ({
//     folders,
//     setFolders,
//     selectedFolder,
//     setSelectedFolder,
//     documents,
//     setDocuments,
//     chatSessions,
//     setChatSessions,
//     selectedChatSessionId,
//     setSelectedChatSessionId,
//     loading,
//     error,
//     success,
//     setError,
//     setSuccess,
//     loadFoldersAndFiles,
//     createFolder,
//     uploadDocuments,
//   }), [
//     folders, selectedFolder, documents, chatSessions, selectedChatSessionId,
//     loading, error, success,
//     loadFoldersAndFiles, createFolder, uploadDocuments,
//   ]);

//   return (
//     <FileManagerContext.Provider value={value}>
//       {children}
//     </FileManagerContext.Provider>
//   );
// };

// export const useFileManager = () => {
//   const context = useContext(FileManagerContext);
//   if (!context) {
//     throw new Error('useFileManager must be used within a FileManagerProvider');
//   }
//   return context;
// };





import React, { createContext, useState, useEffect, useCallback, useMemo, useContext } from 'react';
import { documentApi } from '../services/documentApi'; // Import the new API service

export const FileManagerContext = createContext();

export const FileManagerProvider = ({ children }) => {
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null); // Stores folder name
  const [documents, setDocuments] = useState([]); // Files within the selected folder
  const [chatSessions, setChatSessions] = useState([]); // Chat sessions for the selected folder
  const [selectedChatSessionId, setSelectedChatSessionId] = useState(null); // Active chat session ID
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Auto-clear messages after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Load user files/folders on component mount
  useEffect(() => {
    loadFoldersAndFiles();
  }, []);

  const loadFoldersAndFiles = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await documentApi.getFoldersAndFiles();
      setFolders(data.folders || []);
    } catch (err) {
      console.error('Error loading folders and files:', err);
      setError(`Error loading folders and files: ${err.message}`);
      setFolders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load documents for a specific folder
  // const loadSelectedFolderDocuments = useCallback(async (folderName) => {
  //   if (!folderName) {
  //     setDocuments([]);
  //     return;
  //   }

  //   setLoading(true);
  //   setError('');
  //   try {
  //     // Find the selected folder and get its documents
  //     const data = await documentApi.getFoldersAndFiles();
  //     const folder = data.folders?.find(f => f.name === folderName);
      
  //     if (folder && folder.children) {
  //       setDocuments(folder.children);
  //     } else {
  //       setDocuments([]);
  //     }
  //   } catch (err) {
  //     console.error('Error loading folder documents:', err);
  //     setError(`Error loading documents: ${err.message}`);
  //     setDocuments([]);
  //   } finally {
  //     setLoading(false);
  //   }
  // }, []);

  // // Refresh current folder documents
  // const refreshCurrentFolder = useCallback(async () => {
  //   if (selectedFolder) {
  //     await loadSelectedFolderDocuments(selectedFolder);
  //   }
  // }, [selectedFolder, loadSelectedFolderDocuments]);

const loadSelectedFolderDocuments = useCallback(async (folderName) => {
  if (!folderName) {
    setDocuments([]);
    return;
  }

  setLoading(true);
  setError('');
  try {
    // Find the selected folder and get its documents
    const data = await documentApi.getFoldersAndFiles();
    const folder = data.folders?.find(f => f.name === folderName);
    
    if (folder && folder.children) {
      // CHANGED: Instead of completely replacing documents, merge them intelligently
      // Keep any newly uploaded files that might not be in the server response yet
      setDocuments(prevDocs => {
        const serverDocs = folder.children;
        const recentUploads = prevDocs.filter(doc => {
          // Keep documents that were uploaded in the last 30 seconds
          // and aren't already in the server response
          const uploadTime = new Date(doc.uploadedAt);
          const now = new Date();
          const isRecent = (now - uploadTime) < 30000; // 30 seconds
          const notInServerResponse = !serverDocs.some(serverDoc => serverDoc.name === doc.name);
          return isRecent && notInServerResponse;
        });
        
        // Combine server documents with recent uploads, avoiding duplicates
        const combined = [...serverDocs];
        recentUploads.forEach(upload => {
          if (!combined.some(doc => doc.name === upload.name)) {
            combined.unshift(upload); // Add to beginning
          }
        });
        
        return combined;
      });
    } else {
      // Only clear documents if there's no folder data and no recent uploads
      setDocuments(prevDocs => {
        const recentUploads = prevDocs.filter(doc => {
          const uploadTime = new Date(doc.uploadedAt);
          const now = new Date();
          return (now - uploadTime) < 30000; // Keep uploads from last 30 seconds
        });
        return recentUploads;
      });
    }
  } catch (err) {
    console.error('Error loading folder documents:', err);
    setError(`Error loading documents: ${err.message}`);
    // Don't clear documents on error - keep existing state
  } finally {
    setLoading(false);
  }
}, []);

// Update refreshCurrentFolder to be less aggressive about clearing state:
const refreshCurrentFolder = useCallback(async () => {
  if (selectedFolder) {
    // Don't show loading spinner during refresh to avoid clearing UI
    await loadSelectedFolderDocuments(selectedFolder);
  }
}, [selectedFolder, loadSelectedFolderDocuments]);
  const createFolder = useCallback(async (folderName) => {
    setError('');
    setLoading(true);
    try {
      await documentApi.createFolder(folderName);
      setSuccess('Folder created successfully');
      await loadFoldersAndFiles(); // Refresh folders after creation
    } catch (err) {
      setError(`Error creating folder: ${err.response?.data?.details || err.message}`);
      console.error('Error creating folder:', err);
    } finally {
      setLoading(false);
    }
  }, [loadFoldersAndFiles]);

  // const uploadDocuments = useCallback(async (folderName, files) => {
  //   if (!folderName || !files || files.length === 0) {
  //     setError('Please select a folder and files to upload');
  //     return;
  //   }

  //   setError('');
  //   setLoading(true);
    
  //   try {
  //     const response = await documentApi.uploadDocuments(folderName, files);
      
  //     // Show success message with details
  //     const fileCount = files.length;
  //     const fileNames = files.length <= 3 
  //       ? files.map(f => f.name).join(', ')
  //       : `${files.slice(0, 2).map(f => f.name).join(', ')} and ${files.length - 2} more`;
      
  //     setSuccess(`Successfully uploaded ${fileCount} file${fileCount > 1 ? 's' : ''}: ${fileNames}`);
      
  //     // Don't immediately refresh - let the upload process complete
  //     // The calling component can handle the refresh timing
  //     console.log('Upload response:', response);
      
  //   } catch (err) {
  //     const errorMessage = err.response?.data?.details || err.response?.data?.message || err.message;
  //     setError(`Error uploading documents: ${errorMessage}`);
  //     console.error('Error uploading documents:', err);
  //     throw err; // Re-throw so the calling component can handle it
  //   } finally {
  //     setLoading(false);
  //   }
  // }, []);

  // Get folder processing status
  
//   const uploadDocuments = useCallback(async (folderName, files) => {
//   if (!folderName || !files || files.length === 0) {
//     setError('Please select a folder and files to upload');
//     return;
//   }

//   setError('');
//   setLoading(true);
  
//   try {
//     const response = await documentApi.uploadDocuments(folderName, files);

//     // Optimistically add uploaded files to state
//     const optimisticDocs = files.map(file => ({
//       id: `${file.name}-${Date.now()}-${Math.random()}`, // temporary ID
//       name: file.name,
//       size: file.size,
//       uploadedAt: new Date().toISOString(),
//       status: 'processing',
//     }));

//     setDocuments(prevDocs => [...optimisticDocs, ...prevDocs]);

//     // Success message
//     const fileCount = files.length;
//     const fileNames = files.length <= 3 
//       ? files.map(f => f.name).join(', ')
//       : `${files.slice(0, 2).map(f => f.name).join(', ')} and ${files.length - 2} more`;
    
//     setSuccess(`Successfully uploaded ${fileCount} file${fileCount > 1 ? 's' : ''}: ${fileNames}`);

//     // Return server response in case caller wants to use it
//     return response;
//   } catch (err) {
//     const errorMessage = err.response?.data?.details || err.response?.data?.message || err.message;
//     setError(`Error uploading documents: ${errorMessage}`);
//     console.error('Error uploading documents:', err);
//     throw err;
//   } finally {
//     setLoading(false);
//   }
// }, []);

  // In FileManagerContext.js, update the uploadDocuments function:

const uploadDocuments = useCallback(async (folderName, files) => {
  if (!folderName || !files || files.length === 0) {
    setError('Please select a folder and files to upload');
    throw new Error('Please select a folder and files to upload');
  }

  setError('');
  
  try {
    console.log('FileManagerContext: Starting upload...', { folderName, fileCount: files.length });
    
    // Call the API
    const response = await documentApi.uploadDocuments(folderName, files);
    
    console.log('FileManagerContext: Upload successful', response);
    
    // CHANGED: Add uploaded files to the documents state immediately
    // This ensures they appear in the file list right away
    const newDocuments = files.map(file => ({
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      name: file.name,
      size: file.size,
      uploadedAt: new Date().toISOString(),
      status: 'completed', // Mark as completed since upload was successful
    }));
    
    // Add new documents to the beginning of the list
    setDocuments(prevDocs => [...newDocuments, ...prevDocs]);
    
    // Return the response for the calling component
    return response;
    
  } catch (err) {
    console.error('FileManagerContext: Upload failed', err);
    
    // Re-throw the error so the calling component can handle it
    throw err;
  }
}, []);

  const getFolderProcessingStatus = useCallback(async (folderName) => {
    if (!folderName) {
      console.warn('No folder name provided for processing status check');
      return null;
    }

    try {
      const status = await documentApi.getFolderProcessingStatus(folderName);
      return status;
    } catch (err) {
      console.error('Error getting folder processing status:', err);
      setError(`Error checking processing status: ${err.message}`);
      return null;
    }
  }, []);

  // Get folder summary
  const getFolderSummary = useCallback(async (folderName) => {
    if (!folderName) {
      setError('No folder selected');
      return null;
    }

    setLoading(true);
    setError('');
    try {
      const summary = await documentApi.getFolderSummary(folderName);
      return summary;
    } catch (err) {
      setError(`Error getting folder summary: ${err.response?.data?.details || err.message}`);
      console.error('Error getting folder summary:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Load chat sessions for the selected folder
  const loadFolderChatSessions = useCallback(async (folderName) => {
    if (!folderName) {
      setChatSessions([]);
      return;
    }

    try {
      const sessions = await documentApi.getFolderChatSessions(folderName);
      setChatSessions(sessions.sessions || []);
    } catch (err) {
      console.error('Error loading chat sessions:', err);
      setChatSessions([]);
    }
  }, []);

  // Query documents in folder
  const queryFolderDocuments = useCallback(async (folderName, question, sessionId = null) => {
    if (!folderName || !question) {
      setError('Folder name and question are required');
      return null;
    }

    try {
      const response = await documentApi.queryFolderDocuments(folderName, question, sessionId);
      
      // If this created a new session, refresh the chat sessions list
      if (!sessionId && response.sessionId) {
        await loadFolderChatSessions(folderName);
        setSelectedChatSessionId(response.sessionId);
      }
      
      return response;
    } catch (err) {
      setError(`Error querying documents: ${err.response?.data?.details || err.message}`);
      console.error('Error querying documents:', err);
      return null;
    }
  }, [loadFolderChatSessions]);

  // Continue existing chat session
  const continueFolderChat = useCallback(async (folderName, sessionId, question) => {
    if (!folderName || !sessionId || !question) {
      setError('Folder name, session ID, and question are required');
      return null;
    }

    try {
      const response = await documentApi.continueFolderChat(folderName, sessionId, question);
      return response;
    } catch (err) {
      setError(`Error continuing chat: ${err.response?.data?.details || err.message}`);
      console.error('Error continuing chat:', err);
      return null;
    }
  }, []);

  // Delete chat session
  const deleteFolderChatSession = useCallback(async (folderName, sessionId) => {
    if (!folderName || !sessionId) {
      setError('Folder name and session ID are required');
      return false;
    }

    try {
      await documentApi.deleteFolderChatSession(folderName, sessionId);
      
      // Refresh chat sessions list
      await loadFolderChatSessions(folderName);
      
      // If the deleted session was selected, clear the selection
      if (selectedChatSessionId === sessionId) {
        setSelectedChatSessionId(null);
      }
      
      setSuccess('Chat session deleted successfully');
      return true;
    } catch (err) {
      setError(`Error deleting chat session: ${err.response?.data?.details || err.message}`);
      console.error('Error deleting chat session:', err);
      return false;
    }
  }, [loadFolderChatSessions, selectedChatSessionId]);

  // Get specific chat session
  const getFolderChatSessionById = useCallback(async (folderName, sessionId) => {
    if (!folderName || !sessionId) {
      return null;
    }

    try {
      const session = await documentApi.getFolderChatSessionById(folderName, sessionId);
      return session;
    } catch (err) {
      console.error('Error getting chat session:', err);
      return null;
    }
  }, []);

  const value = useMemo(() => ({
    // State
    folders,
    setFolders,
    selectedFolder,
    setSelectedFolder,
    documents,
    setDocuments,
    chatSessions,
    setChatSessions,
    selectedChatSessionId,
    setSelectedChatSessionId,
    loading,
    error,
    success,
    setError,
    setSuccess,

    // Actions
    loadFoldersAndFiles,
    loadSelectedFolderDocuments,
    refreshCurrentFolder,
    createFolder,
    uploadDocuments,
    getFolderProcessingStatus,
    getFolderSummary,
    loadFolderChatSessions,
    queryFolderDocuments,
    continueFolderChat,
    deleteFolderChatSession,
    getFolderChatSessionById,
  }), [
    folders, selectedFolder, documents, chatSessions, selectedChatSessionId,
    loading, error, success,
    loadFoldersAndFiles, loadSelectedFolderDocuments, refreshCurrentFolder,
    createFolder, uploadDocuments, getFolderProcessingStatus, getFolderSummary,
    loadFolderChatSessions, queryFolderDocuments, continueFolderChat,
    deleteFolderChatSession, getFolderChatSessionById,
  ]);

  return (
    <FileManagerContext.Provider value={value}>
      {children}
    </FileManagerContext.Provider>
  );
};

export const useFileManager = () => {
  const context = useContext(FileManagerContext);
  if (!context) {
    throw new Error('useFileManager must be used within a FileManagerProvider');
  }
  return context;
};