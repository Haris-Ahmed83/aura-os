import { useState, useCallback } from 'react';
import type { Task, TaskColumns, DropResult } from '../types';

const initialTasks: TaskColumns = {
  todo: [
    { id: '1', title: 'Build Personal Assistant App', type: 'Idea', color: 'blue' },
    { id: '2', title: 'Research Premium UI features', type: 'Idea', color: 'blue' },
  ],
  inProgress: [
    { id: '3', title: 'Integrate Drag & Drop', type: 'Active', color: 'purple' },
  ],
  completed: [
    { id: '4', title: 'Initialize Project', type: 'Done', color: 'green' },
  ],
  deleted: [],
};

export function useTasks() {
  const [tasks, setTasks] = useState<TaskColumns>(initialTasks);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedTaskColumn, setSelectedTaskColumn] = useState<keyof TaskColumns | null>(null);
  const [menuTask, setMenuTask] = useState<{ task: Task; fromCol: keyof TaskColumns } | null>(null);
  const [quickIdea, setQuickIdea] = useState('');
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [boardCategoryFilter, setBoardCategoryFilter] = useState<'All' | 'Personal' | 'Work' | 'Learning'>('All');

  const handleAddIdea = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!quickIdea.trim()) return;
    setTasks(prev => ({
      ...prev,
      todo: [{ id: Date.now().toString(), title: quickIdea, type: 'Idea', color: 'blue' }, ...prev.todo],
    }));
    setQuickIdea('');
  }, [quickIdea]);

  const handlePermanentDelete = useCallback((id: string) => {
    setTasks(prev => ({ ...prev, deleted: prev.deleted.filter(t => t.id !== id) }));
  }, []);

  const handleRestore = useCallback((id: string) => {
    const task = tasks.deleted.find(t => t.id === id);
    if (!task) return;
    setTasks(prev => ({
      ...prev,
      deleted: prev.deleted.filter(t => t.id !== id),
      todo: [{ ...task, type: 'Idea', color: 'blue' }, ...prev.todo],
    }));
  }, [tasks.deleted]);

  const handleClearDeleted = useCallback(() => {
    setTasks(prev => ({ ...prev, deleted: [] }));
  }, []);

  const onDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;
    const { source, destination } = result;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const sourceItems = [...tasks[source.droppableId as keyof TaskColumns]];
    const destItems = source.droppableId === destination.droppableId
      ? sourceItems
      : [...tasks[destination.droppableId as keyof TaskColumns]];
    const [removed] = sourceItems.splice(source.index, 1);

    if (destination.droppableId === 'inProgress') {
      removed.type = 'Active';
      removed.color = 'purple';
    } else if (destination.droppableId === 'completed') {
      removed.type = 'Done';
      removed.color = 'green';
    } else if (destination.droppableId === 'deleted') {
      removed.type = 'Deleted';
      removed.color = 'red';
    } else {
      removed.type = 'Idea';
      removed.color = 'blue';
    }

    if (source.droppableId === destination.droppableId) {
      sourceItems.splice(destination.index, 0, removed);
      setTasks({ ...tasks, [source.droppableId]: sourceItems });
    } else {
      destItems.splice(destination.index, 0, removed);
      setTasks({
        ...tasks,
        [source.droppableId]: sourceItems,
        [destination.droppableId]: destItems,
      });
    }
  }, [tasks]);

  const handleUpdateTaskDetails = useCallback((updatedTask: Task) => {
    if (!selectedTaskColumn) return;
    setTasks(prev => ({
      ...prev,
      [selectedTaskColumn]: prev[selectedTaskColumn].map(t => t.id === updatedTask.id ? updatedTask : t),
    }));
    setSelectedTask(updatedTask);
  }, [selectedTaskColumn]);

  const addTask = useCallback((title: string) => {
    setTasks(prev => ({
      ...prev,
      todo: [{ id: Date.now().toString(), title, type: 'Idea', color: 'blue' }, ...prev.todo],
    }));
  }, []);

  const moveTaskToInProgress = useCallback((titleKeyword: string) => {
    setTasks(prev => {
      const keyword = titleKeyword.toLowerCase();
      const matched = prev.todo.find(t => t.title.toLowerCase().includes(keyword));
      if (!matched) return prev;
      return {
        ...prev,
        todo: prev.todo.filter(t => t.id !== matched.id),
        inProgress: [...prev.inProgress, { ...matched, type: 'Active', color: 'purple' }],
      };
    });
  }, []);

  const moveTaskToDone = useCallback((titleKeyword: string) => {
    setTasks(prev => {
      const keyword = titleKeyword.toLowerCase();
      const matched = [...prev.todo, ...prev.inProgress].find(t => t.title.toLowerCase().includes(keyword));
      if (!matched) return prev;
      return {
        ...prev,
        todo: prev.todo.filter(t => t.id !== matched.id),
        inProgress: prev.inProgress.filter(t => t.id !== matched.id),
        completed: [{ ...matched, type: 'Done', color: 'green' }, ...prev.completed],
      };
    });
  }, []);

  return {
    tasks,
    setTasks,
    selectedTask,
    setSelectedTask,
    selectedTaskColumn,
    setSelectedTaskColumn,
    menuTask,
    setMenuTask,
    quickIdea,
    setQuickIdea,
    showQuickAddModal,
    setShowQuickAddModal,
    boardCategoryFilter,
    setBoardCategoryFilter,
    handleAddIdea,
    handlePermanentDelete,
    handleRestore,
    handleClearDeleted,
    onDragEnd,
    handleUpdateTaskDetails,
    addTask,
    moveTaskToInProgress,
    moveTaskToDone,
  };
}