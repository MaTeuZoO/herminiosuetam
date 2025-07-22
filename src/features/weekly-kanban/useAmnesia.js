import { useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useCoreDataStore } from '../../store/useCoreDataStore';

// Função auxiliar para obter o início da semana (Domingo) para uma data qualquer.
const getWeekStart = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
};

// Gera o array de dias (em formato string 'YYYY-MM-DD') para a "Base" estática.
const generateStaticBase = () => {
    const today = new Date(); // Usa a data atual para definir a base
    const dayOfWeek = today.getDay();
    const startOfWeek = getWeekStart(today);

    const baseDays = [];
    for (let i = 0; i < 7; i++) {
        const day = new Date(startOfWeek);
        day.setDate(startOfWeek.getDate() + i);
        baseDays.push(day.toISOString().split('T')[0]);
    }

    if (dayOfWeek >= 4) { // Buffer a partir de Quinta-feira
        const bufferStartDate = new Date(baseDays[baseDays.length - 1]);
        for (let i = 1; i <= 5; i++) {
            const day = new Date(bufferStartDate);
            day.setDate(bufferStartDate.getDate() + i);
            baseDays.push(day.toISOString().split('T')[0]);
        }
    }
    return baseDays;
};


export const useAmnesia = ({ isEnabled, virtualItems, days, scrollContainerRef, scrollRestoreRef, setIsRestoring, controllingDay }) => {
    const memoryLeakTimer = useRef(null);
    const queryClient = useQueryClient();
    const userId = useCoreDataStore(state => state.session?.user?.id);
    const queryKey = ['weeklyPlan', userId];

    // A nossa "Base" estática, calculada apenas uma vez.
    const staticBaseRef = useRef(null);
    if (!staticBaseRef.current) {
        staticBaseRef.current = generateStaticBase();
    }
    const staticBase = staticBaseRef.current;

    useEffect(() => {
        if (memoryLeakTimer.current) clearTimeout(memoryLeakTimer.current);

        if (!isEnabled || !controllingDay || days.length <= staticBase.length) {
            return;
        }
        
        // CONDIÇÃO DO GATILHO:
        // 1. O dia em foco pertence à Base estática?
        const isViewingBaseRange = staticBase.includes(controllingDay.id);
        // 2. Existem mais dias na memória do que os que compõem a Base?
        const hasExtraDaysInMemory = days.length > staticBase.length;

        if (isViewingBaseRange && hasExtraDaysInMemory) {
            memoryLeakTimer.current = setTimeout(() => {
                console.log('%c[Amnesia] GATILHO! Limpando semanas distantes...', 'color: red; font-weight: bold;');
                
                queryClient.setQueryData(queryKey, (oldData) => {
                    if (!oldData || !oldData.pages) return oldData;

                    const newPages = [];
                    const newPageParams = [];

                    // A "PODA" CORRETA:
                    // Itera pelas páginas e mantém apenas aquelas que pertencem à Base.
                    oldData.pages.forEach((page, index) => {
                        const weekStart = getWeekStart(new Date(page.weekDate)).toISOString().split('T')[0];
                        if (staticBase.includes(weekStart)) {
                            newPages.push(page);
                            newPageParams.push(oldData.pageParams[index]);
                        }
                    });

                    if (newPages.length === oldData.pages.length) return oldData;

                    // Guarda a posição ANTES de alterar os dados.
                    const anchorItem = virtualItems.find(item => days[item.index]?.id === controllingDay.id);
                    if (anchorItem) {
                        const offset = scrollContainerRef.current.scrollLeft - anchorItem.start;
                        scrollRestoreRef.current = { anchorId: controllingDay.id, offset };
                    }
                    
                    setIsRestoring(true);
                    // Atualiza o cache com as páginas E os pageParams, mantendo a consistência.
                    return { pages: newPages, pageParams: newPageParams };
                });

            }, 2000);
        }

        return () => {
            if (memoryLeakTimer.current) clearTimeout(memoryLeakTimer.current);
        };
    }, [controllingDay, isEnabled, days, queryClient, queryKey, scrollContainerRef, scrollRestoreRef, setIsRestoring, virtualItems, staticBase]);
};
