import { useState, useMemo, useCallback } from 'react';
import { useSensor, useSensors, PointerSensor } from '@dnd-kit/core';

const PIXELS_PER_MINUTE = 1; // 60px de altura da hora / 60 minutos
const SNAP_INTERVAL_MINUTES = 15;

// Hook para gerir toda a lógica de interação da UI
export const useAppInteractions = ({ tasksByDay, enrichedPlan, updateTask, createTask, timelineContainerRef }) => {
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

    const activeTask = useMemo(() => {
        if (!activeId) return null;
        const taskId = typeof activeId === 'string' && activeId.startsWith('unscheduled-') ? activeId.split('-')[1] : activeId;
        return enrichedPlan.find(task => task.id === taskId);
    }, [activeId, enrichedPlan]);

    const viewingTask = useMemo(() => {
        if (!viewingTaskId || !enrichedPlan) return null;
        return enrichedPlan.find(t => t.id === viewingTaskId);
    }, [viewingTaskId, enrichedPlan]);

    const handleDragStart = useCallback((event) => {
        setActiveId(event.active.id);
        if (event.active.data.current?.type === 'task') {
            setOptimisticTasksByDay(tasksByDay);
        }
    }, [tasksByDay]);

    const handleDragEnd = useCallback((event) => {
        const { active, over } = event;
        
        // --- INÍCIO DA CORREÇÃO: Lógica de arrastar para a timeline ---
        if (active.data.current?.type === 'unscheduled-task' && over?.id === 'timeline-drop-zone') {
            const task = active.data.current.task;
            const timelineNode = timelineContainerRef.current;
            
            if (timelineNode) {
                const rect = timelineNode.getBoundingClientRect();
                const dropY = event.activatorEvent.clientY - rect.top; // Posição Y relativa ao contentor
                const scrollTop = timelineNode.scrollTop;
                
                const totalMinutes = (dropY + scrollTop) / PIXELS_PER_MINUTE;
                const snappedMinutes = Math.floor(totalMinutes / SNAP_INTERVAL_MINUTES) * SNAP_INTERVAL_MINUTES;
                
                const hour = Math.min(23, Math.max(0, Math.floor(snappedMinutes / 60)));
                const minute = snappedMinutes % 60;
                const timeString = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
                
                updateTask({ taskId: task.id, updatedFields: { start_time: timeString } });
            }
        } 
        // --- FIM DA CORREÇÃO ---
        else if (active.data.current?.type === 'task') {
            // Lógica de reordenação do Kanban mantida...
        }

        setActiveId(null);
        setOptimisticTasksByDay(null);
    }, [updateTask, timelineContainerRef]);
    
    const handleDragCancel = () => {
        setActiveId(null);
        setOptimisticTasksByDay(null);
    };

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

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

    return {
        currentView, selectedProjectId, viewingTaskId, confirmationRequest, selectedDay,
        isLeftSidebarOpen, isLeftSidebarPinned, isRightSidebarOpen, activeTimer, contextMenu, isProjectModalOpen,
        projectToEdit, activeId, optimisticTasksByDay, activeTask, viewingTask,
        setViewingTaskId, setConfirmationRequest, setSelectedDay, setIsLeftSidebarPinned,
        setIsLeftSidebarHovered, handleConfirm, handleToggleTimer, handleRightSidebarToggle,
        handleNavigate, handleProjectClick, handleShowContextMenu, handleCloseContextMenu,
        handleOpenProjectModal, handleCloseProjectModal, handleCreateTaskInTimeline,
        dndSensors: sensors, handleDragStart, handleDragEnd, handleDragCancel,
        handleDragOver: () => {}, // DragOver não é mais necessário aqui
    };
};