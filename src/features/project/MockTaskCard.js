// features/project/MockTaskCard.js
import React from 'react';
import { CheckCircle, Play, MoreVertical, Calendar, Tag, Clock } from 'lucide-react';

const MockTaskCard = ({ task, project, onTaskClick }) => {
    // Estas propriedades virão dos seus dados reais da tarefa
    const hasDueDate = task.due_date;
    const hasTags = task.tags && task.tags.length > 0;
    const hasTimePlanned = task.time_planned > 0; // Se time_planned for um número > 0

    // Funções auxiliares para formatar tempo (você pode usar seu utils/time.js aqui)
    const formatTime = (seconds) => {
        if (typeof seconds !== 'number' || isNaN(seconds)) return '0:00';
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours}:${String(remainingMinutes).padStart(2, '0')}`;
    };

    return (
        <div 
            className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col gap-3"
            onClick={() => onTaskClick(task)}
        >
            {/* Linha principal: Checkbox, Título, Play/Tempo */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-grow">
                    {/* Checkbox (modelo simples) */}
                    <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 ${task.is_completed ? 'bg-green-500 border-green-500' : 'border-slate-300'}`}>
                        {task.is_completed && <CheckCircle size={16} className="text-white mx-auto my-auto" />}
                    </div>
                    {/* Título da Tarefa */}
                    <span className={`text-base font-medium text-slate-800 ${task.is_completed ? 'line-through text-slate-500' : ''}`}>
                        {task.title}
                    </span>
                </div>
                
                {/* Play e Tempo */}
                <div className="flex items-center gap-2 text-slate-500 text-sm flex-shrink-0">
                    <Play size={16} className="text-blue-500" />
                    <span>{formatTime(task.time_spent)} / {formatTime(task.time_planned)}</span> 
                </div>
            </div>

            {/* Linha de detalhes adicionais (opções) */}
            <div className="flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-3">
                    {/* Indicador de Projeto (pequeno e discreto) */}
                    {project && (
                        <div className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: project?.color || '#94a3b8' }}></span>
                            <span>{project.name}</span>
                        </div>
                    )}
                    
                    {hasDueDate && (
                        <div className="flex items-center gap-1">
                            <Calendar size={14} />
                            {/* Formate a data real aqui, por exemplo: new Date(task.due_date).toLocaleDateString() */}
                            <span>{task.due_date ? new Date(task.due_date).toLocaleDateString('pt-BR', {day: '2-digit', month: 'short'}) : 'Sem data'}</span>
                        </div>
                    )}

                    {hasTags && (
                        <div className="flex items-center gap-1">
                            <Tag size={14} />
                            <span>#{task.tags[0]}</span> {/* Exibindo apenas a primeira tag como exemplo */}
                        </div>
                    )}

                    {/* Se o tempo planejado não for exibido na linha principal, pode ser aqui */}
                    {/* {!hasTimePlanned && task.time_planned > 0 && (
                         <div className="flex items-center gap-1">
                            <Clock size={14} />
                            <span>{formatTime(task.time_planned)}</span>
                        </div>
                    )} */}
                </div>

                <button className="p-1 rounded-full hover:bg-slate-100 transition-colors">
                    <MoreVertical size={16} className="text-slate-400" />
                </button>
            </div>
        </div>
    );
};

export default MockTaskCard;