export const handleErrors = (errorResponse, setErrors) => {
    const errorMessages = {};
    errorResponse.errors.forEach((error) => {
        errorMessages[error.path] = error.msg;
    });
    setErrors(errorMessages);
};