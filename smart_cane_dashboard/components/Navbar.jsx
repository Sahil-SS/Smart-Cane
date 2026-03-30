export default function Navbar({ connected, lastSeen }) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.06] bg-[#080c10]/80 backdrop-blur-xl">
      <div className="max-w-screen-xl mx-auto px-6 h-16 flex items-center justify-between gap-4">

        {/* ── Brand ── */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-400
            flex items-center justify-center text-lg shadow-lg shadow-emerald-500/20 shrink-0">
            🦯
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-mono text-sm font-bold tracking-[0.15em] text-white">
              SMART CANE
            </span>
            <span className="font-mono text-[0.55rem] tracking-[0.12em] text-white/30 uppercase">
              Assistive Perception Dashboard
            </span>
          </div>
        </div>

        {/* ── Center title (hidden on small screens) ── */}
        <div className="hidden md:flex items-center gap-2">
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-white/20" />
          <span className="font-mono text-[0.65rem] tracking-[0.2em] text-white/20 uppercase">
            Node-RED  ·  WebSocket  ·  AI Vision
          </span>
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-white/20" />
        </div>

        {/* ── WebSocket status ── */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Status pill */}
          <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border transition-all duration-500
            ${connected
              ? "bg-emerald-400/10 border-emerald-400/30"
              : "bg-red-500/10 border-red-500/30"
            }`}>
            <span className="relative flex h-2 w-2 shrink-0">
              {connected && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              )}
              <span className={`relative inline-flex h-2 w-2 rounded-full
                ${connected
                  ? "bg-emerald-400 shadow-[0_0_6px_#34d399]"
                  : "bg-red-500 shadow-[0_0_6px_#ef4444]"
                }`}
              />
            </span>
            <span className={`font-mono text-[0.68rem] font-bold tracking-widest
              ${connected ? "text-emerald-400" : "text-red-400"}`}>
              {connected ? "CONNECTED" : "DISCONNECTED"}
            </span>
          </div>

          {/* Last seen (desktop only) */}
          {lastSeen && connected && (
            <span className="hidden lg:block font-mono text-[0.6rem] text-white/25 tracking-wide">
              ping {lastSeen}
            </span>
          )}

          {/* WS endpoint badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
            <span className="font-mono text-[0.58rem] text-white/25 tracking-wide">
              ws://localhost:1880/cane-alert
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}