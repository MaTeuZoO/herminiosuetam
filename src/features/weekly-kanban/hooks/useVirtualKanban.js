import { useMemo, useCallback, useState, useLayoutEffect, useRef, useEffect } from 'react';
import { useEnrichedPlan } from './useEnrichedPlan';
import { useWeeklyVirtualizer } from '../useWeeklyVirtualizer';
import { useAmnesia } from '../useAmnesia';

const COLUMN_WIDTH = 336;

// Função auxiliar para encontrar o início da semana (domingo).
const getWeekStart = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
};

// --- INÍCIO DA CORREÇÃO ---
// A função agora gera o objeto 'day' com a mesma estrutura do App.js
const generateDaysFromPages = (pages) => {
    if (!pages || pages.length === 0) return [];
    const daysMap = new Map();
    const dayNames = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

    pages.forEach(page => {
        const weekStartDate = new Date(page.weekDate);
        for (let i = 0; i < 7; i++) {
            const dateObj = new Date(weekStartDate);
            dateObj.setDate(weekStartDate.getDate() + i);
            
            const dayOfWeek = dateObj.getDay();
            const dateStr = dateObj.toISOString().split('T')[0];

            if (!daysMap.has(dateStr)) {
                daysMap.set(dateStr, {
                    // Propriedades existentes
                    id: dateStr,
                    fullDate: dateObj,
                    name: dayNames[dayOfWeek],
                    date: dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                    
                    // Propriedades ADICIONADAS para padronização
                    dayOfMonth: dateObj.getDate().toString(),
                    dayName: dayNames[dayOfWeek].substring(0, 3).toUpperCase(),
                });
            }
        }
    });
    const days = Array.from(daysMap.values());
    days.sort((a, b) => a.fullDate - b.fullDate);
    return days;
};
// --- FIM DA CORREÇÃO ---


export const useVirtualKanban = (props) => {
    const { activeId } = props;
    const scrollRestoreRef = useRef(null);
    const prevFirstDayIdRef = useRef(null);

    const {
        enrichedPlan, planData, isLoading, fetchNextPage, fetchPreviousPage,
        hasNextPage, hasPreviousPage, isFetchingNextPage, isFetchingPreviousPage,
    } = useEnrichedPlan();

    const [days, setDays] = useState([]);
    const generatedDays = useMemo(() => generateDaysFromPages(planData?.pages), [planData]);

    useEffect(() => {
        if (generatedDays && generatedDays.length > 0) {
            setDays(generatedDays);
        }
    }, [generatedDays]);
    
    const [isRestoring, setIsRestoring] = useState(false);

    useEffect(() => {
        if (isRestoring) {
            setTimeout(() => setIsRestoring(false), 0);
        }
    }, [isRestoring]);

    const handleRangeExpanded = useCallback((direction) => {
        if (direction === 'future' && hasNextPage && !isFetchingNextPage) fetchNextPage();
        else if (direction === 'past' && hasPreviousPage && !isFetchingPreviousPage) fetchPreviousPage();
    }, [fetchNextPage, fetchPreviousPage, hasNextPage, hasPreviousPage, isFetchingNextPage, isFetchingPreviousPage]);

    const {
        scrollContainerRef, virtualItems, totalSize, scrollToIndex, controllingDay,
    } = useWeeklyVirtualizer({
        days,
        onRangeExpanded: handleRangeExpanded,
        isFetching: isFetchingNextPage || isFetchingPreviousPage,
    });
    
    const triggeredWeeksRef = useRef(new Set());

    useEffect(() => {
        if (!controllingDay || isFetchingNextPage || !hasNextPage) return;

        const focusDayOfWeek = controllingDay.fullDate.getDay();

        if (focusDayOfWeek >= 4) { // Se for Quinta-feira ou posterior
            const weekStart = getWeekStart(controllingDay.fullDate).toISOString().split('T')[0];

            if (!triggeredWeeksRef.current.has(weekStart)) {
                console.log(`%c[VirtualKanban] Buffer acionado em ${controllingDay.name}. Buscando próxima semana...`, 'color: green');
                triggeredWeeksRef.current.add(weekStart);
                handleRangeExpanded('future');
            }
        }
    }, [controllingDay, handleRangeExpanded, hasNextPage, isFetchingNextPage]);

    useAmnesia({
        isEnabled: !activeId, virtualItems, days, scrollContainerRef,
        scrollRestoreRef, setIsRestoring, controllingDay,
    });

    const isInitialScrollDone = useRef(false);
    const todayDateString = new Date().toISOString().split('T')[0];
    const todayIndex = useMemo(() => days.findIndex(d => d.id === todayDateString), [days, todayDateString]);

    useLayoutEffect(() => {
        if (!scrollContainerRef.current || days.length === 0) return;

        if (scrollRestoreRef.current) {
            const { anchorId, offset } = scrollRestoreRef.current;
            const newAnchorIndex = days.findIndex(day => day.id === anchorId);
            if (newAnchorIndex > -1) {
                const newScrollLeft = (newAnchorIndex * COLUMN_WIDTH) + offset;
                scrollContainerRef.current.scrollLeft = newScrollLeft;
            }
            scrollRestoreRef.current = null;
            isInitialScrollDone.current = true;
            prevFirstDayIdRef.current = days[0]?.id;
            return;
        }

        const newFirstDayId = days[0]?.id;
        const prevFirstDayId = prevFirstDayIdRef.current;
        if (newFirstDayId !== prevFirstDayId) {
            const oldFirstDayIndex = days.findIndex(d => d.id === prevFirstDayId);
            if (oldFirstDayIndex > 0) {
                const scrollAdjustment = oldFirstDayIndex * COLUMN_WIDTH;
                scrollContainerRef.current.scrollLeft += scrollAdjustment;
            }
        }
        prevFirstDayIdRef.current = newFirstDayId;
        
        if (todayIndex > -1 && !isInitialScrollDone.current && !isLoading) {
            scrollToIndex(todayIndex, { align: 'start', behavior: 'auto' });
            isInitialScrollDone.current = true;
        }
    }, [days, todayIndex, scrollToIndex, isLoading, scrollContainerRef]);

    return {
        ...props, scrollContainerRef, virtualItems, totalSize, enrichedPlan, isRestoring,
        isLoading: isLoading && days.length === 0,
        isFetchingNextPage, isFetchingPreviousPage, days, todayDateString,
    };
};