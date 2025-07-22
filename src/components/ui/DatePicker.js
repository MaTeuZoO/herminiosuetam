import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const DatePicker = ({ value, onChange, onClose }) => {
    const [currentDate, setCurrentDate] = useState(value ? new Date(value) : new Date());
    const datePickerRef = useRef(null);

    // Lógica para fechar o calendário se clicar fora dele
    useEffect(() => {
        function handleClickOutside(event) {
            if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
                onClose();
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [datePickerRef, onClose]);


    const daysOfWeek = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
    const monthNames = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const handlePrevMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1));
    };

    const handleDateClick = (day) => {
        const selected = new Date(year, month, day);
        const formattedDate = selected.toISOString().split('T')[0];
        onChange(formattedDate);
        onClose();
    };

    const renderCalendar = () => {
        const blanks = Array(firstDayOfMonth).fill(null);
        const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
        const totalSlots = [...blanks, ...days];
        const rows = [];
        let cells = [];

        const today = new Date();
        const todayDate = today.getDate();
        const todayMonth = today.getMonth();
        const todayYear = today.getFullYear();

        totalSlots.forEach((slot, i) => {
            if (slot === null) {
                cells.push(<td key={`blank-${i}`}></td>);
            } else {
                const isSelected = value && new Date(value).toDateString() === new Date(year, month, slot).toDateString();
                const isToday = slot === todayDate && month === todayMonth && year === todayYear;

                cells.push(
                    // A célula da tabela agora centraliza o botão
                    <td key={`day-${slot}`} className="text-center">
                        <button
                            onClick={() => handleDateClick(slot)}
                            className={`w-9 h-9 rounded-full text-sm transition-colors font-medium mx-auto flex items-center justify-center ${
                                isSelected 
                                ? 'bg-blue-600 text-white' 
                                : isToday
                                ? 'bg-blue-100 text-blue-700'
                                : 'text-slate-700 hover:bg-slate-100'
                            }`}
                        >
                            {slot}
                        </button>
                    </td>
                );
            }

            if ((i + 1) % 7 === 0) {
                rows.push(<tr key={`row-${i}`}>{cells}</tr>);
                cells = [];
            }
        });
        if (cells.length > 0) {
            rows.push(<tr key="last-row">{cells}</tr>);
        }
        return rows;
    };

    return (
        <div ref={datePickerRef} className="absolute top-full left-0 mt-2 w-72 bg-white border border-slate-200 rounded-lg shadow-xl z-50 p-3">
            <div className="flex items-center justify-between mb-4">
                <button onClick={handlePrevMonth} className="p-1.5 rounded-full hover:bg-slate-100">
                    <ChevronLeft size={18} className="text-slate-600" />
                </button>
                <div className="font-semibold text-slate-800 text-sm">
                    {monthNames[month]} {year}
                </div>
                <button onClick={handleNextMonth} className="p-1.5 rounded-full hover:bg-slate-100">
                    <ChevronRight size={18} className="text-slate-600" />
                </button>
            </div>
            <table className="w-full">
                <thead>
                    <tr>
                        {daysOfWeek.map((day, index) => (
                            <th key={index} className="text-xs font-medium text-slate-400 pb-2 w-10 text-center">{day}</th>
                        ))}
                    </tr>
                </thead>
                <tbody className="space-y-1">
                    {renderCalendar()}
                </tbody>
            </table>
        </div>
    );
};

export default DatePicker;
