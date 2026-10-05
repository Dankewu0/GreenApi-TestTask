import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { GreenApiConfig } from "../api/greenApi";

type SettingsDialogProps = {
  isOpen: boolean;
  config: GreenApiConfig | null;
  state: string;
  onClose: () => void;
  onReconnect: (config: GreenApiConfig) => Promise<void>;
  onDisconnect: () => void;
  error: string;
};

export function SettingsDialog({
  isOpen,
  config,
  state,
  onClose,
  onReconnect,
  onDisconnect,
  error,
}: SettingsDialogProps) {
  const [draft, setDraft] = useState<GreenApiConfig | null>(config);

  useEffect(() => {
    if (isOpen) setDraft(config);
  }, [config, isOpen]);

  if (!isOpen || !config) return null;

  const current: GreenApiConfig = draft ?? config;

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();

    if (!current.idInstance.trim() || !current.apiTokenInstance.trim()) return;

    await onReconnect({
      apiUrl: current.apiUrl.trim(),
      idInstance: current.idInstance.trim(),
      apiTokenInstance: current.apiTokenInstance.trim(),
    });
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/35 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="w-full max-w-[29rem] rounded-[1rem] bg-white shadow-[0_18px_50px_rgba(0,0,0,0.18)]">
        <header className="flex items-center justify-between border-b border-[#edf0f2] px-5 py-4">
          <div>
            <h2
              id="settings-title"
              className="m-0 text-[1rem] font-semibold text-[#222]"
            >
              Settings
            </h2>
            <p className="m-0 mt-1 text-[0.75rem] text-[#8a9198]">
              Connection: {state || "unknown"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border-0 bg-transparent px-2.5 py-2 text-[0.8rem] text-[#6f7880] hover:bg-[#f1f3f5]"
          >
            Close
          </button>
        </header>

        <form onSubmit={handleSubmit} className="space-y-3 p-5">
          <label className="block">
            <span className="mb-1.5 block text-[0.76rem] font-medium text-[#555d65]">
              API URL
            </span>
            <input
              value={current.apiUrl}
              onChange={(event) =>
                setDraft({ ...current, apiUrl: event.target.value })
              }
              className="h-11 w-full rounded-[0.7rem] border border-[#dce1e5] px-3 text-[0.88rem] outline-none focus:border-[#3390ec]"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[0.76rem] font-medium text-[#555d65]">
              idInstance
            </span>
            <input
              value={current.idInstance}
              onChange={(event) =>
                setDraft({ ...current, idInstance: event.target.value })
              }
              className="h-11 w-full rounded-[0.7rem] border border-[#dce1e5] px-3 text-[0.88rem] outline-none focus:border-[#3390ec]"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[0.76rem] font-medium text-[#555d65]">
              apiTokenInstance
            </span>
            <input
              type="password"
              value={current.apiTokenInstance}
              onChange={(event) =>
                setDraft({ ...current, apiTokenInstance: event.target.value })
              }
              className="h-11 w-full rounded-[0.7rem] border border-[#dce1e5] px-3 text-[0.88rem] outline-none focus:border-[#3390ec]"
              autoComplete="off"
            />
          </label>

          {error ? (
            <p className="m-0 rounded-[0.7rem] bg-[#fff0f0] px-3 py-2.5 text-[0.78rem] leading-5 text-[#d54a4a]">
              {error}
            </p>
          ) : null}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onDisconnect}
              className="h-10 rounded-[0.7rem] border-0 bg-[#fff0f0] px-4 text-[0.82rem] font-medium text-[#d54a4a] hover:bg-[#ffe6e6]"
            >
              Disconnect
            </button>

            <button
              type="submit"
              className="ml-auto h-10 rounded-[0.7rem] border-0 bg-[#3390ec] px-4 text-[0.82rem] font-medium text-white hover:bg-[#2f87d7]"
            >
              Reconnect
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
