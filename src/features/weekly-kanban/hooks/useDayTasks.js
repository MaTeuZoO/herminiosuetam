import { useMemo } from 'react';

/**
 * Hook simplificado. Agora ele apenas filtra o plano já enriquecido
 * para um dia específico e calcula os totais da coluna.
 */
export const useDayTasks = (day, enrichedPlan) => {
    const computedData = useMemo(() => {
        // LOG: Verificar se o useMemo está a ser re-calculado.
        // console.log(`[useDayTasks: ${day.id}] useMemo a recalcular.`);

        if (!day || !enrichedPlan) {
            return { tasks: [], totalSpent: 0, totalPlanned: 0 };
        }

        const tasksForDay = enrichedPlan
            .filter(task => task.planDate && task.planDate.startsWith(day.id))
            .sort((a, b) => a.position - b.position);
        
        // LOG: Verificar quantas tarefas foram encontradas para este dia específico.
        // console.log(`[useDayTasks: ${day.id}] Encontrou ${tasksForDay.length} tarefas.`);

        const totalSpent = tasksForDay.reduce((sum, task) => sum + (task.timeSpent || 0), 0);
        const totalPlanned = tasksForDay.reduce((sum, task) => sum + (task.timePlanned || 0), 0);

        return {
            tasks: tasksForDay,
            totalSpent,
            totalPlanned,
        };
    }, [day, enrichedPlan]);

    return computedData;
};
