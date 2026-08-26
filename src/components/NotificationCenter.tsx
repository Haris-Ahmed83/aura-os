import { useState, useRef, useEffect, useCallback } from "react";
import {
  Bell,
  Clock,
  AlertTriangle,
  AlertCircle,
  Info,
  Trash2,
  BellOff,
} from "lucide-react";

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: "reminder" | "deadline" | "alert" | "info";
  timestamp: string;
  read: boolean;
}

interface NotificationCenterProps {
  notifications: AppNotification[];
  onDismiss: (id: string) => void;
  onClearAll: () => void;
}

export function sendBrowserNotification(title: string, body: string): void {
  if (Notification.permission === "granted") {
    new Notification(title, { body });
  }
}

function getRelativeTime(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diff = now - then;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

const typeConfig: Record<
  AppNotification["type"],
  { icon: React.ReactNode; color: string }
> = {
  reminder: { icon: <Clock size={16} />, color: "var(--accent)" },
  deadline: { icon: <AlertTriangle size={16} />, color: "var(--warning)" },
  alert: { icon: <AlertCircle size={16} />, color: "var(--accent-rose)" },
  info: { icon: <Info size={16} />, color: "var(--accent-blue)" },
};

export default function NotificationCenter({
  notifications,
  onDismiss,
  onClearAll,
}: NotificationCenterProps) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const requestPermission = useCallback(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={panelRef} style={styles.wrapper}>
      <button style={styles.bellBtn} onClick={() => setOpen(!open)}>
        <Bell size={20} color={unreadCount > 0 ? "var(--accent)" : "var(--text-2)"} />
        {unreadCount > 0 && <span style={styles.badge}>{unreadCount}</span>}
      </button>

      {open && (
        <div className="glass-panel" style={styles.panel}>
          <div style={styles.panelHeader}>
            <span style={styles.panelTitle}>Notifications</span>
            {notifications.length > 0 && (
              <button
                style={styles.clearBtn}
                onClick={() => {
                  onClearAll();
                  setOpen(false);
                }}
              >
                <Trash2 size={14} />
                Clear all
              </button>
            )}
          </div>

          <div style={styles.list}>
            {notifications.length === 0 ? (
              <div style={styles.empty}>
                <BellOff size={32} color="var(--text-3)" />
                <span style={styles.emptyText}>No notifications yet</span>
              </div>
            ) : (
              notifications.map((n) => {
                const cfg = typeConfig[n.type];
                return (
                  <div
                    key={n.id}
                    style={{
                      ...styles.item,
                      background: n.read ? "transparent" : "rgba(212,175,55,0.04)",
                      borderLeft: n.read ? "2px solid transparent" : `2px solid var(--accent)`,
                    }}
                    onClick={() => {
                      onDismiss(n.id);
                      if (!n.read && "Notification" in window && Notification.permission === "granted") {
                        sendBrowserNotification(n.title, n.message);
                      }
                    }}
                  >
                    <div style={{ ...styles.iconWrap, color: cfg.color }}>
                      {!n.read && <span style={styles.unreadDot} />}
                      {cfg.icon}
                    </div>
                    <div style={styles.itemContent}>
                      <span style={styles.itemTitle}>{n.title}</span>
                      <span style={styles.itemMessage}>{n.message}</span>
                      <span style={styles.itemTime}>{getRelativeTime(n.timestamp)}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: { position: "relative" },
  bellBtn: {
    background: "var(--surface-2)",
    border: "1px solid var(--border)",
    color: "var(--text-2)",
    cursor: "pointer",
    padding: "8px",
    borderRadius: "50%",
    width: 36,
    height: 36,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    transition: "all 0.15s cubic-bezier(0.25,1,0.5,1)",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    background: "var(--accent-rose)",
    color: "#fff",
    fontSize: 10,
    fontWeight: 700,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 4px",
    lineHeight: 1,
  },
  panel: {
    position: "absolute",
    top: "calc(100% + 8px)",
    right: 0,
    width: 360,
    maxHeight: 420,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    zIndex: 100,
    padding: 0,
  },
  panelHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 16px",
    borderBottom: "1px solid var(--border)",
  },
  panelTitle: {
    fontFamily: "'Outfit', sans-serif",
    fontSize: 14,
    fontWeight: 700,
    color: "var(--text-1)",
  },
  clearBtn: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    background: "rgba(239,68,68,0.1)",
    border: "1px solid rgba(239,68,68,0.2)",
    borderRadius: 8,
    padding: "4px 10px",
    fontSize: 11,
    fontWeight: 600,
    color: "var(--accent-rose)",
    cursor: "pointer",
    fontFamily: "'Inter', sans-serif",
  },
  list: {
    flex: 1,
    overflowY: "auto",
    padding: "4px 0",
  },
  empty: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
    padding: "40px 20px",
    color: "var(--text-3)",
  },
  emptyText: {
    fontSize: 13,
    color: "var(--text-3)",
  },
  item: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    padding: "10px 16px",
    cursor: "pointer",
    transition: "background 0.15s",
    borderBottom: "1px solid var(--border)",
  },
  iconWrap: {
    position: "relative",
    marginTop: 2,
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
  },
  unreadDot: {
    position: "absolute",
    top: -3,
    left: -3,
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: "var(--accent)",
  },
  itemContent: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
    minWidth: 0,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: "var(--text-1)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  itemMessage: {
    fontSize: 12,
    color: "var(--text-2)",
    lineHeight: 1.4,
    overflow: "hidden",
    textOverflow: "ellipsis",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
  },
  itemTime: {
    fontSize: 11,
    color: "var(--text-3)",
    marginTop: 2,
  },
};
