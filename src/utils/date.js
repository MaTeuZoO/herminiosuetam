/**
 * @file Contém funções utilitárias puras para manipulação de datas.
 */

const getWeekStart = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.getFullYear(), d.getMonth(), diff);
};

export const generateStaticBase = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const startOfWeek = getWeekStart(today);

    const baseDays = [];
    for (let i = 0; i < 7; i++) {
        const day = new Date(startOfWeek);
        day.setDate(startOfWeek.getDate() + i);
        baseDays.push(day.toISOString().split('T')[0]);
    }

    if (dayOfWeek >= 4) {
        const bufferStartDate = new Date(baseDays[baseDays.length - 1]);
        for (let i = 1; i <= 5; i++) {
            const day = new Date(bufferStartDate);
            day.setDate(bufferStartDate.getDate() + i);
            baseDays.push(day.toISOString().split('T')[0]);
        }
    }
    return baseDays;
};

export const getUniqueWeekStartsFromRange = (dateRange) => {
    const weekStarts = new Map();
    dateRange.forEach(dateStr => {
        const weekStart = getWeekStart(new Date(dateStr));
        const weekStartStr = weekStart.toISOString().split('T')[0];
        if (!weekStarts.has(weekStartStr)) {
            weekStarts.set(weekStartStr, weekStart);
        }
    });
    return Array.from(weekStarts.values());
};
