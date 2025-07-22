import React from 'react';
import DayColumn from './DayColumn';
import { Loader } from 'lucide-react';
import { useVirtualKanban } from './hooks/useVirtualKanban';

const WeeklyKanbanView = (props) => {
  // --- MUDANÇA 1: Recebemos a nova prop 'tasksByDay' ---
  const {
    scrollContainerRef,
    virtualItems,
    totalSize,
    tasksByDay, // <-- Nova prop com os dados agrupados
    isLoading,
    isRestoring,
    isFetchingNextPage,
    isFetchingPreviousPage,
    days,
    todayDateString,
  } = useVirtualKanban(props);

  const customScrollbarStyles = `
    .custom-scrollbar::-webkit-scrollbar { height: 12px; }
    .custom-scrollbar::-webkit-scrollbar-track { background-color: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #d1d5db; border-radius: 10px; border: 3px solid #f1f5f9; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #9ca3af; }
  `;

  return (
    <main className="flex-1 flex flex-col bg-slate-100 overflow-hidden">
        <style>{customScrollbarStyles}</style>

        {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
                <Loader className="animate-spin text-violet-500" size={40} />
            </div>
        ) : (
             <div
                ref={scrollContainerRef}
                className="flex-1 overflow-x-auto custom-scrollbar"
                style={{ contain: 'strict' }}
            >
                <div style={{ position: 'relative', height: '100%', width: `${totalSize}px` }}>

                    {isFetchingPreviousPage && (
                        <div className="absolute top-0 left-0 h-full flex items-center justify-center w-24 z-10">
                            <Loader className="animate-spin text-violet-400" size={24} />
                        </div>
                    )}

                    {virtualItems.map(virtualItem => {
                        const day = days[virtualItem.index];
                        if (!day) return null;

                        // --- MUDANÇA 2: Buscamos as tarefas para este dia específico ---
                        const dayTasks = tasksByDay[day.id] || [];

                        return (
                            <div
                                key={day.id}
                                data-index={virtualItem.index}
                                style={{
                                    position: 'absolute', top: 0, left: 0, height: '100%',
                                    width: `${virtualItem.size}px`,
                                    transform: `translateX(${virtualItem.start}px)`,
                                    padding: '1rem 8px'
                                }}
                            >
                                <DayColumn
                                    day={day}
                                    // --- MUDANÇA 3: Passamos a lista de tarefas do dia ---
                                    tasks={dayTasks}
                                    isToday={day.id === todayDateString}
                                    isSelected={day.id === props.selectedDay?.id}
                                    {...props}
                                />
                            </div>
                        );
                    })}

                    {isFetchingNextPage && (
                         <div className="absolute top-0 right-0 h-full flex items-center justify-center w-24 z-10">
                            <Loader className="animate-spin text-violet-400" size={24} />
                         </div>
                    )}
                </div>
            </div>
        )}
    </main>
  );
};

export default WeeklyKanbanView;
