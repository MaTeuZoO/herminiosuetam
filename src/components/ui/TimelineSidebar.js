import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { PanelLeft, PanelRight, GripVertical, Clock, Save, X, Calendar, Hash, Lock, LockOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import QuickCreateForm from './QuickCreateForm'; // Certifique-se de que o caminho está correto

const HOUR_HEIGHT = 60;
const PIXELS_PER_MINUTE = HOUR_HEIGHT / 60;
const MIN_DURATION_MINUTES = 5;
const SNAP_INTERVAL_MINUTES = 15;

// Função auxiliar para formatar o tempo e calcular a hora de fim
// Esta função é usada internamente no TimelineSidebar e QuickCreateForm
const formatTimeRange = (startTime, durationSeconds) => {
    const start = new Date(`1970-01-01T${startTime}:00`);
    const end = new Date(start.getTime() + durationSeconds * 1000);
    const endTime = `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`;
    return `${startTime} - ${endTime}`;
};

const UnscheduledTaskItem = ({ task }) => {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: `unscheduled-${task.id}`,
        data: { task, type: 'unscheduled-task' },
    });
    const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 100 } : undefined;
    return (
        <div ref={setNodeRef} style={style} {...listeners} {...attributes}
             className="bg-slate-100 p-2 rounded-md cursor-grab active:cursor-grabbing shadow-sm">
            <p className="text-xs font-medium text-slate-800 truncate">{task.title}</p>
        </div>
    );
};

const ScheduledTaskBlock = ({ task, projectColors, onUpdateTask }) => {
    const [visualHeight, setVisualHeight] = useState(null);
    const taskBlockRef = useRef(null);

    const style = useMemo(() => {
        if (!task.start_time) return { display: 'none' };
        const [startHour, startMinute] = task.start_time.split(':').map(Number);
        const top = (startHour * 60 + startMinute) * PIXELS_PER_MINUTE;
        const durationInMinutes = (task.timePlanned || MIN_DURATION_MINUTES * 60) / 60;
        const height = durationInMinutes * PIXELS_PER_MINUTE;
        const projectColor = projectColors[task.project_id] || '#64748b'; // Ajustado para task.project_id
        return { top: `${top}px`, height: `${visualHeight ?? height}px`, backgroundColor: `${projectColor}26`, borderLeft: `3px solid ${projectColor}` };
    }, [task, visualHeight, projectColors]);

    const handleResizeStart = useCallback((startEvent) => {
        startEvent.preventDefault();
        startEvent.stopPropagation();
        
        const startY = startEvent.clientY;
        const initialHeight = taskBlockRef.current.offsetHeight;

        const handleMouseMove = (moveEvent) => {
            const deltaY = moveEvent.clientY - startY;
            let newHeight = initialHeight + deltaY;
            newHeight = Math.max(newHeight, MIN_DURATION_MINUTES * PIXELS_PER_MINUTE);
            setVisualHeight(newHeight);
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            
            setVisualHeight(currentVisualHeight => {
                const finalHeight = currentVisualHeight ?? initialHeight;
                const newDurationInMinutes = Math.round(finalHeight / PIXELS_PER_MINUTE / SNAP_INTERVAL_MINUTES) * SNAP_INTERVAL_MINUTES;
                const newDurationInSeconds = newDurationInMinutes * 60;

                if (newDurationInSeconds > 0 && newDurationInSeconds !== task.timePlanned) {
                    onUpdateTask({ taskId: task.id, updatedFields: { planned_time_seconds: newDurationInSeconds } });
                }
                return null;
            });
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }, [task.id, task.timePlanned, onUpdateTask]);

    return (
        <div ref={taskBlockRef} style={style} className="absolute left-14 right-2 p-1 rounded z-20 overflow-hidden group">
            <p className="text-xs font-bold text-slate-800 truncate">{task.title}</p>
            <p className="text-[10px] text-slate-600 truncate">{task.projects?.name || ''}</p>
            <div onMouseDown={handleResizeStart} className="absolute bottom-0 left-0 w-full h-4 flex items-center justify-center cursor-ns-resize opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical size={16} className="text-slate-600 pointer-events-none" />
            </div>
            {visualHeight !== null && <div className="absolute inset-0 bg-slate-500 opacity-20"></div>}
        </div>
    );
};

const TimelineSidebar = ({ timelineContainerRef, selectedDay, tasks, projectColors, isCollapsed, onToggle, onUpdateTask, onCreateTask }) => {
    const [currentTimePosition, setCurrentTimePosition] = useState(0);
    const [isToday, setIsToday] = useState(false);
    const [quickCreateState, setQuickCreateState] = useState(null);
    const [hoverTime, setHoverTime] = useState(null);
    const [isCreateModeActive, setIsCreateModeActive] = useState(false);
    const hours = Array.from({ length: 24 }, (_, i) => i);

    const { setNodeRef, isOver } = useDroppable({ id: 'timeline-drop-zone' });
    
    // Assegura que tasks.filter é seguro mesmo se tasks for undefined/null
    const scheduledTasks = useMemo(() => tasks?.filter(t => t.start_time) || [], [tasks]);
    const unscheduledTasks = useMemo(() => tasks?.filter(t => !t.start_time) || [], [tasks]);

    useEffect(() => {
        if (!selectedDay) return;
        const today = new Date();
        // Ajustado para comparar apenas a data (ignorando hora, minuto, segundo)
        const selectedDayDateOnly = new Date(selectedDay.fullDate.getFullYear(), selectedDay.fullDate.getMonth(), selectedDay.fullDate.getDate());
        const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        console.log("TimelineSidebar.js: Selected Day (fullDate):", selectedDay.fullDate);
        console.log("TimelineSidebar.js: Selected Day (DateOnly):", selectedDayDateOnly.toISOString().split('T')[0]);
        console.log("TimelineSidebar.js: Today (DateOnly):", todayDateOnly.toISOString().split('T')[0]);
        console.log("TimelineSidebar.js: Is Current Day?", selectedDayDateOnly.getTime() === todayDateOnly.getTime());

        const isCurrentDay = selectedDayDateOnly.getTime() === todayDateOnly.getTime();
        setIsToday(isCurrentDay);

        if (isCurrentDay) {
            const updateLinePosition = () => {
                const now = new Date();
                const minutesFromMidnight = now.getHours() * 60 + now.getMinutes();
                setCurrentTimePosition(minutesFromMidnight * PIXELS_PER_MINUTE);
            };
            updateLinePosition();
            const interval = setInterval(updateLinePosition, 60000);
            return () => clearInterval(interval);
        }
    }, [selectedDay]);

    useEffect(() => {
        if (timelineContainerRef.current) {
            const targetTime = isToday ? new Date().getHours() : 8;
            const scrollTo = Math.max(0, (targetTime * HOUR_HEIGHT) - (HOUR_HEIGHT * 2));
            timelineContainerRef.current.scrollTop = scrollTo;
        }
    }, [isToday, isCollapsed, selectedDay, timelineContainerRef]);

    const handleMouseMove = (e) => {
        if (quickCreateState || !isCreateModeActive) return; // Só mostra hover se o modo de criação estiver ativo
        const containerNode = timelineContainerRef.current;
        if (!containerNode) return;
        
        const rect = containerNode.getBoundingClientRect();
        const clientY = e.clientY - rect.top;
        const scrollTop = containerNode.scrollTop;
        const totalMinutes = (clientY + scrollTop) / PIXELS_PER_MINUTE;
        const snappedMinutes = Math.floor(totalMinutes / SNAP_INTERVAL_MINUTES) * SNAP_INTERVAL_MINUTES;
        
        setHoverTime({
            top: snappedMinutes * PIXELS_PER_MINUTE,
            timeString: `${String(Math.floor(snappedMinutes / 60)).padStart(2, '0')}:${String(snappedMinutes % 60).padStart(2, '0')}`
        });
    };
    
    const handleMouseLeave = () => setHoverTime(null);
    
    const handleTimelineClick = useCallback((event) => {
        if (!isCreateModeActive) { // SÓ ABRE O FORM SE O MODO DE CRIAÇÃO ESTIVER ATIVO
            console.log("TimelineSidebar: Modo de criação inativo. Não abrir formulário.");
            return;
        }
        // Calcula a posição e o tempo do clique para o formulário
        const containerNode = timelineContainerRef.current;
        if (!containerNode) {
            console.warn("TimelineSidebar: timelineContainerRef.current é null ao clicar.");
            return;
        }

        const rect = containerNode.getBoundingClientRect();
        const clickY = event.clientY - rect.top; // Posição Y relativa à área visível do container da timeline
        const scrollTop = containerNode.scrollTop; // Quanto o container foi scrollado
        
        const totalMinutes = (clickY + scrollTop) / PIXELS_PER_MINUTE;
        const snappedMinutes = Math.floor(totalMinutes / SNAP_INTERVAL_MINUTES) * SNAP_INTERVAL_MINUTES;
        
        const clickedTimeHour = String(Math.floor(snappedMinutes / 60)).padStart(2, '0');
        const clickedTimeMinute = String(snappedMinutes % 60).padStart(2, '0');
        const clickedTimeString = `${clickedTimeHour}:${clickedTimeMinute}`;

        // --- NOVA LÓGICA PARA POSICIONAMENTO DO QUICK CREATE FORM ---
        // Estime a altura do formulário. Ajuste este valor se o formulário tiver altura variável.
        // A altura foi reajustada para refletir as novas mudanças de padding (mais compacto)
        const formHeightEstimate = 180; // Ajuste esta estimativa se o form ficar maior/menor
        const containerHeight = containerNode.clientHeight; // Altura visível do container da timeline

        let calculatedFormTop = snappedMinutes * PIXELS_PER_MINUTE; // Posição inicial baseada no clique

        // Ajusta se o formulário iria sair da parte inferior da área visível
        if (calculatedFormTop + formHeightEstimate > scrollTop + containerHeight) {
            calculatedFormTop = scrollTop + containerHeight - formHeightEstimate - 10; // 10px de buffer
        }

        // Ajusta se o formulário iria sair da parte superior da área visível
        if (calculatedFormTop < scrollTop) {
            calculatedFormTop = scrollTop + 10; // 10px de buffer
        }
        
        // Garante que não vá abaixo de 0 (topo da timeline)
        calculatedFormTop = Math.max(0, calculatedFormTop);

        console.log("TimelineSidebar: Abrindo QuickCreateForm em:", { top: calculatedFormTop, initialTime: clickedTimeString });
        setQuickCreateState({ top: calculatedFormTop, initialTime: clickedTimeString }); // Usa o 'top' ajustado
        setHoverTime(null); // Esconde o hover time quando o form é aberto
    }, [isCreateModeActive, timelineContainerRef, selectedDay]);

    const handleCreateQuickTask = useCallback(async (taskData) => {
        try {
            console.log("TimelineSidebar: Chamando onCreateTask com:", taskData);
            const taskToCreate = {
                ...taskData,
                date: selectedDay.id, // selectedDay.id já é 'YYYY-MM-DD'
                start_time: taskData.initialTime, // initialTime já está no formato 'HH:MM'
            };
            await onCreateTask(taskToCreate);
            setQuickCreateState(null); // Fecha o formulário após sucesso
            setIsCreateModeActive(false); // Opcional: Desativa o modo de criação após criar a tarefa
            console.log("TimelineSidebar: Tarefa criada com sucesso e formulário fechado.");
        } catch (error) {
            console.error("TimelineSidebar: Erro ao criar tarefa:", error);
            // TODO: Adicionar feedback de erro visual
        }
    }, [onCreateTask, selectedDay]);

    const handleQuickCreateCancel = useCallback(() => {
        console.log("TimelineSidebar: QuickCreateForm cancelado.");
        setQuickCreateState(null);
        setIsCreateModeActive(false); // Desativa o modo de criação ao cancelar
    }, []);

    const toggleCreateMode = useCallback(() => {
        console.log("TimelineSidebar: Toggle modo de criação. Estado anterior:", isCreateModeActive);
        setIsCreateModeActive(prev => !prev);
        // Se o formulário estiver aberto e o modo for desativado, feche o formulário
        if (quickCreateState && isCreateModeActive) {
            setQuickCreateState(null);
            console.log("TimelineSidebar: QuickCreateForm fechado devido ao toggle do modo de criação.");
        }
    }, [quickCreateState, isCreateModeActive]);


    return (
        <div className={`flex-shrink-0 bg-white border-l border-slate-200 flex flex-col overflow-hidden ${isCollapsed ? 'w-14' : 'w-64'} transition-all duration-300 ease-in-out`}>
            <AnimatePresence initial={false} mode="wait">
                {isCollapsed ? (
                    <motion.div key="collapsed" className="flex flex-col items-center w-full h-full py-4 px-1 space-y-2">
                        <button onClick={onToggle} title="Expandir Timeline" className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-colors"><PanelLeft size={20} /></button>
                         {/* Botão para ativar/desativar o modo de criação (colapsado) */}
                        <button
                            onClick={toggleCreateMode}
                            className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${isCreateModeActive ? 'bg-blue-500 text-white hover:bg-blue-600' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'}`}
                            title={isCreateModeActive ? "Desativar modo de criação" : "Ativar modo de criação"}
                        >
                            {isCreateModeActive ? <LockOpen size={20} /> : <Lock size={20} />}
                        </button>
                    </motion.div>
                ) : (
                    <motion.div key="expanded" className="flex flex-col w-full h-full">
                        <div className="flex items-center justify-between p-3 border-b border-slate-200 flex-shrink-0">
                            {selectedDay ? (<div className="flex items-baseline gap-2"><span className="font-bold text-lg text-slate-800">{selectedDay.dayOfMonth}</span><span className="font-semibold text-sm text-slate-500">{selectedDay.dayName}</span></div>) : (<div>-</div>)}
                            <div className="flex items-center gap-2">
                                {/* Botão para ativar/desativar o modo de criação (expandido) */}
                                <button
                                    onClick={toggleCreateMode}
                                    className={`p-2 rounded-md transition-colors ${isCreateModeActive ? 'bg-blue-500 text-white hover:bg-blue-600' : 'text-slate-600 hover:bg-slate-100'}`}
                                    title={isCreateModeActive ? "Desativar modo de criação" : "Ativar modo de criação"}
                                >
                                    {isCreateModeActive ? <LockOpen size={18} /> : <Lock size={18} />}
                                </button>
                                <button onClick={onToggle} title="Minimizar Timeline" className="p-2 rounded-md text-slate-600 hover:bg-slate-100"><PanelRight size={18} /></button>
                            </div>
                        </div>

                        <div className="p-3 border-b border-slate-200 flex-shrink-0">
                            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Para Agendar ({unscheduledTasks.length})</h3>
                            <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar pr-1">
                                {unscheduledTasks.map(task => (<UnscheduledTaskItem key={task.id} task={task} />))}
                                {unscheduledTasks.length === 0 && (<p className="text-xs text-slate-400 italic">Nenhuma tarefa por agendar.</p>)}
                            </div>
                        </div>

                        <div 
                            ref={node => { setNodeRef(node); if(timelineContainerRef) timelineContainerRef.current = node; }} 
                            onMouseMove={handleMouseMove}
                            onMouseLeave={handleMouseLeave}
                            onClick={handleTimelineClick}
                            className={`flex-grow overflow-y-auto overflow-x-hidden custom-scrollbar relative 
                                ${isOver ? 'bg-violet-50' : ''} 
                                ${isCreateModeActive ? 'cursor-crosshair' : ''}`}
                        >
                            {isToday && (
                                <div className="absolute w-full z-30" style={{ top: `${currentTimePosition}px` }}>
                                    <div className="relative h-px bg-red-500">
                                        <div className="absolute -left-1.5 -top-1.5 w-3 h-3 bg-red-500 rounded-full"></div>
                                    </div>
                                </div>
                            )}
                            
                            {hours.map(hour => (<div key={hour} className="relative" style={{ height: `${HOUR_HEIGHT}px`}}><div className="absolute top-0 left-12 right-0 border-b border-slate-100"></div><div className="absolute top-1/2 left-12 right-0 border-b border-dotted border-slate-200"></div><span className="absolute -top-2.5 left-2 text-xs text-slate-400 bg-white px-1 z-10">{`${hour.toString().padStart(2, '0')}:00`}</span></div>))}
                            {scheduledTasks.map(task => (<ScheduledTaskBlock key={task.id} task={task} projectColors={projectColors} onUpdateTask={onUpdateTask} />))}
                            
                            <AnimatePresence>
                                {quickCreateState && <QuickCreateForm {...quickCreateState} selectedDay={selectedDay} onCreate={handleCreateQuickTask} onCancel={handleQuickCreateCancel} />}
                            </AnimatePresence>
                            
                            <AnimatePresence>
                            {hoverTime && !quickCreateState && isCreateModeActive && (
                                <motion.div 
                                    style={{ top: hoverTime.top }} 
                                    className="absolute left-12 right-0 flex items-center pointer-events-none" 
                                    initial={{ opacity: 0 }} 
                                    animate={{ opacity: 1 }} 
                                    exit={{ opacity: 0 }}
                                >
                                    <span className="text-xs text-red-500 font-semibold mr-2 bg-white px-1">{hoverTime.timeString}</span>
                                    <div className="flex-grow border-b border-red-500 border-dashed"></div>
                                </motion.div>
                            )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TimelineSidebar;