import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Play, Pause, Trash2, Check } from 'lucide-react';
import { formatDisplayTime, formatPlannedTime, parseTimeInput } from '../../utils/time';
import TimeInputPopup from './TimeInputPopup';
import AnimatedCheckbox from './AnimatedCheckbox';
import { useTaskMutations } from '../../features/weekly-kanban/hooks/useTaskMutations';
import { useSubtaskMutations } from '../../features/weekly-kanban/hooks/useSubtaskMutations';

const usePrevious = (value) => {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
};

const TaskCard = ({ task, project, onTaskClick, onEdit, onDelete, activeTimer, onToggleTimer }) => {
  const { updateTask } = useTaskMutations();
  const { upsertTimeEntry } = useSubtaskMutations();

  const [editingTime, setEditingTime] = useState(null);
  const [isExitingGreen, setIsExitingGreen] = useState(false);
  const [isDeleteVisible, setIsDeleteVisible] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const isRunning = (activeTimer?.taskId === task.id && activeTimer?.subtaskId === null) || task.subtasks?.some(s => s.id === activeTimer?.subtaskId);
  const prevIsRunning = usePrevious(isRunning);
  
  const shouldAnimateEntrance = isRunning && prevIsRunning === false;

  const projectColor = project?.color || '#94a3b8';
  const totalSubtasks = task.subtasks?.length || 0;
  const completedSubtasks = task.subtasks?.filter(s => s.completed).length || 0;
  const nextSubtask = task.subtasks?.find(s => !s.completed);
  const timeProgress = task.timePlanned > 0 ? (task.timeSpent / task.timePlanned) * 100 : 0;
  const cappedTimeProgress = Math.min(timeProgress, 100);
  const isOvertime = timeProgress > 100;

  const COLOR_GREEN = '#16a34a';
  const COLOR_RED = '#ef4444';
  const COLOR_AMBER = '#f59e0b';
  
  const activeColor = isRunning && isOvertime ? COLOR_RED : COLOR_AMBER;
  const finalBorderLeftColor = (task.completed || isExitingGreen) ? COLOR_GREEN : isRunning ? activeColor : projectColor;

  const hasSubtaskWithPlannedTime = task.subtasks?.some(sub => sub.planned_time_seconds > 0);
  const canEditPlannedTime = !hasSubtaskWithPlannedTime;
  const displayedProject = nextSubtask?.project || project;
  const playPauseColorClass = isRunning ? (isOvertime ? 'text-red-600' : 'text-amber-600') : 'text-slate-400';
  const timeDisplayColorClass = isRunning ? (isOvertime ? 'text-red-600' : 'text-amber-600') : 'text-slate-600';
  const playPauseHoverClass = !isRunning ? 'hover:text-amber-600' : '';

  const handleInteraction = (e, action) => {
    e.stopPropagation();
    if (action) action();
  };
  
  const handleCompleteToggle = (e) => {
    handleInteraction(e, () => {
      if (!task.completed && isRunning) {
        onToggleTimer(task.id, null);
        setIsExitingGreen(true);
        setTimeout(() => setIsExitingGreen(false), 1000);
      }
      updateTask({ taskId: task.id, updatedFields: { completed: !task.completed } });
    });
  };

  const handleTimeUpdate = useCallback((timeInput) => {
    if (!editingTime) return;
    const seconds = parseTimeInput(timeInput);
    if (editingTime.type === 'planned' && canEditPlannedTime) {
      updateTask({ taskId: task.id, updatedFields: { planned_time_seconds: seconds } });
    } else if (editingTime.type === 'actual') {
      const today = new Date().toISOString().split('T')[0];
      upsertTimeEntry({ user_id: task.user_id, task_id: task.id, subtask_id: null, date: today, time_spent_seconds: seconds });
    }
    setEditingTime(null);
  }, [editingTime, task.id, task.user_id, updateTask, upsertTimeEntry, canEditPlannedTime]);

  return (
    <>
      <div
        className="w-full bg-white p-3 mb-2 rounded-lg border border-b-0 border-l-4 border-slate-200 hover:border-slate-300 hover:bg-slate-50 cursor-pointer transition-all duration-300 shadow-sm group relative overflow-hidden"
        style={{ borderLeftColor: finalBorderLeftColor }}
        onClick={() => onTaskClick(task)}
        onMouseLeave={() => {
          setIsDeleteVisible(false);
          setIsConfirmingDelete(false);
        }}
      >
        <div className="flex justify-between items-center gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <AnimatedCheckbox completed={task.completed} onToggle={handleCompleteToggle} />
            <div className="relative flex-1 min-w-0">
              <p className={`text-sm font-medium text-slate-800 truncate ${task.completed ? 'line-through text-slate-400' : ''}`} title={task.title}>
                {task.title}
              </p>
              {nextSubtask && (
                <div className="absolute top-full left-0 right-[-60px] mt-px pointer-events-none">
                  <p className="text-[11px] leading-tight text-slate-500 truncate" title={nextSubtask.title}>{nextSubtask.title}</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center flex-shrink-0">
            <div className="relative">
              <div className="flex items-center justify-end w-auto">
                {totalSubtasks > 0 && (
                  <span className="text-xs font-semibold text-slate-400 group-hover:text-slate-600 transition-colors mr-1 tabular-nums">
                    {completedSubtasks}/{totalSubtasks}
                  </span>
                )}
                <button 
                  onClick={(e) => handleInteraction(e, () => onToggleTimer(task.id, null))}
                  className={`p-1 rounded-md transition-colors duration-300 w-7 h-7 flex items-center justify-center ${playPauseColorClass} ${playPauseHoverClass}`} 
                  title={isRunning ? "Pausar cronómetro" : "Iniciar cronómetro"}
                >
                  <AnimatePresence initial={false} mode="wait">
                    <motion.span key={isRunning ? 'pause' : 'play'}>{isRunning ? <Pause size={16} /> : <Play size={16} />}</motion.span>
                  </AnimatePresence>
                </button>
                <div className="flex items-center justify-end flex-1 gap-0.5 text-xs font-bold tabular-nums">
                  <button onClick={(e) => handleInteraction(e, () => setEditingTime({ type: 'actual', rect: e.currentTarget.getBoundingClientRect() }))} className={`rounded-md transition-colors duration-300 px-1 ${timeDisplayColorClass} hover:bg-slate-200`} title="Tempo gasto">
                    {formatDisplayTime(task.timeSpent, isRunning, false)}
                  </button>
                  <span className="text-slate-300">/</span>
                  <button onClick={(e) => { if (canEditPlannedTime) handleInteraction(e, () => setEditingTime({ type: 'planned', rect: e.currentTarget.getBoundingClientRect() })); else e.stopPropagation(); }} className={`rounded-md text-slate-400 px-1 transition-all ${canEditPlannedTime ? 'hover:bg-slate-200' : 'cursor-not-allowed opacity-75'}`} title={canEditPlannedTime ? "Editar tempo planeado" : "O tempo planeado é a soma das subtarefas"}>
                    {formatPlannedTime(task.timePlanned, false)}
                  </button>
                </div>
              </div>
              {displayedProject?.name && (
                <div className="absolute top-full right-0 mt-px pointer-events-none">
                  <p className="text-[11px] font-medium leading-tight" style={{ color: displayedProject.color || '#94a3b8' }}>
                    {displayedProject.name}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <AnimatePresence>{(isRunning || isExitingGreen) && task.timePlanned > 0 && (<motion.div key="animated-border" className="absolute bottom-0 left-0 h-px" style={{ backgroundColor: finalBorderLeftColor }} initial={shouldAnimateEntrance ? { width: '0%' } : false} animate={{ width: `${cappedTimeProgress}%` }} exit={{ opacity: 0 }} transition={{ width: { ease: "easeOut", duration: 0.8 }, opacity: { duration: 0.8 } }} />)}</AnimatePresence>
        <AnimatePresence>{!isRunning && !isExitingGreen && (<motion.div key="static-border" className="absolute bottom-0 left-0 w-full h-px bg-slate-200" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8, delay: 0.2 }} />)}</AnimatePresence>

        {/* --- ÁREA DE EXCLUSÃO COM HOVER --- */}
        <div
          className="absolute top-0 right-0 h-full w-4"
          onMouseEnter={() => setIsDeleteVisible(true)}
        />
        <AnimatePresence>
          {isDeleteVisible && (
            <motion.div
              className="absolute top-0 right-0 h-full"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ ease: "easeInOut", duration: 0.3 }}
              onMouseLeave={() => setIsConfirmingDelete(false)}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (isConfirmingDelete) {
                    onDelete(task.id);
                  } else {
                    setIsConfirmingDelete(true);
                  }
                }}
                className={`flex items-center justify-center w-16 h-full rounded-r-md transition-all duration-200 ease-in-out ${
                  isConfirmingDelete
                    ? 'bg-red-600 text-white'
                    : 'bg-slate-100 text-slate-500 hover:bg-red-100 hover:text-red-500'
                }`}
                title={isConfirmingDelete ? "Confirmar exclusão" : "Excluir tarefa"}
              >
                <AnimatePresence mode="wait">
                  {isConfirmingDelete ? (
                    <motion.div key="confirm" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="flex flex-col items-center gap-0.5">
                      <Check size={18} />
                      <span className="text-[10px] font-bold">Apagar?</span>
                    </motion.div>
                  ) : (
                    <motion.div key="trash" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
                      <Trash2 size={18} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {editingTime && (<TimeInputPopup key={task.id + editingTime.type} onSelect={handleTimeUpdate} onClose={() => setEditingTime(null)} initialValue={editingTime.type === 'planned' ? task.timePlanned : task.timeSpent} parentRect={editingTime.rect} />)}
    </>
  );
};

export default TaskCard;
