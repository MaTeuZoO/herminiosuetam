import { useMemo } from 'react';
import { useWeeklyPlanQuery } from './useWeeklyPlanQuery';
import { useCoreDataStore } from '../../../store/useCoreDataStore';

/**
 * A ÚNICA FONTE DA VERDADE para os dados do plano.
 * Enriquece as tarefas e as agrupa por dia.
 */
export const useEnrichedPlan = () => {
    const {
        data: planData,
        isLoading,
        fetchNextPage,
        fetchPreviousPage,
        hasNextPage,
        hasPreviousPage,
        isFetchingNextPage,
        isFetchingPreviousPage,
    } = useWeeklyPlanQuery();

    const { subtasks, timeEntries } = useCoreDataStore();

    const enrichedPlan = useMemo(() => {
        const rawPlan = planData?.pages.flatMap(page => page.data) ?? [];
        if (!rawPlan.length) return [];
        const today = new Date().toISOString().split('T')[0];

        return rawPlan.map(task => {
            // --- A CORREÇÃO ESTÁ AQUI ---
            // Filtramos E ORDENAMOS as subtarefas pela sua posição.
            const taskSubtasks = subtasks
                .filter(s => s.task_id === task.id)
                .sort((a, b) => (a.position ?? Infinity) - (b.position ?? Infinity));

            const enrichedSubtasks = taskSubtasks.map(sub => {
                const subTimeSpent = timeEntries.find(e => e.subtask_id === sub.id && e.date === today)?.time_spent_seconds || 0;
                return { ...sub, timeSpent: subTimeSpent };
            });

            let totalTimeSpent = timeEntries.find(e => e.task_id === task.id && e.subtask_id === null && e.date === today)?.time_spent_seconds || 0;
            enrichedSubtasks.forEach(sub => {
                totalTimeSpent += sub.timeSpent;
            });

            let totalTimePlanned = 0;
            if (enrichedSubtasks.length > 0) {
                totalTimePlanned = enrichedSubtasks.reduce((sum, sub) => sum + (sub.planned_time_seconds || 0), 0);
            } else {
                totalTimePlanned = task.planned_time_seconds || 0;
            }

            return {
                ...task,
                timeSpent: totalTimeSpent,
                timePlanned: totalTimePlanned,
                subtasks: enrichedSubtasks,
            };
        });
    }, [planData, subtasks, timeEntries]);

    const tasksByDay = useMemo(() => {
        const grouped = {};
        enrichedPlan.forEach(task => {
            const date = task.planDate;
            if (!grouped[date]) {
                grouped[date] = [];
            }
            grouped[date].push(task);
        });

        for (const date in grouped) {
            grouped[date].sort((a, b) => (a.position ?? Infinity) - (b.position ?? Infinity));
        }
        return grouped;
    }, [enrichedPlan]);


    return {
        enrichedPlan,
        tasksByDay,
        planData,
        isLoading,
        fetchNextPage,
        fetchPreviousPage,
        hasNextPage,
        hasPreviousPage,
        isFetchingNextPage,
        isFetchingPreviousPage,
    };
};
