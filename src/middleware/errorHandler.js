const errorHandler = (err, req, res, next) => {
    console.error(`[Error] ${err.message}`);
    const statusCode = err.status || 500;
    res.status(statusCode).json({ status: statusCode, message: err.message });
};

module.exports = errorHandler;