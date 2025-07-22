import { create } from 'zustand';
import * as api from '../api/supabaseService';
import * as projectService from '../api/projectService';
import { usePlanStore } from './usePlanStore';

export const useCoreDataStore = create((set, get) => ({
  // --- ESTADO ---
  projects: [],
  tasks: [],
  subtasks: [],
  timeEntries: [],
  session: null,
  dataLoaded: false,

  // --- AÇÕES ---

  setSession: (session) => set({ session }),

  fetchCoreData: async (userId) => {
    if (get().dataLoaded) return;
    try {
      const [projectsRes, tasksRes, subtasksRes, timeEntriesRes] = await Promise.all([
        projectService.fetchProjectsAPI(userId),
        api.fetchTasks(userId),
        api.fetchSubtasks(userId),
        api.fetchTimeEntries(userId),
      ]);
      set({
        projects: projectsRes || [],
        tasks: tasksRes.data || [],
        subtasks: subtasksRes.data || [],
        timeEntries: timeEntriesRes.data || [],
        dataLoaded: true,
      });
    } catch (error) {
      console.error("Erro ao carregar dados base:", error);
      set({ dataLoaded: false });
    }
  },

  refetchProjects: async (userId) => {
    try {
      const projectsRes = await projectService.fetchProjectsAPI(userId);
      set({ projects: projectsRes || [] });
    } catch (error)      {
      console.error("Erro ao recarregar projetos:", error);
    }
  },

  // --- AÇÃO DE REORDENAR PROJETOS (LÓGICA ROBUSTA) ---
  /**
   * Atualiza a ordem dos projetos na UI e no banco de dados.
   * @param {Array} reorderedProjects - A lista de projetos na nova ordem.
   */
  updateProjectOrder: async (reorderedProjects) => {
    const originalProjects = get().projects;
    
    const projectsToUpdate = reorderedProjects.map((project, index) => ({
      id: project.id,
      position: index,
    }));

    try {
      // 1. Salva a nova ordem no banco de dados PRIMEIRO.
      await projectService.updateProjectOrderAPI(projectsToUpdate);
      
      // 2. Se a chamada for bem-sucedida, ATUALIZA a UI com a nova ordem.
      set({ projects: reorderedProjects });

    } catch (error) {
      console.error("Falha ao salvar a ordem dos projetos. A UI não foi alterada.", error);
      // 3. Se a chamada falhar, a UI não é alterada, mantendo a consistência.
      // Opcional: reverter para a ordem original se uma atualização otimista fosse usada.
      set({ projects: originalProjects });
    }
  },

  // --- Ações CRUD para Tarefas ---
  addTask: async (taskData) => {
    const { data, error } = await api.addTask(taskData);
    if (error) throw error;
    if (data?.[0]) {
      set(state => ({ tasks: [data[0], ...state.tasks] }));
      return data[0];
    }
    return null;
  },

  updateTask: async (taskId, updatedFields) => {
    const originalTasks = get().tasks;
    set(state => ({
      tasks: state.tasks.map(t => (t.id === taskId ? { ...t, ...updatedFields } : t)),
    }));
    usePlanStore.getState().updateTaskInPlan(taskId, updatedFields);
    try {
      const { error } = await api.updateTask(taskId, updatedFields);
      if (error) throw error;
    } catch (error) {
      console.error("Falha ao atualizar a tarefa no servidor. Revertendo.", error);
      set({ tasks: originalTasks });
    }
  },
  
  deleteTask: async (taskId) => { 
    const originalTasks = get().tasks;
    set(state => ({ tasks: state.tasks.filter(t => t.id !== taskId) })); 
    usePlanStore.getState().removeTaskFromPlan(taskId);
    const { error } = await api.deleteTask(taskId); 
    if(error) {
      console.error("Falha ao apagar a tarefa. Revertendo.", error);
      set({ tasks: originalTasks });
    }
  },

  // --- Ações CRUD para Subtarefas ---
  addSubtask: async (subtaskData) => { 
    const { data } = await api.addSubtask(subtaskData); 
    if (data?.[0]) set(state => ({ subtasks: [...state.subtasks, data[0]] })); 
  },

  updateSubtask: async (subtaskId, updatedFields) => { 
    set(state => ({ subtasks: state.subtasks.map(s => s.id === subtaskId ? { ...s, ...updatedFields } : s) })); 
    await api.updateSubtask(subtaskId, updatedFields); 
  },

  deleteSubtask: async (subtaskId) => { 
    const original = get().subtasks; 
    set(state => ({ subtasks: state.subtasks.filter(s => s.id !== subtaskId) })); 
    const { error } = await api.deleteSubtask(subtaskId); 
    if(error) set({ subtasks: original }); 
  },

  updateSubtaskOrder: async (reorderedSubtasks) => { 
    set(state => { 
      const other = state.subtasks.filter(s => s.task_id !== reorderedSubtasks[0]?.task_id); 
      return { subtasks: [...other, ...reorderedSubtasks].sort((a, b) => a.position - b.position) }; 
    }); 
    await Promise.all(reorderedSubtasks.map(s => api.updateSubtask(s.id, { position: s.position }))); 
  },

  // --- Ações de Apontamento de Tempo ---
  upsertTimeEntry: async (entryData) => {
    const currentState = get();
    const existingEntry = currentState.timeEntries.find(e => 
        e.task_id === entryData.task_id &&
        e.subtask_id === entryData.subtask_id &&
        e.date === entryData.date
    );
    const updatedEntry = { ...existingEntry, ...entryData };
    set(state => {
        const entryIndex = state.timeEntries.findIndex(e => e.id === updatedEntry.id);
        const newTimeEntries = [...state.timeEntries];
        if (entryIndex > -1) {
            newTimeEntries[entryIndex] = updatedEntry;
        } else {
            const businessKeyIndex = state.timeEntries.findIndex(e => 
                e.task_id === updatedEntry.task_id &&
                e.subtask_id === entryData.subtask_id &&
                e.date === entryData.date
            );
            if(businessKeyIndex > -1) {
                newTimeEntries[businessKeyIndex] = updatedEntry;
            } else {
                newTimeEntries.push(updatedEntry);
            }
        }
        return { timeEntries: newTimeEntries };
    });
    const apiData = { ...updatedEntry };
    if (typeof apiData.id === 'string' && apiData.id.startsWith('temp-')) {
        delete apiData.id;
    }
    await api.upsertTimeEntry(apiData);
  },

  tickTimer: (activeTimer, userId) => {
    if (!activeTimer) return;
    const getTodayDateString = () => new Date().toISOString().split('T')[0];
    const today = getTodayDateString();
    set(state => {
        const newTimeEntries = [...state.timeEntries];
        const entryIndex = newTimeEntries.findIndex(e => 
            e.task_id === activeTimer.taskId && 
            e.subtask_id === activeTimer.subtaskId && 
            e.date === today
        );
        if (entryIndex > -1) {
            const entry = newTimeEntries[entryIndex];
            newTimeEntries[entryIndex] = { ...entry, time_spent_seconds: (entry.time_spent_seconds || 0) + 1 };
        } else {
            newTimeEntries.push({
                id: `temp-${Date.now()}`,
                user_id: userId,
                task_id: activeTimer.taskId,
                subtask_id: activeTimer.subtaskId,
                date: today,
                time_spent_seconds: 1,
            });
        }
        return { timeEntries: newTimeEntries };
    });
  },
}));
