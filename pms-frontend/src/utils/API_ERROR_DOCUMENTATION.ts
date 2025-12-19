/**
 * API Error Response Format Documentation
 * 
 * All API endpoints return consistent error responses with meaningful messages
 * instead of raw status codes. This utility helps extract and display these
 * messages to users.
 * 
 * ====== ERROR RESPONSE STRUCTURE ======
 * 
 * All errors are returned in this format:
 * {
 *   "timestamp": "2024-12-02T10:30:45.123Z",
 *   "status": 400,
 *   "error": "Human-readable error message",
 *   "path": "/api/materials",
 *   "fieldErrors": {
 *     "name": "Material name is required",
 *     "code": "Material code must be unique"
 *   }
 * }
 * 
 * ====== COMMON STATUS CODES & MESSAGES ======
 * 
 * 400 Bad Request
 *   - Missing or invalid parameters
 *   - Validation errors
 *   - Message: "Invalid value for parameter 'xyz'"
 * 
 * 401 Unauthorized
 *   - Missing or invalid authentication token
 *   - Token has expired
 *   - Message: "Missing authentication token" or "Invalid token"
 * 
 * 403 Forbidden
 *   - User lacks required permissions
 *   - Message: "You do not have permission to perform this action"
 * 
 * 404 Not Found
 *   - Resource does not exist
 *   - Message: "Resource not found"
 * 
 * 409 Conflict
 *   - Resource already exists (duplicate)
 *   - Logical conflict (e.g., can't delete active project)
 *   - Message: "Item with this code already exists"
 * 
 * 422 Unprocessable Entity
 *   - Data validation failed (field errors)
 *   - fieldErrors object contains field-level messages
 * 
 * 500 Internal Server Error
 *   - Unexpected server error
 *   - Message: "Unexpected server error"
 * 
 * 503 Service Unavailable
 *   - Server temporarily unavailable
 *   - Message: "Service unavailable. Please try again later."
 * 
 * ====== FRONTEND ERROR HANDLING ======
 * 
 * Use the getErrorMessage() utility function:
 * 
 *   try {
 *     const data = await apiGet("/api/materials");
 *   } catch (error: any) {
 *     // Extracts meaningful message and displays field errors if present
 *     const errorMsg = getErrorMessage(error, "Failed to load materials");
 *     toast.error(errorMsg);
 *   }
 * 
 * The function automatically:
 * - Extracts "error" field from response
 * - Maps common status codes to user-friendly messages
 * - Formats validation field errors for display
 * - Handles network errors gracefully
 * 
 * ====== AUTHENTICATION FLOW ======
 * 
 * 1. User logs in with Microsoft (Azure AD)
 * 2. Frontend receives idToken from MSAL
 * 3. Frontend calls GET /api/auth/session with Bearer token
 * 4. Backend validates token with Azure AD public keys
 * 5. Backend returns user profile with role
 * 6. Frontend stores role in Redux
 * 7. Frontend routes user to role-specific dashboard
 * 
 * On 401 response:
 * - Frontend automatically logs out user
 * - Clears auth state
 * - Redirects to login page
 * 
 * ====== ROLE ROUTING ======
 * 
 * After authentication, user is routed based on role:
 * 
 * ADMIN                     → /admin/materials
 * PROCUREMENT_MANAGER       → /procurement-manager
 * CEO / COO                 → /ceo-dashboard
 * PROJECT_HEAD              → /project-head
 * PROJECT_MANAGER           → /project-manager
 * USER                      → /workspace/bom (default workspace)
 * 
 * ====== VALIDATION FIELD ERRORS ======
 * 
 * When the backend returns 422 (Unprocessable Entity),
 * the response includes fieldErrors:
 * 
 * {
 *   "status": 422,
 *   "error": "Validation failed",
 *   "fieldErrors": {
 *     "email": "Email must be unique",
 *     "quantity": "Quantity must be greater than 0"
 *   }
 * }
 * 
 * The getErrorMessage() function formats this as:
 * "Validation failed
 * • email: Email must be unique
 * • quantity: Quantity must be greater than 0"
 */

// Example implementations in components:

// Example 1: Simple error handling
/*
const handleLoadData = async () => {
  try {
    setLoading(true);
    const data = await apiGet("/api/materials");
    setMaterials(data);
  } catch (error: any) {
    const errorMsg = getErrorMessage(error, "Failed to load materials");
    toast.error(errorMsg);
  } finally {
    setLoading(false);
  }
};
*/

// Example 2: Error handling with custom default message
/*
const handleCreateMaterial = async (formData) => {
  try {
    await apiPost("/api/materials", formData);
    toast.success("Material created successfully");
  } catch (error: any) {
    const errorMsg = getErrorMessage(error, "Failed to create material");
    toast.error(errorMsg);
  }
};
*/

// Example 3: Displaying field errors
/*
const { fieldErrors } = extractErrorMessage(error);
if (fieldErrors) {
  Object.entries(fieldErrors).forEach(([field, msg]) => {
    setFieldError(field, msg as string);
  });
}
*/

export {};
