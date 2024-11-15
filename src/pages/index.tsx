import ChatArea from "@/components/ChatArea";
import SettingsModal from "@/components/SettingsModal";
import Sidebar from "@/components/Sidebar";
import type { Chat, ChatState, Message } from "@/types";
import { nanoid } from "nanoid";
import React from "react";

const STORAGE_KEY = "chatgpt-client-state";

const initialState: ChatState = {
	chats: [],
	currentChatId: null,
	apiKey: null,
};

function App() {
	const [state, setState] = React.useState<ChatState>(() => {
		if (typeof window !== "undefined") {
			const saved = localStorage.getItem(STORAGE_KEY);
			return saved ? JSON.parse(saved) : initialState;
		}
		return initialState;
	});

	const [isSettingsModalOpen, setIsSettingsModalOpen] = React.useState(false);
	const [settingsError, setSettingsError] = React.useState("");

	React.useEffect(() => {
		if (typeof window !== "undefined") {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
		}
	}, [state]);

	const currentChat =
		state.chats.find((chat) => chat.id === state.currentChatId) || null;

	const createNewChat = (setAsCurrent = true) => {
		if (!state.apiKey) {
			setSettingsError("API key is required to create a new chat.");
			setIsSettingsModalOpen(true);
			return;
		}

		const newChat: Chat = {
			id: nanoid(),
			title: "New Chat",
			messages: [
				{
					role: "system",
					content:
						"You are a helpful assistant. Be brief. Be concise. Be right.",
				},
			],
			model: "gpt-4o",
			imageModel: "dall-e-3",
			createdAt: Date.now(),
		};

		setState((prev) => ({
			...prev,
			chats: [newChat, ...prev.chats],
			currentChatId: setAsCurrent ? newChat.id : prev.currentChatId,
		}));
	};

	const handleSendMessage = async (
		content: string,
		type: "text" | "image",
		messageIndex?: number,
	) => {
		if (!state.apiKey || !currentChat) {
			setSettingsError("API key is required to send messages.");
			setIsSettingsModalOpen(true);
			return;
		}

		const newMessage: Message = {
			role: "user",
			content,
			type,
		};

		const assistantMessageId = nanoid();

		setState((prev) => ({
			...prev,
			chats: prev.chats.map((chat) =>
				chat.id === currentChat.id
					? {
							...chat,
							messages:
								messageIndex !== undefined
									? [
											...chat.messages.slice(0, messageIndex),
											newMessage,
											{
												role: "assistant",
												content: "",
												id: assistantMessageId,
												type,
											},
										]
									: [
											...chat.messages,
											newMessage,
											{
												role: "assistant",
												content: "",
												id: assistantMessageId,
												type,
											},
										],
							title:
								chat.messages.length === 1 ? content.slice(0, 30) : chat.title,
						}
					: chat,
			),
		}));

		try {
			const apiMessages = currentChat.messages.map(({ role, content }) => ({
				role,
				content,
			}));

			apiMessages.push({ role: "user", content });

			const response = await fetch("/api/chat", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					messages: apiMessages,
					model: currentChat.model === "gpt-4o" ? "gpt-4" : "gpt-3.5-turbo",
					imageModel: currentChat.imageModel,
					type,
					openaiApiKey: state.apiKey,
				}),
			});

			const data = await response.json();

			if (!response.ok) {
				console.error("Error:", data);
				throw new Error(data.error || "Failed to get response");
			}

			setState((prev) => ({
				...prev,
				chats: prev.chats.map((chat) =>
					chat.id === currentChat.id
						? {
								...chat,
								messages: chat.messages.map((msg) =>
									msg.id === assistantMessageId
										? {
												...msg,
												content: data.content,
												imageUrl: data.imageUrl,
												type: data.type,
											}
										: msg,
								),
							}
						: chat,
				),
			}));
		} catch (error) {
			console.error("Error:", error);

			setState((prev) => ({
				...prev,
				chats: prev.chats.map((chat) =>
					chat.id === currentChat.id
						? {
								...chat,
								messages: chat.messages.map((msg) =>
									msg.id === assistantMessageId
										? {
												...msg,
												content:
													"Sorry, there was an error processing your request. Please try again.",
												type,
											}
										: msg,
								),
							}
						: chat,
				),
			}));
		}
	};

	const handleModelChange = (model: "gpt-4o" | "gpt-4o-mini") => {
		if (!currentChat) return;

		setState((prev) => ({
			...prev,
			chats: prev.chats.map((chat) =>
				chat.id === currentChat.id ? { ...chat, model } : chat,
			),
		}));
	};

	const handleImageModelChange = (imageModel: "dall-e-2" | "dall-e-3") => {
		if (!currentChat) return;

		setState((prev) => ({
			...prev,
			chats: prev.chats.map((chat) =>
				chat.id === currentChat.id ? { ...chat, imageModel } : chat,
			),
		}));
	};

	const [theme, setTheme] = React.useState<"light" | "dark" | "system">(
		"system",
	);

	React.useEffect(() => {
		const savedTheme = localStorage.getItem("theme") as
			| "light"
			| "dark"
			| "system"
			| null;
		if (savedTheme) {
			setTheme(savedTheme);
		}
	}, []);

	React.useEffect(() => {
		const root = document.documentElement;

		root.classList.remove("light", "dark");

		if (theme === "light") {
			root.classList.add("light");
		} else if (theme === "dark") {
			root.classList.add("dark");
		} else {
			const systemDark = window.matchMedia(
				"(prefers-color-scheme: dark)",
			).matches;
			root.classList.add(systemDark ? "dark" : "light");
		}

		localStorage.setItem("theme", theme);
	}, [theme]);

	const handleRemoveChat = (chatId: string) => {
		setState((prev) => ({
			...prev,
			chats: prev.chats.filter((chat) => chat.id !== chatId),
			currentChatId: prev.currentChatId === chatId ? null : prev.currentChatId,
		}));
	};

	const handleDeleteMessage = (messageIndex: number) => {
		if (!currentChat) return;

		setState((prev) => ({
			...prev,
			chats: prev.chats.map((chat) =>
				chat.id === currentChat.id
					? {
							...chat,
							messages: [
								...chat.messages.slice(0, messageIndex),
								...chat.messages.slice(messageIndex + 2),
							],
						}
					: chat,
			),
		}));
	};

	return (
		<div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900 md:flex-row">
			<Sidebar
				chats={state.chats}
				currentChatId={state.currentChatId}
				onChatSelect={(id) =>
					setState((prev) => ({ ...prev, currentChatId: id }))
				}
				onNewChat={() => createNewChat(true)}
				onApiKeyUpdate={(apiKey) => setState((prev) => ({ ...prev, apiKey }))}
				apiKey={state.apiKey}
				theme={theme}
				setTheme={setTheme}
				onRemoveChat={handleRemoveChat}
			/>
			<ChatArea
				chat={currentChat}
				chats={state.chats}
				onSendMessage={handleSendMessage}
				onModelChange={handleModelChange}
				onImageModelChange={handleImageModelChange}
				onNewChat={() => createNewChat(true)}
				theme={theme}
				onDeleteMessage={handleDeleteMessage}
				onEditMessage={(messageIndex: number) => {
					if (!currentChat) return;
					setState((prev) => ({
						...prev,
						chats: prev.chats.map((chat) =>
							chat.id === currentChat.id
								? {
										...chat,
										messages: chat.messages.slice(0, messageIndex),
									}
								: chat,
						),
					}));
				}}
			/>
			<SettingsModal
				isOpen={isSettingsModalOpen}
				onClose={() => setIsSettingsModalOpen(false)}
				apiKey={state.apiKey}
				onApiKeyUpdate={(apiKey: string) =>
					setState((prev) => ({ ...prev, apiKey }))
				}
				theme={theme}
				setTheme={setTheme}
				errorMessage={settingsError}
			/>
		</div>
	);
}

export default App;
