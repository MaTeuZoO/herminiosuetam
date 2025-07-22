import React from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';

/**
 * Componente para renderizar uma pílula de tarefa compacta para a visão de calendário.
 */
const TaskPill = ({ task, project }) => {
    // Tenta obter uma cor do projeto, com um fallback.
    const bgColor = project?.color || '#a855f7'; // Roxo como fallback
    const textColor = '#ffffff';

    return (
        <div 
            style={{ backgroundColor: bgColor, color: textColor }}
            className="text-xs font-semibold px-2 py-1 rounded-md truncate"
            title={task.title}
        >
            {task.title}
        </div>
    );
};


/**
 * Componente para renderizar uma única célula de dia no calendário mensal.
 */
const CalendarDayCell = ({ date, tasks, isCurrentMonth, ...props }) => {
    const today = new Date();
    const isToday = date.getFullYear() === today.getFullYear() &&
                    date.getMonth() === today.getMonth() &&
                    date.getDate() === today.getDate();

    const dateString = date.toISOString().split('T')[0];

    return (
        <div 
            className={`rounded-lg border flex flex-col
                ${isCurrentMonth ? 'bg-white' : 'bg-slate-50'}
                ${isToday ? 'border-violet-500' : 'border-slate-200'}
            `}
        >
            <div className="p-2 text-sm font-semibold">
                <span className={`
                    ${isToday ? 'bg-violet-500 text-white' : isCurrentMonth ? 'text-slate-700' : 'text-slate-400'}
                    rounded-full w-7 h-7 flex items-center justify-center
                `}>
                    {date.getDate()}
                </span>
            </div>
            
            <Droppable droppableId={dateString}>
                {(provided, snapshot) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-1 p-1 space-y-1 overflow-y-auto custom-scrollbar transition-colors
                            ${snapshot.isDraggingOver ? 'bg-violet-50' : 'bg-transparent'}
                        `}
                    >
                        {tasks.map((task, index) => (
                             <Draggable key={task.id} draggableId={task.id.toString()} index={index}>
                                {(provided) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        onClick={() => props.onTaskClick(task)}
                                    >
                                        <TaskPill
                                            task={task}
                                            project={task.projects} // Assumindo que a task enriquecida tem a info do projeto
                                        />
                                    </div>
                                )}
                            </Draggable>
                        ))}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </div>
    );
};

export default CalendarDayCell;
