class AppError extends Error {
  constructor(message, status = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const buildError = ({ message, status = 500, code = 'INTERNAL_ERROR', details = null }) => {
  return new AppError(message, status, code, details);
};

const toErrorResponse = (error) => {
  if (error instanceof AppError) {
    return {
      status: error.status,
      body: {
        success: false,
        message: error.message,
        code: error.code,
        details: error.details || undefined
      }
    };
  }

  return {
    status: 500,
    body: {
      success: false,
      message: error?.message || 'Unexpected server error',
      code: 'INTERNAL_ERROR'
    }
  };
};

export { AppError, buildError, toErrorResponse };
