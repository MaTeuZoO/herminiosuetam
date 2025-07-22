import React, { useEffect, useRef } from 'react';

const ColorPicker = ({ onSelectColor, onClose }) => {
    const pickerRef = useRef(null);

    // Paleta de cores cuidadosamente selecionada
    const colors = [
        '#ef4444', '#f97316', '#f59e0b', '#eab308',
        '#84cc16', '#22c55e', '#10b981', '#14b8a6',
        '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
        '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
    ];

    // Efeito para fechar o seletor se clicar fora dele
    useEffect(() => {
        function handleClickOutside(event) {
            if (pickerRef.current && !pickerRef.current.contains(event.target)) {
                onClose();
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [pickerRef, onClose]);

    return (
        <div ref={pickerRef} className="absolute top-full left-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-xl z-50 p-3">
            <div className="grid grid-cols-4 gap-2">
                {colors.map(color => (
                    <button
                        key={color}
                        onClick={() => {
                            onSelectColor(color);
                            onClose();
                        }}
                        className="w-8 h-8 rounded-full cursor-pointer transition-transform hover:scale-110"
                        style={{ backgroundColor: color }}
                    />
                ))}
            </div>
        </div>
    );
};

export default ColorPicker;
