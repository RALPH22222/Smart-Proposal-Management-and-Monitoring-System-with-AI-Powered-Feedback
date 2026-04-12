// Cross-tab auth change signal. When any tab logs in or logs out it posts
// "auth:changed" on this channel; every OTHER tab listening receives it and
// can react (typically by forcing a reload so its cached React state can't
// speak for a stale user). Messages are not delivered to the sender.

const channel: BroadcastChannel | null =
  typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("auth") : null;

export function broadcastAuthChange(): void {
  channel?.postMessage("auth:changed");
}

export function onAuthChange(callback: () => void): () => void {
  if (!channel) return () => {};
  const handler = (ev: MessageEvent) => {
    if (ev.data === "auth:changed") callback();
  };
  channel.addEventListener("message", handler);
  return () => channel.removeEventListener("message", handler);
}
