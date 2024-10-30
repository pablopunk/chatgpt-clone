export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  imageUrl?: string;
  id?: string;
  type?: 'text' | 'image';
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  model: 'gpt-4o' | 'gpt-4o-mini';
  imageModel: 'dall-e-2' | 'dall-e-3';
  createdAt: number;
}

export interface ChatState {
  chats: Chat[];
  currentChatId: string | null;
  apiKey: string | null;
}