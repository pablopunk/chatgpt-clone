import ChatArea from "@/components/ChatArea";
import SettingsModal from "@/components/SettingsModal";
import Sidebar from "@/components/Sidebar";
import type { Chat, ChatState, Message } from "@/types";
import { nanoid } from "nanoid";
import OpenAI from "openai";
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

	const handleSendMessage = async (content: string, type: "text" | "image") => {
		if (!state.apiKey || !currentChat) {
			setSettingsError("API key is required to send messages.");
			setIsSettingsModalOpen(true);
			return;
		}

		const openai = new OpenAI({
			apiKey: state.apiKey,
			dangerouslyAllowBrowser: true,
		});

		const newMessage: Message = {
			role: "user",
			content,
			type,
		};

		// Create a temporary ID for the assistant's message
		const assistantMessageId = nanoid();

		// Update state with user message and prepare for assistant's response
		setState((prev) => ({
			...prev,
			chats: prev.chats.map((chat) =>
				chat.id === currentChat.id
					? {
							...chat,
							messages: [
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

			// Define function for image generation
			const functions =
				type === "image"
					? [
							{
								name: "generate_image",
								description: "Generates an image based on the conversation",
								parameters: {
									type: "object",
									properties: {
										prompt: {
											type: "string",
											description: "The prompt for the image generation",
										},
									},
									required: ["prompt"],
								},
							},
						]
					: undefined;

			const completion = await openai.chat.completions.create({
				model: currentChat.model === "gpt-4o" ? "gpt-4" : "gpt-3.5-turbo",
				messages: apiMessages,
				functions,
				function_call:
					type === "image" ? { name: "generate_image" } : undefined,
				stream: type === "text",
			});

			if (type === "image") {
				const functionCall = completion.choices[0].message?.function_call;
				if (functionCall && functionCall.name === "generate_image") {
					const functionArgs = JSON.parse(functionCall.arguments || "{}");
					const imagePrompt = functionArgs.prompt || content;

					// Call the image generation API
					const response = await openai.images.generate({
						prompt: imagePrompt,
						n: 1,
						size:
							currentChat.imageModel === "dall-e-3" ? "1024x1024" : "512x512",
						model: currentChat.imageModel,
					});

					const openaiImageUrl = response.data[0].url;

					// Upload the image to ImageKit via your API endpoint
					const uploadResponse = await fetch("/api/images/upload", {
						method: "POST",
						body: JSON.stringify({ imageUrl: openaiImageUrl }),
					});

					const jsonResponse = await uploadResponse.json();
					const imageUrl = jsonResponse.url;

					// Update the assistant's message with the new ImageKit URL
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
														content: "Here's your generated image:",
														imageUrl: imageUrl,
														type,
													}
												: msg,
										),
									}
								: chat,
						),
					}));
				}
			} else {
				// Handle streaming text response
				const stream = completion;

				let streamedContent = "";

				for await (const chunk of stream) {
					const content = chunk.choices[0]?.delta?.content || "";
					streamedContent += content;

					setState((prev) => ({
						...prev,
						chats: prev.chats.map((chat) =>
							chat.id === currentChat.id
								? {
										...chat,
										messages: chat.messages.map((msg) =>
											msg.id === assistantMessageId
												? { ...msg, content: streamedContent, type }
												: msg,
										),
									}
								: chat,
						),
					}));
				}
			}
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

	// Add theme state
	const [theme, setTheme] = React.useState<"light" | "dark" | "system">(
		"system",
	);

	// Load theme from localStorage on mount
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

	// Apply theme to document root
	React.useEffect(() => {
		const root = document.documentElement;

		// Remove all theme classes
		root.classList.remove("light", "dark");

		if (theme === "light") {
			root.classList.add("light");
		} else if (theme === "dark") {
			root.classList.add("dark");
		} else {
			// 'system' preference
			const systemDark = window.matchMedia(
				"(prefers-color-scheme: dark)",
			).matches;
			root.classList.add(systemDark ? "dark" : "light");
		}

		// Save theme to localStorage
		localStorage.setItem("theme", theme);
	}, [theme]);

	const handleRemoveChat = (chatId: string) => {
		setState((prev) => ({
			...prev,
			chats: prev.chats.filter((chat) => chat.id !== chatId),
			currentChatId: prev.currentChatId === chatId ? null : prev.currentChatId,
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
