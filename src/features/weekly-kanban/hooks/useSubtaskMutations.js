import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../../../api/supabaseService';
import { useCoreDataStore } from '../../../store/useCoreDataStore';

/**
 * Hook centralizado para todas as mutações de subtarefas.
 */
export const useSubtaskMutations = () => {
  const queryClient = useQueryClient();
  const userId = useCoreDataStore(state => state.session?.user?.id);
  const queryKey = ['weeklyPlan', userId];

  const updateSubtaskMutation = useMutation({
    mutationFn: ({ subtaskId, updatedFields }) => api.updateSubtask(subtaskId, updatedFields),
    onMutate: async ({ subtaskId, updatedFields }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousSubtasks = useCoreDataStore.getState().subtasks;
      useCoreDataStore.setState(state => ({
        subtasks: state.subtasks.map(s => 
          s.id === subtaskId ? { ...s, ...updatedFields } : s
        )
      }));
      return { previousSubtasks };
    },
    onError: (err, variables, context) => {
      if (context?.previousSubtasks) {
        useCoreDataStore.setState({ subtasks: context.previousSubtasks });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const upsertTimeEntryMutation = useMutation({
    mutationFn: (entryData) => api.upsertTimeEntry(entryData),
    onMutate: async (entryData) => {
        await queryClient.cancelQueries({ queryKey });
        const previousTimeEntries = useCoreDataStore.getState().timeEntries;
        useCoreDataStore.setState(state => {
            const newTimeEntries = [...state.timeEntries];
            const idx = newTimeEntries.findIndex(e => e.subtask_id === entryData.subtask_id && e.date === entryData.date);
            if (idx > -1) {
                newTimeEntries[idx] = { ...newTimeEntries[idx], ...entryData };
            } else {
                newTimeEntries.push({ id: `temp-${Date.now()}`, ...entryData });
            }
            return { timeEntries: newTimeEntries };
        });
        return { previousTimeEntries };
    },
    onError: (err, variables, context) => {
        if (context?.previousTimeEntries) {
            useCoreDataStore.setState({ timeEntries: context.previousTimeEntries });
        }
    },
    onSettled: () => {
        queryClient.invalidateQueries({ queryKey });
    }
  });

  const addSubtaskMutation = useMutation({
    mutationFn: (subtaskData) => api.addSubtask(subtaskData),
    onMutate: async (newSubtaskData) => {
      await queryClient.cancelQueries({ queryKey });
      const tempId = `temp-${Date.now()}`;
      const optimisticSubtask = { id: tempId, completed: false, ...newSubtaskData };
      const previousSubtasks = useCoreDataStore.getState().subtasks;
      useCoreDataStore.setState(state => {
        const parentTaskSubtasks = state.subtasks.filter(s => s.task_id === newSubtaskData.task_id);
        let newSubtasksForTask;
        if (newSubtaskData.position === 0) {
          newSubtasksForTask = [optimisticSubtask, ...parentTaskSubtasks];
        } else {
          newSubtasksForTask = [...parentTaskSubtasks, optimisticSubtask];
        }
        const reorderedSubtasks = newSubtasksForTask.map((sub, index) => ({ ...sub, position: index }));
        const otherSubtasks = state.subtasks.filter(s => s.task_id !== newSubtaskData.task_id);
        return {
          subtasks: [...otherSubtasks, ...reorderedSubtasks]
        };
      });
      return { previousSubtasks };
    },
    onError: (err, variables, context) => {
      if (context?.previousSubtasks) {
        useCoreDataStore.setState({ subtasks: context.previousSubtasks });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const deleteSubtaskMutation = useMutation({
    mutationFn: (subtaskId) => api.deleteSubtask(subtaskId),
    onMutate: async (subtaskId) => {
        await queryClient.cancelQueries({ queryKey });
        const previousSubtasks = useCoreDataStore.getState().subtasks;
        useCoreDataStore.setState(state => ({
            subtasks: state.subtasks.filter(s => s.id !== subtaskId)
        }));
        return { previousSubtasks };
    },
    onError: (err, variables, context) => {
        if (context?.previousSubtasks) {
            useCoreDataStore.setState({ subtasks: context.previousSubtasks });
        }
    },
    onSettled: () => {
        queryClient.invalidateQueries({ queryKey });
    },
  });

  // --- MUTAÇÃO DE REORDENAÇÃO (LÓGICA FINAL E CORRETA) ---
  const updateOrderMutation = useMutation({
    mutationFn: (reorderedSubtasks) => 
      Promise.all(reorderedSubtasks.map(s => api.updateSubtask(s.id, { position: s.position }))),
    
    onMutate: async (reorderedSubtasks) => {
      await queryClient.cancelQueries({ queryKey });
      const previousSubtasks = useCoreDataStore.getState().subtasks;
      
      useCoreDataStore.setState(state => {
        // Pega o ID da tarefa "mãe" a partir da lista que recebemos.
        const parentTaskId = reorderedSubtasks.length > 0 ? reorderedSubtasks[0].task_id : null;
        if (!parentTaskId) return state;

        // 1. ISOLA as subtarefas de outras tarefas, que não serão tocadas.
        const otherSubtasks = state.subtasks.filter(s => s.task_id !== parentTaskId);

        // 2. A nova lista de subtarefas para a nossa tarefa "mãe" é a que recebemos.
        const newSubtasksForParent = reorderedSubtasks;

        // 3. RECOMBINA as subtarefas intocadas com a nossa nova lista atualizada.
        const finalSubtasks = [...otherSubtasks, ...newSubtasksForParent];
        
        return { subtasks: finalSubtasks };
      });

      return { previousSubtasks };
    },
    
    onError: (err, variables, context) => {
      if (context?.previousSubtasks) {
        useCoreDataStore.setState({ subtasks: context.previousSubtasks });
      }
    },

    onSettled: () => {
        queryClient.invalidateQueries({ queryKey });
    }
  });

  return {
    addSubtask: addSubtaskMutation.mutate,
    updateSubtask: updateSubtaskMutation.mutate,
    deleteSubtask: deleteSubtaskMutation.mutate,
    updateSubtaskOrder: updateOrderMutation.mutate,
    upsertTimeEntry: upsertTimeEntryMutation.mutate,
  };
};