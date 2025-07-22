import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import TaskCard from '../../components/ui/TaskCard'; // Importando nosso novo componente

const PlanDayView = ({ tasks, projects, onUpdateTask, onTaskClick, onToggleComplete }) => {
    const [planningStep, setPlanningStep] = useState(1);
    
    // Pega o nome do dia da semana atual em português
    const today = new Date();
    const dayOfWeekName = today.toLocaleDateString('pt-BR', { weekday: 'long' }).charAt(0).toUpperCase() + today.toLocaleDateString('pt-BR', { weekday: 'long' }).slice(1);

    // Lógica para lidar com o fim do arrastar e soltar
    const onDragEnd = (result) => {
        const { source, destination, draggableId } = result;
        if (!destination) return;

        const taskId = parseInt(draggableId);
        
        // Movendo entre as colunas "Hoje" e "Backlog"
        if (source.droppableId !== destination.droppableId) {
            if (destination.droppableId === 'today') {
                onUpdateTask(taskId, { day_of_week: dayOfWeekName });
            } else if (destination.droppableId === 'backlog') {
                onUpdateTask(taskId, { day_of_week: null, start_time: null, end_time: null });
            }
        }
    };

    // Filtra as tarefas para cada coluna
    const tasksForToday = tasks.filter(t => t.day_of_week === dayOfWeekName);
    const backlogTasks = tasks.filter(t => !t.day_of_week);

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex-1 flex h-full overflow-hidden bg-zinc-50">
                {/* Coluna de Contexto (Etapas) */}
                <div className="w-96 p-6 flex flex-col justify-between border-r border-zinc-200 bg-white">
                    <div>
                        <h2 className="text-xl font-bold text-zinc-800">O que quer fazer hoje?</h2>
                        <p className="text-zinc-500 mt-2">Arraste as tarefas do seu backlog para a coluna "Hoje" para começar a planejar.</p>
                        {/* Aqui entrarão as outras etapas do planejamento no futuro */}
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={() => alert("Próximo passo a ser implementado!")} className="flex-1 px-4 py-2 font-semibold text-white bg-violet-600 rounded-md hover:bg-violet-700 flex items-center justify-center gap-2">
                            Próximo <ArrowRight size={16}/>
                        </button>
                    </div>
                </div>

                {/* Conteúdo Principal (Colunas de tarefas) */}
                <div className="flex-1 grid grid-cols-2 gap-6 p-6 overflow-y-auto custom-scrollbar">
                    {/* Coluna de tarefas do dia */}
                    <div className="flex flex-col h-full">
                        <h3 className="font-bold text-lg mb-4 text-zinc-800">Hoje</h3>
                        <Droppable droppableId="today">
                            {(provided, snapshot) => (
                                <div ref={provided.innerRef} {...provided.droppableProps} className={`p-4 rounded-lg min-h-full flex-1 ${snapshot.isDraggingOver ? 'bg-violet-50' : 'bg-white'}`}>
                                    {tasksForToday.map((task, index) => (
                                        <Draggable key={task.id} draggableId={task.id.toString()} index={index}>
                                            {(provided) => (
                                                <TaskCard 
                                                    provided={provided}
                                                    task={task} 
                                                    project={projects.find(p => p.id === task.project_id)}
                                                    onTaskClick={onTaskClick}
                                                    onToggleComplete={onToggleComplete}
                                                    isPlanning={true}
                                                    onUpdateTime={onUpdateTask}
                                                />
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                    {tasksForToday.length === 0 && <div className="text-zinc-400 text-sm text-center py-10">Arraste tarefas aqui.</div>}
                                </div>
                            )}
                        </Droppable>
                    </div>

                    {/* Coluna de Backlog */}
                    <div className="flex flex-col h-full">
                       <h3 className="font-bold text-lg mb-4 text-zinc-800">Backlog</h3>
                       <Droppable droppableId="backlog">
                           {(provided, snapshot) => (
                               <div ref={provided.innerRef} {...provided.droppableProps} className={`p-4 rounded-lg min-h-full flex-1 ${snapshot.isDraggingOver ? 'bg-blue-50' : 'bg-white'}`}>
                                   {backlogTasks.map((task, index) => (
                                       <Draggable key={task.id} draggableId={task.id.toString()} index={index}>
                                           {(provided) => (
                                               <TaskCard 
                                                   provided={provided}
                                                   task={task} 
                                                   project={projects.find(p => p.id === task.project_id)}
                                                   onTaskClick={onTaskClick}
                                                   onToggleComplete={onToggleComplete}
                                               />
                                           )}
                                       </Draggable>
                                   ))}
                                   {provided.placeholder}
                                   {backlogTasks.length === 0 && <div className="text-zinc-400 text-sm text-center py-10">Nenhuma tarefa no backlog.</div>}
                               </div>
                           )}
                       </Droppable>
                    </div>
                </div>
            </div>
        </DragDropContext>
    );
};

export default PlanDayView;
