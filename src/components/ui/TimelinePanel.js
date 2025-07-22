import React, { useEffect, useState, useRef } from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { Calendar, X } from 'lucide-react';

const TimelinePanel = ({ selectedDay, tasks, projectColors, onClose }) => {
    const [currentTimePosition, setCurrentTimePosition] = useState(0);
    const [isToday, setIsToday] = useState(false);
    const containerRef = useRef(null);
    const panelRef = useRef(null);

    // Constantes de layout para a timeline
    const HOUR_HEIGHT = 48;
    const PIXELS_PER_MINUTE = 0.8;
    const hours = Array.from({ length: 24 }, (_, i) => i);

    // Efeito para fechar o painel se clicar fora dele
    useEffect(() => {
        function handleClickOutside(event) {
            if (panelRef.current && !panelRef.current.contains(event.target)) {
                onClose();
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [panelRef, onClose]);


    // Efeito para verificar se é hoje e definir a linha do tempo atual
    useEffect(() => {
        const today = new Date();
        const todayDateString = today.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        const isCurrentDay = selectedDay.date === todayDateString;
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

    // Efeito para rolar a timeline para uma hora útil
    useEffect(() => {
        if (containerRef.current) {
            const targetTime = isToday ? new Date().getHours() : 8;
            const scrollTo = Math.max(0, (targetTime * HOUR_HEIGHT) - (HOUR_HEIGHT * 2));
            containerRef.current.scrollTop = scrollTo;
        }
    }, [isToday]);

    // Função para calcular o estilo dos blocos de tarefa
    const getTaskStyle = (task) => {
        if (!task.start_time) return { display: 'none' };
        const [startHour, startMinute] = task.start_time.split(':').map(Number);
        const duration = task.estimated_time || 30;
        const top = (startHour * 60 + startMinute) * PIXELS_PER_MINUTE;
        const height = Math.max(duration * PIXELS_PER_MINUTE, 10);
        const projectColor = projectColors[task.project_id] || '#A855F7';
        return {
            top: `${top}px`,
            height: `${height}px`,
            backgroundColor: `${projectColor}26`,
            borderLeft: `3px solid ${projectColor}`,
        };
    };

    return (
        // O painel é posicionado de forma fixa, à direita da barra de ferramentas
        <div ref={panelRef} className="fixed top-0 right-16 h-full w-72 bg-white border-l border-slate-200 shadow-2xl flex flex-col z-40">
            {/* Cabeçalho do Painel */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
                <div className="flex items-center gap-2">
                    <Calendar size={18} className="text-blue-500" />
                    <h3 className="font-semibold text-slate-800">Timeline do Dia</h3>
                </div>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100">
                    <X size={18} className="text-slate-500" />
                </button>
            </div>

            {/* Sub-cabeçalho com a data */}
            <div className="p-3 text-center border-b border-slate-200 bg-slate-50">
                <span className="font-bold text-lg text-slate-800">{selectedDay.dayOfMonth}</span>
                <span className="font-semibold text-sm text-slate-500 ml-2">{selectedDay.dayName}, {selectedDay.date}</span>
            </div>

            {/* Corpo da Timeline */}
            <div ref={containerRef} className="flex-grow overflow-y-auto custom-scrollbar relative">
                {isToday && (
                     <div className="absolute w-full z-30" style={{ top: `${currentTimePosition}px` }}>
                        <div className="relative h-px bg-red-500">
                            <div className="absolute -left-1.5 -top-1.5 w-3 h-3 bg-red-500 rounded-full"></div>
                        </div>
                    </div>
                )}
               
                {hours.map(hour => (
                    <div key={hour} className="relative" style={{ height: `${HOUR_HEIGHT}px`}}>
                        <div className="absolute top-0 left-12 w-full border-b border-slate-100"></div>
                        <div className="absolute top-1/2 left-12 w-full border-b border-dotted border-slate-200"></div>
                        <span className="absolute -top-2.5 left-2 text-xs text-slate-400 bg-white px-1 z-10">
                            {`${hour.toString().padStart(2, '0')}:00`}
                        </span>
                        <Droppable droppableId={`timeline-${hour}-00`}>{(provided) => <div ref={provided.innerRef} {...provided.droppableProps} className="absolute top-0 left-12 right-0 h-1/2 z-0"></div>}</Droppable>
                        <Droppable droppableId={`timeline-${hour}-30`}>{(provided) => <div ref={provided.innerRef} {...provided.droppableProps} className="absolute top-1/2 left-12 right-0 h-1/2 z-0"></div>}</Droppable>
                    </div>
                ))}

                {tasks.map(task => (
                    <div 
                        key={task.id} 
                        className="absolute left-14 right-2 p-1 rounded z-20 overflow-hidden"
                        style={getTaskStyle(task)}
                    >
                        <p className="text-xs font-bold text-slate-800 truncate">{task.title}</p>
                        <p className="text-[10px] text-slate-600 truncate">{task.project_name || ''}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TimelinePanel;
