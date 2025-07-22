import { useInfiniteQuery } from '@tanstack/react-query';
import * as planService from '../../../api/planService';
import { useCoreDataStore } from '../../../store/useCoreDataStore';

// --- FUNÇÃO CORRIGIDA: Lógica de datas segura e sem mutação ---
const getWeekStart = (date) => {
  const d = new Date(date);
  const day = d.getDay(); // 0 para Domingo, 1 para Segunda, etc.
  // Calcula a data do domingo da semana correspondente
  const diff = d.getDate() - day;
  // Retorna um NOVO objeto de data, sem alterar o original.
  return new Date(d.getFullYear(), d.getMonth(), diff);
};

export const useWeeklyPlanQuery = () => {
  const userId = useCoreDataStore(state => state.session?.user?.id);

  return useInfiniteQuery({
    queryKey: ['weeklyPlan', userId],
    
    queryFn: async ({ pageParam }) => {
      const weekStart = getWeekStart(pageParam);
      const weekEnd = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 6);
      
      console.log(`[useWeeklyPlanQuery] Buscando dados para a semana de: ${weekStart.toLocaleDateString()}`);
      
      const planData = await planService.getDailyPlanForDateRange(userId, weekStart, weekEnd);
      
      return { data: planData || [], weekDate: weekStart };
    },

    initialPageParam: new Date(),

    // --- LÓGICA CORRIGIDA para obter a próxima página ---
    getNextPageParam: (lastPage) => {
      if (!lastPage?.weekDate) return undefined;
      const current = new Date(lastPage.weekDate);
      // Cria uma nova data 7 dias no futuro, sem mutar a original.
      return new Date(current.getFullYear(), current.getMonth(), current.getDate() + 7);
    },

    // --- LÓGICA CORRIGIDA para obter a página anterior ---
    getPreviousPageParam: (firstPage) => {
      if (!firstPage?.weekDate) return undefined;
      const current = new Date(firstPage.weekDate);
      // Cria uma nova data 7 dias no passado, sem mutar a original.
      return new Date(current.getFullYear(), current.getMonth(), current.getDate() - 7);
    },

    enabled: !!userId,
    staleTime: 1000 * 60 * 5, 
    gcTime: 1000 * 60 * 15, 
  });
};
