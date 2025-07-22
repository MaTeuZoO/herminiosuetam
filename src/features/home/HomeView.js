import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { TaskCard } from '../../components/TaskCard'; // Vamos criar este componente compartilhado depois

// Componente para uma única coluna do dia
const DayColumn = ({ day, tasks, onAddTask, projects, onTaskClick, onToggleComplete }) => {
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && newTaskTitle.trim() !== '') {
      onAddTask(newTaskTitle, { dayOfWeek: day });
      setNewTaskTitle('');
    }
  };

  return (
    <div className="flex-1 min-w-[280px] flex flex-col">
      <h2 className="font-semibold text-zinc-800 mb-3">{day}</h2>
      <div className="flex items-center gap-2 p-2 rounded-md border-2 border-dashed border-zinc-200 hover:border-violet-400 transition-colors mb-3">
        <Plus size={16} className="text-zinc-500" />
        <input
          type="text"
          placeholder="Nova Tarefa"
          className="w-full bg-transparent text-sm placeholder-zinc-400 text-zinc-800 focus:outline-none"
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>
      <Droppable droppableId={day}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-grow rounded-lg transition-colors p-1 ${snapshot.isDraggingOver ? 'bg-violet-50' : ''}`}
          >
            {tasks.map((task, index) => (
              <Draggable key={task.id} draggableId={task.id.toString()} index={index}>
                {(provided) => (
                  <TaskCard
                    task={task}
                    project={projects.find(p => p.id === task.project_id)}
                    provided={provided}
                    onToggleComplete={onToggleComplete}
                    onTaskClick={onTaskClick}
                  />
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};


// Componente principal da Home View
export default function HomeView({ tasks, projects, onDragEnd, onAddTask, onTaskClick, onToggleComplete }) {
  const daysOfWeek = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  
  // Filtra as tarefas que pertencem à visão de Kanban (têm um dia da semana definido)
  const kanbanTasks = tasks.filter(t => t.day_of_week);

  const handleDragEnd = (result) => {
    const { source, destination } = result;
    // Se não houver destino, não faz nada
    if (!destination) return;
    // Se a tarefa for movida para a mesma posição, não faz nada
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
        return;
    }
    // Chama a função onDragEnd que está no App.js para atualizar o estado
    onDragEnd(result);
  };

  return (
    <main className="flex-1 p-6 overflow-x-auto overflow-y-hidden custom-scrollbar">
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-6 h-full">
          {daysOfWeek.map(day => (
            <DayColumn
              key={day}
              day={day}
              tasks={kanbanTasks.filter(t => t.day_of_week === day)}
              projects={projects}
              onAddTask={onAddTask}
              onTaskClick={onTaskClick}
              onToggleComplete={onToggleComplete}
            />
          ))}
        </div>
      </DragDropContext>
    </main>
  );
}