import { create } from 'zustand';
import * as api from '../api/supabaseService';
import * as planService from '../api/planService';

const getTodayDateString = () => {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const adjustedToday = new Date(today.getTime() - (offset*60*1000));
    return adjustedToday.toISOString().split('T')[0];
}

export const useDataStore = create((set, get) => ({
  // --- ESTADO ---
  projects: [],
  tasks: [],
  subtasks: [],
  timeEntries: [],
  dataLoaded: false,
  session: null,
  focusDate: new Date(),
  dailyPlan: [],
  isLoadingPlan: false,

  // --- AÇÕES ---
  fetchInitialData: async (userId, session) => {
    if (get().dataLoaded) return; 
    try {
      const [projectsRes, tasksRes, subtasksRes, timeEntriesRes] = await Promise.all([
        api.fetchProjects(userId),
        api.fetchTasks(userId),
        api.fetchSubtasks(userId),
        api.fetchTimeEntries(userId),
      ]);
      set({
        projects: projectsRes.data || [],
        tasks: tasksRes.data || [],
        subtasks: subtasksRes.data || [],
        timeEntries: timeEntriesRes.data || [],
        dataLoaded: true,
        session: session,
      });
      await get().fetchWeeklyPlan(get().focusDate);
    } catch (error) {
      console.error("Erro ao carregar dados na store:", error);
      set({ dataLoaded: false });
    }
  },

  // --- CORREÇÃO AQUI ---
  // A ação updateTask agora atualiza tanto a lista geral 'tasks' quanto o 'dailyPlan'.
  // Isso garante que a UI do Kanban e do Modal fiquem sincronizadas instantaneamente.
  updateTask: async (taskId, updatedFields) => {
    set(state => ({
      // 1. Atualiza a lista principal de tarefas (comportamento antigo mantido)
      tasks: state.tasks.map(t => 
        (t.id === taskId ? { ...t, ...updatedFields } : t)
      ),
      // 2. Atualiza a tarefa correspondente dentro do plano semanal
      dailyPlan: state.dailyPlan.map(planEntry => 
        (planEntry.id === taskId ? { ...planEntry, ...updatedFields } : planEntry)
      )
    }));
    // A chamada para o backend continua a mesma, garantindo que os dados sejam salvos.
    await api.updateTask(taskId, updatedFields);
  },
  
  // O restante das ações permanece o mesmo...
  addTask: async (taskData) => {
    try {
      const { data, error } = await api.addTask(taskData);
      if (error) throw error;
      if (data && data.length > 0) {
        set(state => ({ tasks: [data[0], ...state.tasks] }));
      }
    } catch (error) {
      console.error("Erro ao adicionar tarefa na store:", error);
    }
  },
  deleteTask: async (taskId) => { 
    const originalTasks = get().tasks;
    const originalPlan = get().dailyPlan;
    set(state => ({ 
      tasks: state.tasks.filter(t => t.id !== taskId),
      dailyPlan: state.dailyPlan.filter(p => p.id !== taskId)
    })); 
    const { error } = await api.deleteTask(taskId); 
    if(error) {
      set({ tasks: originalTasks, dailyPlan: originalPlan });
    }
  },
  addSubtask: async (subtaskData) => { const { data } = await api.addSubtask(subtaskData); if (data) set(state => ({ subtasks: [...state.subtasks, data[0]] })); },
  updateSubtask: async (subtaskId, updatedFields) => { set(state => ({ subtasks: state.subtasks.map(s => s.id === subtaskId ? { ...s, ...updatedFields } : s) })); await api.updateSubtask(subtaskId, updatedFields); },
  deleteSubtask: async (subtaskId) => { const original = get().subtasks; set(state => ({ subtasks: state.subtasks.filter(s => s.id !== subtaskId) })); const { error } = await api.deleteSubtask(subtaskId); if(error) set({ subtasks: original }); },
  updateSubtaskOrder: async (reorderedSubtasks) => { set(state => { const other = state.subtasks.filter(s => s.task_id !== reorderedSubtasks[0]?.task_id); return { subtasks: [...other, ...reorderedSubtasks].sort((a, b) => a.position - b.position) }; }); await Promise.all(reorderedSubtasks.map(s => api.updateSubtask(s.id, { position: s.position }))); },

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
    const { error } = await api.upsertTimeEntry(apiData);
    if (error) {
        console.error("Falha ao sincronizar com o Supabase (a UI já foi atualizada):", error.message);
    }
  },

  tickTimer: (activeTimer, userId) => {
    if (!activeTimer) return;
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

  fetchWeeklyPlan: async (dateInWeek) => {
    const userId = get().session?.user?.id;
    if (!userId) return;
    set({ isLoadingPlan: true });

    const date = new Date(dateInWeek);
    const dayOfWeek = date.getDay();
    const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(date.setDate(diff));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    try {
        const plan = await planService.getDailyPlanForDateRange(userId, monday, sunday);
        set({ dailyPlan: plan, isLoadingPlan: false });
    } catch (error) {
        console.error("Falha ao buscar o plano semanal na store:", error);
        set({ isLoadingPlan: false });
    }
  },
  goToPreviousWeek: () => {
      const prevWeek = new Date(get().focusDate);
      prevWeek.setDate(prevWeek.getDate() - 7);
      set({ focusDate: prevWeek });
      get().fetchWeeklyPlan(prevWeek);
  },
  goToNextWeek: () => {
      const nextWeek = new Date(get().focusDate);
      nextWeek.setDate(nextWeek.getDate() + 7);
      set({ focusDate: nextWeek });
      get().fetchWeeklyPlan(nextWeek);
  },
  reorderPlan: async (updatedPlan) => {
    set({ dailyPlan: updatedPlan });
    const updatePromises = updatedPlan.map((task) => {
      const updatedFields = {
        plan_date: task.planDate,
        position: task.position,
      };
      return planService.updatePlanEntry(task.planEntryId, updatedFields);
    });
    await Promise.all(updatePromises);
  },
  addTaskAndPlanForDay: async (taskData, planDate) => {
    const { data: newTaskArray, error: addTaskError } = await api.addTask(taskData);
    if (addTaskError || !newTaskArray || newTaskArray.length === 0) {
        console.error("Falha ao criar tarefa no banco de dados", addTaskError);
        return;
    }
    const newTask = newTaskArray[0];
    set(state => ({ tasks: [newTask, ...state.tasks] }));

    const { dailyPlan, focusDate } = get();
    const dateString = planDate.toISOString().split('T')[0];
    const position = dailyPlan.filter(t => t.planDate === dateString).length;

    await planService.addTaskToDailyPlan(newTask.id, planDate, position);
    await get().fetchWeeklyPlan(focusDate);
  },
}));
