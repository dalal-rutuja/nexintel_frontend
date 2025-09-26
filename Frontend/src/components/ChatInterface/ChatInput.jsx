import React, { useState } from 'react';

const ChatInput = ({ onSendMessage, disabled }) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message);
      setMessage('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center space-x-3">
      <input
        type="text"
        className="flex-grow px-4 py-2 bg-white border border-gray-300 rounded-full text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={disabled ? "Select a folder to chat" : "Ask a question about the documents..."}
        disabled={disabled}
      />
      <button
        type="submit"
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-full transition-colors duration-200 disabled:opacity-50 shadow-sm"
        disabled={disabled || !message.trim()}
      >
        Send
      </button>
    </form>
  );
};

export default ChatInput;