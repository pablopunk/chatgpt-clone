import React from 'react';
import { Plus, MessageSquare, Settings } from 'lucide-react';
import { Chat } from '../types';

interface SidebarProps {
  chats: Chat[];
  currentChatId: string | null;
  onChatSelect: (chatId: string) => void;
  onNewChat: () => void;
  onApiKeyUpdate: (key: string) => void;
  apiKey: string | null;
}

export default function Sidebar({
  chats,
  currentChatId,
  onChatSelect,
  onNewChat,
  onApiKeyUpdate,
  apiKey,
}: SidebarProps) {
  const [showApiKey, setShowApiKey] = React.useState(false);

  return (
    <div className="w-64 bg-gray-900 h-screen flex flex-col">
      <button
        onClick={onNewChat}
        className="m-2 p-2 bg-gray-700 text-white rounded-md flex items-center gap-2 hover:bg-gray-600 transition-colors"
      >
        <Plus size={20} />
        New Chat
      </button>

      <div className="flex-1 overflow-y-auto">
        {chats.map((chat) => (
          <button
            key={chat.id}
            onClick={() => onChatSelect(chat.id)}
            className={`w-full p-2 text-left flex items-center gap-2 hover:bg-gray-700 transition-colors ${
              chat.id === currentChatId ? 'bg-gray-700' : ''
            } text-white`}
          >
            <MessageSquare size={20} />
            <span className="truncate">{chat.title || 'New Chat'}</span>
          </button>
        ))}
      </div>

      <div className="p-2 border-t border-gray-700">
        <button
          onClick={() => setShowApiKey(!showApiKey)}
          className="w-full p-2 text-white flex items-center gap-2 hover:bg-gray-700 rounded-md transition-colors"
        >
          <Settings size={20} />
          API Settings
        </button>
        {showApiKey && (
          <div className="mt-2">
            <input
              type="password"
              placeholder="Enter OpenAI API Key"
              value={apiKey || ''}
              onChange={(e) => onApiKeyUpdate(e.target.value)}
              className="w-full p-2 bg-gray-800 text-white rounded-md border border-gray-700"
            />
          </div>
        )}
      </div>
    </div>
  );
}