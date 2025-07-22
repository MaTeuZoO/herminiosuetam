import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Loader2 } from 'lucide-react';
import { useProjectMutations } from './hooks/useProjectMutations';

// Paleta de 28 cores, organizada em duas fileiras
const ColorPicker = ({ selectedColor, onColorSelect }) => {
    const row1 = ['#FCA5A5', '#F87171', '#EF4444', '#FB923C', '#F59E0B', '#FACC15', '#A3E635', '#4ADE80', '#22C55E', '#34D399', '#2DD4BF', '#22D3EE', '#38BDF8', '#60A5FA'];
    const row2 = ['#3B82F6', '#818CF8', '#A78BFA', '#C084FC', '#E879F9', '#F472B6', '#EC4899', '#F43F5E', '#78716C', '#A1A1AA', '#71717A', '#52525B', '#3F3F46', '#1F2937'];

    return (
        <div className="space-y-2.5">
            {[row1, row2].map((row, rowIndex) => (
                <div key={rowIndex} className="flex justify-between">
                    {row.map(color => (
                        <button
                            type="button"
                            key={color} 
                            onClick={() => onColorSelect(color)}
                            className="w-6 h-6 rounded-full cursor-pointer transition-transform duration-150 ease-in-out hover:scale-110 focus:outline-none"
                            style={{ 
                                backgroundColor: color,
                                boxShadow: selectedColor === color ? `0 0 0 3px ${color}4D` : 'none',
                            }}
                        />
                    ))}
                </div>
            ))}
        </div>
    );
};


export const ProjectModal = ({ isOpen, onClose, projectToEdit }) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#8B5CF6');
  const [isFavorite, setIsFavorite] = useState(false);

  const { createProject, updateProject, isCreatingProject, isUpdatingProject } = useProjectMutations();
  const isLoading = isCreatingProject || isUpdatingProject;

  useEffect(() => {
    if (isOpen) {
        if (projectToEdit && projectToEdit.id) {
            setName(projectToEdit.name || '');
            setColor(projectToEdit.color || '#8B5CF6');
            setIsFavorite(projectToEdit.is_favorite || false);
        } else {
            setName('');
            setColor('#8B5CF6');
            setIsFavorite(false);
        }
    }
  }, [projectToEdit, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || isLoading) return;
    const projectData = { name, color, is_favorite: isFavorite };
    
    if (projectToEdit && projectToEdit.id) {
      updateProject({ projectId: projectToEdit.id, updates: projectData }, { onSuccess: () => onClose() });
    } else {
      createProject(projectData, { onSuccess: () => onClose() });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: -20, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-lg rounded-xl bg-slate-100 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 1. CABEÇALHO DINÂMICO */}
            <motion.div 
              className="h-24 flex items-center justify-center p-6"
              animate={{ backgroundColor: color }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-2xl font-bold text-white text-shadow-sm">
                {projectToEdit?.id ? 'Editar Projeto' : 'Seu Novo Projeto'}
              </h2>
            </motion.div>

            <div className="p-8 bg-white">
              <form onSubmit={handleSubmit}>
                <fieldset disabled={isLoading} className="space-y-8">
                  <div>
                    {/* 2. HIERARQUIA VISUAL */}
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      Nome
                    </label>
                    {/* 3. COR E NOME UNIFICADOS */}
                    <div className="relative flex items-center">
                      <span className="absolute left-3 w-3 h-3 rounded-full" style={{ backgroundColor: color }}></span>
                      <input
                        id="projectName"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ex: Relatório Anual"
                        className="w-full rounded-lg border-slate-300 bg-slate-50 py-3 pl-8 pr-4 text-slate-900 shadow-sm transition-shadow focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500"
                        autoFocus
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                      Cor
                    </label>
                    <ColorPicker selectedColor={color} onColorSelect={setColor} />
                  </div>
                </fieldset>

                <div className="flex justify-between items-center mt-10 pt-6 border-t border-slate-200">
                  <button type="button" onClick={() => setIsFavorite(!isFavorite)} className="flex items-center space-x-2 text-slate-500 hover:text-slate-800 transition-colors">
                      <Star size={18} className={`transition-all duration-200 ${isFavorite ? 'text-yellow-400 fill-yellow-400 scale-110' : ''}`} />
                      <span className="text-sm font-medium">Favorito</span>
                  </button>
                  <div className="flex space-x-3">
                    <button type="button" onClick={onClose} className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 border border-slate-300 hover:bg-slate-100 transition-colors disabled:opacity-50" disabled={isLoading}>
                      Cancelar
                    </button>
                    <button type="submit" disabled={isLoading} className="flex items-center justify-center rounded-lg bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-70 transition-colors shadow-sm">
                      {isLoading && <Loader2 size={16} className="animate-spin mr-2" />}
                      {projectToEdit?.id ? 'Salvar' : 'Criar projeto'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
            
            <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white/100 transition-colors p-1 rounded-full hover:bg-black/10">
              <X size={20} />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
