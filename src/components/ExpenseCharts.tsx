import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, PieChart, BarChart3, DollarSign } from 'lucide-react';

export interface Expense {
  id: string;
  name: string;
  amount: number;
  category: 'food' | 'transport' | 'subscription' | 'health' | 'entertainment' | 'other';
  date: string;
  recurring: boolean;
}

interface ExpenseChartsProps {
  expenses: Expense[];
  monthlyIncome: number;
}

const CATEGORY_COLORS: Record<Expense['category'], string> = {
  food: '#f59e0b',
  transport: '#3b82f6',
  subscription: '#a855f7',
  health: '#10b981',
  entertainment: '#f43f5e',
  other: '#64748B',
};

const CATEGORY_LABELS: Record<Expense['category'], string> = {
  food: 'Food',
  transport: 'Transport',
  subscription: 'Subscriptions',
  health: 'Health',
  entertainment: 'Entertainment',
  other: 'Other',
};

const ExpenseCharts: React.FC<ExpenseChartsProps> = ({ expenses, monthlyIncome }) => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const thisMonthExpenses = useMemo(
    () => expenses.filter((e) => {
      const d = new Date(e.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }),
    [expenses, currentMonth, currentYear]
  );

  const lastMonthExpenses = useMemo(() => {
    const lm = currentMonth === 0 ? 11 : currentMonth - 1;
    const ly = currentMonth === 0 ? currentYear - 1 : currentYear;
    return expenses.filter((e) => {
      const d = new Date(e.date);
      return d.getMonth() === lm && d.getFullYear() === ly;
    });
  }, [expenses, currentMonth, currentYear]);

  const totalSpent = useMemo(
    () => thisMonthExpenses.reduce((sum, e) => sum + e.amount, 0),
    [thisMonthExpenses]
  );

  const lastMonthTotal = useMemo(
    () => lastMonthExpenses.reduce((sum, e) => sum + e.amount, 0),
    [lastMonthExpenses]
  );

  const remainingBudget = monthlyIncome - totalSpent;

  const categoryTotals = useMemo(() => {
    const map: Record<string, number> = {};
    thisMonthExpenses.forEach((e) => {
      map[e.category] = (map[e.category] || 0) + e.amount;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, amount]) => ({
        category: cat as Expense['category'],
        amount,
        color: CATEGORY_COLORS[cat as Expense['category']],
        label: CATEGORY_LABELS[cat as Expense['category']],
      }));
  }, [thisMonthExpenses]);

  const topCategory = categoryTotals.length > 0 ? categoryTotals[0] : null;

  const donutGradient = useMemo(() => {
    if (categoryTotals.length === 0) return 'conic-gradient(rgba(255,255,255,0.05) 0deg 360deg)';
    let accumulated = 0;
    const segments = categoryTotals.map((ct) => {
      const pct = (ct.amount / totalSpent) * 100;
      const start = accumulated;
      accumulated += pct;
      return `${ct.color} ${start}% ${accumulated}%`;
    });
    return `conic-gradient(${segments.join(', ')})`;
  }, [categoryTotals, totalSpent]);

  const top5Expenses = useMemo(
    () => [...thisMonthExpenses].sort((a, b) => b.amount - a.amount).slice(0, 5),
    [thisMonthExpenses]
  );

  const maxExpense = top5Expenses.length > 0 ? top5Expenses[0].amount : 1;

  const spendingTrend = lastMonthTotal > 0
    ? ((totalSpent - lastMonthTotal) / lastMonthTotal) * 100
    : totalSpent > 0 ? 100 : 0;

  const isSpendingUp = totalSpent > lastMonthTotal;

  const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', width: '100%' }}>
        <div className="glass-panel" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '10.5px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-2)' }}>Total Spent</span>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'var(--negative-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={14} color="var(--negative)" />
            </div>
          </div>
          <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: '22px', fontWeight: 800, color: 'var(--text-1)', fontVariantNumeric: 'tabular-nums' }}>
            ${fmt(totalSpent)}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>This month</span>
        </div>

        <div className="glass-panel" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '10.5px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-2)' }}>Remaining</span>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: remainingBudget >= 0 ? 'var(--positive-subtle)' : 'var(--negative-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={14} color={remainingBudget >= 0 ? 'var(--positive)' : 'var(--negative)'} />
            </div>
          </div>
          <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: '22px', fontWeight: 800, color: remainingBudget >= 0 ? 'var(--positive)' : 'var(--negative)', fontVariantNumeric: 'tabular-nums' }}>
            ${fmt(remainingBudget)}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>Of ${fmt(monthlyIncome)}</span>
        </div>

        <div className="glass-panel" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '10.5px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-2)' }}>Top Category</span>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: topCategory ? `${topCategory.color}20` : 'var(--accent-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PieChart size={14} color={topCategory?.color || 'var(--accent)'} />
            </div>
          </div>
          <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: '16px', fontWeight: 700, color: 'var(--text-1)' }}>
            {topCategory ? topCategory.label : 'None'}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>
            {topCategory ? `$${fmt(topCategory.amount)} spent` : 'No expenses'}
          </span>
        </div>
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', width: '100%' }}>

        {/* Donut Chart */}
        <div className="glass-panel" style={{ padding: '18px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: '14px', fontWeight: 700, color: 'var(--text-1)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PieChart size={16} color="var(--accent)" />
            Category Breakdown
          </div>

          {categoryTotals.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', color: 'var(--text-3)', fontSize: '13px' }}>
              No expenses this month
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <div style={{ position: 'relative', width: '140px', height: '140px', flexShrink: 0 }}>
                <div style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  background: donutGradient,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <div style={{
                    width: '84px',
                    height: '84px',
                    borderRadius: '50%',
                    background: 'var(--surface-2)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: '18px', fontWeight: 800, color: 'var(--text-1)', lineHeight: 1 }}>
                      ${fmt(totalSpent)}
                    </span>
                    <span style={{ fontSize: '9px', color: 'var(--text-3)', marginTop: '2px' }}>total</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minWidth: 0 }}>
                {categoryTotals.map((ct) => {
                  const pct = totalSpent > 0 ? (ct.amount / totalSpent) * 100 : 0;
                  return (
                    <div key={ct.category} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '3px', background: ct.color, flexShrink: 0 }} />
                      <span style={{ fontSize: '11.5px', color: 'var(--text-2)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ct.label}
                      </span>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-3)', fontVariantNumeric: 'tabular-nums' }}>
                        {pct.toFixed(0)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Spending Trend */}
        <div className="glass-panel" style={{ padding: '18px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: '14px', fontWeight: 700, color: 'var(--text-1)', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart3 size={16} color="var(--accent)" />
              Monthly Trend
            </span>
            <span style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              fontSize: '11px', fontWeight: 600,
              color: isSpendingUp ? 'var(--negative)' : 'var(--positive)',
              background: isSpendingUp ? 'var(--negative-subtle)' : 'var(--positive-subtle)',
              padding: '3px 8px', borderRadius: '8px',
            }}>
              {isSpendingUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {Math.abs(spendingTrend).toFixed(1)}%
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>This Month</span>
                <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: '20px', fontWeight: 800, color: 'var(--text-1)', fontVariantNumeric: 'tabular-nums' }}>
                  ${fmt(totalSpent)}
                </span>
              </div>
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${monthlyIncome > 0 ? Math.min((totalSpent / monthlyIncome) * 100, 100) : 0}%`,
                  background: 'var(--accent-gradient)',
                  borderRadius: '4px',
                  transition: 'width 0.6s cubic-bezier(0.25, 1, 0.5, 1)',
                }} />
              </div>
              <span style={{ fontSize: '10.5px', color: 'var(--text-3)' }}>
                {monthlyIncome > 0 ? `${((totalSpent / monthlyIncome) * 100).toFixed(0)}%` : '0%'} of income
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Last Month</span>
                <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: '20px', fontWeight: 800, color: 'var(--text-2)', fontVariantNumeric: 'tabular-nums' }}>
                  ${fmt(lastMonthTotal)}
                </span>
              </div>
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${monthlyIncome > 0 ? Math.min((lastMonthTotal / monthlyIncome) * 100, 100) : 0}%`,
                  background: 'var(--surface-3)',
                  borderRadius: '4px',
                  transition: 'width 0.6s cubic-bezier(0.25, 1, 0.5, 1)',
                }} />
              </div>
              <span style={{ fontSize: '10.5px', color: 'var(--text-3)' }}>
                {monthlyIncome > 0 ? `${((lastMonthTotal / monthlyIncome) * 100).toFixed(0)}%` : '0%'} of income
              </span>
            </div>
          </div>

          <div style={{
            marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: '6px',
            fontSize: '11.5px', color: 'var(--text-3)',
          }}>
            {isSpendingUp ? (
              <>
                <TrendingUp size={13} color="var(--negative)" />
                <span>Spending increased by <strong style={{ color: 'var(--negative)' }}>${fmt(totalSpent - lastMonthTotal)}</strong> vs last month</span>
              </>
            ) : (
              <>
                <TrendingDown size={13} color="var(--positive)" />
                <span>Spending decreased by <strong style={{ color: 'var(--positive)' }}>${fmt(lastMonthTotal - totalSpent)}</strong> vs last month</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Top 5 Expenses Bar Chart */}
      <div className="glass-panel" style={{ padding: '18px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: '14px', fontWeight: 700, color: 'var(--text-1)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BarChart3 size={16} color="var(--accent)" />
          Top 5 Expenses
        </div>

        {top5Expenses.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 20px', color: 'var(--text-3)', fontSize: '13px' }}>
            No expenses this month
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {top5Expenses.map((exp, idx) => (
              <div key={exp.id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{
                  fontSize: '11px', fontWeight: 700, color: 'var(--text-3)',
                  width: '18px', textAlign: 'right', fontVariantNumeric: 'tabular-nums',
                }}>
                  {idx + 1}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {exp.name}
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: CATEGORY_COLORS[exp.category], fontVariantNumeric: 'tabular-nums', marginLeft: '8px', flexShrink: 0 }}>
                      ${fmt(exp.amount)}
                    </span>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${maxExpense > 0 ? (exp.amount / maxExpense) * 100 : 0}%`,
                      background: CATEGORY_COLORS[exp.category],
                      borderRadius: '4px',
                      transition: 'width 0.5s cubic-bezier(0.25, 1, 0.5, 1)',
                      opacity: 0.85,
                    }} />
                  </div>
                  <div style={{ display: 'flex', gap: '6px', marginTop: '3px' }}>
                    <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', background: `${CATEGORY_COLORS[exp.category]}18`, color: CATEGORY_COLORS[exp.category], fontWeight: 600 }}>
                      {CATEGORY_LABELS[exp.category]}
                    </span>
                    {exp.recurring && (
                      <span className="recurring-badge">Recurring</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpenseCharts;
