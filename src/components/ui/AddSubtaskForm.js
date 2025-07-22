import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp, ArrowDown, Clock, Hash } from 'lucide-react';
import { parseTimeInput, formatPlannedTime } from '../../utils/time';
import TimeInputPopup from './TimeInputPopup';

// Este é o novo formulário, inspirado no AddTaskForm
const AddSubtaskForm = ({ onAddSubtask, onCancel }) => {
  const [title, setTitle] = useState('');
  const [plannedTime, setPlannedTime] = useState(0);
  const [position, setPosition] = useState('bottom');
  
  const [isTimePopupOpen, setIsTimePopupOpen] = useState(false);
  const timeButtonRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (title.trim() === '') return;

    // Apenas envia os dados relevantes para a subtarefa
    onAddSubtask({
      title: title.charAt(0).toUpperCase() + title.slice(1),
      planned_time_seconds: plannedTime,
    }, position);

    setTitle('');
    setPlannedTime(0);
    inputRef.current?.focus();
  };

  const handleTimeSelect = useCallback((timeInput) => {
    const seconds = parseTimeInput(timeInput);
    setPlannedTime(seconds);
    setIsTimePopupOpen(false);
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onCancel();
    }
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault(); 
        handleSubmit(e);
    }
  };

  const handleProjectSelectClick = () => {
      console.log("Futuramente, abrir seletor de projetos para subtarefa...");
  };

  return (
    <>
      <motion.div 
          className="p-2"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
      >
          <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="bg-white rounded-lg shadow-md border border-slate-300">
              <input
                  ref={inputRef}
                  type="text"
                  placeholder="Descreva a subtarefa e pressione Enter..."
                  className="w-full text-sm p-3 bg-transparent focus:outline-none"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
              />
              <div className="flex items-center justify-between p-2 border-t border-slate-200 bg-slate-50 rounded-b-lg">
                  <div className="flex items-center gap-2">
                      <button
                          type="button"
                          onClick={() => setPosition(pos => pos === 'top' ? 'bottom' : 'top')}
                          className="p-1.5 rounded-md text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors"
                          title={position === 'top' ? "Adicionar no topo" : "Adicionar no final"}
                      >
                          {position === 'top' ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                      </button>
                      
                      <button
                          ref={timeButtonRef}
                          type="button"
                          onClick={() => setIsTimePopupOpen(true)}
                          className="flex items-center gap-1 text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded-md p-1 transition-colors"
                      >
                          <Clock size={16} className="ml-1" />
                          <span className="text-sm font-medium tabular-nums">
                            {formatPlannedTime(plannedTime, false)}
                          </span>
                      </button>

                      <button
                          type="button"
                          onClick={handleProjectSelectClick}
                          className="flex items-center gap-1 text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded-md p-1 transition-colors"
                          title="Associar a um projeto (futuro)"
                      >
                          <Hash size={16} />
                      </button>
                  </div>
                  <button
                      type="submit"
                      className="px-3 py-1 text-sm font-semibold text-white bg-violet-500 rounded-md hover:bg-violet-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={!title.trim()}
                  >
                      Adicionar
                  </button>
              </div>
          </form>
      </motion.div>

      <AnimatePresence>
        {isTimePopupOpen && timeButtonRef.current && (
            <TimeInputPopup 
                onSelect={handleTimeSelect}
                onClose={() => setIsTimePopupOpen(false)}
                initialValue={plannedTime}
                parentRect={timeButtonRef.current.getBoundingClientRect()}
            />
        )}
      </AnimatePresence>
    </>
  );
};

export default AddSubtaskForm;
