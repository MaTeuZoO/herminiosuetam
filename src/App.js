// Caminho do arquivo: src/App.js

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import { AnimatePresence } from 'framer-motion';
import { Loader, Edit, Trash2 } from 'lucide-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import * as api from './api/supabaseService';
import Auth from './components/ui/Auth';
import Sidebar from './components/ui/Sidebar';
import TaskDetailModal from './components/ui/TaskDetailModal';
import ConfirmationModal from './components/ui/ConfirmationModal';
import TimelineSidebar from './components/ui/TimelineSidebar';
import ContextMenu from './components/ui/ContextMenu';
import TaskCard from './components/ui/TaskCard';
import { ProjectModal } from './features/project/ProjectModal';
import WeeklyKanbanView from './features/weekly-kanban/WeeklyKanbanView';
import ProjectView from './features/project/ProjectView';

import { useTaskMutations } from './features/weekly-kanban/hooks/useTaskMutations';
import { useProjectMutations } from './features/project/hooks/useProjectMutations';
import { useCoreDataStore } from './store/useCoreDataStore';
import { useEnrichedPlan } from './features/weekly-kanban/hooks/useEnrichedPlan';
import { useAppInteractions } from './components/ui/hooks/useAppInteractions';

const queryClient = new QueryClient();

// ... (sua função getTodayDetails permanece a mesma)
const getTodayDetails = () => {
    const today = new Date();
    const dayNames = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const isoDateString = `${year}-${month}-${day}`;
    const displayDateString = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}`;
    return {
        id: isoDateString,
        name: dayNames[today.getDay()],
        date: displayDateString,
        dayOfMonth: today.getDate().toString(),
        dayName: dayNames[today.getDay()].substring(0,3).toUpperCase(),
        fullDate: today,
    };
};


function AppContent() {
  const [loading, setLoading] = useState(true);
  const [localSession, setLocalSession] = useState(null);

  const { projects, subtasks: allSubtasks, session: storeSession } = useCoreDataStore();
  const { setSession, fetchCoreData, tickTimer } = useCoreDataStore(state => state);
  const { tasksByDay, enrichedPlan, isLoading: isPlanLoading } = useEnrichedPlan();
  const { deleteTask, updateTask, updateTaskOrder, createTask } = useTaskMutations();
  const { deleteProject } = useProjectMutations();
  const isCreatingTask = false; // Placeholder se você não pegou o 'isPending' da mutação

  const timelineContainerRef = useRef(null);

  const {
    currentView, selectedProjectId, viewingTaskId, confirmationRequest, selectedDay,
    isLeftSidebarOpen, isLeftSidebarPinned, isRightSidebarOpen, activeTimer, contextMenu, isProjectModalOpen,
    projectToEdit, activeId, 
    optimisticTasksByDay, // <-- Pegando o estado otimista
    activeTask, viewingTask,
    setViewingTaskId, setConfirmationRequest, setSelectedDay, setIsLeftSidebarPinned,
    setIsLeftSidebarHovered, handleConfirm, handleToggleTimer, handleRightSidebarToggle,
    handleNavigate, handleProjectClick, handleShowContextMenu, handleCloseContextMenu,
    handleOpenProjectModal, handleCloseProjectModal, handleCreateTaskInTimeline,
    dndSensors, handleDragStart, 
    handleDragOver, // <-- Pegando o novo handler
    handleDragEnd, handleDragCancel
  } = useAppInteractions({
      tasksByDay,
      enrichedPlan,
      updateTask,
      updateTaskOrder,
      createTask,
      deleteProject,
      timelineContainerRef,
  });

  const selectedProjectObject = useMemo(() => {
    return projects.find(p => p.id === selectedProjectId);
  }, [projects, selectedProjectId]);


  useEffect(() => {
    const handleAuthChange = async (session) => {
      setLocalSession(session);
      setSession(session);
      if (session && !useCoreDataStore.getState().dataLoaded) await fetchCoreData(session.user.id);
      setLoading(false);
    };
    api.getSession().then(({ data: { session } }) => { handleAuthChange(session); });
    const { data: { subscription } = {} } = api.onAuthStateChange((_event, session) => { setLocalSession(session); setSession(session); });
    return () => { subscription?.unsubscribe(); };
  }, [setSession, fetchCoreData]);

  useEffect(() => {
    if (!selectedDay) {
        const todayDetails = getTodayDetails();
        setSelectedDay(todayDetails);
    }
  }, [selectedDay, setSelectedDay]);

  useEffect(() => {
    if (!activeTimer || !storeSession) return;
    const interval = setInterval(() => { tickTimer(activeTimer, storeSession.user.id); }, 1000);
    return () => clearInterval(interval);
  }, [activeTimer, storeSession, tickTimer]);

  const tasksForTimeline = useMemo(() => {
    if (!selectedDay || !tasksByDay) return [];
    return tasksByDay[selectedDay.id] || [];
  }, [selectedDay, tasksByDay]);

  const projectColors = useMemo(() => {
    if (!projects) return {};
    return projects.reduce((acc, project) => { acc[project.id] = project.color; return acc; }, {});
  }, [projects]);

  const handleShowProjectMenu = useCallback((event, project) => {
    handleShowContextMenu(event.clientX, event.clientY, [
      { label: 'Editar', icon: <Edit size={14} />, action: () => handleOpenProjectModal(project) },
      { label: 'Excluir', icon: <Trash2 size={14} />, action: () => setConfirmationRequest({
          title: 'Excluir Projeto',
          message: `Tem certeza que deseja excluir "${project.name}"? Todas as suas tarefas serão perdidas.`,
          onConfirm: () => deleteProject(project.id),
        }), isDestructive: true },
    ]);
  }, [deleteProject, handleShowContextMenu, handleOpenProjectModal, setConfirmationRequest]);


  const renderCurrentView = () => {
    // --- LÓGICA DO PASSO 2 ---
    // Se o estado otimista existir (ou seja, estamos arrastando), use-o.
    // Caso contrário, use o estado normal (tasksByDay).
    const planToRender = optimisticTasksByDay || tasksByDay;
    // --- FIM DA LÓGICA DO PASSO 2 ---
    
    switch (currentView) {
      case 'project_view':
        return (
          <ProjectView
            project={selectedProjectObject}
            selectedProjectId={selectedProjectId}
            onTaskClick={(task) => setViewingTaskId(task.id)}
            onOpenProjectModal={handleOpenProjectModal}
            createTask={createTask}
            isCreatingTask={isCreatingTask}
          />
        );
      case 'weekly_kanban':
      default:
        return (
          <WeeklyKanbanView
            // Passamos o `planToRender` para o Kanban
            tasksByDay={planToRender} 
            isLoading={isPlanLoading}
            onTaskClick={(task) => setViewingTaskId(task.id)}
            onDeleteTask={(taskId) => setConfirmationRequest({
                title: 'Excluir Tarefa',
                message: 'Tem certeza que deseja excluir esta tarefa?',
                onConfirm: () => deleteTask(taskId),
            })}
            selectedDay={selectedDay}
            onDaySelect={setSelectedDay}
            activeTimer={activeTimer}
            onToggleTimer={handleToggleTimer}
            onShowContextMenu={handleShowContextMenu}
            activeId={activeId}
          />
        );
    }
  };

  if (loading) return <div className="flex h-screen w-full items-center justify-center"><Loader className="animate-spin text-violet-500" size={48} /></div>;
  if (!localSession) return <Auth />;

  return (
    <>
      <ConfirmationModal isOpen={!!confirmationRequest} onClose={() => setConfirmationRequest(null)} onConfirm={handleConfirm} title={confirmationRequest?.title} message={confirmationRequest?.message} />
      <AnimatePresence>{viewingTask && (<TaskDetailModal key={viewingTask.id} task={viewingTask} project={projects.find(p => p.id === viewingTask.project_id)} subtasks={allSubtasks.filter(s => s.task_id === viewingTask.id)} onClose={() => setViewingTaskId(null)} onDeleteTask={(taskId) => setConfirmationRequest({ title: 'Excluir Tarefa', message: 'Tem certeza que deseja excluir esta tarefa?', onConfirm: () => deleteTask(taskId), })} activeTimer={activeTimer} onToggleTimer={handleToggleTimer} />)}</AnimatePresence>
      <ProjectModal isOpen={isProjectModalOpen} onClose={handleCloseProjectModal} projectToEdit={projectToEdit} />
      <AnimatePresence>{contextMenu && (<ContextMenu x={contextMenu.x} y={contextMenu.y} options={contextMenu.options} onClose={handleCloseContextMenu} />)}</AnimatePresence>

      <div className="flex h-screen font-sans bg-slate-50 text-zinc-800">
        <Sidebar projects={projects} onOpenProjectModal={handleOpenProjectModal} onShowProjectMenu={handleShowProjectMenu} selectedProjectId={selectedProjectId} onProjectClick={handleProjectClick} currentView={currentView} onNavigate={handleNavigate} isCollapsed={!isLeftSidebarOpen} onPin={() => setIsLeftSidebarPinned(true)} onClose={() => setIsLeftSidebarPinned(false)} onHoverEnter={() => !isLeftSidebarPinned && setIsLeftSidebarHovered(true)} onHoverLeave={() => setIsLeftSidebarHovered(false)} />

        <DndContext 
            sensors={dndSensors} 
            onDragStart={handleDragStart} 
            onDragOver={handleDragOver} // <-- Adicionamos o novo handler aqui
            onDragEnd={handleDragEnd} 
            onDragCancel={handleDragCancel}
        >
            <div className="flex-1 flex overflow-hidden">{renderCurrentView()}</div>
            <TimelineSidebar
                timelineContainerRef={timelineContainerRef}
                selectedDay={selectedDay}
                tasks={tasksForTimeline}
                projectColors={projectColors}
                isCollapsed={!isRightSidebarOpen}
                onToggle={handleRightSidebarToggle}
                onUpdateTask={updateTask}
                onCreateTask={handleCreateTaskInTimeline}
            />
            <DragOverlay dropAnimation={null}>{activeTask ? (<TaskCard task={activeTask} project={projects.find(p => p.id === activeTask.project_id)} isDragging={true} onTaskClick={() => {}} onEdit={() => {}} onDelete={() => {}} onToggleTimer={() => {}} onShowContextMenu={() => {}} />) : null}</DragOverlay>
        </DndContext>
      </div>
    </>
  );
}

export default function App() {
  return (<QueryClientProvider client={queryClient}><AppContent /></QueryClientProvider>);
}