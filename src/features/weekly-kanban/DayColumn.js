import React, { useState, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableTaskCard } from './SortableTaskCard';

import { useTaskMutations } from './hooks/useTaskMutations';
import EmptyState from '../../components/ui/EmptyState';
import AddTaskForm from '../../components/ui/AddTaskForm';

const formatHeaderTime = (seconds) => {
    if (!seconds || seconds <= 0) return '0:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}:${m.toString().padStart(2, '0')}`;
};

const DayColumn = React.forwardRef((props, ref) => {
  const { day, tasks = [], onTaskClick, onDaySelect, isSelected, onEditTask, onDeleteTask, activeTimer, onToggleTimer, onShowContextMenu, activeId } = props;
  
  const [isAdding, setIsAdding] = useState(false);
  const { createTask } = useTaskMutations();

  const { totalSpent, totalPlanned } = useMemo(() => {
    return tasks.reduce((acc, task) => {
        acc.totalSpent += task.timeSpent || 0;
        acc.totalPlanned += task.timePlanned || 0;
        return acc;
    }, { totalSpent: 0, totalPlanned: 0 });
  }, [tasks]);

  const dayId = day.fullDate.toISOString().split('T')[0];
  const { setNodeRef, isOver } = useDroppable({ id: dayId });
  
  // --- A CORREÇÃO ESTÁ AQUI ---
  // Garantimos que as tarefas estão sempre ordenadas pela sua posição antes de serem usadas.
  const sortedTasks = useMemo(() => tasks.slice().sort((a, b) => (a.position ?? Infinity) - (b.position ?? Infinity)), [tasks]);
  const taskIds = useMemo(() => sortedTasks.map(t => t.id), [sortedTasks]);

  const handleCreateTask = (taskData, position) => {
    const taskPosition = position === 'top' ? 0 : sortedTasks.length;
    createTask({ 
        taskData, 
        planDate: day.fullDate, 
        position: taskPosition
    });
  };
  const handleAddTaskClick = () => setIsAdding(true);
  const handleCancelAddTask = () => setIsAdding(false);

  const completedTasks = sortedTasks.filter(task => task.completed);
  const progress = sortedTasks.length > 0 ? (completedTasks.length / sortedTasks.length) * 100 : 0;
  
  const columnBg = isSelected ? 'bg-white shadow-lg' : 'bg-transparent';
  const droppableBg = isOver ? 'bg-violet-50' : '';

  return (
    <div 
      ref={ref}
      className="h-full flex flex-col"
      onClick={() => {
        if (isAdding) {
          handleCancelAddTask();
        } else {
          onDaySelect(day);
        }
      }}
    >
      <div className={`rounded-xl h-full flex flex-col ${columnBg}`}>
        <div className="px-4 pt-4 pb-3">
          <div className="flex justify-between items-baseline mb-3">
            <h2 className="font-bold text-lg text-slate-800 flex items-baseline gap-1">
              <span>{day.name}</span>
              <span className="text-slate-400 text-sm font-medium">{day.date}</span>
            </h2>
            <div className="text-sm font-semibold text-slate-500 tabular-nums" title="Tempo Gasto / Tempo Estimado">
              <span>{formatHeaderTime(totalSpent)}</span>
              <span className="text-slate-300 mx-1">/</span>
              <span>{formatHeaderTime(totalPlanned)}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div className="bg-violet-500 h-2 rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div>
            </div>
            <span className="text-xs font-semibold text-slate-400 w-12 text-right" title="Tarefas concluídas">{`${completedTasks.length}/${sortedTasks.length}`}</span>
          </div>
        </div>
        
        <div 
          ref={setNodeRef}
          className={`flex-grow flex flex-col min-h-[100px] transition-colors rounded-b-xl ${droppableBg}`}
        >
          <SortableContext id={dayId} items={taskIds} strategy={verticalListSortingStrategy}>
            <div className="flex-grow px-2 pt-1 pb-1 overflow-y-auto custom-scrollbar">
              {sortedTasks.length === 0 && !isAdding && <EmptyState onAddTask={handleAddTaskClick} />}
              
              {sortedTasks.map((task) => (
                <SortableTaskCard
                  key={task.id}
                  task={task}
                  project={task.projects}
                  onTaskClick={onTaskClick}
                  onEdit={onEditTask}
                  onDelete={onDeleteTask}
                  activeTimer={activeTimer}
                  onToggleTimer={onToggleTimer}
                  onShowContextMenu={onShowContextMenu}
                  isDragging={activeId === task.id}
                />
              ))}
            </div>
          </SortableContext>
        </div>

        <div className="px-2 pb-2 pt-1">
          {isAdding ? (
            <div onClick={(e) => e.stopPropagation()}>
              <AddTaskForm 
                onAddTask={handleCreateTask}
                onCancel={handleCancelAddTask}
              />
            </div>
          ) : (
            sortedTasks.length > 0 && (
              <button 
                onClick={(e) => { e.stopPropagation(); handleAddTaskClick(); }} 
                className="flex items-center gap-2 w-full text-left p-2 rounded-lg text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors"
              >
                <Plus size={16} />
                <span className="text-sm font-medium">Adicionar tarefa</span>
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
});

export default DayColumn;
