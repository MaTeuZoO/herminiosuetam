import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

/**
 * Componente reutilizável para um menu de contexto que aparece com o clique direito.
 * @param {number} x - A coordenada X onde o menu deve aparecer.
 * @param {number} y - A coordenada Y onde o menu deve aparecer.
 * @param {Array} options - Um array de objetos, cada um definindo uma opção do menu.
 * @param {Function} onClose - A função a ser chamada para fechar o menu.
 */
const ContextMenu = ({ x, y, options, onClose }) => {
  const menuRef = useRef(null);

  // Efeito para fechar o menu se o utilizador clicar fora dele.
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };
    // Adiciona o listener no mousedown para capturar o clique imediatamente.
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const menuVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.1 } },
  };

  return (
    <motion.div
      ref={menuRef}
      className="fixed bg-white rounded-lg shadow-2xl border border-slate-200 w-56 p-2 z-50"
      style={{ top: y, left: x }}
      variants={menuVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
    >
      <ul className="space-y-1">
        {options.map((option, index) => (
          <li key={index}>
            <button
              onClick={() => {
                option.action();
                onClose();
              }}
              className={`w-full flex items-center gap-3 text-left px-3 py-2 text-sm rounded-md transition-colors ${
                option.isDestructive 
                ? 'text-red-600 hover:bg-red-50' 
                : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              {option.icon && <span className="flex-shrink-0 w-4">{option.icon}</span>}
              <span className="flex-grow">{option.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </motion.div>
  );
};

export default ContextMenu;
