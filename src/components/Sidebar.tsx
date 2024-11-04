import { MessageSquare, Plus, Settings, Trash } from "lucide-react";
import React, { useEffect, useState } from "react";
import type { Chat } from "../types";
import ChatListModal from "./ChatListModal";
import SettingsModal from "./SettingsModal";

interface SidebarProps {
	chats: Chat[];
	currentChatId: string | null;
	onChatSelect: (chatId: string) => void;
	onNewChat: () => void;
	onApiKeyUpdate: (key: string) => void;
	apiKey: string | null;
	theme: "light" | "dark" | "system";
	setTheme: (theme: "light" | "dark" | "system") => void;
	onRemoveChat: (chatId: string) => void;
}

export default function Sidebar({
	chats,
	currentChatId,
	onChatSelect,
	onNewChat,
	onApiKeyUpdate,
	apiKey,
	theme,
	setTheme,
	onRemoveChat,
}: SidebarProps) {
	const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
	const [isChatListModalOpen, setIsChatListModalOpen] = useState(false);
	const [currentChatTitle, setCurrentChatTitle] = useState<string | null>(null);
	const [clientChats, setClientChats] = useState<Chat[]>([]);

	useEffect(() => {
		// This ensures the title and chats are set only on the client
		const currentChat = chats.find((chat) => chat.id === currentChatId);
		setCurrentChatTitle(currentChat ? currentChat.title : null);
		setClientChats(chats);
	}, [chats, currentChatId]);

	return (
		<div className="w-full bg-gray-200 dark:bg-gray-800 flex flex-col md:w-64 md:h-screen">
			<div className="flex flex-row justify-between items-center m-2">
				<button
					type="button"
					onClick={onNewChat}
					className="p-2 bg-gray-300 dark:bg-gray-700 text-black dark:text-white text-sm rounded-md flex items-center gap-2 hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors"
				>
					<Plus size={20} />
					New Chat
				</button>

				{/* Mobile: Current Chat Title Button */}
				{currentChatTitle && (
					<button
						type="button"
						onClick={() => setIsChatListModalOpen(true)}
						className="p-2 font-bold text-black dark:text-white text-sm rounded-md flex items-center gap-2 mx-2 hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors md:hidden"
					>
						<span
							className="truncate max-w-[100px]"
							title={currentChatTitle || "New Chat"}
						>
							{currentChatTitle || "New Chat"}
						</span>
					</button>
				)}

				<button
					type="button"
					onClick={() => setIsSettingsModalOpen(true)}
					className="p-2 bg-gray-300 dark:bg-gray-700 text-black dark:text-white flex items-center gap-2 hover:bg-gray-400 dark:hover:bg-gray-600 rounded-md transition-colors"
				>
					<Settings size={20} />
				</button>
			</div>

			{/* Desktop Chat List */}
			<div className="flex-1 overflow-y-auto hidden md:block">
				{clientChats.map((chat) => (
					<div
						key={chat.id}
						className={`flex items-center gap-2 p-2 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors ${
							chat.id === currentChatId ? "bg-gray-300 dark:bg-gray-700" : ""
						}`}
					>
						<button
							type="button"
							onClick={() => onChatSelect(chat.id)}
							className="flex-1 text-left flex items-center gap-2 text-black dark:text-white"
						>
							<MessageSquare size={20} />
							<span
								className="truncate max-w-[170px]"
								title={chat.title || "New Chat"}
							>
								{chat.title || "New Chat"}
							</span>
						</button>
						<button
							type="button"
							onClick={() => onRemoveChat(chat.id)}
							className="p-2 text-white hover:text-red-700 transition-colors"
						>
							<Trash size={20} />
						</button>
					</div>
				))}
			</div>

			<SettingsModal
				isOpen={isSettingsModalOpen}
				onClose={() => setIsSettingsModalOpen(false)}
				apiKey={apiKey}
				onApiKeyUpdate={onApiKeyUpdate}
				theme={theme}
				setTheme={setTheme}
			/>

			{/* Chat List Modal for Mobile */}
			<ChatListModal
				isOpen={isChatListModalOpen}
				onClose={() => setIsChatListModalOpen(false)}
				chats={chats}
				currentChatId={currentChatId}
				onChatSelect={onChatSelect}
				onRemoveChat={onRemoveChat}
			/>
		</div>
	);
}
