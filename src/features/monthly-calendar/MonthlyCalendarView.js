import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import CalendarDayCell from './CalendarDayCell'; // Importa da mesma pasta

/**
 * Componente principal para a visualização em formato de calendário mensal.
 */
const MonthlyCalendarView = (props) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const tasksByDate = useMemo(() => {
        const map = new Map();
        props.enrichedPlan.forEach(task => {
            const date = task.plan_date;
            if (!map.has(date)) {
                map.set(date, []);
            }
            map.get(date).push(task);
        });
        return map;
    }, [props.enrichedPlan]);

    const monthDays = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);

        const daysInGrid = [];
        const startDayOfWeek = firstDayOfMonth.getDay();

        for (let i = 0; i < startDayOfWeek; i++) {
            const day = new Date(firstDayOfMonth);
            day.setDate(day.getDate() - (startDayOfWeek - i));
            daysInGrid.push({ date: day, isCurrentMonth: false });
        }

        for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
            daysInGrid.push({ date: new Date(year, month, i), isCurrentMonth: true });
        }

        const endDayOfWeek = lastDayOfMonth.getDay();
        for (let i = 1; i < 7 - endDayOfWeek; i++) {
            const day = new Date(lastDayOfMonth);
            day.setDate(day.getDate() + i);
            daysInGrid.push({ date: day, isCurrentMonth: false });
        }
        
        return daysInGrid;
    }, [currentDate]);

    const handlePrevMonth = () => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };

    const weekDays = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

    return (
        <div className="flex-1 flex flex-col bg-slate-100 p-4 overflow-y-auto">
            <header className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-800">
                    {currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase())}
                </h2>
                <div className="flex items-center gap-2">
                    <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-slate-200 transition-colors">
                        <ChevronLeft size={20} />
                    </button>
                    <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-slate-200 transition-colors">
                        <ChevronRight size={20} />
                    </button>
                </div>
            </header>

            <div className="flex-1 grid grid-cols-7 grid-rows-6 gap-2">
                {weekDays.map(day => (
                    <div key={day} className="text-center font-semibold text-sm text-slate-500 pb-2">
                        {day}
                    </div>
                ))}
                
                {monthDays.map(({ date, isCurrentMonth }) => {
                    const dateString = date.toISOString().split('T')[0];
                    const tasks = tasksByDate.get(dateString) || [];
                    return (
                        <CalendarDayCell
                            key={dateString}
                            date={date}
                            tasks={tasks}
                            isCurrentMonth={isCurrentMonth}
                            {...props}
                        />
                    );
                })}
            </div>
        </div>
    );
};

export default MonthlyCalendarView;
