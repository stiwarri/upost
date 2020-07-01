exports.generateError = (message, statusCode, data) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.data = data;
    return error;
};