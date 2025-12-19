/**
 * Error response handler utility for consistent error message extraction
 * across all API calls. Extracts meaningful error messages from various
 * response formats instead of showing raw status codes.
 */

export interface ErrorResponse {
  message: string;
  status?: number;
  timestamp?: string;
  path?: string;
  fieldErrors?: Record<string, string>;
}

/**
 * Extracts a meaningful error message from an API error response.
 * Handles various error response formats:
 * - Backend error: { error, message, status, fieldErrors, etc. }
 * - Axios error: { response: { data: {...}, status, statusText } }
 * - Network error: standard Error object
 * - String message
 *
 * @param error The error object from a catch block
 * @param defaultMessage Fallback message if no error details found
 * @returns An ErrorResponse object with extracted message
 */
export function extractErrorMessage(error: any, defaultMessage: string = "An error occurred"): ErrorResponse {
  // If it's already an ErrorResponse object, return as-is
  if (error?.message && typeof error.message === 'string' && !error.response) {
    return {
      message: error.message,
      status: error.status,
      timestamp: error.timestamp,
      path: error.path,
      fieldErrors: error.fieldErrors,
    };
  }

  // Handle axios/HTTP errors with response data
  if (error?.response?.data) {
    const data = error.response.data;
    
    // Check for explicit error message in various formats
    if (data.error && typeof data.error === 'string') {
      return {
        message: data.error,
        status: error.response.status,
        timestamp: data.timestamp,
        path: data.path,
        fieldErrors: data.fieldErrors,
      };
    }
    
    if (data.message && typeof data.message === 'string') {
      return {
        message: data.message,
        status: error.response.status,
        timestamp: data.timestamp,
        path: data.path,
        fieldErrors: data.fieldErrors,
      };
    }

    // Check for validation errors
    if (data.fieldErrors && Object.keys(data.fieldErrors).length > 0) {
      const fieldErrorMessages = Object.entries(data.fieldErrors)
        .map(([field, msg]) => `${field}: ${msg}`)
        .join(", ");
      return {
        message: fieldErrorMessages,
        status: error.response.status,
        timestamp: data.timestamp,
        path: data.path,
        fieldErrors: data.fieldErrors,
      };
    }
  }

  // Handle axios errors with status text
  if (error?.response?.status && error?.response?.statusText) {
    const statusTextMap: Record<number, string> = {
      400: "Invalid request. Please check your input.",
      401: "Unauthorized. Please sign in again.",
      403: "You don't have permission to perform this action.",
      404: "The requested resource was not found.",
      409: "Conflict. This item may already exist or be in use.",
      422: "Invalid data. Please check your input.",
      500: "Server error. Please try again later.",
      503: "Service unavailable. Please try again later.",
    };

    const message = statusTextMap[error.response.status] || 
      error.response.statusText || 
      defaultMessage;
    
    return {
      message,
      status: error.response.status,
    };
  }

  // Handle generic Error objects
  if (error instanceof Error) {
    return {
      message: error.message || defaultMessage,
    };
  }

  // Handle string errors
  if (typeof error === 'string') {
    return {
      message: error,
    };
  }

  // Fallback to default message
  return {
    message: defaultMessage,
  };
}

/**
 * Formats an ErrorResponse for user display.
 * Includes field errors if present.
 */
export function formatErrorForDisplay(errorResponse: ErrorResponse): string {
  let message = errorResponse.message;

  if (errorResponse.fieldErrors && Object.keys(errorResponse.fieldErrors).length > 0) {
    const fieldErrors = Object.entries(errorResponse.fieldErrors)
      .map(([field, err]) => `• ${field}: ${err}`)
      .join("\n");
    message = `${message}\n\n${fieldErrors}`;
  }

  return message;
}

/**
 * Helper to handle API errors consistently across components
 * Usage: 
 *   catch (error: any) {
 *     const errorMsg = getErrorMessage(error, "Failed to load data");
 *     toast.error(errorMsg);
 *   }
 */
export function getErrorMessage(error: any, defaultMessage: string = "An error occurred"): string {
  const errorResponse = extractErrorMessage(error, defaultMessage);
  return formatErrorForDisplay(errorResponse);
}
