// Centraliza as funções de manipulação de tempo para serem usadas em todo o aplicativo.

/**
 * Formata segundos para o formato HH:MM:SS.
 * @param {number} seconds - O total de segundos.
 * @returns {string} O tempo formatado.
 */
export const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds < 0) seconds = 0;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

/**
 * Formata o tempo gasto para exibição.
 * A função agora aceita um parâmetro para mostrar ou esconder os segundos.
 * @param {number} totalSeconds - O tempo total em segundos.
 * @param {boolean} isRunning - Se o cronómetro está a correr (usado para feedback visual, não afeta o formato).
 * @param {boolean} showSeconds - Se for `true`, retorna "H:MM:SS". Se for `false`, retorna "H:MM".
 * @returns {string} O tempo formatado.
 */
export const formatDisplayTime = (totalSeconds, isRunning, showSeconds = true) => {
  if (totalSeconds === null || totalSeconds === undefined || totalSeconds < 0) {
    return showSeconds ? '0:00:00' : '0:00';
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  
  const paddedMinutes = minutes.toString().padStart(2, '0');

  if (showSeconds) {
    const seconds = Math.floor(totalSeconds % 60);
    const paddedSeconds = seconds.toString().padStart(2, '0');
    return `${hours}:${paddedMinutes}:${paddedSeconds}`;
  } else {
    return `${hours}:${paddedMinutes}`;
  }
};

/**
 * Formata o tempo planeado para exibição.
 * @param {number} totalSeconds - O tempo total em segundos.
 * @param {boolean} showSeconds - Se for `true`, retorna "H:MM:SS". Se for `false`, retorna "H:MM".
 * @returns {string} O tempo formatado.
 */
export const formatPlannedTime = (totalSeconds, showSeconds = false) => {
  if (!totalSeconds || totalSeconds <= 0) {
    return showSeconds ? '0:00:00' : '0:00';
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  const paddedMinutes = minutes.toString().padStart(2, '0');

  if (showSeconds) {
    const seconds = Math.floor(totalSeconds % 60);
    const paddedSeconds = seconds.toString().padStart(2, '0');
    return `${hours}:${paddedMinutes}:${paddedSeconds}`;
  } else {
    return `${hours}:${paddedMinutes}`;
  }
};

/**
 * Converte um input de texto (ex: "1h 30m", "90m", "1.5h") para segundos.
 * @param {string} input - O texto a ser convertido.
 * @returns {number} O total de segundos.
 */
export const parseTimeInput = (input) => {
    if (!input) return 0;
    let totalSeconds = 0;
    const hoursMatch = input.match(/(\d+\.?\d*)\s*h/);
    const minutesMatch = input.match(/(\d+)\s*m/);

    if (hoursMatch) totalSeconds += parseFloat(hoursMatch[1]) * 3600;
    if (minutesMatch) totalSeconds += parseInt(minutesMatch[1], 10) * 60;
    
    // Adicionado suporte para formato HH:MM
    const timeMatch = input.match(/^(\d{1,2}):(\d{2})$/);
    if(timeMatch) {
        totalSeconds = (parseInt(timeMatch[1], 10) * 3600) + (parseInt(timeMatch[2], 10) * 60);
    } else if (!hoursMatch && !minutesMatch && !isNaN(parseFloat(input))) {
        // Fallback para considerar números sozinhos como minutos
        totalSeconds = parseFloat(input) * 60;
    }

    return Math.round(totalSeconds);
};

/**
 * Calcula os tempos totais seguindo as regras de negócio.
 * @param {object} task - A tarefa principal.
 * @param {Array} allSubtasks - A lista completa de todas as subtarefas da aplicação.
 * @param {Array} allTimeEntries - A lista completa de todas as entradas de tempo da aplicação.
 * @returns {{totalTimeSpentSeconds: number, totalPlannedSeconds: number}}
 */
export const calculateTaskTimes = (task, allSubtasks, allTimeEntries) => {
    const today = new Date().toISOString().split('T')[0];
    const taskSubtasks = allSubtasks.filter(s => s.task_id === task.id);

    const parentTimeEntry = allTimeEntries.find(e => e.task_id === task.id && e.subtask_id === null && e.date === today);
    let totalTimeSpentSeconds = parentTimeEntry?.time_spent_seconds || 0;
    taskSubtasks.forEach(sub => {
        const subTimeEntry = allTimeEntries.find(e => e.subtask_id === sub.id && e.date === today);
        totalTimeSpentSeconds += subTimeEntry?.time_spent_seconds || 0;
    });

    let totalPlannedSeconds = 0;
    if (taskSubtasks.length > 0) {
        taskSubtasks.forEach(sub => {
            totalPlannedSeconds += sub.planned_time_seconds || 0;
        });
    } else {
        totalPlannedSeconds = task.planned_time_seconds || 0;
    }

    return { totalTimeSpentSeconds, totalPlannedSeconds };
};

/**
 * Formata segundos para o formato HH:MM (ex: 02:30).
 * Específico para o popup de edição de tempo para não afetar o resto do app.
 * @param {number} seconds - O total de segundos.
 * @returns {string} O tempo formatado como HH:MM.
 */
export const formatSecondsToHHMM = (seconds) => {
    if (isNaN(seconds) || seconds < 0) seconds = 0;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};