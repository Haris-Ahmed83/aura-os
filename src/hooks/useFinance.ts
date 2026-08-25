import { useState, useCallback } from 'react';
import type { Expense, SavingsGoal } from '../App';
import { toast } from 'sonner';

export function useFinance() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [editExpenseId, setEditExpenseId] = useState<string | null>(null);
  const [newExpense, setNewExpense] = useState({
    name: '',
    amount: '',
    category: 'other' as Expense['category'],
    recurring: false,
  });

  const [totalFunds, setTotalFunds] = useState(0);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newGoal, setNewGoal] = useState({ name: '', targetAmount: '', color: '#3b82f6' });
  const [showAddFunds, setShowAddFunds] = useState<string | null>(null);
  const [addFundsAmount, setAddFundsAmount] = useState('');

  const addExpense = useCallback((
    name: string,
    amount: number,
    category: Expense['category'],
    recurring = false
  ) => {
    const cat = (['food', 'transport', 'health', 'entertainment', 'subscription'].includes(category)
      ? category
      : 'other') as Expense['category'];
    setExpenses(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        name: name || `Aura: ${category}`,
        amount,
        category: cat,
        date: new Date().toISOString().split('T')[0],
        recurring,
      },
    ]);
    setTotalFunds(prev => Math.max(0, prev - amount));
    toast.success(`Expense logged: Rs ${amount}`);
  }, []);

  const setIncome = useCallback((amount: number) => {
    setMonthlyIncome(amount);
    toast.success(`Income set to Rs ${amount}`);
  }, []);

  const addSavingsGoal = useCallback((name: string, targetAmount: number, color: string) => {
    setSavingsGoals(prev => [
      ...prev,
      { id: Date.now().toString(), name, targetAmount, savedAmount: 0, color },
    ]);
    setShowAddGoal(false);
    setNewGoal({ name: '', targetAmount: '', color: '#3b82f6' });
    toast.success(`Savings goal "${name}" created!`);
  }, []);

  const addFundsToGoal = useCallback((goalId: string, amount: number) => {
    setSavingsGoals(prev =>
      prev.map(g =>
        g.id === goalId ? { ...g, savedAmount: g.savedAmount + amount } : g
      )
    );
    setTotalFunds(prev => prev + amount);
    setShowAddFunds(null);
    setAddFundsAmount('');
    toast.success(`Added Rs ${amount} to goal!`);
  }, []);

  const deleteExpense = useCallback((id: string) => {
    const expense = expenses.find(e => e.id === id);
    if (expense) {
      setTotalFunds(prev => prev + expense.amount);
    }
    setExpenses(prev => prev.filter(e => e.id !== id));
    toast.success('Expense deleted');
  }, [expenses]);

  const updateExpense = useCallback((id: string, updates: Partial<Expense>) => {
    setExpenses(prev => prev.map(e => (e.id === id ? { ...e, ...updates } : e)));
  }, []);

  const deleteGoal = useCallback((id: string) => {
    setSavingsGoals(prev => prev.filter(g => g.id !== id));
    toast.success('Goal deleted');
  }, []);

  const getTotalSpent = useCallback((monthStr?: string) => {
    const currentMonth = monthStr || new Date().toISOString().substring(0, 7);
    return expenses
      .filter(e => e.recurring || e.date.startsWith(currentMonth))
      .reduce((s, e) => s + e.amount, 0);
  }, [expenses]);

  const getRemainingFunds = useCallback(() => {
    const currentMonth = new Date().toISOString().substring(0, 7);
    const totalSpent = expenses
      .filter(e => e.recurring || e.date.startsWith(currentMonth))
      .reduce((s, e) => s + e.amount, 0);
    return totalFunds + monthlyIncome - totalSpent;
  }, [expenses, totalFunds, monthlyIncome]);

  return {
    expenses,
    setExpenses,
    showAddExpense,
    setShowAddExpense,
    editExpenseId,
    setEditExpenseId,
    newExpense,
    setNewExpense,
    totalFunds,
    setTotalFunds,
    monthlyIncome,
    setMonthlyIncome,
    savingsGoals,
    setSavingsGoals,
    showAddGoal,
    setShowAddGoal,
    newGoal,
    setNewGoal,
    showAddFunds,
    setShowAddFunds,
    addFundsAmount,
    setAddFundsAmount,
    addExpense,
    setIncome,
    addSavingsGoal,
    addFundsToGoal,
    deleteExpense,
    updateExpense,
    deleteGoal,
    getTotalSpent,
    getRemainingFunds,
  };
}