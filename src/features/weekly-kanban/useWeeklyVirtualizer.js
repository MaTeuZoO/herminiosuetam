import { useRef, useEffect, useCallback, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

const COLUMN_WIDTH = 336;

export const useWeeklyVirtualizer = ({ days, onRangeExpanded, isFetching }) => {
    const scrollContainerRef = useRef(null);
    const [isLoading, setIsLoading] = useState({ past: false, future: false });
    const [controllingDay, setControllingDay] = useState(null);

    const columnVirtualizer = useVirtualizer({
        count: days.length,
        getScrollElement: () => scrollContainerRef.current,
        estimateSize: () => COLUMN_WIDTH,
        horizontal: true,
        overscan: 2,
    });

    const virtualItems = columnVirtualizer.getVirtualItems();
    const totalSize = columnVirtualizer.getTotalSize();

    useEffect(() => {
        if (!isFetching) {
            setIsLoading({ past: false, future: false });
        }
    }, [isFetching]);

    const expandWindow = useCallback((direction) => {
        if (isLoading.past || isLoading.future) return;
        setIsLoading(prev => ({ ...prev, [direction]: true }));
        if (onRangeExpanded) {
            onRangeExpanded(direction);
        }
    }, [onRangeExpanded, isLoading.past, isLoading.future]);

    // --- CONSOLE DE DEBUG ADICIONADO ---
    // Este efeito calcula e reporta o dia em foco.
    useEffect(() => {
        if (!virtualItems || virtualItems.length === 0 || !scrollContainerRef.current) return;
        
        const scrollLeft = scrollContainerRef.current.scrollLeft;
        const controllingItem = virtualItems.find(item => item.start + item.size / 2 > scrollLeft);

        if (controllingItem && days[controllingItem.index]) {
            const newControllingDay = days[controllingItem.index];
            if (controllingDay?.id !== newControllingDay.id) {
                console.log(`%c[Virtualizer] Dia em foco mudou para: ${newControllingDay.id}`, 'color: purple');
                setControllingDay(newControllingDay);
            }
        }
    }, [virtualItems, days, controllingDay]);


    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;
        const handleWheel = (event) => {
            if (isLoading.past || isLoading.future || !onRangeExpanded) return;
            const { scrollLeft, scrollWidth, clientWidth } = container;
            const delta = event.deltaX !== 0 ? event.deltaX : event.deltaY;
            if (Math.abs(delta) < 10) return;
            const isAtEnd = scrollLeft + clientWidth >= scrollWidth - 10;
            const isAtStart = scrollLeft <= 10;
            if (delta > 0 && isAtEnd) {
                event.preventDefault();
                expandWindow('future');
            } else if (delta < 0 && isAtStart) {
                event.preventDefault();
                expandWindow('past');
            }
        };
        container.addEventListener('wheel', handleWheel, { passive: false });
        return () => container.removeEventListener('wheel', handleWheel);
    }, [expandWindow, onRangeExpanded, isLoading]);

    return {
        scrollContainerRef,
        virtualItems,
        totalSize,
        scrollToIndex: columnVirtualizer.scrollToIndex,
        controllingDay, // Exporta o dia em foco para o cérebro
    };
};
