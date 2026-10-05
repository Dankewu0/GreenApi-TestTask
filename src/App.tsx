import { useCallback, useEffect, useRef, useState } from "react";

import {
  greenApi,
  type GreenApiConfig,
  type ReceiveNotificationResponse,
} from "./api/greenApi";

import { ChatList } from "./components/ChatList";
import { ChatView } from "./components/ChatView";
import { ConnectionForm } from "./components/ConnectionForm";
import { NewChatDialog } from "./components/NewChatDialog";
import { SettingsDialog } from "./components/SettingsDialog";
import SideBar from "./components/SideBar";
import type { Chat, Message } from "./types";

const createId = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;

const formatPhone = (value: number | string): string =>
  String(value).replace(/\D/g, "");

const createTestChat = (): Chat => {
  const timestamp = Date.now();

  return {
    id: "test",
    name: "test",
    phoneNumber: "",
    messages: [
      {
        id: "test-message-1",
        text: "Приветствую, это тестовый чат",
        timestamp,
        direction: "incoming",
        status: "sent",
      },
    ],
    unread: 0,
    lastMessage: "Приветствую, это тестовый чат",
    lastTimestamp: timestamp,
  };
};

export default function App() {
  const [config, setConfig] = useState<GreenApiConfig | null>(null);
  const [instanceState, setInstanceState] = useState<string>("");
  const [connectionError, setConnectionError] = useState<string>("");
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [search, setSearch] = useState<string>("");
  const [isNewChatOpen, setIsNewChatOpen] = useState<boolean>(false);
  const [newChatError, setNewChatError] = useState<string>("");
  const [isCreatingChat, setIsCreatingChat] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [settingsError, setSettingsError] = useState<string>("");

  const pollAbortRef = useRef<AbortController | null>(null);
  const pollRunRef = useRef<number>(0);
  const configRef = useRef<GreenApiConfig | null>(null);
  const activeChatIdRef = useRef<string | null>(null);

  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  useEffect(() => {
    setChats((current) => {
      if (current.some((chat) => chat.id === "test")) {
        return current;
      }

      return [createTestChat(), ...current];
    });
  }, []);

  const disconnect = useCallback((): void => {
    pollRunRef.current += 1;
    pollAbortRef.current?.abort();
    pollAbortRef.current = null;
    configRef.current = null;
    setConfig(null);
    setInstanceState("");
    setConnectionError("");
    setSettingsError("");
    setIsSettingsOpen(false);
    setChats([createTestChat()]);
    setActiveChatId(null);
  }, []);

  const handleIncoming = useCallback(
    (notification: ReceiveNotificationResponse): void => {
      const body = notification.body;

      if (body.typeWebhook !== "incomingMessageReceived") return;
      if (body.messageData?.typeMessage !== "textMessage") return;

      const text: string | undefined =
        body.messageData.textMessageData?.textMessage?.trim();
      const chatId: string | undefined = body.senderData?.chatId?.trim();

      if (!text || !chatId) return;

      const timestamp: number =
        (body.timestamp ?? Math.floor(Date.now() / 1000)) * 1000;
      const name: string =
        body.senderData?.chatName?.trim() ||
        body.senderData?.senderName?.trim() ||
        (body.senderData?.senderPhoneNumber
          ? formatPhone(body.senderData.senderPhoneNumber)
          : chatId);
      const phoneNumber: string = body.senderData?.senderPhoneNumber
        ? formatPhone(body.senderData.senderPhoneNumber)
        : "";

      const message: Message = {
        id: body.idMessage ?? createId(),
        text,
        timestamp,
        direction: "incoming",
        status: "sent",
      };

      setChats((current: Chat[]): Chat[] => {
        const existing: Chat | undefined = current.find(
          (chat: Chat): boolean => chat.id === chatId,
        );

        if (!existing) {
          return [
            {
              id: chatId,
              name,
              phoneNumber,
              messages: [message],
              unread: activeChatIdRef.current === chatId ? 0 : 1,
              lastMessage: text,
              lastTimestamp: timestamp,
            },
            ...current,
          ];
        }

        const alreadyExists: boolean = existing.messages.some(
          (item: Message): boolean => item.id === message.id,
        );

        if (alreadyExists) return current;

        const nextUnread: number =
          activeChatIdRef.current === chatId ? 0 : existing.unread + 1;

        return [
          {
            ...existing,
            name: existing.name || name,
            phoneNumber: existing.phoneNumber || phoneNumber,
            messages: [...existing.messages, message],
            unread: nextUnread,
            lastMessage: text,
            lastTimestamp: timestamp,
          },
          ...current.filter((item: Chat): boolean => item.id !== chatId),
        ];
      });
    },
    [],
  );

  const startPolling = useCallback(
    (nextConfig: GreenApiConfig): void => {
      pollRunRef.current += 1;
      const runId: number = pollRunRef.current;
      pollAbortRef.current?.abort();

      const controller: AbortController = new AbortController();
      pollAbortRef.current = controller;

      void (async (): Promise<void> => {
        while (runId === pollRunRef.current && !controller.signal.aborted) {
          try {
            const notification: ReceiveNotificationResponse | null =
              await greenApi.receiveNotification(
                nextConfig,
                30,
                controller.signal,
              );

            if (!notification) continue;

            try {
              handleIncoming(notification);
            } finally {
              await greenApi.deleteNotification(
                nextConfig,
                notification.receiptId,
                controller.signal,
              );
            }
          } catch (error: unknown) {
            if (controller.signal.aborted || runId !== pollRunRef.current) {
              break;
            }

            setConnectionError(
              error instanceof Error
                ? error.message
                : "Receiving messages failed",
            );

            await new Promise<void>((resolve) => {
              window.setTimeout(resolve, 1500);
            });
          }
        }
      })();
    },
    [handleIncoming],
  );

  const connect = useCallback(
    async (nextConfig: GreenApiConfig): Promise<void> => {
      setIsConnecting(true);
      setConnectionError("");
      setSettingsError("");

      try {
        const result = await greenApi.getState(nextConfig);
        const state: string = result.stateInstance ?? "unknown";

        if (state !== "authorized") {
          throw new Error(`Instance is not authorized: ${state}`);
        }

        setConfig(nextConfig);
        configRef.current = nextConfig;
        setInstanceState(state);
        setIsSettingsOpen(false);

        setChats((current) => {
          if (current.some((chat) => chat.id === "test")) {
            return current;
          }

          return [createTestChat(), ...current];
        });

        startPolling(nextConfig);
      } catch (error: unknown) {
        const message: string =
          error instanceof Error ? error.message : "Connection failed";

        setConnectionError(message);
        setSettingsError(message);
        throw error;
      } finally {
        setIsConnecting(false);
      }
    },
    [startPolling],
  );

  const createChat = useCallback(async (value: string): Promise<void> => {
    const currentConfig = configRef.current;

    if (!currentConfig) {
      return;
    }

    setIsCreatingChat(true);
    setNewChatError("");

    try {
      const normalized = value.trim();

      if (!normalized) {
        throw new Error("Enter a username or phone number.");
      }

      const isUsername = normalized.startsWith("@");

      if (isUsername) {
        const username = normalized.replace(/^@+/, "").trim();

        if (!username) {
          throw new Error("Enter a valid Telegram username.");
        }

        const chatId = `@${username}`;

        setChats((current) => {
          if (current.some((chat) => chat.id === chatId)) {
            return current;
          }

          return [
            {
              id: chatId,
              name: `@${username}`,
              phoneNumber: "",
              messages: [],
              unread: 0,
            },
            ...current,
          ];
        });

        setActiveChatId(chatId);
        activeChatIdRef.current = chatId;
        setIsNewChatOpen(false);

        return;
      }

      const phoneNumber = normalized.replace(/\D/g, "");

      if (!phoneNumber) {
        throw new Error("Enter a valid phone number.");
      }

      const result = await greenApi.checkAccount(
        currentConfig,
        Number(phoneNumber),
      );

      if (result.status === false) {
        throw new Error(
          result.reason || "GREEN-API could not check this number.",
        );
      }

      if (!result.exist || !result.chatId) {
        throw new Error("No Telegram account was found for this phone number.");
      }

      const chatId = result.chatId;
      const name =
        result.username || result.phoneNumber?.toString() || phoneNumber;

      setChats((current) => {
        if (current.some((chat) => chat.id === chatId)) {
          return current;
        }

        return [
          {
            id: chatId,
            name,
            phoneNumber,
            messages: [],
            unread: 0,
          },
          ...current,
        ];
      });

      setActiveChatId(chatId);
      activeChatIdRef.current = chatId;
      setIsNewChatOpen(false);
    } catch (error: unknown) {
      setNewChatError(
        error instanceof Error ? error.message : "Could not create chat",
      );
    } finally {
      setIsCreatingChat(false);
    }
  }, []);

  const sendMessage = useCallback(async (text: string): Promise<void> => {
    const currentConfig: GreenApiConfig | null = configRef.current;
    const chatId: string | null = activeChatIdRef.current;

    if (!currentConfig || !chatId) return;

    const now: number = Date.now();
    const optimisticId: string = createId();

    const optimisticMessage: Message = {
      id: optimisticId,
      text,
      timestamp: now,
      direction: "outgoing",
      status: "sending",
    };

    setChats((current: Chat[]): Chat[] =>
      current.map((chat: Chat): Chat =>
        chat.id === chatId
          ? {
              ...chat,
              messages: [...chat.messages, optimisticMessage],
              lastMessage: text,
              lastTimestamp: now,
            }
          : chat,
      ),
    );

    if (chatId === "test") {
      setChats((current: Chat[]): Chat[] =>
        current.map((chat: Chat): Chat =>
          chat.id === chatId
            ? {
                ...chat,
                messages: chat.messages.map((message: Message): Message =>
                  message.id === optimisticId
                    ? {
                        ...message,
                        status: "sent",
                      }
                    : message,
                ),
              }
            : chat,
        ),
      );

      return;
    }

    try {
      const result = await greenApi.sendMessage(currentConfig, chatId, text);

      setChats((current: Chat[]): Chat[] =>
        current.map((chat: Chat): Chat =>
          chat.id === chatId
            ? {
                ...chat,
                messages: chat.messages.map((message: Message): Message =>
                  message.id === optimisticId
                    ? {
                        ...message,
                        id: result.idMessage ?? optimisticId,
                        status: "sent",
                      }
                    : message,
                ),
              }
            : chat,
        ),
      );
    } catch (error: unknown) {
      setChats((current: Chat[]): Chat[] =>
        current.map((chat: Chat): Chat =>
          chat.id === chatId
            ? {
                ...chat,
                messages: chat.messages.map((message: Message): Message =>
                  message.id === optimisticId
                    ? { ...message, status: "error" }
                    : message,
                ),
              }
            : chat,
        ),
      );

      setConnectionError(
        error instanceof Error ? error.message : "Message sending failed",
      );
    }
  }, []);

  const activeChat: Chat | null =
    chats.find((chat: Chat): boolean => chat.id === activeChatId) ?? null;

  const selectChat = (chatId: string): void => {
    activeChatIdRef.current = chatId;
    setActiveChatId(chatId);
    setChats((current: Chat[]): Chat[] =>
      current.map((chat: Chat): Chat =>
        chat.id === chatId ? { ...chat, unread: 0 } : chat,
      ),
    );
  };

  const handleReconnect = async (nextConfig: GreenApiConfig): Promise<void> => {
    try {
      await connect(nextConfig);
    } catch {
      return;
    }
  };

  useEffect(() => {
    return (): void => {
      pollRunRef.current += 1;
      pollAbortRef.current?.abort();
    };
  }, []);

  if (!config) {
    return (
      <ConnectionForm
        onConnect={connect}
        isConnecting={isConnecting}
        error={connectionError}
      />
    );
  }

  return (
    <main className="grid h-dvh min-h-0 min-w-0 grid-cols-[minmax(17rem,32vw)_minmax(0,1fr)] overflow-hidden bg-[#e8edf1]">
      <aside className="flex min-h-0 min-w-0 flex-col bg-white">
        <SideBar
          onSettings={() => {
            setSettingsError("");
            setIsSettingsOpen(true);
          }}
          connected={Boolean(config)}
          onDisconnect={disconnect}
        />

        <ChatList
          chats={chats}
          activeChatId={activeChatId}
          onSelect={selectChat}
          search={search}
          onSearchChange={setSearch}
          onNewChat={() => {
            setNewChatError("");
            setIsNewChatOpen(true);
          }}
        />
      </aside>

      <ChatView chat={activeChat} onSend={sendMessage} />

      <NewChatDialog
        isOpen={isNewChatOpen}
        isCreating={isCreatingChat}
        error={newChatError}
        onClose={() => setIsNewChatOpen(false)}
        onCreate={createChat}
      />

      <SettingsDialog
        isOpen={isSettingsOpen}
        config={config}
        state={instanceState}
        error={settingsError}
        onClose={() => setIsSettingsOpen(false)}
        onReconnect={handleReconnect}
        onDisconnect={disconnect}
      />
    </main>
  );
}
