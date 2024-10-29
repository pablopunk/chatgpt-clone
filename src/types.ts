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
  createdAt: number;
}