import React from 'react';

const Modal = ({
    isOpen,
    onClose,
    title,
    icon,
    message,
    children,
    type = 'success', // 'warning', 'error', 'success'
    onConfirm,
    confirmText,
    cancelText = 'Cancelar',
    showCancel = false,
    isLoading = false,
    size = 'md',
    hideFooter = false
}) => {
    if (!isOpen) return null;

    const isWarning = type === 'warning';
    const isError = type === 'error';

    const defaultConfirmText = isWarning ? 'Eliminar' : isError ? 'Cerrar' : 'Aceptar';
    const finalConfirmText = confirmText || defaultConfirmText;

    const shouldShowCancel = isWarning || showCancel;

    const maxWidthClass = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg'
    }[size] || 'max-w-md';

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className={`bg-white rounded-2xl shadow-sm w-full ${maxWidthClass} p-6 transform transition-all`}>
                <div className="flex items-center gap-3 mb-2">
                    {icon && (
                        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                            {icon}
                        </div>
                    )}
                    <h2 className="text-xl font-bold text-slate-800">{title}</h2>
                </div>

                {/* Si hay mensaje de texto, lo mostramos */}
                {message && <p className="text-gray-500 text-sm mb-6 leading-relaxed">{message}</p>}

                {children && <div className="mb-6">{children}</div>}

                {!hideFooter && (
                    <div className="flex justify-end gap-3 mt-2">
                        {shouldShowCancel && (
                            <button
                                onClick={onClose}
                                disabled={isLoading}
                                className="px-4 py-2 border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 font-medium rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200 disabled:opacity-50"
                            >
                                {cancelText}
                            </button>
                        )}

                        <button
                            onClick={onConfirm || onClose}
                            disabled={isLoading}
                            className={`px-4 py-2 font-medium rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed 
                                ${isError || isWarning
                                    ? 'bg-[#E53E3E] hover:bg-red-700 text-white focus:ring-red-500' // Using a slightly softer red like the image or standard tailwind red-600
                                    : 'bg-[#1D4ED8] hover:bg-blue-800 text-white focus:ring-blue-600' // standard tailwind blue-700
                                }`}
                        >
                            {isLoading ? 'Guardando...' : finalConfirmText}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Modal;