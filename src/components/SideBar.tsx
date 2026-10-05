import { useEffect, useRef, useState } from "react";

type SideBarProps = {
  onSettings: () => void;
  connected: boolean;
  onDisconnect: () => void;
};

export default function SideBar({
  onSettings,
  connected,
  onDisconnect,
}: SideBarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const menuRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent): void => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent): void => {
      if (event.key === "Escape") setIsMenuOpen(false);
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <section
      ref={menuRef}
      className="relative flex h-14 shrink-0 items-center justify-between border-b border-[#e7e9eb] bg-white px-2.5"
    >
      <button
        type="button"
        className="grid size-10 place-items-center rounded-full bg-transparent p-0 transition hover:bg-[#f1f3f5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3390ec]/30"
        aria-label="Open menu"
        aria-expanded={isMenuOpen}
        onClick={() => setIsMenuOpen((open: boolean) => !open)}
      >
        <img src="/menu-dropdown.png" alt="" className="size-5 object-contain" />
      </button>

      <img
        src="/avatar-user.png"
        alt="User avatar"
        className="size-9 rounded-full object-cover"
      />

      {isMenuOpen ? (
        <div className="absolute left-2 top-[calc(100%+0.25rem)] z-30 w-[min(88vw,20rem)] overflow-hidden rounded-[0.85rem] border border-[#e1e4e6] bg-white p-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.14),0_2px_8px_rgba(0,0,0,0.08)]">
          <div className="flex items-center gap-2.5 border-b border-[#edf0f2] px-2 py-2.5">
            <img
              src="/avatar-user.png"
              alt="User avatar"
              className="size-11 rounded-full object-cover"
            />
            <div className="min-w-0">
              <p className="m-0 truncate text-[0.9rem] font-semibold text-[#222]">
                Telegram account
              </p>
              <p className="m-0 mt-0.5 text-[0.75rem] text-[#8a9198]">
                {connected ? "Connected" : "Disconnected"}
              </p>
            </div>
          </div>

          <div className="py-1.5">
            <button
              type="button"
              onClick={() => {
                setIsMenuOpen(false);
                onSettings();
              }}
              className="flex min-h-10 w-full items-center rounded-lg border-0 bg-transparent px-2.5 text-left text-[0.86rem] text-[#222] transition hover:bg-[#f1f3f5] focus-visible:outline-none"
            >
              Settings
            </button>

            <button
              type="button"
              onClick={() => {
                setIsMenuOpen(false);
                onDisconnect();
              }}
              className="flex min-h-10 w-full items-center rounded-lg border-0 bg-transparent px-2.5 text-left text-[0.86rem] text-[#d54a4a] transition hover:bg-[#fff0f0] focus-visible:outline-none"
            >
              Disconnect
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
