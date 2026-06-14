export const parseOverloadError = (error, defaultMessage = 'Ha ocurrido un error al actualizar.') => {
    let errorMessage = defaultMessage;

    if (error.response?.data) {
        const data = error.response.data;

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
        errorMessage
    };
};