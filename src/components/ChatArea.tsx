import {
	Copy,
	Edit2,
	Image,
	MessageSquare,
	Plus,
	Send,
	Trash2,
} from "lucide-react";
import React from "react";
import ReactMarkdown from "react-markdown";
import SyntaxHighlighter from "react-syntax-highlighter";
import docco from "react-syntax-highlighter/dist/cjs/styles/hljs/docco";
import vs2015 from "react-syntax-highlighter/dist/cjs/styles/hljs/vs2015";
import type { Chat } from "../types";

interface ChatAreaProps {
	chat: Chat | null;
	chats: Chat[];
	onSendMessage: (
		content: string,
		type: "text" | "image",
		messageIndex?: number,
	) => void;
	onModelChange: (model: "gpt-4o" | "gpt-4o-mini") => void;
	onImageModelChange: (model: "dall-e-2" | "dall-e-3") => void;
	onNewChat: () => void;
	theme: "light" | "dark" | "system";
	onDeleteMessage: (messageIndex: number) => void;
	onEditMessage: (messageIndex: number) => void;
}

export default function ChatArea({
	chat,
	chats,
	onSendMessage,
	onModelChange,
	onImageModelChange,
	onNewChat,
	theme,
	onDeleteMessage,
	onEditMessage,
}: ChatAreaProps) {
	const [input, setInput] = React.useState("");
	const [isError, setIsError] = React.useState(false);
	const messagesEndRef = React.useRef<HTMLDivElement>(null);
	const [copySuccess, setCopySuccess] = React.useState("");
	const [clientChat, setClientChat] = React.useState<Chat | null>(null);
	const [clientChats, setClientChats] = React.useState<Chat[]>([]);
	const [editingMessageIndex, setEditingMessageIndex] = React.useState<
		number | null
	>(null);

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	};

	React.useEffect(() => {
		scrollToBottom();
	}, [clientChat?.messages]);

	React.useEffect(() => {
		setClientChat(chat);
		setClientChats(chats);
	}, [chat, chats]);

	const effectiveTheme = React.useMemo(() => {
		if (theme === "system" && typeof window !== "undefined") {
			const systemPrefersDark = window.matchMedia(
				"(prefers-color-scheme: dark)",
			).matches;
			return systemPrefersDark ? "dark" : "light";
		}
		return theme;
	}, [theme]);

	const handleCopy = (text: string) => {
		navigator.clipboard.writeText(text).then(
			() => setCopySuccess("Copied!"),
			() => setCopySuccess("Failed to copy!"),
		);
		setTimeout(() => setCopySuccess(""), 2000);
	};

	const handleDeleteMessage = (messageIndex: number) => {
		if (!clientChat) return;

		// Remove the message and its reply (if it exists)
		const newMessages = [
			...clientChat.messages.slice(0, messageIndex),
			...clientChat.messages.slice(messageIndex + 2),
		];

		setClientChat({
			...clientChat,
			messages: newMessages,
		});

		// Update parent state
		onDeleteMessage(messageIndex);
	};

	if (!clientChat) {
		return (
			<div className="flex-1 flex flex-col items-center justify-center">
				{clientChats.length > 0 && (
					<p className="text-gray-600 dark:text-gray-400 mb-4">
						Select a chat from the list or
					</p>
				)}
				<button
					type="button"
					onClick={onNewChat}
					className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center gap-2"
				>
					<Plus size={20} />
					New Chat
				</button>
			</div>
		);
	}

	const handleSubmit = (type: "text" | "image") => {
		if (!input.trim()) {
			setIsError(true);
			return;
		}
		setIsError(false);
		onSendMessage(input, type, editingMessageIndex ?? undefined);
		setInput("");
		setEditingMessageIndex(null);
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setInput(e.target.value);
		if (isError) setIsError(false);
	};

	const displayMessages = clientChat.messages.slice(1);

	return (
		<div className="flex-1 flex flex-col h-screen bg-white dark:bg-gray-900 md:h-auto">
			<div className="p-4 border-b border-gray-200 dark:border-gray-700 flex gap-2 justify-between md:justify-end">
				<div className="flex items-center gap-2">
					<MessageSquare
						size={20}
						className="text-gray-600 dark:text-gray-400"
					/>
					<select
						value={clientChat.model}
						onChange={(e) =>
							onModelChange(e.target.value as "gpt-4o" | "gpt-4o-mini")
						}
						className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md px-2 py-1 text-black dark:text-white"
					>
						<option value="gpt-4o">🧠 GPT-4o</option>
						<option value="gpt-4o-mini">⚡ GPT-4o mini</option>
					</select>
				</div>

				<div className="flex items-center gap-2">
					<Image size={20} className="text-gray-600 dark:text-gray-400" />
					<select
						value={clientChat.imageModel}
						onChange={(e) =>
							onImageModelChange(e.target.value as "dall-e-2" | "dall-e-3")
						}
						className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md px-2 py-1 text-black dark:text-white"
					>
						<option value="dall-e-3">🧠 DALL-E 3</option>
						<option value="dall-e-2">⚡ DALL-E 2</option>
					</select>
				</div>
			</div>

			<div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-100 dark:bg-gray-900">
				{displayMessages.map((message, index) => (
					<div
						key={`${message.role}-${message.content?.substring(0, 10)}-${index}`}
						className={`flex ${
							message.role === "assistant" ? "justify-start" : "justify-end"
						}`}
					>
						<div
							className={`max-w-[80%] p-3 rounded-lg relative group ${
								message.role === "assistant"
									? "bg-gray-200 dark:bg-gray-700 text-black dark:text-white"
									: "bg-blue-500 text-white"
							} ${editingMessageIndex === index + 1 ? "opacity-50 blur-[2px]" : ""}`}
						>
							{message.role === "user" && (
								<div className="absolute left-0 top-0 -ml-12 flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
									<button
										type="button"
										onClick={() => {
											setInput(message.content);
											setEditingMessageIndex(index + 1);
											const inputElement = document.querySelector(
												'input[type="text"]',
											) as HTMLInputElement;
											if (inputElement) {
												inputElement.focus();
											}
										}}
										className="p-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
										title="Edit message"
									>
										<Edit2 size={16} />
									</button>
									<button
										type="button"
										onClick={() => handleDeleteMessage(index + 1)}
										className="p-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
										title="Delete message"
									>
										<Trash2 size={16} />
									</button>
								</div>
							)}
							{message.imageUrl ? (
								<img
									src={message.imageUrl}
									alt="Generated"
									className="rounded-lg max-w-full h-auto"
								/>
							) : message.content ? (
								<div
									id={`message-${index}`}
									contentEditable={false}
									onBlur={(e) => {
										e.currentTarget.contentEditable = "false";
										const newContent = e.currentTarget.textContent;
										if (newContent && newContent !== message.content) {
											onEditMessage(index + 1);
										}
									}}
									onKeyDown={(e) => {
										if (e.key === "Enter" && !e.shiftKey) {
											e.preventDefault();
											e.currentTarget.blur();
										}
									}}
									className="outline-none whitespace-pre-wrap"
								>
									{message.content}
								</div>
							) : (
								<div className={message.type === "image" ? "loading-neon" : ""}>
									{message.type === "image"
										? "✨ Generating image... ✨"
										: "..."}
								</div>
							)}
						</div>
					</div>
				))}
				<div ref={messagesEndRef} />
			</div>

			<div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
				<div className="flex items-center gap-2">
					<div className="flex-1 relative">
						{editingMessageIndex !== null && (
							<div className="absolute -top-6 left-0 text-sm text-gray-500 dark:text-gray-400">
								Editing message...
							</div>
						)}
						<input
							type="text"
							value={input}
							onChange={handleInputChange}
							onKeyPress={(e) => e.key === "Enter" && handleSubmit("text")}
							placeholder={isError ? "Empty message" : "Type your message..."}
							className={`w-full p-2 border rounded-md bg-gray-100 dark:bg-gray-700 text-black dark:text-white ${
								isError
									? "border-red-500 placeholder-red-500"
									: "border-gray-300 dark:border-gray-600"
							}`}
						/>
					</div>
					<button
						type="button"
						title="Generate image"
						onClick={() => handleSubmit("image")}
						className="p-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors"
					>
						<Image size={20} />
					</button>
					<button
						type="button"
						title="Send message"
						onClick={() => handleSubmit("text")}
						className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
					>
						<Send size={20} />
					</button>
				</div>
			</div>
		</div>
	);
}
