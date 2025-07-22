import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addProjectAPI, updateProjectAPI, deleteProjectAPI } from '../../../api/projectService';
import { useCoreDataStore } from '../../../store/useCoreDataStore';

export const useProjectMutations = () => {
  const queryClient = useQueryClient();
  const session = useCoreDataStore((state) => state.session);
  // Pegamos a função de refetch correta do nosso store
  const refetchProjects = useCoreDataStore((state) => state.refetchProjects);

  // Mutação para CRIAR um novo projeto
  const createProjectMutation = useMutation({
    mutationFn: (projectData) => {
      if (!session?.user?.id) throw new Error('Usuário não autenticado');
      return addProjectAPI({ ...projectData, user_id: session.user.id });
    },
    onSuccess: () => {
      // --- CORREÇÃO APLICADA ---
      // Chama a função que força a atualização da lista de projetos no Zustand.
      if (session?.user?.id) {
        refetchProjects(session.user.id);
      }
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  // Mutação para ATUALIZAR um projeto existente
  const updateProjectMutation = useMutation({
    mutationFn: ({ projectId, updates }) => updateProjectAPI(projectId, updates),
    onSuccess: () => {
      // --- CORREÇÃO APLICADA ---
      if (session?.user?.id) {
        refetchProjects(session.user.id);
      }
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  // Mutação para DELETAR um projeto
  const deleteProjectMutation = useMutation({
    mutationFn: (projectId) => deleteProjectAPI(projectId),
    onSuccess: () => {
      // --- CORREÇÃO APLICADA ---
      if (session?.user?.id) {
        refetchProjects(session.user.id);
      }
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  return {
    createProject: createProjectMutation.mutate,
    isCreatingProject: createProjectMutation.isPending,
    updateProject: updateProjectMutation.mutate,
    isUpdatingProject: updateProjectMutation.isPending,
    deleteProject: deleteProjectMutation.mutate,
    isDeletingProject: deleteProjectMutation.isPending,
  };
};
