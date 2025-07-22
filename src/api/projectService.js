import { supabase } from '../supabaseClient';

/**
 * Busca todos os projetos de um usuário, ordenados pela posição manual.
 * @param {string} userId - O ID do usuário logado.
 * @returns {Promise<Array>} Uma promessa que resolve para a lista de projetos.
 */
export const fetchProjectsAPI = async (userId) => {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('position', { ascending: true, nullsFirst: true });

  if (error) {
    console.error('Erro ao buscar projetos:', error);
    throw error;
  }

  return data;
};

/**
 * Adiciona um novo projeto para um usuário no banco de dados.
 * @param {object} projectData - Os dados do projeto a serem criados (ex: { name, color, position, user_id }).
 * @returns {Promise<Object>} Uma promessa que resolve para o objeto do novo projeto criado.
 */
export const addProjectAPI = async (projectData) => {
  const { data, error } = await supabase
    .from('projects')
    .insert([projectData])
    .select()
    .single();

  if (error) {
    console.error('Erro ao adicionar projeto:', error);
    throw error;
  }

  return data;
};

/**
 * Atualiza um projeto existente no Supabase.
 * @param {number} projectId - O ID do projeto a ser atualizado.
 * @param {object} updates - Um objeto com os campos a serem atualizados.
 * @returns {Promise<object>} O objeto do projeto atualizado.
 */
export const updateProjectAPI = async (projectId, updates) => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', projectId)
      .select()
      .single();

    if (error) { throw error; }
    return data;
  } catch (error) {
    console.error('Erro ao atualizar o projeto:', error.message);
    throw error;
  }
};

/**
 * Deleta um projeto do Supabase.
 * @param {number} projectId - O ID do projeto a ser deletado.
 */
export const deleteProjectAPI = async (projectId) => {
  try {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (error) { throw error; }
  } catch (error) {
    console.error('Erro ao deletar o projeto:', error.message);
    throw error;
  }
};


/**
 * Atualiza a posição de múltiplos projetos de uma só vez.
 * @param {Array<{id: number, position: number}>} projectsToUpdate - Um array de objetos, cada um com o id e a nova posição.
 */
export const updateProjectOrderAPI = async (projectsToUpdate) => {
  // --- CORREÇÃO DEFINITIVA APLICADA AQUI ---
  // Em vez de 'upsert', usamos um loop de 'update' que é mais seguro e correto.
  const updatePromises = projectsToUpdate.map(project =>
    supabase
      .from('projects')
      .update({ position: project.position })
      .eq('id', project.id)
  );

  // Executa todas as atualizações em paralelo
  const results = await Promise.all(updatePromises);

  // Verifica se alguma das atualizações falhou
  const firstError = results.find(result => result.error);
  if (firstError) {
    console.error('ERRO DETALHADO DO SUPABASE AO ATUALIZAR ORDEM:', firstError.error);
    throw firstError.error;
  }

  return { data: results.map(r => r.data), error: null };
};
