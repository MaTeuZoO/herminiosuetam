import { supabase } from '../lib/supabaseClient';

/**
 * Busca todas as subtarefas de um usuário.
 * @param {string} userId - O ID do usuário.
 * @returns {Promise<Array>} A lista de subtarefas.
 */
export const fetchSubtasksAPI = async (userId) => {
  const { data, error } = await supabase
    .from('subtasks')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error('Erro ao buscar subtarefas:', error);
    throw error;
  }
  return data;
};

/**
 * Adiciona uma nova subtarefa.
 * @param {string} title - O título da subtarefa.
 * @param {number} taskId - O ID da tarefa pai.
 * @param {string} userId - O ID do usuário.
 * @returns {Promise<Object>} A subtarefa criada.
 */
export const addSubtaskAPI = async (title, taskId, userId) => {
  const { data, error } = await supabase
    .from('subtasks')
    .insert([{ title, task_id: taskId, user_id: userId }])
    .select();

  if (error) {
    console.error('Erro ao adicionar subtarefa:', error);
    throw error;
  }
  return data ? data[0] : null;
};

/**
 * Atualiza os dados de uma subtarefa existente.
 * @param {number} subtaskId - O ID da subtarefa a ser atualizada.
 * @param {object} updatedFields - Um objeto com os campos e novos valores.
 * @returns {Promise<Object>} A subtarefa atualizada.
 */
export const updateSubtaskAPI = async (subtaskId, updatedFields) => {
  const { data, error } = await supabase
    .from('subtasks')
    .update(updatedFields)
    .eq('id', subtaskId)
    .select();

  if (error) {
    console.error('Erro ao atualizar subtarefa:', error);
    throw error;
  }
  return data ? data[0] : null;
};

/**
 * Exclui uma subtarefa do banco de dados.
 * @param {number} subtaskId - O ID da subtarefa a ser excluída.
 */
export const deleteSubtaskAPI = async (subtaskId) => {
  const { error } = await supabase
    .from('subtasks')
    .delete()
    .eq('id', subtaskId);

  if (error) {
    console.error('Erro ao deletar subtarefa:', error);
    throw error;
  }
  // Funções de delete não costumam retornar dados.
  return;
};