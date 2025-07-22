import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Pencil, CheckSquare, Trash2 } from 'lucide-react';

const TaskActionsPopup = ({
  onClose,
  onEdit,
  onSelect,
  onDelete,
  parentRect,
}) => {
  const popupRef = useRef(null);

  const popupStyle = {
    position: 'fixed', // Usar 'fixed' para posicionamento absoluto na tela
    top: parentRect.bottom + 4, // 4px abaixo do botão
    left: parentRect.left + parentRect.width / 2 - 160, // Centralizado e movido para a esquerda (160 é a largura)
  };

  // Efeito para fechar o popup ao clicar fora dele
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        onClose();
      }
    };

    // A CORREÇÃO: Usar setTimeout para atrasar a adição do listener.
    // Isto impede que o mesmo clique que abre o popup o feche imediatamente.
    setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const handleAction = (action) => {
    action();
    onClose();
  };

  return (
    <motion.div
      ref={popupRef}
      style={popupStyle}
      className="w-40 bg-white rounded-md shadow-lg border border-slate-200 z-50"
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
    >
      <ul className="p-1 text-sm text-slate-700">
        <li
          onClick={() => handleAction(onEdit)}
          className="flex items-center gap-3 px-3 py-1.5 rounded-md hover:bg-slate-100 cursor-pointer"
        >
          <Pencil size={14} />
          <span>Editar</span>
        </li>
        <li
          onClick={() => handleAction(onSelect)}
          className="flex items-center gap-3 px-3 py-1.5 rounded-md hover:bg-slate-100 cursor-pointer"
        >
          <CheckSquare size={14} />
          <span>Selecionar</span>
        </li>
        <li
          onClick={() => handleAction(onDelete)}
          className="flex items-center gap-3 px-3 py-1.5 rounded-md text-red-600 hover:bg-red-50 cursor-pointer"
        >
          <Trash2 size={14} />
          <span>Excluir</span>
        </li>
      </ul>
    </motion.div>
  );
};

export default TaskActionsPopup;
