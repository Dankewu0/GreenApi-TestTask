import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import type { Chat, Message } from "../types";

type ChatViewProps = {
  chat: Chat | null;
  onSend: (text: string) => Promise<void>;
};

const formatMessageTime = (timestamp: number): string =>
  new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(timestamp);

export function ChatView({ chat, onSend }: ChatViewProps) {
  const [text, setText] = useState<string>("");
  const messagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesRef.current?.scrollTo({
      top: messagesRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [chat?.id, chat?.messages.length]);

  if (!chat) {
    return (
      <section className="grid min-h-0 flex-1 place-items-center bg-[#e8edf1]">
        <div className="rounded-[0.85rem] bg-white/80 px-5 py-3 text-[0.85rem] text-[#737d86] shadow-sm">
          Select a chat to start messaging
        </div>
      </section>
    );
  }

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();

    const value = text.trim();

    if (!value || value.length > 4096) return;

    setText("");
    await onSend(value);
  };

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col bg-[#e8edf1]">
      <header className="flex min-h-14 shrink-0 items-center border-b border-[#dce1e5] bg-white px-[clamp(0.75rem,2vw,1rem)]">
        <img
          src="/avatar-user.png"
          alt=""
          className="size-9 shrink-0 rounded-full object-cover"
        />
        <div className="ml-2.5 min-w-0">
          <h1 className="m-0 truncate text-[0.9rem] font-semibold text-[#222]">
            {chat.name}
          </h1>
          <p className="m-0 mt-0.5 truncate text-[0.74rem] text-[#8a9198]">
            {chat.phoneNumber}
          </p>
        </div>
      </header>

      <div
        ref={messagesRef}
        className="min-h-0 flex-1 overflow-y-auto px-[clamp(0.75rem,4vw,2.5rem)] py-4"
      >
        <div className="mx-auto flex w-full max-w-[52rem] flex-col gap-1.5">
          {chat.messages.map((message: Message) => {
            const outgoing: boolean = message.direction === "outgoing";

            return (
              <div
                key={message.id}
                className={`flex ${outgoing ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[min(78%,34rem)] rounded-[1rem] px-3 py-2 shadow-[0_1px_1px_rgba(0,0,0,0.04)] ${
                    outgoing
                      ? "rounded-br-[0.35rem] bg-[#d9fdd3] text-[#1f2b22]"
                      : "rounded-bl-[0.35rem] bg-white text-[#222]"
                  }`}
                >
                  <p className="m-0 whitespace-pre-wrap break-words text-[0.9rem] leading-5">
                    {message.text}
                  </p>
                  <div className="mt-1 text-right text-[0.65rem] text-[#7d878f]">
                    {formatMessageTime(message.timestamp)}
                    {outgoing && message.status === "sending"
                      ? " · sending"
                      : ""}
                    {outgoing && message.status === "error" ? " · failed" : ""}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="shrink-0 border-t border-[#dce1e5] bg-white p-[clamp(0.55rem,2vw,0.8rem)]"
      >
        <div className="mx-auto flex max-w-[52rem] items-end gap-2">
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
            rows={1}
            maxLength={4096}
            placeholder="Write a message"
            aria-label="Message"
            className="max-h-32 min-h-11 min-w-0 flex-1 resize-none rounded-[0.8rem] border-0 bg-[#f1f3f5] px-3 py-2.5 text-[0.88rem] leading-5 text-[#222] outline-none placeholder:text-[#899198] focus:bg-[#eceef0]"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="h-11 shrink-0 rounded-[0.8rem] border-0 bg-[#3390ec] px-4 text-[0.85rem] font-medium text-white transition hover:bg-[#2f87d7] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </form>
    </section>
  );
}
