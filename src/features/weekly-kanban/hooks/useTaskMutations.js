// features/weekly-kanban/hooks/useTaskMutations.js

import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../../../api/supabaseService'; // Mantido este import, como solicitado
import * as planService from '../../../api/planService';
import { useCoreDataStore } from '../../../store/useCoreDataStore';

export const useTaskMutations = () => {
  const queryClient = useQueryClient();
  const userId = useCoreDataStore(state => state.session?.user?.id);
  const queryKey = ['weeklyPlan', userId]; // Chave principal para o Weekly Kanban

  const createTaskAndPlanMutation = useMutation({
    // A função mutationFn recebe o objeto completo { taskData, planDate, position }
    mutationFn: async ({ taskData, planDate, position }) => {
      // === CRÍTICO: Garante que o user_id esteja no taskData para a API ===
      // Sem isso, o RLS do Supabase pode estar barrando a inserção silenciosamente.
      if (!userId) {
          throw new Error("Usuário não autenticado. Não é possível criar tarefa.");
      }
      // Garante que taskData é um objeto antes de espalhar e adicionar user_id
      const dataToInsert = { ...taskData, user_id: userId };

      // Chama a função addTask do supabaseService, como solicitado.
      const { data: newTaskArray, error: taskError } = await api.addTask(dataToInsert);
      
      if (taskError || !newTaskArray?.[0]) {
          console.error("Erro detalhado da API ao criar tarefa:", taskError);
          throw new Error(taskError?.message || "Falha ao criar a tarefa no banco de dados.");
      }
      const newTask = newTaskArray[0];

      // Adiciona ao plano diário APENAS se planDate for fornecido (e for um objeto Date válido)
      if (planDate instanceof Date) { // Verifica se planDate é realmente uma data
        await planService.addTaskToDailyPlan(newTask.id, planDate, position);
      }
      return newTask; // Retorna a nova tarefa criada com o ID real
    },
    // A função onMutate recebe o objeto completo das variáveis da mutação
    onMutate: async (mutationVariables) => {
      // Desestrutura as variáveis da mutação aqui dentro, garantindo que taskData é um objeto
      const { taskData = {}, planDate, position } = mutationVariables; //
      
      await queryClient.cancelQueries({ queryKey }); // Cancela queries existentes para evitar refetches desnecessários
      const previousPlan = queryClient.getQueryData(queryKey); //

      // Garante que planDate seja um objeto Date ou null para a lógica otimista
      const actualPlanDate = planDate instanceof Date ? planDate : null;
      const planDateISO = actualPlanDate ? actualPlanDate.toISOString().split('T')[0] : null;

      // Constrói o optimisticTask com defaults robustos
      const optimisticTask = {
        ...taskData, // Espalha as propriedades de taskData
        id: `temp-${Date.now()}`, // ID temporário para a atualização otimista
        created_at: new Date().toISOString(),
        is_completed: taskData.is_completed ?? false, // Usa ?? para nullish coalescing
        planDate: planDateISO, // Pode ser null agora
        position: typeof position === 'number' ? position : 0, // Garante que position é um número
        isOptimistic: true,
        subtasks: taskData.subtasks ?? [],
        time_spent: taskData.time_spent ?? 0,
        time_planned: taskData.time_planned ?? 0, // Usa ?? para garantir 0 se undefined/null
        description: taskData.description ?? '',
        due_date: taskData.due_date ?? null,
        highlighted: taskData.highlighted ?? false,
        project_id: taskData.project_id || null,
        start_time: taskData.start_time ?? null,
        projects: taskData.projects ?? null, // Pode ser null ou o projeto real se vindo de lá
        user_id: userId, // CRÍTICO: Adiciona user_id ao objeto otimista também
      };

      // Lógica de atualização otimista do weeklyPlan APENAS se a tarefa foi planejada
      if (actualPlanDate) { // Só atualiza o weeklyPlan se uma data de plano foi fornecida
          queryClient.setQueryData(queryKey, (oldData) => {
              if (!oldData || !oldData.pages) return oldData;
              
              // Encontra a página correta para adicionar a tarefa otimista
              const targetPageIndex = oldData.pages.findIndex(page => {
                  const pageDate = new Date(page.weekDate).toISOString().split('T')[0];
                  return pageDate === planDateISO;
              });

              if (targetPageIndex !== -1) {
                  return {
                      ...oldData,
                      pages: oldData.pages.map((page, index) => {
                          if (index === targetPageIndex) {
                              //
                              const newData = (typeof position === 'number' && position === 0) ? [optimisticTask, ...(page.data || [])] : [...(page.data || []), optimisticTask];
                              return { ...page, data: newData };
                          }
                          return page;
                      }),
                  };
              }
              return oldData; //
          });
      }

      // Retorna flag se planDate foi fornecido para uso em onError/onSuccess
      // O project_id também é importante para invalidar a query ProjectTasks
      return { previousPlan, tempId: optimisticTask.id, project_id: optimisticTask.project_id, planDateProvided: !!actualPlanDate };
    },
    onError: (err, variables, context) => {
      console.error("Erro na criação/planejamento da tarefa:", err);
      // Reverte o estado APENAS se a atualização otimista do weeklyPlan foi feita
      if (context?.planDateProvided && context?.previousPlan) {
          queryClient.setQueryData(queryKey, context.previousPlan);
      }
      // Adicione um feedback visual ao usuário aqui (ex: um toast de erro)
    },
    onSuccess: (realTask, variables, context) => {
      // 1. Atualizar o cache do Weekly Kanban (substituir ID temporário pelo real)
      // APENAS se a tarefa foi adicionada otimisticamente ao weeklyPlan
      if (context?.planDateProvided) { //
          queryClient.setQueryData(queryKey, (oldData) => {
            if (!oldData) return oldData;
            return {
              ...oldData,
              pages: oldData.pages.map(page => ({
                ...page,
                data: page.data.map(task => task.id === context.tempId ? { ...realTask, position: task.position, planDate: task.planDate } : task),
              })),
            };
          });
      }

      // 2. INVALIDAR A QUERY DO PROJECTVIEW para forçar um refetch da lista de tarefas do projeto
      // Isso garante que a nova tarefa apareça na ProjectView.
      if (realTask.project_id) {
        queryClient.invalidateQueries({ queryKey: ['projectTasks', realTask.project_id] });
      }
      // Invalide também a query de 'enrichedPlan' como fallback ou para garantir consistência global
      queryClient.invalidateQueries({ queryKey: ['enrichedPlan'] });
    },
    onSettled: () => {
      // Deixamos vazio, pois a invalidação já foi feita em onSuccess
    },
  });

  const updateTaskMutation = useMutation({
      mutationFn: ({ taskId, updatedFields }) => api.updateTask(taskId, updatedFields), // Usando api (supabaseService)
      onMutate: async ({ taskId, updatedFields }) => {
        await queryClient.cancelQueries({ queryKey }); // Cancela a query principal do Kanban
        // Cancela também a query de projectTasks se o project_id estiver envolvido na atualização
        const existingTask = queryClient.getQueryData(queryKey)?.pages?.[0]?.data.find(t => t.id === taskId);
        if (existingTask && updatedFields.project_id !== undefined) {
             await queryClient.cancelQueries({ queryKey: ['projectTasks', existingTask.project_id] });
             // Se o projeto mudou, cancelar a query do novo projeto também
             if (updatedFields.project_id !== null) {
                 await queryClient.cancelQueries({ queryKey: ['projectTasks', updatedFields.project_id] });
             }
        }

        const previousPlan = queryClient.getQueryData(queryKey);
        // Atualização otimista para o Kanban
        queryClient.setQueryData(queryKey, (oldData) => {
            if (!oldData) return oldData;
            return {
                ...oldData,
                pages: oldData.pages.map(page => ({
                    ...page,
                    data: page.data.map(task => task.id === taskId ? { ...task, ...updatedFields } : task),
                })),
            };
        });

        // Atualização otimista para ProjectTasks se a tarefa está visível lá
        queryClient.setQueriesData({ queryKey: ['projectTasks'] }, (oldProjectTasksData) => {
            // Verifica se oldProjectTasksData é um array antes de mapear
            if (!Array.isArray(oldProjectTasksData)) return oldProjectTasksData;
            return oldProjectTasksData.map(task => task.id === taskId ? { ...task, ...updatedFields } : task);
        });

        return { previousPlan };
      },
      onError: (err, variables, context) => {
        if (context?.previousPlan) queryClient.setQueryData(queryKey, context.previousPlan);
        console.error("Erro ao atualizar tarefa:", err);
      },
      onSettled: (updatedTask, error, variables, context) => {
          // Invalidar queries relevantes para garantir consistência após otimista e server update
          if (updatedTask && updatedTask.project_id) {
            queryClient.invalidateQueries({ queryKey: ['projectTasks', updatedTask.project_id] });
          }
          queryClient.invalidateQueries({ queryKey }); // Invalida a query principal do Kanban
          queryClient.invalidateQueries({ queryKey: ['enrichedPlan'] }); // Invalida a query de enrichedPlan
          // Se o project_id mudou, invalida a query do projeto antigo também
          const originalProjectId = context?.previousPlan?.pages?.[0]?.data.find(t => t.id === variables.taskId)?.project_id;
          if (originalProjectId && originalProjectId !== updatedTask?.project_id) {
              queryClient.invalidateQueries({ queryKey: ['projectTasks', originalProjectId] });
          }
      },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (taskId) => api.deleteTask(taskId), // Usando api (supabaseService)
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey }); // Cancela a query principal do Kanban
      // Cancela também queries de projectTasks se a tarefa estiver lá
      const taskToDelete = queryClient.getQueryData(queryKey)?.pages?.[0]?.data.find(t => t.id === taskId);
      if (taskToDelete && taskToDelete.project_id) {
          await queryClient.cancelQueries({ queryKey: ['projectTasks', taskToDelete.project_id] });
      }

      const previousPlan = queryClient.getQueryData(queryKey);
      // Atualização otimista para o Kanban
      queryClient.setQueryData(queryKey, (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map(page => ({
            ...page,
            data: page.data.filter(task => task.id !== taskId)
          }))
        };
      });

      // Atualização otimista para ProjectTasks
      queryClient.setQueriesData({ queryKey: ['projectTasks'] }, (oldProjectTasksData) => {
        // Verifica se oldProjectTasksData é um array antes de filtrar
        if (!Array.isArray(oldProjectTasksData)) return oldProjectTasksData;
        return oldProjectTasksData.filter(task => task.id !== taskId);
      });

      return { previousPlan, project_id: taskToDelete?.project_id }; // Passa project_id para o contexto
    },
    onError: (err, taskId, context) => {
      if (context?.previousPlan) queryClient.setQueryData(queryKey, context.previousPlan);
      console.error("Erro ao deletar tarefa:", err);
    },
    onSettled: (deletedData, error, taskId, context) => {
      // Invalida a query principal do Kanban
      queryClient.invalidateQueries({ queryKey });
      // Invalida a query de ProjectTasks do projeto da tarefa deletada
      if (context?.project_id) {
        queryClient.invalidateQueries({ queryKey: ['projectTasks', context.project_id] });
      }
      // Invalida a query de enrichedPlan
      queryClient.invalidateQueries({ queryKey: ['enrichedPlan'] });
    },
  });

  const updateTaskOrderMutation = useMutation({
    mutationFn: (planEntriesToUpdate) => {
      return Promise.all(planEntriesToUpdate.map(entry => {
        const updatedFields = { position: entry.position };
        if (entry.planDate) {
          updatedFields.plan_date = entry.planDate;
        }
        return planService.updatePlanEntry(entry.planEntryId, updatedFields);
      }));
    },
    onMutate: async (planEntriesToUpdate) => {
      await queryClient.cancelQueries({ queryKey });
      const previousPlan = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, (oldData) => {
        if (!oldData) return oldData;
        const entriesMap = new Map();
        planEntriesToUpdate.forEach(e => {
            entriesMap.set(e.planEntryId, { position: e.position, planDate: e.planDate });
        });
        return {
          ...oldData,
          pages: oldData.pages.map(page => ({
            ...page,
            data: page.data.map(task => {
              if (entriesMap.has(task.planEntryId)) {
                const update = entriesMap.get(task.planEntryId);
                return { ...task, position: update.position, planDate: update.planDate || task.planDate };
              }
              return task;
            }),
          })),
        };
      });
      return { previousPlan };
    },
    onError: (err, variables, context) => {
      if (context?.previousPlan) {
        queryClient.setQueryData(queryKey, context.previousPlan);
      }
      queryClient.invalidateQueries({ queryKey });
      console.error("Erro ao atualizar ordem das tarefas:", err);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey }); // Invalida a query principal para garantir estado mais recente
      queryClient.invalidateQueries({ queryKey: ['enrichedPlan'] }); // Invalida a query de enrichedPlan
    },
  });

  const upsertTimeEntryMutation = useMutation({
    mutationFn: (entryData) => api.upsertTimeEntry(entryData), // Usando api (supabaseService)
    onMutate: async (entryData) => {
        const previousTimeEntries = useCoreDataStore.getState().timeEntries;
        useCoreDataStore.setState(state => {
            const newTimeEntries = [...state.timeEntries];
            const idx = newTimeEntries.findIndex(e =>
                e.task_id === entryData.task_id &&
                e.subtask_id === entryData.subtask_id &&
                e.date === entryData.date
            );
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
        console.error("Erro ao inserir/atualizar entrada de tempo:", err);
    },
    onSettled: () => {
        queryClient.invalidateQueries({ queryKey: ['timeEntries'] });
        // Invalida queries relacionadas a tarefas para que o tempo total seja recalculado
        queryClient.invalidateQueries({ queryKey }); // weeklyPlan
        // Invalida a query de projectTasks de forma mais específica se possível, ou geral
        queryClient.invalidateQueries({ queryKey: ['projectTasks'] }); // Invalida todas as queries de projectTasks
        queryClient.invalidateQueries({ queryKey: ['enrichedPlan'] });
    }
  });

  const updateSubtaskMutation = useMutation({
    mutationFn: ({ subtaskId, updatedFields }) => api.updateSubtask(subtaskId, updatedFields), // Usando api (supabaseService)
    onSuccess: (updatedSubtask, variables) => {
        // As subtarefas fazem parte do useCoreDataStore e do enrichedPlan/weeklyPlan
        // Revalidar enrichedPlan e weeklyPlan é suficiente para a maioria dos casos
        queryClient.invalidateQueries({ queryKey }); // weeklyPlan
        queryClient.invalidateQueries({ queryKey: ['enrichedPlan'] });
        // Opcional: Se a subtarefa afeta o tempo total de uma tarefa, e essa tarefa está em um projeto específico,
        // você pode querer invalidar também a query do projeto da tarefa pai.
        // Se `updatedSubtask` contém `task_id` e `task` (com `project_id`), poderia fazer:
        // if (updatedSubtask?.task?.project_id) {
        //    queryClient.invalidateQueries({ queryKey: ['projectTasks', updatedSubtask.task.project_id] });
        // }
    },
    onError: (err) => {
        console.error("Erro ao atualizar subtarefa:", err);
    }
  });

  const deleteSubtaskMutation = useMutation({
    mutationFn: (subtaskId) => api.deleteSubtask(subtaskId), // Usando api (supabaseService)
    onSuccess: () => {
        // Revalidar enrichedPlan e weeklyPlan
        queryClient.invalidateQueries({ queryKey }); // weeklyPlan
        queryClient.invalidateQueries({ queryKey: ['enrichedPlan'] });
        // Como no update, se a exclusão de uma subtarefa afeta o tempo total da tarefa pai,
        // pode ser necessário invalidar a query do projeto da tarefa pai.
    },
    onError: (err) => {
        console.error("Erro ao deletar subtarefa:", err);
    }
  });

  const updateOrderMutation = useMutation({
    mutationFn: (reorderedSubtasks) =>
      Promise.all(reorderedSubtasks.map(s => api.updateSubtask(s.id, { position: s.position }))), // Usando api (supabaseService)
    onSuccess: () => {
        // Revalidar enrichedPlan e weeklyPlan
        queryClient.invalidateQueries({ queryKey }); // weeklyPlan
        queryClient.invalidateQueries({ queryKey: ['enrichedPlan'] });
    },
    onError: (err) => {
        console.error("Erro ao atualizar ordem das subtarefas:", err);
    }
  });

  return {
    createTask: createTaskAndPlanMutation.mutate,
    deleteTask: deleteTaskMutation.mutate,
    updateTask: updateTaskMutation.mutate,
    updateTaskOrder: updateTaskOrderMutation.mutate,
    updateSubtask: updateSubtaskMutation.mutate,
    deleteSubtask: deleteSubtaskMutation.mutate,
    updateSubtaskOrder: updateOrderMutation.mutate,
    upsertTimeEntry: upsertTimeEntryMutation.mutate,
  };
};