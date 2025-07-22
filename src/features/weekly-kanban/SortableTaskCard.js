import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { motion } from 'framer-motion';
import TaskCard from '../../components/ui/TaskCard';

export function SortableTaskCard(props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useSortable({
      id: props.task.id,
      // --- A ETIQUETA É ADICIONADA AQUI ---
      data: {
        type: 'task',
        task: props.task,
      },
      animateLayoutChanges: () => false,
  });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0 : 1,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      {...attributes}
      {...listeners}
    >
      <TaskCard {...props} />
    </motion.div>
  );
}