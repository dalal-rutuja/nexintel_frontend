import React, { useState, useRef, useEffect } from 'react';
import { Paperclip, BookOpen, ChevronDown, Loader2, Send, FileCheck } from 'lucide-react';
import ApiService from '../../services/api'; // Adjust path as needed

const ChatSearchBox = ({
  fileId, setFileId,
  sessionId, setSessionId,
  isUploading, setIsUploading,
  uploadProgress, setUploadProgress,
  processingStatus, setProcessingStatus,
  isLoading, setIsLoading,
  isGeneratingInsights, setIsGeneratingInsights,
  error, setError,
  success, setSuccess,
  activeDropdown, setActiveDropdown,
  showDropdown, setShowDropdown,
  secrets, setSecrets,
  isLoadingSecrets, setIsLoadingSecrets,
  selectedSecretId, setSelectedSecretId,
  isSecretPromptSelected, setIsSecretPromptSelected,
  chatInput, setChatInput,
  documentData, setDocumentData,
  batchUploads, setBatchUploads,
  messages, setMessages,
  animateResponse, // Passed from parent
  API_BASE_URL, getAuthToken, apiRequest,
  fetchSecrets, fetchSecretValue, startProcessingStatusPolling,
  formatFileSize, formatDate,
}) => {
  // Refs
  const fileInputRef = useRef(null);
  const dropdownRef = useRef(null);

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
  }, [fetchSecrets]); // Dependency array includes fetchSecrets

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Input Area */}
      <form onSubmit={handleSend} className="mx-auto">
        <div className="flex items-center space-x-3 bg-gray-50 rounded-xl border border-gray-200 px-4 py-3 focus-within:border-blue-300 focus-within:bg-white focus-within:shadow-sm">
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
              className="flex items-center space-x-2 px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>{isLoadingSecrets ? 'Loading...' : activeDropdown}</span>
              <ChevronDown className="h-3.5 w-3.5" />
            </button>

            {showDropdown && !isLoadingSecrets && (
              <div className="absolute bottom-full left-0 mb-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
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
