import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { DndContext, PointerSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';

import { Trash2, X, Star, Calendar, Tag, Folder, Play, Pause, ListChecks } from 'lucide-react';
import { formatDisplayTime, formatPlannedTime, parseTimeInput } from '../../utils/time';
import DatePicker from './DatePicker';
import SubtaskList from './SubtaskList';
import AnimatedCheckbox from './AnimatedCheckbox';
import TimeInputPopup from './TimeInputPopup';
import { useTaskMutations } from '../../features/weekly-kanban/hooks/useTaskMutations';
import { useSubtaskMutations } from '../../features/weekly-kanban/hooks/useSubtaskMutations';

const MetadataRow = ({ icon, label, children, color }) => (
    <div className="group flex items-center py-3 px-2 -mx-2 rounded-lg transition-all">
        <div className={`w-10 flex-shrink-0 ${color}`}>{icon}</div>
        <div className="w-28 text-slate-600 font-medium">{label}</div>
        <div className="flex-grow relative">{children}</div>
    </div>
);

const TaskDetailModal = ({ task, project, subtasks, onClose, onDeleteTask, activeTimer, onToggleTimer }) => {
    const { updateTask } = useTaskMutations();
    const { upsertTimeEntry, updateSubtaskOrder } = useSubtaskMutations();

    const [title, setTitle] = useState(task.title);
    const [description, setDescription] = useState(task.description || '');
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const [editingTime, setEditingTime] = useState(null);
    const [activeSubtaskId, setActiveSubtaskId] = useState(null);

    const [localSubtasks, setLocalSubtasks] = useState([]);

    useEffect(() => {
        setLocalSubtasks(subtasks.sort((a, b) => (a.position ?? Infinity) - (b.position ?? Infinity)));
    }, [subtasks]);


    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        })
    );

    const handleSubtaskDragStart = (event) => {
        setActiveSubtaskId(event.active.id);
    };

    const handleSubtaskDragEnd = (event) => {
        const { active, over } = event;
        setActiveSubtaskId(null);

        if (over && active.id !== over.id) {
            const oldIndex = localSubtasks.findIndex(s => s.id === active.id);
            const newIndex = localSubtasks.findIndex(s => s.id === over.id);

            if (oldIndex !== -1 && newIndex !== -1) {
                const reordered = arrayMove(localSubtasks, oldIndex, newIndex);
                setLocalSubtasks(reordered);

                // --- A CORREÇÃO FINAL ESTÁ AQUI ---
                // Enviamos o objeto completo da subtarefa, com a nova posição.
                const updatedPositions = reordered.map((sub, index) => ({ ...sub, position: index }));
                updateSubtaskOrder(updatedPositions);
            }
        }
    };

    useEffect(() => {
        setTitle(task.title);
        setDescription(task.description || '');
    }, [task]);

    const isRunning = (activeTimer?.taskId === task.id && activeTimer?.subtaskId === null) || subtasks.some(s => s.id === activeTimer?.subtaskId);

    const handleToggleComplete = useCallback(() => {
        if (!task.completed && isRunning) {
            onToggleTimer(task.id, null);
        }
        updateTask({ taskId: task.id, updatedFields: { completed: !task.completed } });
    }, [task.id, task.completed, isRunning, onToggleTimer, updateTask]);
    
    // ... (resto do seu componente, sem alterações)
    const handleTitleBlur = useCallback(() => {
        if (title.trim() && title !== task.title) {
            updateTask({ taskId: task.id, updatedFields: { title } });
        } else {
            setTitle(task.title);
        }
    }, [title, task.id, task.title, updateTask]);

    const handleDescriptionBlur = useCallback(() => {
        if (description !== (task.description || '')) {
            updateTask({ taskId: task.id, updatedFields: { description } });
        }
    }, [description, task.id, task.description, updateTask]);

    const handleDateChange = useCallback((newDate) => {
        updateTask({ taskId: task.id, updatedFields: { due_date: newDate } });
    }, [task.id, updateTask]);

    const handleTimeUpdate = useCallback((timeInput) => {
        if (!editingTime) return;
        editingTime.onSave(timeInput);
        setEditingTime(null);
    }, [editingTime]);
    
    const formatDate = (dateString) => {
        if (!dateString) return "Definir data de conclusão";
        const date = new Date(dateString);
        date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
        return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
    };
    
    const completedSubtasks = localSubtasks.filter(s => s.completed).length;
    const totalSubtasks = localSubtasks.length;
    const progress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

    const playPauseAnimation = {
        initial: { opacity: 0, scale: 0.7 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.7 },
        transition: { duration: 0.15 }
    };

    if (!task) return null;

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" 
        onClick={onClose}
      >
        <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative w-full max-w-3xl bg-white rounded-xl shadow-2xl flex flex-col" 
            onClick={e => e.stopPropagation()}
        >
            <div className="flex items-center p-5 border-b border-slate-200">
                <AnimatedCheckbox
                    completed={task.completed}
                    onToggle={handleToggleComplete}
                    size={6}
                    radius="lg"
                    thick={true}
                />
                <input 
                    type="text" 
                    value={title} 
                    onChange={e => setTitle(e.target.value)} 
                    onBlur={handleTitleBlur} 
                    onKeyDown={e => e.key === 'Enter' && e.target.blur()} 
                    className="w-full flex-grow ml-2 text-2xl font-semibold text-slate-800 bg-transparent focus:outline-none" 
                />
                
                <div className="flex items-center ml-auto pl-4">
                    <div className="flex items-center gap-4">
                        <button onClick={() => onToggleTimer(task.id, null)} className="text-slate-500 hover:text-amber-600 transition-colors" title={isRunning ? "Pausar cronômetro" : "Iniciar cronômetro"}>
                            <AnimatePresence initial={false} mode="wait">
                                <motion.span key={isRunning ? 'pause' : 'play'} {...playPauseAnimation}>
                                    {isRunning ? <Pause size={20} /> : <Play size={20} />}
                                </motion.span>
                            </AnimatePresence>
                        </button>
                        <div className="text-center min-w-[4rem]">
                            <p className="text-[9px] font-bold text-slate-400 tracking-wider">ATUAL</p>
                            <button onClick={(e) => { const rect = e.currentTarget.getBoundingClientRect(); setEditingTime({ onSave: (val) => { const today = new Date().toISOString().split('T')[0]; upsertTimeEntry({ user_id: task.user_id, task_id: task.id, subtask_id: null, date: today, time_spent_seconds: parseTimeInput(val) }); }, initialValue: task.timeSpent, rect }); }} className={`text-base font-medium tabular-nums px-1 rounded-md transition-colors ${isRunning ? 'text-amber-600' : 'text-slate-800'} hover:bg-slate-200`}>
                                {formatDisplayTime(task.timeSpent, isRunning, true)}
                            </button>
                        </div>
                        <div className="text-center min-w-[4rem]">
                            <p className="text-[9px] font-bold text-slate-400 tracking-wider">ESTIMADO</p>
                            <button onClick={(e) => { const rect = e.currentTarget.getBoundingClientRect(); setEditingTime({ onSave: (val) => updateTask({ taskId: task.id, updatedFields: { planned_time_seconds: parseTimeInput(val) } }), initialValue: task.timePlanned, rect }); }} className="text-base font-medium text-slate-500 whitespace-nowrap px-1 rounded-md hover:bg-slate-200">
                                {formatPlannedTime(task.timePlanned, true)}
                            </button>
                        </div>
                    </div>
                    <button onClick={() => updateTask({ taskId: task.id, updatedFields: { highlighted: !task.highlighted } })} className={`p-2 ml-4 rounded-lg transition-colors ${task.highlighted ? 'text-amber-400 bg-amber-100' : 'text-slate-500 hover:bg-slate-100'}`}><Star size={20} className={task.highlighted ? 'fill-current' : ''} /></button>
                    <button onClick={onClose} className="p-2 ml-2 rounded-lg text-slate-500 hover:bg-slate-100"><X size={22} /></button>
                </div>
            </div>

            <div className="flex-grow p-6 overflow-y-auto custom-scrollbar" style={{maxHeight: '70vh'}}>
                {totalSubtasks > 0 && (
                    <div className="mb-6">
                        <div className="flex justify-between items-center mb-1 text-xs">
                            <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                                <ListChecks size={16} className="text-violet-500" />
                                <span>Progresso das Subtarefas</span>
                            </div>
                            <span className="font-semibold text-slate-600">{completedSubtasks} / {totalSubtasks}</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1.5">
                            <div className="bg-violet-500 h-1.5 rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 mb-8">
                    <div className="flex flex-col justify-between h-full">
                        <div className="divide-y divide-slate-100 -my-3">
                            <MetadataRow icon={<Folder size={18}/>} label="Projeto" color="text-blue-500"><p className="text-sm text-slate-800">{project?.name || 'Nenhum'}</p></MetadataRow>
                            <MetadataRow icon={<Calendar size={18}/>} label="Concluir em" color="text-green-500">
                                <button onClick={() => setIsDatePickerOpen(!isDatePickerOpen)} className={`text-sm rounded-md px-2 py-1 transition-colors ${task.due_date ? 'text-green-800 bg-green-100 hover:bg-green-200' : 'text-slate-600 bg-slate-100 hover:bg-slate-200'}`}>{formatDate(task.due_date)}</button>
                                {isDatePickerOpen && <DatePicker value={task.due_date} onChange={handleDateChange} onClose={() => setIsDatePickerOpen(false)} />}
                            </MetadataRow>
                            <MetadataRow icon={<Tag size={18}/>} label="Etiquetas" color="text-purple-500"><p className="text-sm text-slate-500 italic">Em breve...</p></MetadataRow>
                        </div>
                    </div>
                    <div className="h-full">
                        <textarea value={description} onChange={e => setDescription(e.target.value)} onBlur={handleDescriptionBlur} placeholder="Adicione mais detalhes..." className="w-full h-full p-3 text-sm bg-slate-100/70 border border-transparent hover:border-slate-200 transition-colors resize-none focus:outline-none focus:ring-2 focus:ring-violet-400 rounded-lg placeholder:text-slate-400"></textarea>
                    </div>
                </div>
                
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleSubtaskDragStart}
                    onDragEnd={handleSubtaskDragEnd}
                >
                    <SubtaskList 
                        task={task}
                        subtasks={localSubtasks}
                        onToggleTimer={onToggleTimer}
                        activeTimer={activeTimer}
                        onEditTime={(config) => setEditingTime(config)}
                        activeSubtaskId={activeSubtaskId}
                    />
                </DndContext>

            </div>

            <div className="p-4 bg-slate-100 border-t border-slate-200 flex justify-end rounded-b-xl">
                 <button onClick={() => {onDeleteTask(task.id); onClose();}} className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 font-medium"><Trash2 size={14} /><span>Excluir Tarefa</span></button>
            </div>
            {editingTime && (
                <TimeInputPopup
                    key={editingTime.rect.top + editingTime.rect.left}
                    onSelect={handleTimeUpdate}
                    onClose={() => setEditingTime(null)}
                    initialValue={editingTime.initialValue}
                    parentRect={editingTime.rect}
                />
            )}
        </motion.div>
      </motion.div>
    );
};

export default TaskDetailModal;
