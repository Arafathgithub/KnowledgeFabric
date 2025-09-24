
import React, { useState, FormEvent, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { SendIcon, BotIcon, UserIcon, LoadingSpinner } from './icons';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isAnswering: boolean;
  isReady: boolean;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, onSendMessage, isAnswering, isReady }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isAnswering && isReady) {
      onSendMessage(input);
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-full p-4">
      <h2 className="text-xl font-semibold text-gray-100 mb-4 pb-4 border-b border-slate-700">Chat with the Graph</h2>
      <div className="flex-grow overflow-y-auto pr-2 space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
            {msg.sender === 'ai' && (
              <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center flex-shrink-0">
                <BotIcon className="w-5 h-5 text-white" />
              </div>
            )}
            <div className={`max-w-xs md:max-w-sm lg:max-w-xs rounded-lg px-4 py-2 ${msg.sender === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-slate-700 text-gray-200 rounded-bl-none'}`}>
              <p className="text-sm break-words">{msg.text}</p>
            </div>
             {msg.sender === 'user' && (
              <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center flex-shrink-0">
                <UserIcon className="w-5 h-5 text-white" />
              </div>
            )}
          </div>
        ))}
         {isAnswering && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center flex-shrink-0">
              <BotIcon className="w-5 h-5 text-white" />
            </div>
            <div className="max-w-xs rounded-lg px-4 py-2 bg-slate-700 text-gray-300 rounded-bl-none flex items-center">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.15s] mx-1"></div>
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="mt-4 pt-4 border-t border-slate-700">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isReady ? 'Ask a question...' : 'Upload a document first'}
            disabled={!isReady || isAnswering}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg py-2 pl-4 pr-12 text-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!isReady || isAnswering || !input.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-cyan-600 text-white hover:bg-cyan-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
          >
            {isAnswering ? <LoadingSpinner className="w-5 h-5"/> : <SendIcon className="w-5 h-5" />}
          </button>
        </div>
      </form>
    </div>
  );
};
