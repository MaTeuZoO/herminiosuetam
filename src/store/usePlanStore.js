import { create } from 'zustand';

/**
 * Com a introdução do TanStack Query, este store foi drasticamente simplificado.
 * Ele não é mais responsável por buscar ou armazenar os dados do plano semanal.
 * Sua única função agora é gerir o estado da UI que não pertence ao servidor,
 * como a data de foco do utilizador no calendário.
 */
export const usePlanStore = create((set, get) => ({
  /**
   * A data que o utilizador está a visualizar. Serve como ponto de referência
   * para navegação e pode ser usada por outros componentes.
   */
  focusDate: new Date(),

  /**
   * Atualiza a data de foco.
   * @param {Date} date - A nova data de foco.
   */
  setFocusDate: (date) => set({ focusDate: date }),

  /**
   * Move a data de foco para a semana anterior.
   * A busca de dados para esta nova semana será acionada automaticamente
   * pelo componente que usa o hook `useWeeklyPlanQuery`.
   */
  goToPreviousWeek: () => {
    set(state => {
      const newFocusDate = new Date(state.focusDate);
      newFocusDate.setDate(newFocusDate.getDate() - 7);
      return { focusDate: newFocusDate };
    });
  },

  /**
   * Move a data de foco para a semana seguinte.
   */
  goToNextWeek: () => {
    set(state => {
      const newFocusDate = new Date(state.focusDate);
      newFocusDate.setDate(newFocusDate.getDate() + 7);
      return { focusDate: newFocusDate };
    });
  },

  // NOTA: Todas as outras ações como `reorderPlan`, `addTaskToPlan`, `removeTaskFromPlan`
  // e `updateTaskInPlan` foram removidas. A manipulação de dados agora é feita
  // através de "mutações" do TanStack Query, que invalidam a query 'weeklyPlan'
  // para buscar os dados atualizados automaticamente.
}));
