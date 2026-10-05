import type { ChangeEvent } from "react";
import type { Chat } from "../types";

type ChatListProps = {
  chats: Chat[];
  activeChatId: string | null;
  onSelect: (chatId: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
  onNewChat: () => void;
};

const formatTime = (timestamp?: number): string => {
  if (!timestamp) return "";

  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(timestamp);
};

export function ChatList({
  chats,
  activeChatId,
  onSelect,
  search,
  onSearchChange,
  onNewChat,
}: ChatListProps) {
  const query = search.trim().toLowerCase();

  const filteredChats: Chat[] = chats.filter((chat: Chat) => {
    if (!query) return true;

    return (
      chat.name.toLowerCase().includes(query) ||
      chat.phoneNumber.includes(query) ||
      Boolean(chat.lastMessage?.toLowerCase().includes(query))
    );
  });

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>): void => {
    onSearchChange(event.target.value);
  };

  return (
    <section className="flex h-full min-h-0 min-w-0 flex-col bg-white">
      <header className="shrink-0 border-b border-[#edf0f2] p-[clamp(0.55rem,1.6vw,0.8rem)]">
        <div className="flex items-center gap-2">
          <input
            type="search"
            value={search}
            onChange={handleSearchChange}
            placeholder="Search"
            aria-label="Search chats"
            className="h-10 min-w-0 flex-1 rounded-[0.75rem] border-0 bg-[#f1f3f5] px-[clamp(0.7rem,2vw,0.9rem)] text-[0.88rem] text-[#222] outline-none placeholder:text-[#899198] focus:bg-[#eceef0]"
          />
          <button
            type="button"
            onClick={onNewChat}
            className="grid size-10 shrink-0 place-items-center rounded-[0.75rem] border-0 bg-[#3390ec] text-[1.25rem] font-normal leading-none text-white transition hover:bg-[#2f87d7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3390ec]/40"
            aria-label="New chat"
          >
            +
          </button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-1">
        {filteredChats.length > 0 ? (
          filteredChats.map((chat: Chat) => {
            const active: boolean = chat.id === activeChatId;

            return (
              <button
                key={chat.id}
                type="button"
                onClick={() => onSelect(chat.id)}
                className={`flex w-full min-w-0 items-center gap-3 rounded-[0.8rem] border-0 px-2.5 py-2.5 text-left transition ${
                  active
                    ? "bg-[#e8f1fa]"
                    : "bg-transparent hover:bg-[#f3f4f5] focus-visible:bg-[#f3f4f5]"
                }`}
              >
                <img
                  src="/avatar-user.png"
                  alt=""
                  className="size-[clamp(2.7rem,10vw,3rem)] shrink-0 rounded-full object-cover"
                />

                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <strong className="min-w-0 flex-1 truncate text-[0.9rem] font-semibold text-[#222]">
                      {chat.name}
                    </strong>
                    <span className="shrink-0 text-[0.7rem] text-[#8a9198]">
                      {formatTime(chat.lastTimestamp)}
                    </span>
                  </span>

                  <span className="mt-1 flex items-center gap-2">
                    <span className="min-w-0 flex-1 truncate text-[0.8rem] text-[#8a9198]">
                      {chat.lastMessage ?? chat.phoneNumber}
                    </span>
                    {chat.unread > 0 ? (
                      <span className="grid size-5 shrink-0 place-items-center rounded-full bg-[#3390ec] px-1 text-[0.68rem] font-semibold text-white">
                        {chat.unread}
                      </span>
                    ) : null}
                  </span>
                </span>
              </button>
            );
          })
        ) : (
          <div className="px-4 py-12 text-center text-[0.82rem] text-[#8a9198]">
            No chats found
          </div>
        )}
      </div>
    </section>
  );
}
