// features/project/ProjectView.js
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Plus, Loader2, Settings, CheckCircle, MessageSquare, Play, MoreVertical, Calendar, Tag, Clock } from 'lucide-react';

// Importe o hook para buscar tarefas de projeto
import { useProjectTasksQuery } from './hooks/useProjectTasksQuery';

// Importe o hook de mutações de tarefas.
// Pelo documento de arquitetura, ele está em 'features/weekly-kanban/hooks/useTaskMutations.js'.
// VERIFIQUE SE ESTE CAMUNHO ESTÁ CORRETO NO SEU PROJETO REAL E SE ESTE HOOK POSSUI A FUNÇÃO 'createTask'.
import { useTaskMutations } from '../weekly-kanban/hooks/useTaskMutations';
// Importe o hook de mutações de projetos para atualizar a descrição
import { useProjectMutations } from './hooks/useProjectMutations';

// === MockTaskCard: Pode ser movido para 'features/project/MockTaskCard.js' como sugerido no código original ===
// Mantido aqui para fins de demonstração completa do arquivo.
const MockTaskCard = ({ task, project, onTaskClick }) => {
    const hasDueDate = task.due_date;
    const hasTags = task.tags && task.tags.length > 0;
    const hasTimePlanned = task.time_planned > 0;

    const formatDuration = (seconds) => {
        if (typeof seconds !== 'number' || seconds < 0) return '0:00';
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours}:${minutes < 10 ? '0' : ''}${minutes}`;
    };

    const formatDateDisplay = (dateString) => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            const options = { day: '2-digit', month: 'short' };
            return date.toLocaleDateString('pt-BR', options);
        } catch (e) {
            console.error("Erro ao formatar data:", dateString, e);
            return dateString;
        }
    };


    return (
        <div
            className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col gap-3"
            onClick={() => onTaskClick(task)}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-grow">
                    <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 ${task.is_completed ? 'bg-green-500 border-green-500' : 'border-slate-300'}`}>
                        {task.is_completed && <CheckCircle size={16} className="text-white mx-auto my-auto" />}
                    </div>
                    <span className={`text-base font-medium text-slate-800 ${task.is_completed ? 'line-through text-slate-500' : ''}`}>
                        {task.title}
                    </span>
                </div>

                <div className="flex items-center gap-2 text-slate-500 text-sm flex-shrink-0">
                    <Play size={16} className="text-blue-500" />
                    <span>{formatDuration(task.time_spent)} / {formatDuration(task.time_planned)}</span>
                </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-3">
                    {project && (
                        <div className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: project?.color || '#94a3b8' }}></span>
                            <span>{project.name}</span>
                        </div>
                    )}

                    {hasDueDate && (
                        <div className="flex items-center gap-1">
                            <Calendar size={14} />
                            <span>{formatDateDisplay(task.due_date)}</span>
                        </div>
                    )}

                    {hasTags && (
                        <div className="flex items-center gap-1">
                            <Tag size={14} />
                            <span>{task.tags.map(tag => `#${tag}`).join(' ')}</span>
                        </div>
                    )}

                    {task.time_planned > 0 && !hasTimePlanned && (
                         <div className="flex items-center gap-1">
                            <Clock size={14} />
                            <span>{formatDuration(task.time_planned)}</span>
                        </div>
                    )}
                </div>

                <button className="p-1 rounded-full hover:bg-slate-100 transition-colors">
                    <MoreVertical size={16} className="text-slate-400" />
                </button>
            </div>
        </div>
    );
};

/**
 * Componente ProjectView para exibir os detalhes de um projeto e suas tarefas.
 *
 * @param {object} props - As propriedades do componente.
 * @param {object} props.project - O objeto do projeto selecionado (contém id, name, color, description).
 * @param {number | null} props.selectedProjectId - O ID do projeto atualmente selecionado, usado para a query de tarefas.
 * @param {function} props.onTaskClick - Função de callback para quando uma tarefa é clicada.
 * @param {function} props.onOpenProjectModal - Função de callback para abrir o modal de edição do projeto.
 * @param {function} props.createTask - Função de mutação para criar uma nova tarefa.
 * @param {boolean} props.isCreatingTask - Estado de carregamento da criação de tarefa.
 */
const ProjectView = ({ project, selectedProjectId, onTaskClick, onOpenProjectModal, createTask, isCreatingTask }) => {
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const addTaskInputRef = useRef(null);

    // === NOVIDADE: Estado local para a descrição editável ===
    const [localDescription, setLocalDescription] = useState(project?.description || '');
    // === NOVIDADE: Hook de mutações de projeto para atualizar a descrição ===
    const { updateProject, isUpdatingProject } = useProjectMutations();

    const {
        data: tasks,
        isLoading: isLoadingTasks,
        isError,
        error
    } = useProjectTasksQuery(selectedProjectId);

    // === NOVIDADE: Sincroniza o estado local da descrição com a prop 'project' ===
    // Isso garante que quando um novo projeto é selecionado, a descrição é atualizada.
    useEffect(() => {
        setLocalDescription(project?.description || '');
    }, [project]);

    useEffect(() => {
        if (isAdding) {
            addTaskInputRef.current?.focus();
        }
    }, [isAdding]);

    const handleAddTask = async () => {
        if (!newTaskTitle.trim() || isCreatingTask) return;

        if (!selectedProjectId) {
            console.warn("Nenhum projeto selecionado para adicionar tarefa.");
            return;
        }

        try {
            await createTask({
                taskData: {
                    title: newTaskTitle,
                    project_id: selectedProjectId,
                },
                planDate: null,
                position: null,
            });
            setNewTaskTitle('');
            setIsAdding(false);
        } catch (error) {
            console.error("Erro ao criar tarefa:", error);
        }
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            handleAddTask();
        } else if (event.key === 'Escape') {
            setNewTaskTitle('');
            setIsAdding(false);
        }
    };

    // === NOVIDADE: Função para salvar a descrição editada ===
    const handleDescriptionChange = (e) => {
        setLocalDescription(e.target.value);
    };

    const handleSaveDescription = async () => {
        if (!project || isUpdatingProject || localDescription === project.description) {
            return; // Não salva se não há projeto, já está atualizando, ou a descrição não mudou
        }
        try {
            await updateProject({
                projectId: project.id,
                updates: { description: localDescription }
            });
            console.log("Descrição do projeto atualizada com sucesso!");
        } catch (error) {
            console.error("Erro ao salvar descrição do projeto:", error);
            // Reverter localDescription para o original em caso de erro
            setLocalDescription(project.description || '');
        }
    };


    const tasksToDisplay = tasks || [];

    const completedTasksCount = useMemo(() => tasksToDisplay.filter(t => t.is_completed).length, [tasksToDisplay]);
    const totalTasksCount = tasksToDisplay.length;
    const progressPercentage = totalTasksCount > 0 ? (completedTasksCount / totalTasksCount) * 100 : 0;

    return (
        <main className="flex-1 p-8 overflow-y-auto custom-scrollbar bg-slate-50">
            <div className="max-w-3xl mx-auto">
                {/* Cabeçalho do Projeto - Nome e Botão de Detalhes */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <span className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: project?.color || '#94a3b8' }}></span>
                        <h1 className="text-3xl font-bold text-slate-800 leading-tight">
                            {project?.name || "Selecione um Projeto..."}
                        </h1>
                    </div>
                    {project && (
                        <button
                            onClick={() => onOpenProjectModal(project)}
                            className="p-2 rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
                            title="Editar detalhes do projeto"
                        >
                            <Settings size={20} />
                        </button>
                    )}
                </div>

                {/* Bloco de Progresso e Descrição, visíveis apenas se houver um projeto */}
                {project && (
                    <>
                        {/* Barra de Progresso e Contagem de Tarefas */}
                        <div className="mb-8">
                            <div className="flex justify-between items-center text-sm text-slate-600 mb-2">
                                <span>{completedTasksCount} de {totalTasksCount} tarefas concluídas</span>
                                <span>{Math.round(progressPercentage)}%</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                                <div
                                    className="bg-blue-500 h-full rounded-full transition-all duration-300 ease-out"
                                    style={{ width: `${progressPercentage}%` }}
                                ></div>
                            </div>
                        </div>

                        {/* Bloco de Informações do Projeto - AGORA SEMPRE VISÍVEL QUANDO UM PROJETO ESTÁ SELECIONADO E EDITÁVEL */}
                        <div className="mb-8 p-6 bg-white rounded-lg border border-slate-200 shadow-sm">
                            <h3 className="text-lg font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                <MessageSquare size={18} className="text-slate-500" />
                                Informações do Projeto
                            </h3>
                            {/* === NOVIDADE: Textarea editável para a descrição === */}
                            <textarea
                                className="w-full h-24 p-2 text-slate-600 leading-relaxed rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-400 resize-y"
                                placeholder="Adicione uma descrição para o seu projeto aqui..."
                                value={localDescription}
                                onChange={handleDescriptionChange}
                                onBlur={handleSaveDescription} // Salva ao perder o foco
                                disabled={isUpdatingProject} // Desabilita enquanto estiver salvando
                            />
                            {isUpdatingProject && (
                                <div className="flex items-center text-sm text-slate-500 mt-2">
                                    <Loader2 size={16} className="animate-spin mr-2" />
                                    Salvando descrição...
                                </div>
                            )}
                        </div>
                    </>
                )}


                {/* Lista de Tarefas */}
                <div className="flex flex-col gap-3">
                    {!selectedProjectId ? (
                        <div className="text-center py-6 text-slate-500 bg-white rounded-lg border border-slate-200 shadow-sm">
                            <p className="mb-1.5 text-base">Selecione um projeto na barra lateral para ver suas tarefas.</p>
                        </div>
                    ) : isLoadingTasks ? (
                        <div className="flex items-center justify-center gap-2 text-slate-500 mt-4 p-3 bg-white rounded-lg shadow-sm">
                            <Loader2 size={18} className="animate-spin" />
                            <span className="text-sm">Buscando tarefas...</span>
                        </div>
                    ) : isError ? (
                        <div className="text-center py-6 text-red-500 bg-white rounded-lg border border-red-200 shadow-sm">
                            <p className="mb-1.5 text-base">Erro ao carregar tarefas.</p>
                            <p className="text-sm">{error.message}</p>
                        </div>
                    ) : tasksToDisplay.length > 0 ? (
                        tasksToDisplay.map(task => (
                            <MockTaskCard
                                key={task.id}
                                task={task}
                                project={project}
                                onTaskClick={onTaskClick}
                            />
                        ))
                    ) : (
                        <div className="text-center py-6 text-slate-500 bg-white rounded-lg border border-slate-200 shadow-sm">
                            <p className="mb-1.5 text-base">Nenhuma tarefa encontrada para este projeto.</p>
                            <p className="text-sm">Comece adicionando uma nova tarefa!</p>
                        </div>
                    )}
                </div>

                {/* Adicionar Tarefa Rápida - visível apenas se houver um projeto selecionado */}
                {selectedProjectId && (
                    isAdding ? (
                        <div className="mt-6 flex items-center gap-2 bg-white rounded-lg border border-slate-200 shadow-sm focus-within:ring-1 focus-within:ring-blue-400 transition-all duration-200">
                             <input
                                ref={addTaskInputRef}
                                type="text"
                                placeholder={isCreatingTask ? "Criando tarefa..." : "Descreva a tarefa e pressione Enter..."}
                                className="flex-1 bg-transparent text-sm p-2.5 outline-none placeholder-slate-400 text-slate-700"
                                value={newTaskTitle}
                                onChange={(e) => setNewTaskTitle(e.target.value)}
                                onKeyDown={handleKeyDown}
                                onBlur={() => !isCreatingTask && setIsAdding(false)}
                                disabled={isCreatingTask}
                             />
                             {isCreatingTask && <Loader2 size={18} className="animate-spin text-blue-500 mr-2" />}
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsAdding(true)}
                            className="flex items-center gap-2 w-full text-left p-2.5 mt-6 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors justify-center text-sm font-medium"
                        >
                            <Plus size={16} />
                            <span>Adicionar tarefa</span>
                        </button>
                    )
                )}

            </div>
        </main>
    );
};

export default ProjectView;