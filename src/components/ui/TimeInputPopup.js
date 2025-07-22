import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { formatSecondsToHHMM } from '../../utils/time';

// --- Animation Variants (Popup and List) ---
const popupVariants = {
    hidden: { opacity: 0, y: -20, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] } },
    exit: { opacity: 0, y: -20, scale: 0.95, transition: { duration: 0.15, ease: [0.4, 0, 1, 1] } },
};

const listContainerVariants = {
    hidden: {},
    visible: {
        transition: {
            delayChildren: 0.05, // A small delay before the cascade starts
            staggerChildren: 0.04, // The time between each item's animation
        },
    },
};

// --- Item Component with "Wave" and "Magic Ink" Animation ---
const QuickTimeItem = ({ timeString, onSelect, isHovered, setHoveredTime }) => {
    // State to manage the position and visibility of the "ink" effect.
    // We store the position and a unique key to re-trigger the animation on each hover.
    const [inkPosition, setInkPosition] = useState(null);

    // 1. The variants that define the item's states (unchanged).
    const itemVariants = {
        // Initial state for the cascading load
        hidden: { opacity: 0, y: 10 },
        // Rest state (visible, but not hovered)
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            color: "#475569", // slate-600
            backgroundColor: 'rgba(254, 243, 199, 0)', // amber-100 transparent
            boxShadow: "0px 1px 2px rgba(0,0,0,0)",
            zIndex: 1,
        },
        // Hover state (the item "lifts")
        hover: {
            y: -5,
            scale: 1.1,
            color: "#92400e", // amber-800
            backgroundColor: 'rgba(254, 243, 199, 1)', // amber-100 opaque
            zIndex: 2,
            boxShadow: "0px 5px 15px rgba(0,0,0,0.1)",
        }
    };

    // Handler for when the mouse enters the button area.
    const handleMouseEnter = (event) => {
        // Activate the hover state in the parent component (for the "wave" effect).
        setHoveredTime(timeString);

        // Calculate the mouse position relative to the button.
        const rect = event.currentTarget.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // Set the ink's position and a unique key to restart the animation.
        setInkPosition({ x, y, key: Date.now() });
    };

    return (
        <motion.button
            // Add relative positioning and hide overflow to contain the ink effect.
            className="relative w-full text-center px-2 py-1.5 text-sm font-medium rounded-lg overflow-hidden"
            
            // The existing "wave" animation is maintained.
            animate={isHovered ? "hover" : "visible"}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            variants={itemVariants}
            
            // New mouse trigger for the ink effect.
            onMouseEnter={handleMouseEnter}
            
            // Existing triggers.
            onClick={() => onSelect(timeString)}
            whileTap={{ scale: 1.05, y: -3 }}
        >
            {/* Magic Ink Effect Container */}
            <AnimatePresence>
                {inkPosition && (
                    <motion.span
                        key={inkPosition.key}
                        style={{
                            position: 'absolute',
                            backgroundColor: 'rgba(253, 224, 71, 0.6)', // amber-400 with opacity
                            borderRadius: '50%',
                            left: inkPosition.x,
                            top: inkPosition.y,
                            // Center the ink's origin on the cursor.
                            x: '-50%',
                            y: '-50%',
                        }}
                        initial={{ scale: 0, opacity: 1 }}
                        animate={{ scale: 15, opacity: 0 }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        // Remove the element from the DOM after the animation completes.
                        onAnimationComplete={() => setInkPosition(null)}
                    />
                )}
            </AnimatePresence>

            {/* The text content needs a relative z-index to appear above the ink. */}
            <span className="relative z-10">
                {timeString}
            </span>
        </motion.button>
    );
};


// --- Main Popup Component ---
const TimeInputPopup = ({ onSelect, onClose, initialValue = 0, parentRect }) => {
    // Central state that controls which item is hovered.
    const [hoveredTime, setHoveredTime] = useState(null);
    const [inputValue, setInputValue] = useState('');
    const [position, setPosition] = useState({ top: 0, left: 0, opacity: 0 });
    const [isVisible, setIsVisible] = useState(true);
    const popupRef = useRef(null);

    useLayoutEffect(() => {
        if (parentRect && popupRef.current) {
            const popupRect = popupRef.current.getBoundingClientRect();
            let top = parentRect.bottom + 8;
            if (top + popupRect.height > window.innerHeight - 10) {
                top = parentRect.top - popupRect.height - 8;
            }
            let left = parentRect.left + (parentRect.width / 2) - (popupRect.width / 2);
            left = Math.max(16, left);
            left = Math.min(left, window.innerWidth - popupRect.width - 16);
            setPosition({ top, left, opacity: 1 });
        }
    }, [parentRect]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (popupRef.current && !popupRef.current.contains(event.target)) {
                setIsVisible(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        setInputValue(formatSecondsToHHMM(initialValue));
    }, [initialValue]);

    const triggerClose = () => setIsVisible(false);
    const handleSelect = useCallback((value) => { onSelect(value); triggerClose(); }, [onSelect]);
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') { e.preventDefault(); handleSelect(inputValue); }
        if (e.key === 'Escape') { triggerClose(); }
    };

    const timeSuggestions = ['00:15', '00:30', '00:45', '01:00', '01:30', '02:00', '02:30', '03:00', '04:00', '05:00', '06:00', '08:00'];

    const popupUI = (
        <motion.div
            ref={popupRef} variants={popupVariants} initial="hidden" animate="visible" exit="exit"
            style={{ position: 'fixed', top: `${position.top}px`, left: `${position.left}px`, zIndex: 50, opacity: position.opacity }}
            className="w-28 bg-slate-50 rounded-xl shadow-xl border border-slate-200/70 flex flex-col"
            onClick={(e) => e.stopPropagation()}
        >
            <div className="p-1.5">
                <input id="time-input" type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={handleKeyDown} placeholder="00:00" autoFocus
                    className="w-full bg-white text-slate-800 font-medium text-center text-sm px-2 py-1 focus:outline-none rounded-md border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
                />
            </div>
            <motion.div
                variants={listContainerVariants} initial="hidden" animate="visible"
                onMouseLeave={() => setHoveredTime(null)}
                // We increase padding to give the animation room to "breathe".
                className="border-t border-slate-200/60 p-2 space-y-1 max-h-48 overflow-y-auto custom-scrollbar"
            >
                {timeSuggestions.map((time) => (
                    <QuickTimeItem
                        key={time}
                        timeString={time}
                        onSelect={handleSelect}
                        isHovered={hoveredTime === time}
                        setHoveredTime={setHoveredTime}
                    />
                ))}
            </motion.div>
        </motion.div>
    );

    return ReactDOM.createPortal(
        <AnimatePresence onExitComplete={onClose}>
            {isVisible && popupUI}
        </AnimatePresence>,
        document.body
    );
};

export default TimeInputPopup;