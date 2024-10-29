import React from 'react';
import { Send, Image } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Chat, Message } from '../types';

interface ChatAreaProps {
  chat: Chat | null;
  onSendMessage: (content: string, type: 'text' | 'image') => void;
  onModelChange: (model: 'gpt-4o' | 'gpt-4o-mini') => void;
}

export default function ChatArea({ chat, onSendMessage, onModelChange }: ChatAreaProps) {
  const [input, setInput] = React.useState('');
  const [isError, setIsError] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [chat?.messages]);

  if (!chat) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        Select or create a chat to get started
      </div>
    );
  }

  const handleSubmit = (type: 'text' | 'image') => {
    if (!input.trim()) {
      setIsError(true);
      return;
    }
    setIsError(false);
    onSendMessage(input, type);
    setInput('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    if (isError) setIsError(false);
  };

  // Get all messages except the initial system message for display
  const displayMessages = chat.messages.slice(1);

  return (
    <div className="flex-1 flex flex-col h-screen">
      <div className="p-4 border-b">
        <select
          value={chat.model}
          onChange={(e) => onModelChange(e.target.value as 'gpt-4o' | 'gpt-4o-mini')}
          className="bg-white border rounded-md px-2 py-1"
        >
          <option value="gpt-4o">gpt-4o</option>
          <option value="gpt-4o-mini">gpt-4o mini</option>
        </select>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {displayMessages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === 'assistant' ? 'justify-start' : 'justify-end'
            }`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                message.role === 'assistant'
                  ? 'bg-gray-200'
                  : 'bg-blue-500 text-white'
              }`}
            >
              {message.imageUrl ? (
                <img
                  src={message.imageUrl}
                  alt="Generated"
                  className="rounded-lg max-w-full h-auto"
                />
              ) : message.content ? (
                <ReactMarkdown>{message.content}</ReactMarkdown>
              ) : (
                <div className={message.type === 'image' ? 'loading-neon' : ''}>
                  {message.type === 'image' ? '✨ Generating image... ✨' : '...'}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            onKeyPress={(e) => e.key === 'Enter' && handleSubmit('text')}
            placeholder={isError ? "Empty message" : "Type your message..."}
            className={`flex-1 p-2 border rounded-md ${
              isError ? 'border-red-500 placeholder-red-500' : ''
            }`}
          />
          <button
            onClick={() => handleSubmit('image')}
            className="p-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors"
          >
            <Image size={20} />
          </button>
          <button
            onClick={() => handleSubmit('text')}
            className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}