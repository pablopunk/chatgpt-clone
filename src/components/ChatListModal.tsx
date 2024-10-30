import { MessageSquare, Trash } from "lucide-react";
import React from "react";
import type { Chat } from "../types";

interface ChatListModalProps {
	isOpen: boolean;
	onClose: () => void;
	chats: Chat[];
	currentChatId: string | null;
	onChatSelect: (chatId: string) => void;
	onRemoveChat: (chatId: string) => void;
}

export default function ChatListModal({
	isOpen,
	onClose,
	chats,
	currentChatId,
	onChatSelect,
	onRemoveChat,
}: ChatListModalProps) {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div className="bg-white dark:bg-gray-800 p-4 rounded-lg w-11/12 max-w-md">
				<h2 className="text-lg font-bold mb-4 text-black dark:text-white">
					Select Chat
				</h2>
				<div className="flex flex-col space-y-2">
					{chats.map((chat) => (
						<div
							key={chat.id}
							className={`flex items-center gap-2 p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${
								chat.id === currentChatId ? "bg-gray-200 dark:bg-gray-700" : ""
							}`}
						>
							<button
								onClick={() => {
									onChatSelect(chat.id);
									onClose();
								}}
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
								onClick={() => onRemoveChat(chat.id)}
								className="p-2 text-black dark:text-white hover:text-red-700 transition-colors"
							>
								<Trash size={20} />
							</button>
						</div>
					))}
				</div>
				<button
					onClick={onClose}
					className="mt-4 w-full p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
				>
					Close
				</button>
			</div>
		</div>
	);
}
