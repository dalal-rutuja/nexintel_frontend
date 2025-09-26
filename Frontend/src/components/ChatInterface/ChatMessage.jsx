import React from 'react';

const ChatMessage = ({ message }) => {
  return (
    <div className="space-y-3">
      {/* User Message */}
      <div className="flex justify-end">
        <div className="bg-blue-600 text-white p-3 rounded-lg max-w-lg shadow-md">
          <p className="font-medium mb-1">You:</p>
          <p className="whitespace-pre-wrap">{message.question}</p>
          <p className="text-right text-xs text-blue-200 mt-1">
            {new Date(message.timestamp).toLocaleTimeString()}
          </p>
        </div>
      </div>

      {/* AI Message */}
      <div className="flex justify-start">
        <div className="bg-gray-100 text-gray-800 p-3 rounded-lg max-w-lg shadow-md border border-gray-200">
          <p className="font-medium mb-1">AI:</p>
          <p className="whitespace-pre-wrap">{message.response}</p>
          <p className="text-right text-xs text-gray-500 mt-1">
            {new Date(message.timestamp).toLocaleTimeString()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;