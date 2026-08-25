import { useMemo } from "react";
import { Repeat, CalendarCheck, AlertTriangle, ChevronRight } from "lucide-react";

export interface Expense {
  id: string;
  name: string;
  amount: number;
  category: string;
  date: string;
  recurring: boolean;
}

interface RecurringTrackerProps {
  expenses: Expense[];
  onMarkPaid: (expenseId: string) => void;
}

function getNextDueDate(lastDate: string): Date {
  const d = new Date(lastDate);
  d.setMonth(d.getMonth() + 1);
  return d;
}

function getDaysUntil(date: Date): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function getUrgencyColor(days: number): string {
  if (days <= 0) return "var(--negative)";
  if (days <= 3) return "var(--warning)";
  return "var(--positive)";
}

function formatDueText(days: number): string {
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `In ${days} days`;
}

export default function RecurringTracker({
  expenses,
  onMarkPaid,
}: RecurringTrackerProps) {
  const recurring = useMemo(
    () =>
      expenses
        .filter((e) => e.recurring)
        .map((e) => {
          const nextDue = getNextDueDate(e.date);
          const days = getDaysUntil(nextDue);
          return { ...e, nextDue, days };
        })
        .sort((a, b) => a.days - b.days),
    [expenses]
  );

  const totalMonthly = useMemo(
    () => recurring.reduce((sum, e) => sum + e.amount, 0),
    [recurring]
  );

  if (recurring.length === 0) {
    return (
      <div className="glass-panel" style={styles.container}>
        <div style={styles.empty}>
          <Repeat size={32} color="var(--text-3)" />
          <span style={styles.emptyText}>No recurring expenses</span>
        </div>
      </div>
    );
  }

  const maxDays = Math.max(...recurring.map((e) => Math.abs(e.days)), 1);

  return (
    <div className="glass-panel" style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <Repeat size={18} color="var(--accent)" />
          <span style={styles.title}>Recurring Expenses</span>
        </div>
        <div style={styles.totalWrap}>
          <span style={styles.totalLabel}>Monthly total</span>
          <span style={styles.totalValue}>
            {totalMonthly.toLocaleString("en-US", {
              style: "currency",
              currency: "USD",
            })}
          </span>
        </div>
      </div>

      <div style={styles.timeline}>
        {recurring.map((e) => {
          const color = getUrgencyColor(e.days);
          const barWidth = Math.min(Math.abs(e.days) / maxDays, 1) * 100;
          return (
            <div key={e.id} style={styles.expenseRow}>
              <div style={styles.dotCol}>
                <span style={{ ...styles.dot, background: color }} />
                <span style={{ ...styles.dotLine, background: color }} />
              </div>

              <div style={styles.expenseContent}>
                <div style={styles.expenseTop}>
                  <div style={styles.expenseInfo}>
                    <span style={styles.expenseName}>{e.name}</span>
                    <span style={styles.expenseCategory}>{e.category}</span>
                  </div>
                  <span style={styles.expenseAmount}>
                    {e.amount.toLocaleString("en-US", {
                      style: "currency",
                      currency: "USD",
                    })}
                  </span>
                </div>

                <div style={styles.dueRow}>
                  <div style={styles.dueBarTrack}>
                    <div
                      style={{
                        ...styles.dueBarFill,
                        width: `${Math.max(barWidth, 4)}%`,
                        background: color,
                      }}
                    />
                  </div>
                  <span style={{ ...styles.dueText, color }}>
                    {e.days <= 0 && <AlertTriangle size={12} />}
                    {formatDueText(e.days)}
                  </span>
                </div>

                <div style={styles.actionRow}>
                  <span style={styles.nextDue}>
                    <CalendarCheck size={12} color="var(--text-3)" />
                    {e.nextDue.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  <button
                    className="btn-secondary"
                    style={styles.payBtn}
                    onClick={() => onMarkPaid(e.id)}
                  >
                    Mark as Paid
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: "18px 20px",
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  empty: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
    padding: "40px 20px",
  },
  emptyText: {
    fontSize: 13,
    color: "var(--text-3)",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontFamily: "'Outfit', sans-serif",
    fontSize: 14,
    fontWeight: 700,
    color: "var(--text-1)",
  },
  totalWrap: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
  },
  totalLabel: {
    fontSize: 10,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    color: "var(--text-3)",
  },
  totalValue: {
    fontFamily: "'Outfit', sans-serif",
    fontSize: 18,
    fontWeight: 800,
    color: "var(--accent)",
    fontVariantNumeric: "tabular-nums",
  },
  timeline: {
    display: "flex",
    flexDirection: "column",
    gap: 0,
  },
  expenseRow: {
    display: "flex",
    gap: 12,
  },
  dotCol: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    paddingTop: 14,
    width: 12,
    flexShrink: 0,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: "50%",
    flexShrink: 0,
  },
  dotLine: {
    width: 2,
    flex: 1,
    opacity: 0.25,
    marginTop: 4,
  },
  expenseContent: {
    flex: 1,
    background: "var(--surface-2)",
    border: "1px solid var(--border)",
    borderRadius: 12,
    padding: "10px 14px",
    display: "flex",
    flexDirection: "column",
    gap: 8,
    marginBottom: 8,
    minWidth: 0,
  },
  expenseTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  expenseInfo: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    minWidth: 0,
  },
  expenseName: {
    fontSize: 13.5,
    fontWeight: 600,
    color: "var(--text-1)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  expenseCategory: {
    fontSize: 10,
    fontWeight: 600,
    padding: "2px 8px",
    borderRadius: 6,
    background: "rgba(168,85,247,0.12)",
    color: "var(--accent-purple)",
    textTransform: "capitalize",
    flexShrink: 0,
  },
  expenseAmount: {
    fontFamily: "'Outfit', sans-serif",
    fontSize: 15,
    fontWeight: 700,
    color: "var(--text-1)",
    fontVariantNumeric: "tabular-nums",
    flexShrink: 0,
  },
  dueRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  dueBarTrack: {
    flex: 1,
    height: 4,
    background: "rgba(255,255,255,0.06)",
    borderRadius: 4,
    overflow: "hidden",
  },
  dueBarFill: {
    height: "100%",
    borderRadius: 4,
    transition: "width 0.5s cubic-bezier(0.25,1,0.5,1)",
  },
  dueText: {
    fontSize: 11,
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    gap: 4,
    flexShrink: 0,
    minWidth: 90,
    justifyContent: "flex-end",
  },
  actionRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  nextDue: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    fontSize: 11,
    color: "var(--text-3)",
  },
  payBtn: {
    padding: "4px 10px",
    fontSize: 11,
    fontWeight: 600,
    borderRadius: 8,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 4,
    fontFamily: "'Inter', sans-serif",
  },
};
