export type MessageStatus = "sending" | "sent" | "error";

export type MessageDirection = "incoming" | "outgoing";

export type Message = {
  id: string;
  text: string;
  timestamp: number;
  direction: MessageDirection;
  status: MessageStatus;
};

export type Chat = {
  id: string;
  name: string;
  phoneNumber: string;
  messages: Message[];
  unread: number;
  lastMessage?: string;
  lastTimestamp?: number;
};
