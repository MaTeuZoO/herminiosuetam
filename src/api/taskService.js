import { supabase } from '../supabaseClient';

/**
 * -----------------------------------------------------------------------------
 * taskService.js
 * -----------------------------------------------------------------------------
 * Este arquivo contém todas as funções para interagir com a tabela 'tasks'
 * no Supabase. Cada função é otimizada para robustez e clareza.
 */

/**
 * Busca todas as tarefas de um usuário, ordenadas por status de conclusão e data de criação.
 * @returns {Promise<Array>} Uma lista de tarefas.
 * @throws {Error} Se a busca no Supabase falhar.
 */
export const fetchTasks = async () => {
  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      projects ( * ),
      subtasks ( id, completed )
    `)
    .order('completed', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar tarefas:', error.message);
    throw new Error(`Não foi possível buscar as tarefas: ${error.message}`);
  }

  return data || [];
};

/**
 * --- NOVA FUNÇÃO ---
 * Busca todas as tarefas associadas a um projeto específico.
 * @param {number} projectId - O ID do projeto.
 * @returns {Promise<Array>} Uma lista de tarefas do projeto.
 * @throws {Error} Se a busca no Supabase falhar.
 */
export const fetchTasksByProjectAPI = async (projectId) => {
  if (!projectId) {
    console.warn('fetchTasksByProjectAPI chamado sem um projectId.');
    return [];
  }

  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      projects ( * ),
      subtasks ( id, completed )
    `)
    .eq('project_id', projectId) // Filtra as tarefas pelo ID do projeto
    .order('completed', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    console.error(`Erro ao buscar tarefas para o projeto ${projectId}:`, error.message);
    throw new Error(`Não foi possível buscar as tarefas do projeto: ${error.message}`);
  }

  return data || [];
};


/**
 * Adiciona uma nova tarefa genérica ao banco de dados.
 * @param {object} taskData - Um objeto contendo os dados da nova tarefa (ex: { title, project_id, ... }).
 * @returns {Promise<Object>} A tarefa recém-criada.
 * @throws {Error} Se a inserção no Supabase falhar.
 */
export const addTask = async (taskData) => {
  const { data, error } = await supabase
    .from('tasks')
    .insert([taskData])
    .select()
    .single(); // Retorna um único objeto em vez de um array

  if (error) {
    console.error('Erro ao adicionar tarefa:', error.message);
    throw new Error(`Não foi possível adicionar a tarefa: ${error.message}`);
  }

  return data;
};

/**
 * Atualiza os campos de uma tarefa específica.
 * @param {number} taskId - O ID da tarefa a ser atualizada.
 * @param {object} updatedFields - Os campos a serem modificados (ex: { title, completed, due_date }).
 * @returns {Promise<Object>} A tarefa atualizada.
 * @throws {Error} Se a atualização no Supabase falhar.
 */
export const updateTask = async (taskId, updatedFields) => {
  const { data, error } = await supabase
    .from('tasks')
    .update(updatedFields)
    .eq('id', taskId)
    .select()
    .single();

  if (error) {
    console.error(`Erro ao atualizar tarefa ${taskId}:`, error.message);
    throw new Error(`Não foi possível atualizar a tarefa: ${error.message}`);
  }

  return data;
};

/**
 * Deleta uma tarefa específica do banco de dados.
 * @param {number} taskId - O ID da tarefa a ser deletada.
 * @throws {Error} Se a deleção no Supabase falhar.
 */
export const deleteTask = async (taskId) => {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId);

  if (error) {
    console.error(`Erro ao deletar tarefa ${taskId}:`, error.message);
    throw new Error(`Não foi possível deletar a tarefa: ${error.message}`);
  }
};
