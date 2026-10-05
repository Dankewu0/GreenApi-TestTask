import { useState } from "react";
import type { FormEvent } from "react";

type NewChatDialogProps = {
  isOpen: boolean;
  isCreating: boolean;
  error: string;
  onClose: () => void;
  onCreate: (value: string) => Promise<void>;
};

export function NewChatDialog({
  isOpen,
  isCreating,
  error,
  onClose,
  onCreate,
}: NewChatDialogProps) {
  const [value, setValue] = useState<string>("");

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();

    const normalized = value.trim();

    if (!normalized) {
      return;
    }

    await onCreate(normalized);
    setValue("");
  };

  const isUsername = value.trim().startsWith("@");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-chat-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-[25rem] rounded-[1rem] bg-white p-5 shadow-[0_18px_50px_rgba(0,0,0,0.18)]"
      >
        <div className="mb-5">
          <h2
            id="new-chat-title"
            className="m-0 text-[1.1rem] font-semibold text-[#222]"
          >
            New chat
          </h2>

          <p className="mt-1.5 text-[0.82rem] leading-5 text-[#8a9198]">
            Enter a Telegram username or phone number.
          </p>
        </div>

        <input
          autoFocus
          value={value}
          onChange={(event) => setValue(event.target.value)}
          inputMode={isUsername ? "text" : "tel"}
          autoComplete="off"
          placeholder="@username or +79991234567"
          className="h-11 w-full rounded-[0.7rem] border border-[#dce1e5] px-3 text-[0.9rem] text-[#222] outline-none focus:border-[#3390ec]"
        />

        {error ? (
          <p className="mt-2 rounded-[0.7rem] bg-[#fff0f0] px-3 py-2.5 text-[0.8rem] leading-5 text-[#d54a4a]">
            {error}
          </p>
        ) : null}

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-10 flex-1 rounded-[0.7rem] border-0 bg-[#f1f3f5] px-4 text-[0.85rem] font-medium text-[#222] transition hover:bg-[#e8eaec]"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isCreating || !value.trim()}
            className="h-10 flex-1 rounded-[0.7rem] border-0 bg-[#3390ec] px-4 text-[0.85rem] font-medium text-white transition hover:bg-[#2f87d7] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isCreating ? "Checking..." : "Create chat"}
          </button>
        </div>
      </form>
    </div>
  );
}
