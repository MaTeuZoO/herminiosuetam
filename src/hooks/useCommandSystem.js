import { useEffect, useCallback } from 'react';
import { useTaskMutations } from '../features/weekly-kanban/hooks/useTaskMutations';
import { useCoreDataStore } from '../store/useCoreDataStore';

// O histórico de comandos permanece o mesmo
const commandHistory = {
  stack: [],
  push(action) {
    this.stack.push(action);
    if (this.stack.length > 20) {
      this.stack.shift();
    }
    console.log("Ação adicionada ao histórico:", action);
  },
  pop() {
    return this.stack.pop();
  },
};

// O hook agora recebe a lista de tarefas para poder encontrar os dados
export const useCommandSystem = (selectedTaskId, enrichedPlan) => {
  const { deleteTask, createTask } = useTaskMutations();
  const userId = useCoreDataStore(state => state.session?.user?.id);

  const undoLastAction = useCallback(() => {
    const lastAction = commandHistory.pop();
    if (!lastAction) {
      console.log("Nada para desfazer.");
      return;
    }

    console.log("Desfazendo ação:", lastAction);

    if (lastAction.type === 'DELETE_TASK') {
      const { taskData, planDate, position } = lastAction.payload;
      // Para desfazer um 'delete', nós recriamos a tarefa com os dados guardados
      createTask({ taskData, planDate, position });
    }
    
  }, [createTask]);

  const handleDelete = useCallback(() => {
    if (!selectedTaskId || !enrichedPlan) return;

    // --- AQUI ESTÁ A CORREÇÃO ---
    // 1. Encontrar a tarefa completa na nossa lista de tarefas
    const taskToDelete = enrichedPlan.find(t => t.id === selectedTaskId);

    if (!taskToDelete) {
      console.error("Não foi possível encontrar a tarefa para apagar.");
      return;
    }

    // 2. Guardar os dados essenciais da tarefa no histórico ANTES de a apagar
    commandHistory.push({
      type: 'DELETE_TASK',
      payload: { 
        // Recriamos o objeto 'taskData' que a função 'createTask' espera
        taskData: {
          title: taskToDelete.title,
          description: taskToDelete.description,
          due_date: taskToDelete.due_date,
          project_id: taskToDelete.project_id,
          user_id: userId,
          // Adicione outros campos que sejam importantes
        },
        planDate: new Date(taskToDelete.planDate),
        position: taskToDelete.position,
      }
    });

    // 3. Agora, apagar a tarefa
    console.log(`Comando para apagar a tarefa: ${selectedTaskId}`);
    deleteTask(selectedTaskId);

  }, [selectedTaskId, deleteTask, enrichedPlan, userId, createTask]); // Adicionadas as dependências

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undoLastAction();
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') {
          return;
        }
        e.preventDefault();
        handleDelete();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [undoLastAction, handleDelete]);
};
