import { useQuery } from '@tanstack/react-query';
import { fetchTasksByProjectAPI } from '../../../api/taskService'; // Ajuste o caminho se necessário

/**
 * Hook para buscar todas as tarefas de um projeto específico.
 * Utiliza o TanStack Query para gerenciar o cache, o estado de carregamento e os erros.
 *
 * @param {number | null} projectId - O ID do projeto para o qual buscar as tarefas.
 * @returns {object} O resultado da query do TanStack Query, contendo { data, isLoading, isError, error }.
 */
export const useProjectTasksQuery = (projectId) => {
  return useQuery({
    // A chave da query é um array. O segundo elemento é o projectId.
    // Isso garante que, se o projectId mudar, o TanStack Query buscará os dados para o novo projeto.
    // Ex: ['projectTasks', 1], ['projectTasks', 2], etc.
    queryKey: ['projectTasks', projectId],

    // A função que será executada para buscar os dados.
    // Ela só será chamada se o projectId for um valor válido (não nulo/undefined).
    queryFn: () => fetchTasksByProjectAPI(projectId),

    // 'enabled' é uma opção poderosa: a query só será executada se 'enabled' for true.
    // Isso impede uma chamada à API desnecessária quando nenhum projeto está selecionado (projectId é nulo).
    enabled: !!projectId,

    // Opcional: manter os dados anteriores em tela enquanto os novos são carregados
    // para uma transição mais suave entre projetos.
    keepPreviousData: true,
  });
};
