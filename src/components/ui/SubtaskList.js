import React, { useState, useRef, useEffect, useMemo, memo } from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { GripVertical, Play, Pause, Trash2, Plus } from 'lucide-react';
import { formatDisplayTime, formatPlannedTime, parseTimeInput } from '../../utils/time';
import AnimatedCheckbox from './AnimatedCheckbox';
import { useSubtaskMutations } from '../../features/weekly-kanban/hooks/useSubtaskMutations';
import AddSubtaskForm from './AddSubtaskForm';

// --- 1. O item agora recebe 'isBeingDragged' para saber o seu estado ---
const SortableSubtaskItem = memo(({ sub, task, onUpdate, onDelete, onToggleTimer, activeTimer, onEditTime, onUpsertTimeEntry, isBeingDragged }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: sub.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        // Usamos a nova prop para controlar a opacidade
        opacity: isBeingDragged ? 0.5 : 1,
    };

    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [currentTitle, setCurrentTitle] = useState(sub.title);
    const titleInputRef = useRef(null);
    
    const isRunning = activeTimer?.subtaskId === sub.id;

    const handleCompleteToggle = (e) => {
        e.stopPropagation();
        if (!sub.completed && isRunning) {
            onToggleTimer(sub.task_id, sub.id);
        }
        onUpdate({ subtaskId: sub.id, updatedFields: { completed: !sub.completed } });
    };

    const handleTitleSave = () => {
        if (currentTitle.trim() && currentTitle !== sub.title) {
            onUpdate({ subtaskId: sub.id, updatedFields: { title: currentTitle.trim() } });
        } else {
            setCurrentTitle(sub.title);
        }
        setIsEditingTitle(false);
    };

    useEffect(() => {
        if (isEditingTitle) titleInputRef.current?.focus();
    }, [isEditingTitle]);

    const handleEditActualTime = (e) => {
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        onEditTime({
            rect,
            initialValue: sub.timeSpent || 0,
            onSave: (val) => {
                const today = new Date().toISOString().split('T')[0];
                onUpsertTimeEntry({ user_id: task.user_id, task_id: task.id, subtask_id: sub.id, date: today, time_spent_seconds: parseTimeInput(val) });
            }
        });
    };

    const handleEditPlannedTime = (e) => {
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        onEditTime({
            rect,
            initialValue: sub.planned_time_seconds || 0,
            onSave: (val) => onUpdate({ subtaskId: sub.id, updatedFields: { planned_time_seconds: parseTimeInput(val) } })
        });
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`flex items-center gap-2 py-2.5 px-3 rounded-lg group transition-all duration-200 border ${isBeingDragged ? 'bg-violet-100 shadow-lg border-violet-300' : 'border-transparent'} ${isRunning ? 'bg-amber-50 border-amber-200' : 'hover:bg-slate-100 hover:border-violet-300'} ${sub.completed ? 'opacity-60 hover:opacity-100' : ''}`}
        >
            <div className="flex items-center gap-1">
                <div {...attributes} {...listeners} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity -ml-1 cursor-grab" title="Reordenar subtarefa"><GripVertical size={18} /></div>
                <AnimatedCheckbox completed={sub.completed} onToggle={handleCompleteToggle} />
            </div>
            {isEditingTitle ? (
                <input ref={titleInputRef} type="text" value={currentTitle} onChange={(e) => setCurrentTitle(e.target.value)} onBlur={handleTitleSave} onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()} className="flex-grow text-base bg-white border border-violet-400 rounded-md px-1 -my-1" />
            ) : (
                <span onClick={() => setIsEditingTitle(true)} className={`flex-grow text-base leading-5 cursor-pointer ${sub.completed ? 'line-through text-slate-500' : 'text-slate-700'} ${isRunning ? 'font-semibold text-amber-700' : ''}`}>{sub.title}</span>
            )}
            <div className="flex items-center gap-1 ml-auto text-slate-500">
                <button onClick={() => onDelete(sub.id)} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" title="Excluir subtarefa"><Trash2 size={15} /></button>
                {!sub.completed && (<button onClick={() => onToggleTimer(sub.task_id, sub.id)} className={`transition-colors w-6 h-6 flex items-center justify-center rounded-md ${isRunning ? 'text-amber-600' : 'text-slate-400 opacity-0 group-hover:opacity-100 group-hover:hover:text-amber-600'}`} title="Iniciar/Pausar cronômetro">{isRunning ? <Pause size={16} /> : <Play size={16} />}</button>)}
                <div className="flex items-center gap-0.5 text-sm font-medium tabular-nums">
                    <button onClick={handleEditActualTime} className={`px-1 rounded-md transition-colors ${isRunning ? 'text-amber-600 font-semibold' : 'text-slate-600'} hover:bg-slate-200`} title="Editar tempo gasto">
                        {formatDisplayTime(sub.timeSpent || 0, isRunning, false)}
                    </button>
                    <span className="text-slate-300">/</span>
                    <button onClick={handleEditPlannedTime} className="text-slate-400 px-1 rounded-md hover:bg-slate-200 hover:text-slate-600 transition-colors" title="Editar tempo estimado">
                        {formatPlannedTime(sub.planned_time_seconds, false)}
                    </button>
                </div>
            </div>
        </div>
    );
});

// --- 2. A lista agora recebe 'activeSubtaskId' ---
const SubtaskList = ({ task, subtasks, onToggleTimer, activeTimer, onEditTime, activeSubtaskId }) => {
    const { addSubtask, updateSubtask, deleteSubtask, upsertTimeEntry } = useSubtaskMutations();
    const subtaskIds = useMemo(() => subtasks.map(s => s.id), [subtasks]);

    const [isAdding, setIsAdding] = useState(false);

    const handleCreateSubtask = (subtaskData, position) => {
        const newPosition = position === 'top' ? 0 : subtasks.length;
        
        addSubtask({
            ...subtaskData,
            task_id: task.id,
            user_id: task.user_id,
            position: newPosition,
        });
    };

    return (
        <div className="mt-8 p-4 rounded-lg bg-slate-50/70">
            <h3 className="font-semibold text-slate-800 text-base mb-2">Subtarefas</h3>
            <SortableContext items={subtaskIds} strategy={verticalListSortingStrategy}>
                <div className="space-y-1">
                    {subtasks.map((sub) => (
                        <SortableSubtaskItem
                            key={sub.id}
                            sub={sub}
                            task={task}
                            onUpdate={updateSubtask}
                            onDelete={deleteSubtask}
                            onToggleTimer={onToggleTimer}
                            activeTimer={activeTimer}
                            onEditTime={onEditTime}
                            onUpsertTimeEntry={upsertTimeEntry}
                            // --- 3. Passamos a informação para o item ---
                            isBeingDragged={activeSubtaskId === sub.id}
                        />
                    ))}
                </div>
            </SortableContext>
            <div className="mt-4">
                {isAdding ? (
                    <AddSubtaskForm 
                        onAddSubtask={handleCreateSubtask}
                        onCancel={() => setIsAdding(false)}
                    />
                ) : (
                    <button onClick={() => setIsAdding(true)} className="group flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-violet-600 transition-colors pl-1"><Plus size={16} className="text-violet-500 opacity-80 group-hover:opacity-100" /><span>Adicionar subtarefa</span></button>
                )}
            </div>
        </div>
    );
};

export default SubtaskList;
