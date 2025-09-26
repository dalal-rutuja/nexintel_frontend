import React, { useEffect, useContext, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import FolderContent from '../components/FolderContent/FolderContent';
import ChatInterface from '../components/ChatInterface/ChatInterface';
import ChatSearchBox from '../components/ChatInterface/ChatSearchBox';
import { FileManagerContext } from '../context/FileManagerContext';
import { ArrowLeft, Loader2, MessageSquare } from 'lucide-react';

const FolderDetailPage = () => {
  const { folderName } = useParams();
  const navigate = useNavigate();
  const { setSelectedFolder, selectedFolder, loadFoldersAndFiles } = useContext(FileManagerContext);

  // State for AI response and chat
  const [currentResponse, setCurrentResponse] = useState('');
  const [animatedResponseContent, setAnimatedResponseContent] = useState('');
  const [isAnimatingResponse, setIsAnimatingResponse] = useState(false);
  const [hasResponse, setHasResponse] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // For general loading, e.g., chat
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [fileId, setFileId] = useState(null); // Represents the ID of the currently analyzed file
  const [sessionId, setSessionId] = useState(null); // Represents the current chat session ID
  const [messages, setMessages] = useState([]); // Stores chat history
  const [selectedMessageId, setSelectedMessageId] = useState(null); // ID of the message whose response is displayed

  // Ref for scrolling response area
  const responseRef = useRef(null);

  // Utility function to animate text
  const animateResponse = (text) => {
    setAnimatedResponseContent('');
    setIsAnimatingResponse(true);

    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        setAnimatedResponseContent(prev => prev + text.charAt(i));
        i++;

        if (responseRef.current) {
          responseRef.current.scrollTop = responseRef.current.scrollHeight;
        }
      } else {
        clearInterval(interval);
        setIsAnimatingResponse(false);
      }
    }, 20); // Adjust typing speed here

    return interval;
  };

  // Utility function to format date
  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch (e) {
      return 'Invalid date';
    }
  };

  // API Configuration
  const API_BASE_URL = 'http://localhost:5000';

  // Get auth token with comprehensive fallback options
  const getAuthToken = () => {
    const tokenKeys = [
      'authToken', 'token', 'accessToken', 'jwt', 'bearerToken',
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

  // API request helper
  const apiRequest = async (url, options = {}) => {
    try {
      const token = getAuthToken();
      const defaultHeaders = {
        'Content-Type': 'application/json',
      };

      if (token) {
        defaultHeaders['Authorization'] = `Bearer ${token}`;
      }

      const headers = options.body instanceof FormData
        ? (token ? { 'Authorization': `Bearer ${token}` } : {})
        : { ...defaultHeaders, ...options.headers };

      const response = await fetch(`${API_BASE_URL}${url}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { error: `HTTP error! status: ${response.status}` };
        }

        switch (response.status) {
          case 401:
            throw new Error('Authentication required. Please log in again.');
          case 403:
            throw new Error('Access denied.');
          case 404:
            throw new Error('Resource not found.');
          case 413:
            throw new Error('File too large.');
          case 415:
            throw new Error('Unsupported file type.');
          case 429:
            throw new Error('Too many requests.');
          default:
            throw new Error(errorData.error || errorData.message || `Request failed with status ${response.status}`);
        }
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      return response;
    } catch (error) {
      throw error;
    }
  };

  // State for secrets (analysis prompts)
  const [secrets, setSecrets] = useState([]);
  const [isLoadingSecrets, setIsLoadingSecrets] = useState(false);
  const [selectedSecretId, setSelectedSecretId] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState('Summary');
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSecretPromptSelected, setIsSecretPromptSelected] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [documentData, setDocumentData] = useState(null);
  const [processingStatus, setProcessingStatus] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [batchUploads, setBatchUploads] = useState([]);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);

  // Function to fetch secrets list
  const fetchSecrets = async () => {
    try {
      setIsLoadingSecrets(true);
      setError(null);

      const token = getAuthToken();
      const headers = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/files/secrets?fetch=true`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch secrets: ${response.status}`);
      }

      const secretsData = await response.json();

      setSecrets(secretsData || []);

      if (secretsData && secretsData.length > 0) {
        setActiveDropdown(secretsData[0].name);
        setSelectedSecretId(secretsData[0].id);
      }

    } catch (error) {
      console.error('Error fetching secrets:', error);
      setError(`Failed to load analysis prompts: ${error.message}`);
    } finally {
      setIsLoadingSecrets(false);
    }
  };

  // Function to fetch secret value by ID
  const fetchSecretValue = async (secretId) => {
    try {
      const existingSecret = secrets.find(secret => secret.id === secretId);
      if (existingSecret && existingSecret.value) {
        return existingSecret.value;
      }

      const token = getAuthToken();
      const headers = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/files/secrets/${secretId}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch secret value: ${response.status}`);
      }

      const secretData = await response.json();
      const promptValue = secretData.value || secretData.prompt || secretData.content || secretData;

      setSecrets(prevSecrets =>
        prevSecrets.map(secret =>
          secret.id === secretId
            ? { ...secret, value: promptValue }
            : secret
        )
      );

      return promptValue || '';
    } catch (error) {
      console.error('Error fetching secret value:', error);
      throw new Error('Failed to retrieve analysis prompt');
    }
  };

  // File upload with progress tracking (for single file)
  const uploadDocument = async (file) => {
    try {
      setError(null);

      const formData = new FormData();
      formData.append('document', file);

      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(progress);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              const documentId = data.file_id || data.document_id || data.id;

              if (!documentId) {
                throw new Error('No document ID returned from server');
              }

              setFileId(documentId);
              setDocumentData({
                id: documentId,
                title: file.name,
                originalName: file.name,
                size: file.size,
                type: file.type,
                uploadedAt: new Date().toISOString(),
                status: 'uploaded',
                content: data.html_content || data.content || 'Document uploaded. Processing...'
              });

              setSuccess('Document uploaded successfully!');

              if (data.file_id) {
                startProcessingStatusPolling(data.file_id);
              } else {
                setProcessingStatus({ status: 'processed' });
              }

              resolve(data);
            } catch (error) {
              reject(new Error('Failed to parse server response.'));
            }
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        };

        xhr.onerror = () => {
          reject(new Error('Network error occurred during upload.'));
        };

        xhr.ontimeout = () => {
          reject(new Error('Upload timeout.'));
        };

        const token = getAuthToken();
        xhr.open('POST', `${API_BASE_URL}/files/batch-upload`);

        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }

        xhr.timeout = 300000;
        xhr.send(formData);
      });
    } catch (error) {
      setError(`Upload failed: ${error.message}`);
      throw error;
    }
  };

  // Batch file upload with progress tracking
  const batchUploadDocuments = async (files) => {
    setIsUploading(true);
    setError(null);
    setBatchUploads(files.map(file => ({
      file: file,
      progress: 0,
      status: 'pending',
      id: file.name + Date.now()
    })));

    const uploadPromises = files.map(file => {
      return new Promise((resolve, reject) => {
        const formData = new FormData();
        formData.append('document', file);

        const xhr = new XMLHttpRequest();

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setBatchUploads(prev => prev.map(upload =>
              upload.id === (file.name + Date.now()) ? { ...upload, progress: progress } : upload
            ));
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              const documentId = data.file_id || data.document_id || data.id;

              if (!documentId) {
                throw new Error('No document ID returned from server');
              }

              setBatchUploads(prev => prev.map(upload =>
                upload.id === (file.name + Date.now()) ? { ...upload, status: 'uploaded', file_id: documentId } : upload
              ));
              resolve(data);
            } catch (error) {
              setBatchUploads(prev => prev.map(upload =>
                upload.id === (file.name + Date.now()) ? { ...upload, status: 'failed', error: 'Failed to parse server response.' } : upload
              ));
              reject(new Error('Failed to parse server response.'));
            }
          } else {
            setBatchUploads(prev => prev.map(upload =>
              upload.id === (file.name + Date.now()) ? { ...upload, status: 'failed', error: `Upload failed with status ${xhr.status}` } : upload
            ));
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        };

        xhr.onerror = () => {
          setBatchUploads(prev => prev.map(upload =>
            upload.id === (file.name + Date.now()) ? { ...upload, status: 'failed', error: 'Network error occurred during upload.' } : upload
          ));
          reject(new Error('Network error occurred during upload.'));
        };

        xhr.ontimeout = () => {
          setBatchUploads(prev => prev.map(upload =>
            upload.id === (file.name + Date.now()) ? { ...upload, status: 'failed', error: 'Upload timeout.' } : upload
          ));
          reject(new Error('Upload timeout.'));
        };

        const token = getAuthToken();
        xhr.open('POST', `${API_BASE_URL}/files/batch-upload`);

        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }

        xhr.timeout = 300000;
        xhr.send(formData);
      });
    });

    try {
      const results = await Promise.allSettled(uploadPromises);
      const successfulUploads = results.filter(result => result.status === 'fulfilled');
      const failedUploads = results.filter(result => result.status === 'rejected');

      if (successfulUploads.length > 0) {
        setSuccess(`${successfulUploads.length} document(s) uploaded successfully!`);
        const firstSuccessfulUpload = successfulUploads[0];
        const firstSuccessfulFile = firstSuccessfulUpload.value;
        const originalFile = batchUploads.find(u => u.file_id === firstSuccessfulFile.file_id)?.file;

        if (firstSuccessfulFile.file_id && originalFile) {
          setFileId(firstSuccessfulFile.file_id);
          setDocumentData({
            id: firstSuccessfulFile.file_id,
            title: originalFile.name,
            originalName: originalFile.name,
            size: originalFile.size,
            type: originalFile.type,
            uploadedAt: new Date().toISOString(),
            status: 'uploaded',
            content: firstSuccessfulFile.html_content || firstSuccessfulFile.content || 'Document uploaded. Processing...'
          });
          startProcessingStatusPolling(firstSuccessfulFile.file_id);
        }
      }

      if (failedUploads.length > 0) {
        setError(`${failedUploads.length} document(s) failed to upload.`);
      }

    } catch (error) {
      setError(`Batch upload process encountered an error: ${error.message}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Processing status polling
  const getProcessingStatus = async (file_id) => {
    try {
      const data = await ApiService.getFileStatus(file_id);
      setProcessingStatus(data);

      if (data.status === 'processed') {
        setDocumentData(prev => ({
          ...prev,
          status: 'processed',
          content: prev?.content || 'Document processed successfully.'
        }));
      } else if (data.status === 'error') {
        setError('Document processing failed.');
      }

      return data;
    } catch (error) {
      return null;
    }
  };

  const startProcessingStatusPolling = (file_id) => {
    let pollCount = 0;
    const maxPolls = 150;

    const pollInterval = setInterval(async () => {
      pollCount++;
      const status = await getProcessingStatus(file_id);

      if (status && (status.status === 'processed' || status.status === 'error')) {
        clearInterval(pollInterval);
        if (status.status === 'processed') {
          setSuccess('Document processing completed!');
        } else {
          setError('Document processing failed.');
        }
      } else if (pollCount >= maxPolls) {
        clearInterval(pollInterval);
        setError('Document processing timeout.');
      }
    }, 2000);

    return pollInterval;
  };

  // Chat with AI using custom prompt from secrets
  const chatWithAI = async (file_id, secretId, currentSessionId) => {
    try {
      setIsGeneratingInsights(true);
      setError(null);

      const selectedSecret = secrets.find(s => s.id === secretId);
      if (!selectedSecret) {
        throw new Error('No prompt found for selected analysis type');
      }

      let promptValue = selectedSecret.value;
      const promptLabel = selectedSecret.name;

      if (!promptValue) {
        promptValue = await fetchSecretValue(secretId);
      }

      if (!promptValue) {
        throw new Error('Secret prompt value is empty.');
      }

      const data = await apiRequest('/files/chat', {
        method: 'POST',
        body: JSON.stringify({
          file_id: file_id,
          question: promptValue,
          used_secret_prompt: true,
          prompt_label: promptLabel,
          session_id: currentSessionId
        }),
      });

      const response = data.answer || data.response || 'No response received';
      const newSessionId = data.session_id || currentSessionId;

      const newChat = {
        id: Date.now(),
        file_id: file_id,
        session_id: newSessionId,
        question: promptLabel,
        answer: response,
        display_text_left_panel: `Analysis: ${promptLabel}`,
        timestamp: new Date().toISOString(),
        used_chunk_ids: data.used_chunk_ids || [],
        confidence: data.confidence || 0.8,
        type: 'analysis'
      };

      if (data.history) {
        setMessages(data.history);
      } else {
        setMessages(prev => [...prev, newChat]);
      }
      setSessionId(newSessionId);

      setSuccess('Analysis completed!');
      animateResponse(response); // Animate response in parent

      return data;
    } catch (error) {
      setError(`Analysis failed: ${error.message}`);
      throw error;
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  // Chat with document function
  const chatWithDocument = async (file_id, question, currentSessionId, displayQuestion = null) => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await apiRequest('/files/chat', {
        method: 'POST',
        body: JSON.stringify({
          file_id: file_id,
          question: question.trim(),
          used_secret_prompt: false,
          session_id: currentSessionId
        }),
      });

      const response = data.answer || data.response || 'No response received';
      const newSessionId = data.session_id || currentSessionId;

      const newChat = {
        id: Date.now(),
        file_id: file_id,
        session_id: newSessionId,
        question: question.trim(),
        answer: response,
        display_text_left_panel: displayQuestion || question.trim(),
        timestamp: new Date().toISOString(),
        used_chunk_ids: data.used_chunk_ids || [],
        confidence: data.confidence || 0.8,
        type: 'chat'
      };

      if (data.history) {
        setMessages(data.history);
      } else {
        setMessages(prev => [...prev, newChat]);
      }
      setSessionId(newSessionId);
      setChatInput('');

      setSuccess('Question answered!');
      animateResponse(response); // Animate response in parent

      return data;
    } catch (error) {
      setError(`Chat failed: ${error.message}`);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Handle dropdown selection
  const handleDropdownSelect = (secretName, secretId) => {
    setActiveDropdown(secretName);
    setSelectedSecretId(secretId);
    setIsSecretPromptSelected(true);
    setChatInput('');
    setShowDropdown(false);
  };

  // Handle custom input change
  const handleChatInputChange = (e) => {
    setChatInput(e.target.value);
    setIsSecretPromptSelected(false);
    setActiveDropdown('Custom Query');
  };

  // Handle send button logic (combines chat and analysis)
  const handleSend = async (e) => {
    e.preventDefault();

    if (!fileId) {
      setError('Please upload a document first.');
      return;
    }
    if (processingStatus?.status === 'processing') {
      setError('Please wait for document processing to complete.');
      return;
    }

    if (isSecretPromptSelected) {
      if (!selectedSecretId) {
        setError('Please select an analysis type.');
        return;
      }
      try {
        await chatWithAI(fileId, selectedSecretId, sessionId);
      } catch (error) {
        // Error already handled
      }
    } else {
      if (!chatInput.trim()) {
        setError('Please enter a question.');
        return;
      }
      try {
        await chatWithDocument(fileId, chatInput, sessionId);
      } catch (error) {
        // Error already handled
      }
    }
  };

  // Utility functions
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  useEffect(() => {
    fetchSecrets();
  }, [fetchSecrets]);

  useEffect(() => {
    if (folderName) {
      setSelectedFolder(folderName);
    }
  }, [folderName, setSelectedFolder]);

  // Ensure folders are loaded so context can find the selected folder
  useEffect(() => {
    loadFoldersAndFiles();
  }, [loadFoldersAndFiles]);

  // Effect to clear success messages after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Effect to clear error messages after 8 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return (
    <div className="flex-1 flex flex-col bg-gray-50 text-gray-900 min-h-screen">
      {/* Error Messages */}
      {error && (
        <div className="fixed top-4 right-4 z-50 max-w-sm">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-lg flex items-start space-x-2">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Success Messages */}
      {success && (
        <div className="fixed top-4 right-4 z-50 max-w-sm">
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm">{success}</span>
            <button
              onClick={() => setSuccess(null)}
              className="ml-auto text-green-500 hover:text-green-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Upload Progress Modal */}
      {isUploading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Uploading Document(s)</h3>
              {batchUploads.length > 0 ? (
                <div className="space-y-4">
                  {batchUploads.map((upload) => (
                    <div key={upload.id} className="text-left">
                      <p className="text-sm font-medium text-gray-800 truncate mb-1">{upload.file.name}</p>
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            upload.status === 'uploaded' ? 'bg-green-500' :
                            upload.status === 'failed' ? 'bg-red-500' : 'bg-blue-600'
                          }`}
                          style={{ width: `${upload.progress}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-600">
                        {upload.status === 'uploaded' ? 'Completed' :
                        upload.status === 'failed' ? `Failed: ${upload.error}` :
                        `${upload.progress}% complete`}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              )}
              {batchUploads.length === 0 && (
                <p className="text-sm text-gray-600">{uploadProgress}% complete</p>
              )}
            </div>
          </div>
        </div>
      )}

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

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Center Panel: ChatSearchBox and Results */}
        <div className="flex-1 flex flex-col p-6 overflow-y-auto">
          <ChatSearchBox
            fileId={fileId} setFileId={setFileId}
            sessionId={sessionId} setSessionId={setSessionId}
            isUploading={isUploading} setIsUploading={setIsUploading}
            uploadProgress={uploadProgress} setUploadProgress={setUploadProgress}
            processingStatus={processingStatus} setProcessingStatus={setProcessingStatus}
            isLoading={isLoading} setIsLoading={setIsLoading}
            isGeneratingInsights={isGeneratingInsights} setIsGeneratingInsights={setIsGeneratingInsights}
            error={error} setError={setError}
            success={success} setSuccess={setSuccess}
            activeDropdown={activeDropdown} setActiveDropdown={setActiveDropdown}
            showDropdown={showDropdown} setShowDropdown={setShowDropdown}
            secrets={secrets} setSecrets={setSecrets}
            isLoadingSecrets={isLoadingSecrets} setIsLoadingSecrets={setIsLoadingSecrets}
            selectedSecretId={selectedSecretId} setSelectedSecretId={setSelectedSecretId}
            isSecretPromptSelected={isSecretPromptSelected} setIsSecretPromptSelected={setIsSecretPromptSelected}
            chatInput={chatInput} setChatInput={setChatInput}
            documentData={documentData} setDocumentData={setDocumentData}
            batchUploads={batchUploads} setBatchUploads={setBatchUploads}
            messages={messages} setMessages={setMessages}
            animateResponse={animateResponse}
            API_BASE_URL={API_BASE_URL} getAuthToken={getAuthToken} apiRequest={apiRequest}
            fetchSecrets={fetchSecrets} fetchSecretValue={fetchSecretValue} startProcessingStatusPolling={startProcessingStatusPolling}
            formatFileSize={formatFileSize} formatDate={formatDate}
          />

          {/* AI Response Display Area */}
          {hasResponse && (currentResponse || animatedResponseContent) ? (
            <div className="mt-6 p-6 bg-white rounded-xl shadow-md border border-gray-100">
              <div className="max-w-none">
                {/* Response Header */}
                <div className="mb-6 pb-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">AI Response</h2>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      {messages.find(msg => msg.id === selectedMessageId)?.timestamp && (
                        <span>{formatDate(messages.find(msg => msg.id === selectedMessageId).timestamp)}</span>
                      )}
                      {messages.find(msg => msg.id === selectedMessageId)?.session_id && (
                        <>
                          <span>•</span>
                          <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                            {messages.find(msg => msg.id === selectedMessageId).session_id}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  {/* Original Question */}
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                    <p className="text-sm font-medium text-blue-900 mb-1">Question:</p>
                    <p className="text-sm text-blue-800">
                      {messages.find(msg => msg.id === selectedMessageId)?.question || 'No question available'}
                    </p>
                  </div>
                </div>

                {/* Response Content */}
                <div className="prose prose-gray max-w-none custom-markdown-renderer">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    children={animatedResponseContent || currentResponse || ''}
                    components={{
                      h1: ({node, ...props}) => <h1 className="text-2xl font-bold mb-6 mt-8 text-black border-b-2 border-gray-300 pb-2" {...props} />,
                      h2: ({node, ...props}) => <h2 className="text-xl font-bold mb-4 mt-6 text-black" {...props} />,
                      h3: ({node, ...props}) => <h3 className="text-lg font-bold mb-3 mt-4 text-black" {...props} />,
                      h4: ({node, ...props}) => <h4 className="text-base font-bold mb-2 mt-3 text-black" {...props} />,
                      h5: ({node, ...props}) => <h5 className="text-base font-bold mb-2 mt-3 text-black" {...props} />,
                      h6: ({node, ...props}) => <h6 className="text-base font-bold mb-2 mt-3 text-black" {...props} />,
                      p: ({node, ...props}) => <p className="mb-4 leading-relaxed text-black text-justify" {...props} />,
                      strong: ({node, ...props}) => <strong className="font-bold text-black" {...props} />,
                      em: ({node, ...props}) => <em className="italic text-black" {...props} />,
                      ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-4 text-black" {...props} />,
                      ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-4 text-black" {...props} />,
                      li: ({node, ...props}) => <li className="mb-2 leading-relaxed text-black" {...props} />,
                      a: ({node, ...props}) => <a className="text-blue-600 hover:underline" {...props} />,
                      blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-700 my-4" {...props} />,
                      code: ({node, inline, ...props}) => {
                        const className = inline ? "bg-gray-100 px-1 py-0.5 rounded text-sm font-mono text-red-700" : "block bg-gray-100 p-4 rounded-md text-sm font-mono overflow-x-auto my-4 text-red-700";
                        return <code className={className} {...props} />;
                      },
                      table: ({node, ...props}) => <div className="overflow-x-auto my-6"><table className="min-w-full border-collapse border border-gray-400" {...props} /></div>,
                      thead: ({node, ...props}) => <thead className="bg-gray-100" {...props} />,
                      th: ({node, ...props}) => <th className="border border-gray-400 px-4 py-3 text-left font-bold text-black" {...props} />,
                      tbody: ({node, ...props}) => <tbody {...props} />,
                      td: ({node, ...props}) => <td className="border border-gray-400 px-4 py-3 text-black" {...props} />,
                      hr: ({node, ...props}) => <hr className="my-6 border-gray-400" {...props} />,
                    }}
                  />
                  {isAnimatingResponse && (
                    <span className="inline-block w-2 h-5 bg-gray-400 animate-pulse ml-1"></span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md px-6">
                <MessageSquare className="h-16 w-16 mx-auto mb-6 text-gray-300" />
                <h3 className="text-2xl font-semibold mb-4 text-gray-900">Start a Conversation</h3>
                <p className="text-gray-600 text-lg leading-relaxed">
                  Upload a document or ask a question to get AI-powered insights.
                </p>
              </div>
            </div>
          )}
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