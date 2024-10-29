import React from 'react';
import { Plus, MessageSquare, Settings } from 'lucide-react';
import { Chat } from '../types';
import SettingsModal from './SettingsModal';

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
  const [isSettingsModalOpen, setIsSettingsModalOpen] = React.useState(false);

  return (
    <div className="w-full md:w-64 bg-gray-900 h-screen flex flex-col">
      <div className="flex flex-row justify-between m-2">
        <button
          onClick={onNewChat}
          className="p-2 bg-gray-700 text-white text-sm rounded-md flex items-center gap-2 hover:bg-gray-600 transition-colors"
        >
          <Plus size={20} />
          New Chat
        </button>
        <button
          onClick={() => setIsSettingsModalOpen(true)}
          className="p-2 bg-gray-700 text-white flex items-center gap-2 hover:bg-gray-600 rounded-md transition-colors"
        >
          <Settings size={20} />
        </button>
      </div>

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

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        apiKey={apiKey}
        onApiKeyUpdate={onApiKeyUpdate}
      />
    </div>
  );
}