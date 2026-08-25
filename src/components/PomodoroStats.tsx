import { useMemo } from "react";
import {
  Clock,
  Flame,
  CalendarDays,
  Trophy,
  BarChart3,
} from "lucide-react";

interface PomodoroSession {
  id: string;
  startTime: string;
  duration: number;
  completed: boolean;
}

interface PomodoroStatsProps {
  sessions: PomodoroSession[];
}

interface DayData {
  label: string;
  shortLabel: string;
  minutes: number;
  sessions: number;
}

function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

function getWeekBounds(): { start: Date; end: Date } {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + mondayOffset);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return { start, end };
}

function isToday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function getWeekdayIndex(dateStr: string): number {
  const d = new Date(dateStr);
  const jsDay = d.getDay();
  return jsDay === 0 ? 6 : jsDay - 1;
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function PomodoroStats({ sessions }: PomodoroStatsProps) {
  const stats = useMemo(() => {
    const completed = sessions.filter((s) => s.completed);

    const todaySeconds = completed
      .filter((s) => isToday(s.startTime))
      .reduce((sum, s) => sum + s.duration, 0);

    const { start: weekStart, end: weekEnd } = getWeekBounds();
    const weekSeconds = completed
      .filter((s) => {
        const d = new Date(s.startTime);
        return d >= weekStart && d < weekEnd;
      })
      .reduce((sum, s) => sum + s.duration, 0);

    const daySet = new Set<string>();
    completed.forEach((s) => {
      const d = new Date(s.startTime);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      daySet.add(key);
    });

    let streak = 0;
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);
    while (true) {
      const key = `${cursor.getFullYear()}-${cursor.getMonth()}-${cursor.getDate()}`;
      if (daySet.has(key)) {
        streak++;
        cursor.setDate(cursor.getDate() - 1);
      } else {
        break;
      }
    }

    const dayData: DayData[] = DAY_LABELS.map((label, i) => ({
      label,
      shortLabel: label,
      minutes: 0,
      sessions: 0,
    }));
    completed.forEach((s) => {
      const { start: ws } = getWeekBounds();
      const d = new Date(s.startTime);
      if (d >= ws) {
        const idx = getWeekdayIndex(s.startTime);
        dayData[idx].minutes += s.duration / 60;
        dayData[idx].sessions += 1;
      }
    });

    let bestDayIdx = 0;
    let bestMinutes = 0;
    dayData.forEach((d, i) => {
      if (d.minutes > bestMinutes) {
        bestMinutes = d.minutes;
        bestDayIdx = i;
      }
    });

    return {
      todaySeconds,
      weekSeconds,
      streak,
      totalCompleted: completed.length,
      dayData,
      bestDay: DAY_LABELS[bestDayIdx],
      maxMinutes: Math.max(...dayData.map((d) => d.minutes), 1),
    };
  }, [sessions]);

  return (
    <div className="pomodoro-stats">
      <style>{`
        .pomodoro-stats {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          width: 100%;
        }

        .pomodoro-stats .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0.75rem;
        }

        .pomodoro-stats .stat-card {
          background: var(--surface-2);
          border: 1px solid var(--glass-border);
          border-radius: 12px;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          backdrop-filter: blur(12px);
          transition: border-color 0.2s ease;
        }

        .pomodoro-stats .stat-card:hover {
          border-color: var(--accent);
        }

        .pomodoro-stats .stat-card .stat-icon {
          color: var(--accent);
          opacity: 0.8;
        }

        .pomodoro-stats .stat-card .stat-label {
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--text-3);
          font-weight: 500;
        }

        .pomodoro-stats .stat-card .stat-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-1);
          line-height: 1;
          font-variant-numeric: tabular-nums;
        }

        .pomodoro-stats .chart-section {
          background: var(--surface-2);
          border: 1px solid var(--glass-border);
          border-radius: 12px;
          padding: 1.25rem;
          backdrop-filter: blur(12px);
        }

        .pomodoro-stats .chart-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .pomodoro-stats .chart-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--text-2);
          font-weight: 600;
        }

        .pomodoro-stats .chart-title svg {
          color: var(--accent);
        }

        .pomodoro-stats .best-day {
          font-size: 0.75rem;
          color: var(--text-3);
        }

        .pomodoro-stats .best-day span {
          color: var(--accent);
          font-weight: 600;
        }

        .pomodoro-stats .bar-chart {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 0.5rem;
          height: 120px;
          padding-top: 0.5rem;
        }

        .pomodoro-stats .bar-col {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.4rem;
          height: 100%;
          justify-content: flex-end;
        }

        .pomodoro-stats .bar-wrapper {
          width: 100%;
          max-width: 48px;
          height: 100%;
          display: flex;
          align-items: flex-end;
        }

        .pomodoro-stats .bar {
          width: 100%;
          min-height: 2px;
          border-radius: 4px 4px 2px 2px;
          background: linear-gradient(
            180deg,
            var(--accent) 0%,
            color-mix(in srgb, var(--accent) 60%, transparent) 100%
          );
          transition: height 0.4s cubic-bezier(0.22, 1, 0.36, 1);
          position: relative;
        }

        .pomodoro-stats .bar:hover {
          filter: brightness(1.2);
        }

        .pomodoro-stats .bar-tooltip {
          position: absolute;
          top: -1.5rem;
          left: 50%;
          transform: translateX(-50%);
          font-size: 0.65rem;
          color: var(--text-2);
          white-space: nowrap;
          opacity: 0;
          transition: opacity 0.15s ease;
          pointer-events: none;
          font-variant-numeric: tabular-nums;
        }

        .pomodoro-stats .bar:hover .bar-tooltip {
          opacity: 1;
        }

        .pomodoro-stats .bar-label {
          font-size: 0.7rem;
          color: var(--text-3);
          font-weight: 500;
          white-space: nowrap;
        }

        .pomodoro-stats .bar-col.today .bar-label {
          color: var(--accent);
          font-weight: 700;
        }

        @media (max-width: 700px) {
          .pomodoro-stats .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .pomodoro-stats .bar-chart {
            height: 90px;
          }

          .pomodoro-stats .stat-card .stat-value {
            font-size: 1.2rem;
          }
        }

        @media (max-width: 400px) {
          .pomodoro-stats .stats-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="stats-grid">
        <div className="stat-card">
          <Clock className="stat-icon" size={18} />
          <span className="stat-label">Today</span>
          <span className="stat-value">{formatDuration(stats.todaySeconds)}</span>
        </div>
        <div className="stat-card">
          <CalendarDays className="stat-icon" size={18} />
          <span className="stat-label">This Week</span>
          <span className="stat-value">{formatDuration(stats.weekSeconds)}</span>
        </div>
        <div className="stat-card">
          <Flame className="stat-icon" size={18} />
          <span className="stat-label">Current Streak</span>
          <span className="stat-value">
            {stats.streak} {stats.streak === 1 ? "day" : "days"}
          </span>
        </div>
        <div className="stat-card">
          <Trophy className="stat-icon" size={18} />
          <span className="stat-label">Completed</span>
          <span className="stat-value">{stats.totalCompleted}</span>
        </div>
      </div>

      <div className="chart-section">
        <div className="chart-header">
          <div className="chart-title">
            <BarChart3 size={16} />
            Weekly Focus
          </div>
          <div className="best-day">
            Best day: <span>{stats.bestDay}</span>
          </div>
        </div>
        <div className="bar-chart">
          {stats.dayData.map((day) => {
            const pct = Math.max((day.minutes / stats.maxMinutes) * 100, 2);
            const mins = Math.round(day.minutes);
            const todayIdx = new Date().getDay();
            const normalizedToday = todayIdx === 0 ? 6 : todayIdx - 1;
            const isTodayBar = DAY_LABELS.indexOf(day.label) === normalizedToday;

            return (
              <div
                key={day.label}
                className={`bar-col${isTodayBar ? " today" : ""}`}
              >
                <div className="bar-wrapper">
                  <div
                    className="bar"
                    style={{ height: `${pct}%` }}
                  >
                    <span className="bar-tooltip">
                      {mins > 0 ? `${mins}m` : "—"}
                    </span>
                  </div>
                </div>
                <span className="bar-label">
                  {day.label.charAt(0)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
