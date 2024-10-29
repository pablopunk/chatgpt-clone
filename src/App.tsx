import React from 'react';
import { nanoid } from 'nanoid';
import OpenAI from 'openai';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import { Chat, ChatState, Message } from './types';

const STORAGE_KEY = 'chatgpt-client-state';

const initialState: ChatState = {
  chats: [],
  currentChatId: null,
  apiKey: null,
};

function App() {
  const [state, setState] = React.useState<ChatState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : initialState;
  });

  React.useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const currentChat = state.chats.find((chat) => chat.id === state.currentChatId);

  const createNewChat = () => {
    const newChat: Chat = {
      id: nanoid(),
      title: 'New Chat',
      messages: [{
        role: 'system',
        content: 'You are a helpful assistant.'
      }],
      model: 'gpt-4o',
      createdAt: Date.now(),
    };

    setState((prev) => ({
      ...prev,
      chats: [newChat, ...prev.chats],
      currentChatId: newChat.id,
    }));
  };

  const handleSendMessage = async (content: string, type: 'text' | 'image') => {
    if (!state.apiKey || !currentChat) return;

    const openai = new OpenAI({
      apiKey: state.apiKey,
      dangerouslyAllowBrowser: true,
    });

    const newMessage: Message = {
      role: 'user',
      content,
    };

    // Create a temporary ID for the assistant's message
    const assistantMessageId = nanoid();

    // Update state with user message and prepare for streaming
    setState((prev) => ({
      ...prev,
      chats: prev.chats.map((chat) =>
        chat.id === currentChat.id
          ? {
              ...chat,
              messages: [
                ...chat.messages,
                newMessage,
                // Add empty assistant message that will be streamed
                { role: 'assistant', content: '', id: assistantMessageId, type }
              ],
              title: chat.messages.length === 1 ? content.slice(0, 30) : chat.title,
            }
          : chat
      ),
    }));

    try {
      if (type === 'image') {
        const response = await openai.images.generate({
          model: 'dall-e-3',
          prompt: content,
          n: 1,
          size: '1024x1024',
        });

        setState((prev) => ({
          ...prev,
          chats: prev.chats.map((chat) =>
            chat.id === currentChat.id
              ? {
                  ...chat,
                  messages: chat.messages.map((msg) =>
                    msg.id === assistantMessageId
                      ? {
                          role: 'assistant',
                          content: 'Here\'s your generated image:',
                          imageUrl: response.data[0].url,
                          id: assistantMessageId,
                          type,
                        }
                      : msg
                  ),
                }
              : chat
          ),
        }));
      } else {
        const apiMessages = currentChat.messages.map(({ role, content }) => ({
          role,
          content,
        }));

        apiMessages.push({ role: 'user', content });

        const stream = await openai.chat.completions.create({
          model: currentChat.model === 'gpt-4o' ? 'gpt-4' : 'gpt-3.5-turbo',
          messages: apiMessages,
          stream: true,
        });

        let streamedContent = '';

        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || '';
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
                        : msg
                    ),
                  }
                : chat
            ),
          }));
        }
      }
    } catch (error) {
      console.error('Error:', error);
      
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
                        content: 'Sorry, there was an error processing your request. Please try again.',
                        type,
                      }
                    : msg
                ),
              }
            : chat
        ),
      }));
    }
  };

  const handleModelChange = (model: 'gpt-4o' | 'gpt-4o-mini') => {
    if (!currentChat) return;

    setState((prev) => ({
      ...prev,
      chats: prev.chats.map((chat) =>
        chat.id === currentChat.id ? { ...chat, model } : chat
      ),
    }));
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-100">
      <Sidebar
        chats={state.chats}
        currentChatId={state.currentChatId}
        onChatSelect={(id) => setState((prev) => ({ ...prev, currentChatId: id }))}
        onNewChat={createNewChat}
        onApiKeyUpdate={(apiKey) => setState((prev) => ({ ...prev, apiKey }))}
        apiKey={state.apiKey}
      />
      <ChatArea
        chat={currentChat}
        onSendMessage={handleSendMessage}
        onModelChange={handleModelChange}
      />
    </div>
  );
}

export default App;