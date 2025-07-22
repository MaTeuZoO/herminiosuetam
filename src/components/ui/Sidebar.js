import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, CalendarDays, BarChart3, Plus, ChevronLeft, LogOut, MoreVertical } from 'lucide-react';
import { DndContext, PointerSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useCoreDataStore } from '../../store/useCoreDataStore';

const signOut = () => console.log("Usuário deslogado!"); // Placeholder

// --- ÍCONES ---
const navIcons = {
    weekly_kanban: <Home size={18} />,
    planning: <CalendarDays size={18} />,
    performance: <BarChart3 size={18} />,
};

// --- SUB-COMPONENTE DE TEXTO (SIMPLIFICADO PARA ESTABILIDADE) ---
const AnimatedText = memo(({ children, className }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1, transition: { duration: 0.2, delay: 0.1 } }}
    exit={{ opacity: 0, transition: { duration: 0.1 } }}
    className="whitespace-nowrap"
  >
    <span className={className}>{children}</span>
  </motion.div>
));

// --- COMPONENTES DE LINK (ESTRUTURA FINAL E ESTÁVEL) ---

const NavLink = memo(({ viewName, label, currentView, onNavigate, isCollapsed }) => {
  const isSelected = currentView === viewName;
  const colorClasses = {
      'weekly_kanban': { text: 'text-blue-500', bg: 'bg-blue-50' },
      'planning': { text: 'text-green-500', bg: 'bg-green-50' },
      'performance': { text: 'text-red-500', bg: 'bg-red-50' },
  };
  const selectedColor = colorClasses[viewName] || { text: 'text-slate-600', bg: 'bg-slate-100' };

  return (
    <a href="#" onClick={(e) => { e.stopPropagation(); onNavigate(viewName); }} title={isCollapsed ? label : ''}
      className={`flex items-center w-full h-[44px] rounded-md text-sm font-medium transition-colors duration-200 group
        ${isSelected ? `${selectedColor.bg} font-semibold` : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
    >
      <div className={`w-[44px] flex-shrink-0 flex items-center justify-center ${selectedColor.text}`}>
        {navIcons[viewName]}
      </div>
      <AnimatePresence>
        {!isCollapsed && <AnimatedText className={isSelected ? 'text-slate-900' : ''}>{label}</AnimatedText>}
      </AnimatePresence>
    </a>
  );
});

const SortableProjectLink = ({ project, ...props }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: project.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 'auto',
    opacity: isDragging ? 0.5 : 1,
  };
  const isSelected = props.selectedProjectId === project.id && props.currentView === 'project_view';

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      className={`group relative flex items-center w-full h-[40px] rounded-md text-sm cursor-grab active:cursor-grabbing
                 ${isSelected ? 'bg-slate-100' : ''} ${!isSelected ? 'hover:bg-slate-100' : ''}`}
    >
      <a href="#" onClick={(e) => { e.stopPropagation(); props.onProjectClick(project); }} title={props.isCollapsed ? project.name : ''}
        className={`w-full h-full flex items-center rounded-md ${isSelected ? 'text-slate-900 font-semibold' : 'text-slate-600'}`}
      >
        <div className="w-[44px] flex-shrink-0 flex items-center justify-center">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: project.color || '#94a3b8' }}></span>
        </div>
        <AnimatePresence>
          {!props.isCollapsed && <AnimatedText className="font-normal truncate">{project.name}</AnimatedText>}
        </AnimatePresence>
      </a>
      <AnimatePresence>
        {!props.isCollapsed && (
          <div className="absolute right-2 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={(e) => { e.stopPropagation(); props.onShowMenu(e, project); }} className="p-1 rounded-md hover:bg-slate-200">
              <MoreVertical size={16} className="text-slate-500" />
            </button>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};


// --- COMPONENTE PRINCIPAL ---
const Sidebar = ({ projects, onOpenProjectModal, onShowProjectMenu, selectedProjectId, onProjectClick, currentView, onNavigate, isCollapsed, onPin, onClose, onHoverEnter, onHoverLeave }) => {
  const updateProjectOrder = useCoreDataStore((state) => state.updateProjectOrder);
  
  const sensors = useSensors(useSensor(PointerSensor, {
    activationConstraint: { distance: 5 },
  }));

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = projects.findIndex(p => p.id === active.id);
      const newIndex = projects.findIndex(p => p.id === over.id);
      const reorderedProjects = arrayMove(projects, oldIndex, newIndex);
      updateProjectOrder(reorderedProjects);
    }
  };

  return (
    <motion.div
        animate={{ width: isCollapsed ? 60 : 256 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="flex-shrink-0 bg-white flex flex-col border-r border-slate-200 overflow-hidden h-screen"
        onMouseEnter={onHoverEnter}
        onMouseLeave={onHoverLeave}
        onClick={onPin}
    >
      {/* Cabeçalho */}
      <div className="flex items-center h-[65px] border-b border-slate-200 flex-shrink-0">
        <div className="flex items-center w-full">
            <div className="w-[60px] flex-shrink-0 flex items-center justify-center">
                <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-white text-xl">S</span>
                </div>
            </div>
            <AnimatePresence>
                {!isCollapsed && (
                    <div className="flex-grow flex items-center justify-between pr-2">
                        <AnimatedText className="text-lg font-bold text-slate-800">SunIst</AnimatedText>
                        <motion.button onClick={(e) => { e.stopPropagation(); onClose(); }} className="p-1 rounded-full hover:bg-slate-100">
                            <ChevronLeft size={20} className="text-slate-700" />
                        </motion.button>
                    </div>
                )}
            </AnimatePresence>
        </div>
      </div>
      
      {/* Área de Conteúdo */}
      <div className="flex-grow pt-2 overflow-y-auto overflow-x-hidden custom-scrollbar">
        <nav className="flex flex-col gap-1 px-2">
          <NavLink label="Início" viewName="weekly_kanban" {...{currentView, onNavigate, isCollapsed}}/>
          <NavLink label="Planejar" viewName="planning" {...{currentView, onNavigate, isCollapsed}}/>
          <NavLink label="Performance" viewName="performance" {...{currentView, onNavigate, isCollapsed}}/>
        </nav>
        
        <div className="mt-4">
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div className="flex items-center mb-1 pr-4 pl-[22px] justify-between">
                  <h2 className="text-xs font-bold tracking-wider uppercase text-slate-400">Projetos</h2>
                  <button onClick={onOpenProjectModal} className="p-1 rounded-md hover:bg-slate-200">
                      <Plus size={16} className="text-slate-500" />
                  </button>
              </motion.div>
            )}
          </AnimatePresence>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={projects} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col gap-0 px-2">
                  {projects.map(p => <SortableProjectLink key={p.id} project={p} onShowMenu={onShowProjectMenu} {...{selectedProjectId, currentView, onProjectClick, isCollapsed}} />)}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </div>

      {/* Rodapé */}
      <div className="flex-shrink-0 pt-2 border-t border-slate-200 px-2">
          <a href="#" onClick={(e) => {e.preventDefault(); signOut();}} title="Sair" 
              className={`flex items-center w-full h-[44px] rounded-md text-sm font-medium text-slate-600 hover:bg-slate-100 hover:bg-slate-900`}
          >
              <div className={`w-[44px] flex-shrink-0 flex items-center justify-center`}>
                  <LogOut size={16} />
              </div>
              <AnimatePresence>
                {!isCollapsed && <AnimatedText>Sair</AnimatedText>}
              </AnimatePresence>
          </a>
      </div>
    </motion.div>
  );
};

export default memo(Sidebar);
