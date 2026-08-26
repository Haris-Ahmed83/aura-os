import { useState, useMemo } from "react";
import {
  Plus,
  Trash2,
  Flame,
  Check,
  X,
  TrendingUp,
} from "lucide-react";

interface Habit {
  id: string;
  name: string;
  icon: string;
  completedDates: string[];
}

interface HabitsTrackerProps {
  habits: Habit[];
  onToggle: (habitId: string, date: string) => void;
  onAdd: (name: string, icon: string) => void;
  onDelete: (habitId: string) => void;
}

const EMOJI_OPTIONS = [
  "💪",
  "📚",
  "🏃",
  "🧘",
  "💧",
  "🎨",
  "🎵",
  "✍️",
  "🌙",
  "🥗",
  "🧹",
  "💻",
  "🎯",
  "☀️",
  "🌿",
  "☕",
  "🗣️",
  "📝",
  "🏋️",
  "🚴",
  "🧠",
  "💤",
  "🙏",
  "❤️",
];

function getStreak(dates: string[], dateStrings: string[]): number {
  let streak = 0;
  for (let i = dateStrings.length - 1; i >= 0; i--) {
    if (dates.includes(dateStrings[i])) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

function getCompletionRate(habit: Habit, dateStrings: string[]): number {
  const total = dateStrings.length;
  if (total === 0) return 0;
  const completed = dateStrings.filter((d) =>
    habit.completedDates.includes(d)
  ).length;
  return Math.round((completed / total) * 100);
}

function formatDateKey(date: Date): string {
  return date.toISOString().split("T")[0];
}

function getShortDayName(date: Date): string {
  return date.toLocaleDateString("en-US", { weekday: "short" });
}

function getDayNum(date: Date): string {
  return date.getDate().toString();
}

export default function HabitsTracker({
  habits,
  onToggle,
  onAdd,
  onDelete,
}: HabitsTrackerProps) {
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("💪");

  const last7Days = useMemo(() => {
    const days: Date[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d);
    }
    return days;
  }, []);

  const dateStrings = useMemo(
    () => last7Days.map(formatDateKey),
    [last7Days]
  );

  const handleAdd = () => {
    const name = newName.trim();
    if (!name) return;
    onAdd(name, newIcon);
    setNewName("");
    setNewIcon("💪");
    setShowForm(false);
  };

  const overallRate = useMemo(() => {
    if (habits.length === 0 || dateStrings.length === 0) return 0;
    let total = 0;
    for (const h of habits) {
      total += getCompletionRate(h, dateStrings);
    }
    return Math.round(total / habits.length);
  }, [habits, dateStrings]);

  return (
    <div className="glass-panel" style={styles.container}>
      <div style={styles.topBar}>
        <div style={styles.titleRow}>
          <span style={styles.title}>Habits Tracker</span>
          <div style={styles.rateBadge}>
            <TrendingUp size={14} color="var(--accent)" />
            <span style={styles.rateText}>{overallRate}%</span>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={styles.addBtn}
          title="Add habit"
        >
          {showForm ? (
            <X size={18} color="var(--text-1)" />
          ) : (
            <Plus size={18} color="var(--text-1)" />
          )}
        </button>
      </div>

      {showForm && (
        <div style={styles.formPanel}>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="Habit name..."
            style={styles.input}
          />
          <div style={styles.emojiGrid}>
            {EMOJI_OPTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => setNewIcon(emoji)}
                style={{
                  ...styles.emojiBtn,
                  ...(newIcon === emoji ? styles.emojiBtnSelected : {}),
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
          <button
            onClick={handleAdd}
            disabled={!newName.trim()}
            style={{
              ...styles.confirmBtn,
              opacity: newName.trim() ? 1 : 0.4,
            }}
          >
            <Check size={16} />
            Add
          </button>
        </div>
      )}

      {habits.length === 0 && !showForm && (
        <div style={styles.empty}>
          <span style={{ fontSize: "1.5rem" }}>📋</span>
          <span style={styles.emptyText}>
            No habits yet. Tap + to start.
          </span>
        </div>
      )}

      {habits.length > 0 && (
        <div style={styles.gridWrapper}>
          <div style={styles.dayHeaders}>
            <div style={styles.habitNameCol} />
            {last7Days.map((day, i) => {
              const isToday = i === last7Days.length - 1;
              return (
                <div
                  key={i}
                  style={{
                    ...styles.dayCol,
                    ...(isToday ? styles.dayColToday : {}),
                  }}
                >
                  <span style={styles.dayShort}>{getShortDayName(day)}</span>
                  <span style={styles.dayNum}>{getDayNum(day)}</span>
                </div>
              );
            })}
            <div style={styles.streakCol}>
              <Flame size={12} color="var(--accent)" />
            </div>
          </div>

          {habits.map((habit) => {
            const streak = getStreak(
              habit.completedDates,
              [...dateStrings].reverse()
            );
            const rate = getCompletionRate(habit, dateStrings);
            return (
              <div key={habit.id} style={styles.habitRow}>
                <div style={styles.habitNameCol}>
                  <span style={styles.habitIcon}>{habit.icon}</span>
                  <span style={styles.habitName}>{habit.name}</span>
                  <button
                    onClick={() => onDelete(habit.id)}
                    style={styles.deleteBtn}
                    title="Delete habit"
                  >
                    <Trash2 size={12} color="var(--negative)" />
                  </button>
                </div>

                {dateStrings.map((date, j) => {
                  const done = habit.completedDates.includes(date);
                  const isToday = j === dateStrings.length - 1;
                  return (
                    <button
                      key={j}
                      onClick={() => onToggle(habit.id, date)}
                      style={{
                        ...styles.circleBtn,
                        ...(done ? styles.circleBtnDone : {}),
                        ...(isToday && !done ? styles.circleBtnToday : {}),
                      }}
                      title={`${date}${done ? " ✓" : ""}`}
                    >
                      {done && <Check size={12} color="var(--bg)" strokeWidth={3} />}
                    </button>
                  );
                })}

                <div style={styles.streakCol}>
                  <span
                    style={{
                      ...styles.streakNum,
                      color:
                        streak > 0 ? "var(--accent)" : "var(--text-3)",
                    }}
                  >
                    {streak}
                  </span>
                  <span style={styles.rateNum}>{rate}%</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: "1rem 1.25rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
    overflowX: "auto",
  },
  topBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  titleRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  title: {
    fontSize: "1rem",
    fontWeight: 700,
    color: "var(--text-1)",
  },
  rateBadge: {
    display: "flex",
    alignItems: "center",
    gap: "0.25rem",
    background: "var(--surface-2)",
    borderRadius: "999px",
    padding: "0.15rem 0.5rem",
  },
  rateText: {
    fontSize: "0.7rem",
    fontWeight: 600,
    color: "var(--accent)",
  },
  addBtn: {
    background: "var(--surface-2)",
    border: "1px solid var(--glass-border)",
    borderRadius: "8px",
    padding: "0.35rem",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background 0.2s",
  },
  formPanel: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
    background: "var(--surface-2)",
    borderRadius: "10px",
    padding: "0.75rem",
    border: "1px solid var(--glass-border)",
  },
  input: {
    background: "var(--bg)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    padding: "0.5rem 0.75rem",
    color: "var(--text-1)",
    fontSize: "0.85rem",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  },
  emojiGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.25rem",
  },
  emojiBtn: {
    width: "32px",
    height: "32px",
    borderRadius: "6px",
    border: "1px solid transparent",
    background: "var(--bg)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1rem",
    transition: "all 0.15s",
  },
  emojiBtnSelected: {
    borderColor: "var(--accent)",
    background: "rgba(212, 175, 55, 0.15)",
  },
  confirmBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.35rem",
    background: "var(--accent)",
    color: "var(--bg)",
    border: "none",
    borderRadius: "8px",
    padding: "0.45rem",
    fontSize: "0.8rem",
    fontWeight: 700,
    cursor: "pointer",
  },
  empty: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.5rem",
    padding: "1.5rem 0",
  },
  emptyText: {
    color: "var(--text-3)",
    fontSize: "0.85rem",
  },
  gridWrapper: {
    display: "flex",
    flexDirection: "column",
    gap: "0",
    minWidth: 0,
  },
  dayHeaders: {
    display: "flex",
    alignItems: "center",
    marginBottom: "0.25rem",
  },
  habitNameCol: {
    flex: "1 1 0",
    minWidth: "100px",
    display: "flex",
    alignItems: "center",
    gap: "0.35rem",
    overflow: "hidden",
  },
  dayCol: {
    width: "36px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    flexShrink: 0,
  },
  dayColToday: {
    borderBottom: "2px solid var(--accent)",
    paddingBottom: "2px",
  },
  dayShort: {
    fontSize: "0.55rem",
    color: "var(--text-3)",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.03em",
  },
  dayNum: {
    fontSize: "0.65rem",
    color: "var(--text-2)",
    fontWeight: 500,
  },
  streakCol: {
    width: "36px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    flexShrink: 0,
  },
  habitRow: {
    display: "flex",
    alignItems: "center",
    padding: "0.35rem 0",
    borderTop: "1px solid var(--border)",
  },
  habitIcon: {
    fontSize: "1rem",
    flexShrink: 0,
  },
  habitName: {
    fontSize: "0.8rem",
    color: "var(--text-1)",
    fontWeight: 600,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    flex: 1,
    minWidth: 0,
  },
  deleteBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "2px",
    display: "flex",
    alignItems: "center",
    flexShrink: 0,
    opacity: 0.5,
    transition: "opacity 0.2s",
  },
  circleBtn: {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    border: "2px solid var(--border)",
    background: "transparent",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    transition: "all 0.2s",
  },
  circleBtnDone: {
    background: "var(--accent)",
    borderColor: "var(--accent)",
  },
  circleBtnToday: {
    borderColor: "var(--text-3)",
  },
  streakNum: {
    fontSize: "0.7rem",
    fontWeight: 700,
  },
  rateNum: {
    fontSize: "0.55rem",
    color: "var(--text-3)",
  },
};
