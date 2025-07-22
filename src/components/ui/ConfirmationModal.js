import React from 'react';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-sm p-6 bg-white rounded-lg shadow-xl">
                <h2 className="text-lg font-semibold text-zinc-800">{title}</h2>
                <p className="mt-2 text-sm text-zinc-600">{message}</p>
                <div className="flex justify-end gap-3 mt-6">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold text-zinc-700 bg-zinc-100 rounded-md hover:bg-zinc-200 focus:outline-none">
                        Cancelar
                    </button>
                    <button onClick={onConfirm} className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none">
                        Excluir
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
