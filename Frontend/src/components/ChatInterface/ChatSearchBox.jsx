import React, { useState, useRef, useEffect } from 'react';
import { Paperclip, BookOpen, ChevronDown, Loader2, Send, FileCheck, AlertCircle, X, CheckCircle } from 'lucide-react';
import ApiService from '../../services/api'; // Adjust path as needed

const ChatSearchBox = () => {
  // State variables from AnalysisPage.jsx
  const [fileId, setFileId] = useState(null);
  const [sessionId, setSessionId] = useState(`session-${Date.now()}`); // Initialize with a new session ID
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState('Summary');
  const [showDropdown, setShowDropdown] = useState(false);
  const [secrets, setSecrets] = useState([]);
  const [isLoadingSecrets, setIsLoadingSecrets] = useState(false);
  const [selectedSecretId, setSelectedSecretId] = useState(null);
  const [isSecretPromptSelected, setIsSecretPromptSelected] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [documentData, setDocumentData] = useState(null);
  const [batchUploads, setBatchUploads] = useState([]);
  const [messages, setMessages] = useState([]); // Required for chatWithAI/chatWithDocument

  // Refs from AnalysisPage.jsx
  const fileInputRef = useRef(null);
  const dropdownRef = useRef(null);

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

      return data;
    } catch (error) {
      setError(`Chat failed: ${error.message}`);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Handle file upload
  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];

    const maxSize = 100 * 1024 * 1024; // 100MB

    const validFiles = files.filter(file => {
      if (!allowedTypes.includes(file.type)) {
        setError(`File "${file.name}" has an unsupported type. Please upload PDF, DOC, DOCX, or TXT.`);
        return false;
      }
      if (file.size > maxSize) {
        setError(`File "${file.name}" is too large (max 100MB).`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) {
      event.target.value = '';
      return;
    }

    try {
      if (validFiles.length === 1) {
        await uploadDocument(validFiles[0]);
      } else {
        await batchUploadDocuments(validFiles);
      }
    } catch (error) {
      // Error already handled by uploadDocument or batchUploadDocuments
    }

    event.target.value = '';
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

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Load secrets on component mount
  useEffect(() => {
    fetchSecrets();
  }, []);

  // Clear success messages after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Clear error messages after 8 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return (
    <div className="w-full max-w-4xl mx-auto">
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

      {/* Input Area - Fixed at bottom (from AnalysisPage.jsx split view) */}
      <form onSubmit={handleSend} className="mx-auto">
        <div className="flex items-center space-x-3 bg-gray-50 rounded-xl border border-gray-200 px-4 py-4 focus-within:border-blue-300 focus-within:bg-white focus-within:shadow-sm">
          {/* Upload Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            title="Upload Document"
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Paperclip className="h-4 w-4" />
            )}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.doc,.docx,.txt"
            onChange={handleFileUpload}
            disabled={isUploading}
            multiple
          />

          {/* Analysis Dropdown */}
          <div className="relative flex-shrink-0" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setShowDropdown(!showDropdown)}
              disabled={!fileId || processingStatus?.status !== 'processed' || isLoading || isGeneratingInsights || isLoadingSecrets}
              className="flex items-center space-x-3.5 px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>{isLoadingSecrets ? 'Loading...' : activeDropdown}</span>
              <ChevronDown className="h-3.5 w-3.5" />
            </button>

            {showDropdown && !isLoadingSecrets && (
              <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
                {secrets.length > 0 ? (
                  secrets.map((secret) => (
                    <button
                      key={secret.id}
                      type="button"
                      onClick={() => handleDropdownSelect(secret.name, secret.id)}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                    >
                      {secret.name}
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-2.5 text-sm text-gray-500">
                    No analysis prompts available
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Chat Input */}
          <input
            type="text"
            value={chatInput}
            onChange={handleChatInputChange}
            placeholder={fileId ? "Ask a question..." : "Upload a document first"}
            className="flex-1 bg-transparent border-none outline-none text-gray-900 placeholder-gray-500 text-sm font-medium py-1 min-w-0"
            disabled={isLoading || isGeneratingInsights || !fileId || processingStatus?.status !== 'processed'}
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={isLoading || isGeneratingInsights || (!chatInput.trim() && !isSecretPromptSelected) || !fileId || processingStatus?.status !== 'processed'}
            className="p-1.5 bg-black hover:bg-gray-800 disabled:bg-gray-300 text-white rounded-lg transition-colors flex-shrink-0"
            title="Send Message"
          >
            {isLoading || isGeneratingInsights ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Processing Status */}
        {documentData && processingStatus?.status === 'processing' && (
          <div className="mt-2 text-center">
            <div className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
              Processing document...
              {processingStatus.processing_progress && (
                <span className="ml-1">({Math.round(processingStatus.processing_progress)}%)</span>
              )}
            </div>
          </div>
        )}

        {/* Document Info */}
        {documentData && (
          <div className="mt-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-2">
              <FileCheck className="h-4 w-4 text-green-600" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-900 truncate">{documentData.originalName}</p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(documentData.size)}
                </p>
              </div>
              {processingStatus && (
                <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  processingStatus.status === 'processed'
                    ? 'bg-green-100 text-green-800'
                    : processingStatus.status === 'processing'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {(processingStatus.status ?? '').charAt(0).toUpperCase() + (processingStatus.status ?? '').slice(1)}
                </div>
              )}
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default ChatSearchBox;
