import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Save, X, Calendar, Hash } from 'lucide-react';

// Funções de utilidade de tempo (mantidas as mesmas)
const parseDurationToSeconds = (str) => {
    let totalMinutes = 0;
    const hoursMatch = str.match(/(\d+)\s*h/);
    const minutesMatch = str.match(/(\d+)\s*m/);
    if (hoursMatch) totalMinutes += parseInt(hoursMatch[1]) * 60;
    if (minutesMatch) totalMinutes += parseInt(minutesMatch[1]);
    return (totalMinutes || 30) * 60;
};

const formatSecondsToDuration = (seconds) => {
    const minutes = Math.round(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (hours > 0 && remainingMinutes > 0) return `${hours}h ${remainingMinutes}m`;
    if (hours > 0) return `${hours}h`;
    if (remainingMinutes > 0) return `${remainingMinutes}m`;
    return '0m';
};

const formatTimeRange = (startTime, durationSeconds) => {
    if (!startTime) return '';
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const start = new Date(1970, 0, 1, startHour, startMinute);
    const end = new Date(start.getTime() + durationSeconds * 1000);
    const endTime = `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`;
    return `${startTime} - ${endTime}`;
};


const QuickCreateForm = ({ top, initialTime, selectedDay, onCreate, onCancel }) => {
    const [title, setTitle] = useState('');
    const [durationInput, setDurationInput] = useState('30m');
    const formRef = useRef(null);

    useEffect(() => {
        formRef.current?.querySelector('input[type="text"]')?.focus();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (formRef.current && !formRef.current.contains(event.target)) {
                onCancel();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onCancel]);

    const handleSubmit = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (!title.trim()) {
            alert('O título da tarefa é obrigatório!');
            return;
        }

        const durationInSeconds = parseDurationToSeconds(durationInput);
        
        onCreate({
            title: title.trim(),
            initialTime: initialTime,
            planned_time_seconds: durationInSeconds
        });
    };

    const calculatedDurationSeconds = parseDurationToSeconds(durationInput);
    const timeRange = formatTimeRange(initialTime, calculatedDurationSeconds);

    return (
        <motion.div 
            ref={formRef} 
            style={{ top: `${top}px` }} 
            className="absolute left-14 right-2 z-40" 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            exit={{ opacity: 0, scale: 0.95 }} 
            transition={{ duration: 0.15 }}
            onClick={e => e.stopPropagation()} 
            onMouseMove={e => e.stopPropagation()}
        >
            <div className="bg-white rounded-lg shadow-lg text-sm overflow-hidden"> {/* Sombra mais suave, sem borda externa */}
                <form onSubmit={handleSubmit}>
                    <div className="px-4 pt-4 pb-2"> {/* Padding horizontal, top, e um pouco menos no bottom */}
                        <input 
                            type="text" 
                            value={title} 
                            onChange={(e) => setTitle(e.target.value)} 
                            placeholder="Título da tarefa..." 
                            className="w-full focus:outline-none text-base font-semibold placeholder-slate-400 border-b border-transparent focus:border-blue-400 transition-colors pb-1" // Voltou para text-base, font-semibold, borda mais fina no foco
                            spellCheck="false" 
                        />
                    </div>
                    <div className="px-4 py-3 space-y-2 text-slate-700 border-b border-slate-100"> {/* Padding ajustado, space-y menor, e borda divisória aqui */}
                        <div className="flex items-center">
                            <Calendar size={16} className="text-slate-500 mr-2 flex-shrink-0" /> {/* Ícone menor, cor neutra */}
                            <span className="flex-grow text-slate-700">{selectedDay.name}, {selectedDay.date}</span>
                            <span className="text-slate-800 font-medium tabular-nums">{timeRange}</span> {/* font-medium */}
                        </div>
                         <div className="flex items-center">
                            <Clock size={16} className="text-slate-500 mr-2 flex-shrink-0" /> {/* Ícone menor, cor neutra */}
                            <input 
                                type="text" 
                                value={durationInput} 
                                onChange={(e) => setDurationInput(e.target.value)} 
                                className="w-full text-sm p-1 bg-transparent rounded-md focus:outline-none border-b border-transparent focus:border-blue-400 transition-colors" // Fundo transparente, borda inferior no foco
                                placeholder="ex: 1h 30m" 
                                spellCheck="false" 
                            />
                        </div>
                        <div className="flex items-center">
                            <Hash size={16} className="text-slate-500 mr-2 flex-shrink-0" /> {/* Ícone menor, cor neutra */}
                            <button type="button" className="text-blue-500 hover:underline transition-colors text-sm">Adicionar projeto</button> 
                        </div>
                    </div>
                    <div className="bg-slate-50 px-4 py-3 flex justify-end items-center gap-2"> {/* Padding e gap ajustados, sem borda top aqui */}
                        <button type="button" onClick={onCancel} className="px-3 py-1 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-md transition-colors">Cancelar</button> {/* Estilo mais discreto */}
                        <button type="submit" className="px-4 py-1 text-sm font-semibold text-white bg-blue-500 hover:bg-blue-600 rounded-md transition-colors shadow-sm">Salvar</button> 
                    </div>
                </form>
            </div>
        </motion.div>
    );
};

export default QuickCreateForm;