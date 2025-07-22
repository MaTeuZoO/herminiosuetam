import { supabase } from './supabaseService';

// --- SUAS FUNÇÕES EXISTENTES (getDailyPlan, etc.) FICAM AQUI EM CIMA ---

/**
 * Busca as entradas do plano diário para um intervalo de datas. Usado pelo Kanban semanal.
 * @param {string} userId - O ID do usuário.
 * @param {Date} startDate - A data de início do intervalo.
 * @param {Date} endDate - A data de fim do intervalo.
 * @returns {Promise<Array>} A lista de tarefas planejadas com suas informações.
 */
export const getDailyPlanForDateRange = async (userId, startDate, endDate) => {
    const start = startDate.toISOString().split('T')[0];
    const end = endDate.toISOString().split('T')[0];

    console.log(`%c[planService] Buscando plano de ${start} a ${end}`, 'color: blue; font-weight: bold;');

    const { data, error } = await supabase
        .from('daily_plan_entries')
        .select('id, plan_date, position, tasks ( *, projects ( * ) )')
        .eq('user_id', userId)
        .gte('plan_date', start)
        .lte('plan_date', end)
        .order('position', { ascending: true });

    if (error) {
        console.error('Erro ao buscar plano semanal:', error);
        return [];
    }

    // --- DEBUG: VERIFICAR OS DADOS BRUTOS ---
    console.log('%c[planService] Dados Brutos do Supabase (deve estar ordenado por position):', 'color: red; font-weight: bold;', data);

    const mappedData = data
        .filter(entry => entry.tasks) 
        .map(entry => ({
            planEntryId: entry.id,
            planDate: entry.plan_date,
            position: entry.position ?? 0, 
            ...entry.tasks
        }));
    
    // --- DEBUG: VERIFICAR OS DADOS FINAIS ---
    console.log('%c[planService] Dados Finais Mapeados (enviados para a UI):', 'color: green; font-weight: bold;', mappedData);

    return mappedData;
};

/**
 * Busca o plano para um único dia.
 * @param {Date} date - O dia específico.
 * @returns {Promise<Array>} A lista de tarefas planejadas.
 */
export const getDailyPlan = async (date) => {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) return [];

    const dateString = date.toISOString().split('T')[0];
    
    const { data, error } = await supabase
        .from('daily_plan_entries')
        .select('*, tasks(*, projects(*))')
        .eq('user_id', userId)
        .eq('plan_date', dateString)
        .order('position', { ascending: true });

    if (error) {
        console.error('Erro ao buscar plano diário:', error);
        return [];
    }
    return data;
}

/**
 * Adiciona uma tarefa a um plano diário específico.
 * @param {string} taskId - O ID da tarefa a ser adicionada.
 * @param {Date} planDate - O dia em que a tarefa será planejada.
 * @param {number} position - A ordem da tarefa naquele dia.
 * @returns {Promise<object>} O resultado da inserção.
 */
export const addTaskToDailyPlan = async (taskId, planDate, position) => {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) throw new Error("Usuário não autenticado.");

    const { data, error } = await supabase
        .from('daily_plan_entries')
        .insert({
            user_id: userId,
            task_id: taskId,
            plan_date: planDate.toISOString().split('T')[0],
            position: position
        });

    if (error) {
        console.error("Erro ao adicionar tarefa ao plano:", error);
    }
    return { data, error };
};

/**
 * Remove uma tarefa de um plano diário.
 * @param {number} planEntryId - O ID da entrada no plano a ser removida.
 * @returns {Promise<object>} O resultado da exclusão.
 */
export const removeTaskFromDailyPlan = async (planEntryId) => {
    const { data, error } = await supabase
        .from('daily_plan_entries')
        .delete()
        .eq('id', planEntryId);

    if (error) {
        console.error("Erro ao remover tarefa do plano:", error);
    }
    return { data, error };
};


/**
 * Atualiza uma entrada existente no plano diário.
 * @param {number} planEntryId - O ID da entrada no plano.
 * @param {object} updatedFields - Os campos a serem atualizados (ex: { plan_date, position }).
 * @returns {Promise<object>} O resultado da atualização.
 */
export const updatePlanEntry = async (planEntryId, updatedFields) => {
    const { data, error } = await supabase
        .from('daily_plan_entries')
        .update(updatedFields)
        .eq('id', planEntryId)
        .select(); 

    if (error) {
        console.error("Erro ao atualizar entrada do plano:", error);
    }
    return { data, error };
};
