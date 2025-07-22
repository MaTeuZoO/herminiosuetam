import { useState, useRef, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

/**
 * Gera um array de objetos de dia para um número específico de dias a partir de uma data de referência.
 * @param {Date} referenceDate - A data de início.
 * @param {number} numberOfDays - O número de dias a serem gerados.
 * @returns {Array} Um array de objetos de dia.
 */
const generateDays = (referenceDate, numberOfDays) => {
    const days = [];
    const startDate = new Date(referenceDate.getTime());
    for (let i = 0; i < numberOfDays; i++) {
        const currentDay = new Date(startDate);
        currentDay.setDate(startDate.getDate() + i);
        days.push({
            name: ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"][currentDay.getDay()],
            date: currentDay.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            fullDate: currentDay,
            id: currentDay.toISOString().split('T')[0],
        });
    }
    return days;
};

/**
 * Gera todos os dias para o mês de uma data específica.
 * @param {Date} date - A data de referência para determinar o mês.
 * @returns {Array} Um array de objetos de dia para o mês inteiro.
 */
const getDaysForMonth = (date) => {
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const numDays = endOfMonth.getDate();
    return generateDays(startOfMonth, numDays);
}

const COLUMN_WIDTH = 336; // Largura da coluna em pixels.

/**
 * Hook para gerenciar a virtualização de uma visualização de kanban mensal.
 */
export const useMonthlyVirtualizer = ({ setIsRestoring }) => {
    const [days, setDays] = useState([]);
    const scrollContainerRef = useRef(null);
    // Este ref é para consistência da API com o hook semanal, mas não será usado aqui.
    const scrollRestoreRef = useRef(null);

    useEffect(() => {
        // Por enquanto, ele exibe apenas o mês atual.
        // Uma melhoria futura seria aceitar uma data para exibir um mês específico.
        setDays(getDaysForMonth(new Date()));
        
        // Garantimos que a visualização esteja visível definindo isRestoring como false.
        if (setIsRestoring) {
            setIsRestoring(false);
        }
    }, [setIsRestoring]);

    const columnVirtualizer = useVirtualizer({
        count: days.length,
        getScrollElement: () => scrollContainerRef.current,
        estimateSize: () => COLUMN_WIDTH,
        horizontal: true,
        overscan: 2,
    });

    const virtualItems = columnVirtualizer.getVirtualItems();
    const totalSize = columnVirtualizer.getTotalSize();

    return {
        days,
        setDays,
        scrollContainerRef,
        virtualItems,
        totalSize,
        scrollToIndex: columnVirtualizer.scrollToIndex,
        // Retorna valores nulos para as outras propriedades para corresponder à assinatura do hook semanal.
        controllingDay: null,
        scrollRestoreRef,
    };
};
