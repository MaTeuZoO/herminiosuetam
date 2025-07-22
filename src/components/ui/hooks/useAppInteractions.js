// Caminho do ficheiro: src/components/ui/hooks/useAppInteractions.js

import { useState, useMemo, useCallback } from 'react';
import { useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';

export const useAppInteractions = ({
    tasksByDay,
    enrichedPlan,
    updateTask,
    updateTaskOrder,
    createTask,
    deleteProject,
    timelineContainerRef
}) => {
    // Seus estados permanecem iguais...
    const [currentView, setCurrentView] = useState('weekly_kanban');
    const [selectedProjectId, setSelectedProjectId] = useState(null);
    const [viewingTaskId, setViewingTaskId] = useState(null);
    const [confirmationRequest, setConfirmationRequest] = useState(null);
    const [selectedDay, setSelectedDay] = useState(null);
    const [isLeftSidebarPinned, setIsLeftSidebarPinned] = useState(true);
    const [isLeftSidebarHovered, setIsLeftSidebarHovered] = useState(false);
    const isLeftSidebarOpen = isLeftSidebarPinned || isLeftSidebarHovered;
    const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);
    const [activeTimer, setActiveTimer] = useState(null);
    const [contextMenu, setContextMenu] = useState(null);
    const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
    const [projectToEdit, setProjectToEdit] = useState(null);
    const [activeId, setActiveId] = useState(null);
    const [optimisticTasksByDay, setOptimisticTasksByDay] = useState(null);
    const [startContainerId, setStartContainerId] = useState(null);

    // Seus outros hooks e handlers permanecem iguais...
    const activeTask = useMemo(() => {
        if (!activeId || !enrichedPlan) return null;
        const taskId = typeof activeId === 'string' && activeId.startsWith('unscheduled-') ? activeId.split('-')[1] : activeId;
        return enrichedPlan.find(task => task.id === taskId);
    }, [activeId, enrichedPlan]);
    
    const viewingTask = useMemo(() => {
        if (!viewingTaskId || !enrichedPlan) return null;
        return enrichedPlan.find(t => t.id === viewingTaskId);
    }, [viewingTaskId, enrichedPlan]);

    const handleConfirm = () => {
        if (confirmationRequest?.onConfirm) confirmationRequest.onConfirm();
        setConfirmationRequest(null);
    };
    const handleToggleTimer = useCallback((taskId, subtaskId = null) => {
        setActiveTimer(prev => (prev?.taskId === taskId && prev?.subtaskId === subtaskId) ? null : { taskId, subtaskId });
    }, []);
    const handleRightSidebarToggle = () => setIsRightSidebarOpen(prev => !prev);
    const handleNavigate = useCallback((view) => {
        setCurrentView(view);
        if (view !== 'project_view') setSelectedProjectId(null);
    }, []);
    const handleProjectClick = useCallback((project) => {
        setSelectedProjectId(project.id);
        setCurrentView('project_view');
    }, []);
    const handleShowContextMenu = useCallback((x, y, options) => setContextMenu({ x, y, options }), []);
    const handleCloseContextMenu = useCallback(() => setContextMenu(null), []);
    const handleOpenProjectModal = (project = null) => {
        setProjectToEdit(project);
        setIsProjectModalOpen(true);
    };
    const handleCloseProjectModal = () => {
        setIsProjectModalOpen(false);
        setProjectToEdit(null);
    };
    const handleCreateTaskInTimeline = useCallback((taskData) => {
        if (!selectedDay) return;
        const tasksForDay = tasksByDay[selectedDay.id] || [];
        createTask({
            taskData,
            planDate: selectedDay.fullDate,
            position: tasksForDay.length,
        });
    }, [selectedDay, tasksByDay, createTask]);


    const handleDragStart = useCallback((event) => {
        setActiveId(event.active.id);
        if (event.active.data.current?.type === 'task') {
            setOptimisticTasksByDay(tasksByDay);
            setStartContainerId(event.active.data.current.sortable.containerId);
        }
    }, [tasksByDay]);

    const handleDragOver = useCallback((event) => {
        const { active, over } = event;
        if (!over || active.id === over.id || active.data.current?.type !== 'task') return;

        const activeContainer = active.data.current.sortable.containerId;
        const overContainer = over.data.current?.sortable?.containerId || over.id;

        if (activeContainer && overContainer) {
            setOptimisticTasksByDay(prev => {
                if (!prev) return null;
                
                // --- A CORREÇÃO ESTÁ AQUI ---
                // Se um dia não tiver tarefas, tratamo-lo como uma lista vazia `[]`
                const activeItems = prev[activeContainer] || [];
                const overItems = prev[overContainer] || [];

                const activeIndex = activeItems.findIndex(i => i.id === active.id);
                const overIndex = overItems.findIndex(i => i.id === over.id);

                if (activeIndex === -1) return prev;

                if (activeContainer === overContainer) {
                    if (overIndex !== -1) {
                        return { ...prev, [activeContainer]: arrayMove(activeItems, activeIndex, overIndex) };
                    }
                } else {
                    const [movedItem] = activeItems.splice(activeIndex, 1);
                    const newIndex = overIndex >= 0 ? overIndex : overItems.length;
                    overItems.splice(newIndex, 0, movedItem);
                    return { ...prev, [activeContainer]: [...activeItems], [overContainer]: [...overItems] };
                }
                return prev;
            });
        }
    }, []);
    
    const handleDragEnd = useCallback((event) => {
        const { active, over } = event;
        if (!over) {
            setActiveId(null);
            setOptimisticTasksByDay(null);
            setStartContainerId(null);
            return;
        }
        
        const activeContainer = startContainerId;
        const overContainer = over.data.current?.sortable?.containerId || over.id;
        
        const finalState = optimisticTasksByDay || tasksByDay;
        
        if (activeContainer && overContainer && activeContainer === overContainer) {
            if (active.id !== over.id) {
                const reorderedTasks = finalState[activeContainer] || [];
                const planEntriesToUpdate = reorderedTasks.map((task, index) => ({
                    planEntryId: task.planEntryId,
                    position: index,
                    planDate: task.planDate,
                }));
                updateTaskOrder(planEntriesToUpdate);
            }
        } else if (activeContainer && overContainer) {
            const sourceColumnTasks = finalState[activeContainer] || [];
            const destinationColumnTasks = finalState[overContainer] || [];

            const sourceUpdates = sourceColumnTasks.map((task, index) => ({
                planEntryId: task.planEntryId,
                position: index,
                planDate: activeContainer,
            }));

            const destinationUpdates = destinationColumnTasks.map((task, index) => ({
                planEntryId: task.planEntryId,
                position: index,
                planDate: overContainer,
            }));
            
            const combinedUpdates = [...sourceUpdates, ...destinationUpdates];
            updateTaskOrder(combinedUpdates);
        }

        setActiveId(null);
        setOptimisticTasksByDay(null);
        setStartContainerId(null);
    }, [startContainerId, tasksByDay, optimisticTasksByDay, updateTaskOrder]);

    const handleDragCancel = () => {
        setActiveId(null);
        setOptimisticTasksByDay(null);
        setStartContainerId(null);
    };

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

    return {
        currentView, selectedProjectId, viewingTaskId, confirmationRequest, selectedDay,
        isLeftSidebarOpen, isLeftSidebarPinned, isRightSidebarOpen, activeTimer, contextMenu, isProjectModalOpen,
        projectToEdit, activeId, optimisticTasksByDay, activeTask, viewingTask,
        setViewingTaskId, setConfirmationRequest, setSelectedDay, setIsLeftSidebarPinned,
        setIsLeftSidebarHovered, handleConfirm, handleToggleTimer, handleRightSidebarToggle,
        handleNavigate, handleProjectClick, handleShowContextMenu, handleCloseContextMenu,
        handleOpenProjectModal, handleCloseProjectModal, handleCreateTaskInTimeline,
        dndSensors: sensors, handleDragStart, handleDragOver, handleDragEnd, handleDragCancel,
    };
};
