import React, { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useDataStore } from '../../store/dataStore';
import TaskCard from '../../components/ui/TaskCard'; // O seu componente de cartão de tarefa
import { Loader } from 'lucide-react';

/**
 * Função auxiliar para obter todos os 7 dias de uma semana,
 * começando na Segunda-feira, com base numa data qualquer.
 * @param {Date} anyDateInWeek - Uma data que pertence à semana desejada.
 * @returns {Date[]} Um array com os 7 objetos Date da semana.
 */
const getWeekDays = (anyDateInWeek) => {
  const date = new Date(anyDateInWeek);
  const dayOfWeek = date.getDay(); // 0 (Dom) a 6 (Sáb)
  // Ajusta para a Segunda-feira como o início da semana
  const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  const monday = new Date(date.setDate(diff));

  const week = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    week.push(day);
  }
  return week;
};

/**
 * Componente que renderiza uma única coluna do Kanban para um dia específico.
 * NOTA: Este é um componente simplificado. Você deve substituí-lo
 * pelo seu componente `DayColumn.js` já existente, adaptando as props.
 */
const KanbanColumn = ({ date, tasks }) => {
  const isToday = new Date().toDateString() === date.toDateString();

  const dayFormatter = new Intl.DateTimeFormat('pt-BR', { weekday: 'long' });
  const dateFormatter = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'numeric' });

  return (
    // Cada coluna tem uma largura fixa para permitir o scroll horizontal.
    <div className="flex-shrink-0 w-full sm:w-1/2 md:w-1/3 lg:w-1/4 xl:w-1/5 p-2">
      <div className="p-3 rounded-lg bg-slate-100 h-full flex flex-col">
        <h2 className={`font-bold text-lg mb-4 ${isToday ? 'text-violet-600' : 'text-slate-700'}`}>
          <span className="capitalize">{dayFormatter.format(date)}</span>
          <span className="ml-2 text-sm font-normal text-slate-400">{dateFormatter.format(date)}</span>
        </h2>
        
        <div className="space-y-2 overflow-y-auto flex-grow">
          {tasks.map(task => (
            <TaskCard key={task.id} task={task} />
            // NOTA: Futuramente, passaremos o "visualState" para o TaskCard
          ))}
        </div>
      </div>
    </div>
  );
};


/**
 * O componente principal que orquestra a visualização do Kanban por semana.
 */
const DailyKanbanView = () => {
  // Aceder ao estado e ações do nosso store Zustand.
  // NOTA: As ações goToNextWeek/goToPreviousWeek devem ser criadas no seu dataStore.
  const { 
    focusDate, 
    dailyPlan, 
    isLoadingPlan, 
    fetchWeeklyPlan, // Assumindo que o store terá uma ação para buscar a semana inteira
    goToNextWeek, 
    goToPreviousWeek 
  } = useDataStore(state => ({
    focusDate: state.focusDate,
    dailyPlan: state.dailyPlan,
    isLoadingPlan: state.isLoadingPlan,
    fetchWeeklyPlan: state.fetchWeeklyPlan, // Mapear para a nova ação
    goToNextWeek: state.goToNextWeek,
    goToPreviousWeek: state.goToPreviousWeek,
  }));

  const weekDays = useMemo(() => getWeekDays(focusDate), [focusDate]);

  // Quando a semana em foco muda, busca os dados para essa nova semana.
  useEffect(() => {
    if (fetchWeeklyPlan && weekDays.length > 0) {
      const startDate = weekDays[0];
      const endDate = weekDays[6];
      fetchWeeklyPlan(startDate, endDate);
    }
  }, [weekDays, fetchWeeklyPlan]);

  // Lógica para o gesto de arrastar, agora para navegar entre semanas.
  const SWIPE_THRESHOLD = 100;
  const handleDragEnd = (event, info) => {
    const swipePower = info.offset.x;
    if (swipePower < -SWIPE_THRESHOLD) {
      goToNextWeek();
    } else if (swipePower > SWIPE_THRESHOLD) {
      goToPreviousWeek();
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Aqui pode entrar um cabeçalho com o nome do mês ou botões de navegação */}
      <div className="flex-grow w-full h-full overflow-x-hidden relative">
        {isLoadingPlan && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10">
            <Loader className="animate-spin text-violet-500" size={40} />
          </div>
        )}
        <motion.div
          key={focusDate.toISOString().slice(0, 10)} // Chave para forçar a re-animação
          className="flex h-full"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.05}
          onDragEnd={handleDragEnd}
        >
          {weekDays.map(date => {
            const tasksForDate = dailyPlan.filter(task => task.planDate === date.toISOString().split('T')[0]);
            return <KanbanColumn key={date.toISOString()} date={date} tasks={tasksForDate} />
          })}
        </motion.div>
      </div>
    </div>
  );
};

export default DailyKanbanView;
