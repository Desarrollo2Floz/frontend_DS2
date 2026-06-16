export const parseOverloadError = (error, defaultMessage = 'Ha ocurrido un error al actualizar.') => {
    let errorMessage = defaultMessage;
    let isOverloadConflict = false;
    let conflictMessage = null;
    let conflictPayload = null;

    if (error.response?.data) {
        const data = error.response.data;

        // Detectar conflicto de capacidad diaria (status 409)
        if (error.response.status === 409) {
            // El backend devuelve: { detail: "Capacidad diaria excedida", conflict: { ... } }
            if (data.detail && typeof data.detail === 'string' && data.detail.includes('capacidad diaria')) {
                isOverloadConflict = true;
                conflictMessage = data.detail;
                conflictPayload = data.conflict || null;
                errorMessage = data.detail;
            }
        }

        if (data.errors && typeof data.errors === 'object' && Object.keys(data.errors).length > 0) {
            const firstKey = Object.keys(data.errors)[0];
            const firstError = data.errors[firstKey];
            errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
        } else if (data.detail) {
            errorMessage = typeof data.detail === 'string' ? data.detail : data.detail[0];
        } else if (data.message && data.message !== 'Error de validación') {
            errorMessage = typeof data.message === 'string' ? data.message : data.message[0];
        } else if (data.error) {
            errorMessage = typeof data.error === 'string' ? data.error : data.error[0];
        } else if (data.target_date) {
            errorMessage = data.target_date[0];
        } else if (data.non_field_errors) {
            errorMessage = data.non_field_errors[0];
        } else if (data.message) {
            // Fallback for "Error de validación" si no hay otro error específico
            errorMessage = typeof data.message === 'string' ? data.message : data.message[0];
        }
    } else if (error.message) {
        errorMessage = error.message;
    }

    return {
        errorMessage,
        isOverloadConflict,
        conflictMessage,
        conflictPayload
    };
};