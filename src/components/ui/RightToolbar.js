import React from 'react';
import { PanelLeft, Calendar, Search, Bell } from 'lucide-react';

const RightToolbar = ({ onToggle }) => {
    
    return (
        <div className="w-16 bg-white border-l border-slate-200 flex flex-col items-center py-2 space-y-1">
            {/* O botão principal agora é para expandir */}
            <button 
                onClick={onToggle}
                className="p-3 rounded-lg text-slate-600 hover:bg-slate-100"
            >
                <PanelLeft size={20} />
            </button>

            {/* Outros ícones podem ser adicionados aqui no futuro */}
            <div className="p-3 rounded-lg text-slate-400 cursor-not-allowed">
                 <Calendar size={20} />
            </div>
             <div className="p-3 rounded-lg text-slate-400 cursor-not-allowed">
                 <Search size={20} />
            </div>
        </div>
    );
};

export default RightToolbar;
