import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import TaskCard from '../../components/ui/TaskCard';

const SortableTaskCard = (props) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: props.task.id,
        data: {
            type: 'task',
            task: props.task,
        },
    });

    // O estilo que o dnd-kit usa para mover o "fantasma" do elemento
    const style = {
        transform: CSS.Transform.toString(transform),
        transition: transition,
        // O item original fica invisível para não causar confusão visual
        opacity: isDragging ? 0 : 1,
        position: 'relative',
        zIndex: isDragging ? 10 : 'auto',
    };

    return (
        // O container que o dnd-kit controla. Ele NÃO tem animação.
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            {/* O TaskCard em si, envolvido pelo motion.div.
                É este que vai animar suavemente a sua posição no layout,
                sem conflitar com o dnd-kit.
            */}
            <motion.div layout="position">
                <TaskCard
                    {...props}
                    isDragging={isDragging}
                />
            </motion.div>
        </div>
    );
};

export default SortableTaskCard;
