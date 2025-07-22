import React from 'react';
import { Sun } from 'lucide-react';

const EmptyState = ({ onAddTask }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full px-4 py-8 text-center bg-slate-50/50 rounded-lg">
      <Sun size={40} className="text-slate-300 mb-4" />
      <h3 className="text-sm font-semibold text-slate-500">Tudo limpo por aqui!</h3>
      <p className="text-xs text-slate-400 mt-1 mb-4">Adicione uma tarefa para começar a planejar seu dia.</p>
      <button
        onClick={onAddTask}
        className="px-3 py-1.5 text-xs font-semibold text-white bg-violet-500 rounded-md hover:bg-violet-600 transition-colors shadow-sm"
      >
        Adicionar Tarefa
      </button>
    </div>
  );
};

export default EmptyState;
