import { useState } from "react";
import type { FormEvent } from "react";
import type { GreenApiConfig } from "../api/greenApi";

type ConnectionFormProps = {
  onConnect: (config: GreenApiConfig) => Promise<void>;
  isConnecting: boolean;
  error: string;
};

export function ConnectionForm({
  onConnect,
  isConnecting,
  error,
}: ConnectionFormProps) {
  const [apiUrl, setApiUrl] = useState<string>("");
  const [idInstance, setIdInstance] = useState<string>("");
  const [apiTokenInstance, setApiTokenInstance] = useState<string>("");

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();

    if (!idInstance.trim() || !apiTokenInstance.trim()) return;

    await onConnect({
      apiUrl: apiUrl.trim(),
      idInstance: idInstance.trim(),
      apiTokenInstance: apiTokenInstance.trim(),
    });
  };

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#eef1f4] p-[clamp(1rem,4vw,2rem)]">
      <section className="w-full max-w-[28rem] rounded-[1.1rem] bg-white p-[clamp(1.25rem,5vw,2rem)] shadow-[0_10px_35px_rgba(0,0,0,0.08)]">
        <div className="mb-7">
          <p className="mb-2 text-[0.78rem] font-semibold uppercase tracking-[0.08em] text-[#3390ec]">
            Telegram client
          </p>
          <h1 className="m-0 text-[clamp(1.45rem,6vw,1.9rem)] font-semibold tracking-[-0.025em] text-[#222]">
            Connect GREEN-API
          </h1>
          <p className="mt-2 text-[0.9rem] leading-6 text-[#7c858e]">
            Enter your Telegram instance credentials to start a conversation.
          </p>
        </div>

        <form className="space-y-3" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-1.5 block text-[0.78rem] font-medium text-[#555d65]">
              API URL
            </span>
            <input
              value={apiUrl}
              onChange={(event) => setApiUrl(event.target.value)}
              className="h-11 w-full rounded-[0.7rem] border border-[#dce1e5] bg-white px-3 text-[0.9rem] text-[#222] outline-none transition focus:border-[#3390ec]"
              placeholder="https://api.green-api.com"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[0.78rem] font-medium text-[#555d65]">
              idInstance
            </span>
            <input
              value={idInstance}
              onChange={(event) => setIdInstance(event.target.value)}
              className="h-11 w-full rounded-[0.7rem] border border-[#dce1e5] bg-white px-3 text-[0.9rem] text-[#222] outline-none transition focus:border-[#3390ec]"
              inputMode="numeric"
              autoComplete="off"
              placeholder="4100000000"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[0.78rem] font-medium text-[#555d65]">
              apiTokenInstance
            </span>
            <input
              type="password"
              value={apiTokenInstance}
              onChange={(event) => setApiTokenInstance(event.target.value)}
              className="h-11 w-full rounded-[0.7rem] border border-[#dce1e5] bg-white px-3 text-[0.9rem] text-[#222] outline-none transition focus:border-[#3390ec]"
              autoComplete="off"
              placeholder="Instance access token"
            />
          </label>

          {error ? (
            <p className="m-0 rounded-[0.7rem] bg-[#fff0f0] px-3 py-2.5 text-[0.8rem] leading-5 text-[#d54a4a]">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isConnecting}
            className="mt-2 h-11 w-full rounded-[0.7rem] border-0 bg-[#3390ec] px-4 text-[0.9rem] font-medium text-white transition hover:bg-[#2f87d7] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isConnecting ? "Connecting..." : "Connect"}
          </button>
        </form>
      </section>
    </main>
  );
}
