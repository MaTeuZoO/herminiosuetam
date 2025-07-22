import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';

const AnimatedCheckbox = ({ completed, onToggle, size = 5, radius = 'md', thick = false }) => {
    const checkboxRef = useRef(null);

    const handleToggle = (e) => {
        e.stopPropagation();
        if (!completed) {
            const rect = checkboxRef.current.getBoundingClientRect();
            const origin = {
                x: (rect.left + rect.width / 2) / window.innerWidth,
                y: (rect.top + rect.height / 2) / window.innerHeight,
            };
            confetti({
                particleCount: 80,
                spread: 60,
                origin: origin,
                colors: ['#8b5cf6', '#a78bfa', '#c4b5fd', '#facc15'],
            });
        }
        onToggle(e);
    };

    const sizeClass = size === 6 ? 'w-7 h-7' : 'w-5 h-5';
    const svgSizeClass = size === 6 ? 'w-4 h-4' : 'w-3.5 h-3.5';
    const radiusClass = radius === 'lg' ? 'rounded-lg' : 'rounded-md';
    const borderClass = thick ? 'border-[2px]' : 'border-2';

    return (
        <button
            ref={checkboxRef}
            onClick={handleToggle}
            className={`${sizeClass} ${radiusClass} ${borderClass} flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                completed
                    ? 'bg-green-500 border-green-500'
                    // --- CORREÇÃO AQUI: A classe 'group-hover' foi removida ---
                    : 'border-slate-300 hover:border-violet-500'
            }`}
            aria-label={completed ? "Marcar como incompleta" : "Marcar como completa"}
        >
            <svg className={svgSizeClass} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <motion.path
                    d="M5 13L9 17L19 7"
                    stroke="white"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: completed ? 1 : 0 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                />
            </svg>
        </button>
    );
};

export default AnimatedCheckbox;
