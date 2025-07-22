import { supabase } from '../supabaseClient';

// --- Funções de Autenticação ---
export const getSession = () => supabase.auth.getSession();
export const onAuthStateChange = (callback) => supabase.auth.onAuthStateChange(callback);
export const signUp = (credentials) => supabase.auth.signUp(credentials);
export const signIn = (credentials) => supabase.auth.signInWithPassword(credentials);
export const signOut = () => supabase.auth.signOut();

// --- Funções de Projetos ---
export const fetchProjects = async (userId) => {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('name', { ascending: true });
  if (error) console.error('Erro buscando projetos:', error);
  return { data, error };
};

export const addProject = async (projectName, userId) => {
  const { data, error } = await supabase
    .from('projects')
    .insert([{ name: projectName, user_id: userId }])
    .select();
  if (error) console.error('Erro adicionando projeto:', error);
  return { data, error };
};

// --- Funções de Tarefas ---
export const fetchTasks = async (userId) => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .order('completed', { ascending: true })
    .order('created_at', { ascending: false });
  if (error) console.error('Erro buscando tarefas:', error);
  return { data, error };
};

export const addTask = async (taskData) => {
  const { data, error } = await supabase
    .from('tasks')
    .insert([taskData])
    .select();
  if (error) console.error('Erro adicionando tarefa:', error);
  return { data, error };
};

export const updateTask = async (taskId, updatedFields) => {
  const { error } = await supabase
    .from('tasks')
    .update(updatedFields)
    .eq('id', taskId);
  if (error) console.error('Erro ao atualizar tarefa:', error);
  return { error };
};

// ESTA FUNÇÃO ESTÁ CORRETA. ELA NÃO TEM NENHUM POP-UP.
export const deleteTask = async (taskId) => {
    const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);
    if (error) console.error('Erro ao excluir tarefa:', error);
    return { error };
};

// --- Funções de Subtarefas ---
export const fetchSubtasks = async (userId) => {
  const { data, error } = await supabase
    .from('subtasks')
    .select('*')
    .eq('user_id', userId);
  if (error) console.error('Erro buscando subtarefas:', error);
  return { data, error };
};

export const addSubtask = async (subtaskData) => {
    const { data, error } = await supabase
        .from('subtasks')
        .insert([subtaskData])
        .select();
    if (error) console.error('Erro adicionando subtarefa:', error);
    return { data, error };
};

export const updateSubtask = async (subtaskId, updatedFields) => {
    const { error } = await supabase
        .from('subtasks')
        .update(updatedFields)
        .eq('id', subtaskId);
    if (error) console.error('Erro ao atualizar subtarefa:', error);
    return { error };
};

export const deleteSubtask = async (subtaskId) => {
    const { error } = await supabase
        .from('subtasks')
        .delete()
        .eq('id', subtaskId);
    if (error) console.error("Erro ao deletar subtarefa:", error);
    return { error };
};

// --- Funções de Entradas de Tempo ---
export const fetchTimeEntries = async (userId) => {
    const { data, error } = await supabase
        .from('time_entries')
        .select('*')
        .eq('user_id', userId);
    if (error) console.error('Erro buscando entradas de tempo:', error);
    return { data, error };
};

export const upsertTimeEntry = async (entryData) => {
    const { data, error } = await supabase
        .from('time_entries')
        .upsert(entryData, {
            onConflict: 'task_id, subtask_id, date',
        })
        .select();
        
    if (error) {
        console.error('Erro ao salvar entrada de tempo:', error);
    }
    
    return { data, error };
};

// --- ADIÇÃO: Exportando a instância do Supabase para ser usada em outros serviços ---
export { supabase };
