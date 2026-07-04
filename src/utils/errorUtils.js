export const parseOverloadError = (error, defaultMessage = 'Ha ocurrido un error al actualizar.') => {
    let errorMessage = defaultMessage;
    let isOverloadConflict = false;
    let conflictMessage = null;
    let conflictPayload = null;

    if (error.response?.data) {
        const data = error.response.data;

        // Detectar conflicto de capacidad diaria (status 409)
        if (error.response.status === 409) {
            // Formato 1: Respuesta directa del serializer con overload_conflict
            // { status: 'error', resolved: false, message: '...', planned_hours, limit_hours, exceeds_by, ... }
            if (data.status === 'error' && data.resolved === false && data.planned_hours !== undefined) {
                isOverloadConflict = true;
                conflictMessage = data.message || 'Capacidad diaria excedida.';
                conflictPayload = data;
                errorMessage = conflictMessage;
            }
            // Formato 2: Respuesta del endpoint validate_overload
            // { status: 'conflict', message: '...', planned_hours, limit_hours, ... }
            else if (data.status === 'conflict') {
                isOverloadConflict = true;
                conflictMessage = data.message || 'Capacidad diaria excedida.';
                conflictPayload = data;
                errorMessage = conflictMessage;
            }
            // Formato 3: El backend devuelve: { detail: "Capacidad diaria excedida", conflict: { ... } }
            else if (data.detail && typeof data.detail === 'string' && data.detail.toLowerCase().includes('capacidad')) {
                isOverloadConflict = true;
                conflictMessage = data.detail;
                conflictPayload = data.conflict || null;
                errorMessage = data.detail;
            }
        }

        // Detectar overload_conflict en errors (viene como 400 desde el serializer via views.py)
        if (!isOverloadConflict && data.errors?.overload_conflict) {
            const conflictData = Array.isArray(data.errors.overload_conflict)
                ? data.errors.overload_conflict[0]
                : data.errors.overload_conflict;
            if (typeof conflictData === 'object') {
                isOverloadConflict = true;
                conflictMessage = conflictData.message || 'Capacidad diaria excedida.';
                conflictPayload = conflictData;
                errorMessage = conflictMessage;
            }
        }

        if (!isOverloadConflict) {
            if (data.errors && typeof data.errors === 'object' && Object.keys(data.errors).length > 0) {
                // Buscar el primer error que no sea overload_conflict
                const firstKey = Object.keys(data.errors).find(k => k !== 'overload_conflict') || Object.keys(data.errors)[0];
                const firstError = data.errors[firstKey];
                if (typeof firstError === 'string') {
                    errorMessage = firstError;
                } else if (Array.isArray(firstError)) {
                    errorMessage = typeof firstError[0] === 'string' ? firstError[0] : JSON.stringify(firstError[0]);
                } else {
                    errorMessage = JSON.stringify(firstError);
                }
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
        }

        // --- Analizar si el mensaje extraído indica conflicto de sobrecarga ---
        const lowerError = String(errorMessage || '').toLowerCase();
        if (
            lowerError.includes("horas e intentas") ||
            lowerError.includes("quedarás con") ||
            lowerError.includes("quedarías con") ||
            lowerError.includes("(límite") ||
            lowerError.includes("planificadas")
        ) {
            isOverloadConflict = true;
            conflictMessage = errorMessage;
            conflictPayload = data;
        }
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