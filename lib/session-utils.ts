import { toast } from 'sonner';

export interface SessionValidationResult {
  isValid: boolean;
  error?: string;
  shouldRedirect?: boolean;
}

export async function validateAndHandleSession(response: Response): Promise<SessionValidationResult> {
  if (response.ok) {
    return { isValid: true };
  }

  if (response.status === 401) {
    try {
      const errorData = await response.json();
      console.log('Session validation failed:', errorData.error);
      
      // Check if it's a session expiration issue
      if (errorData.error?.includes('expired') || 
          errorData.error?.includes('Invalid') || 
          errorData.error?.includes('No session token')) {
        
        toast.error('Your session has expired. Redirecting to login...');
        
        // Redirect to login with current page as redirect target
        setTimeout(() => {
          window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
        }, 2000);
        
        return { 
          isValid: false, 
          error: errorData.error, 
          shouldRedirect: true 
        };
      }
      
      // Other authentication errors
      toast.error('Authentication failed. Please refresh the page.');
      return { 
        isValid: false, 
        error: errorData.error 
      };
      
    } catch (parseError) {
      console.error('Error parsing error response:', parseError);
      toast.error('Authentication failed. Please refresh the page.');
      return { 
        isValid: false, 
        error: 'Authentication failed' 
      };
    }
  }

  // Other HTTP errors
  try {
    const errorData = await response.json();
    return { 
      isValid: false, 
      error: errorData.error || `HTTP ${response.status} error` 
    };
  } catch (parseError) {
    return { 
      isValid: false, 
      error: `HTTP ${response.status} error` 
    };
  }
}

export async function makeAuthenticatedRequest(
  url: string, 
  options: RequestInit = {}
): Promise<Response> {
  
  const defaultOptions: RequestInit = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, defaultOptions);
    return response;
  } catch (error) {
    console.error('Network error:', error);
    toast.error('Network error. Please check your connection.');
    throw error;
  }
}

export async function handleApiResponse<T>(response: Response): Promise<T | null> {
  const validation = await validateAndHandleSession(response);
  
  if (!validation.isValid) {
    if (validation.shouldRedirect) {
      return null; // Will redirect
    }
    // For non-auth errors, let the caller handle them
    if (response.status !== 401) {
      try {
        const errorData = await response.json();
        const errorMessage = errorData.details 
          ? `${errorData.error}: ${errorData.details}`
          : errorData.error || `HTTP ${response.status} error`;
        throw new Error(errorMessage);
      } catch (parseError) {
        throw new Error(`HTTP ${response.status} error`);
      }
    }
    throw new Error(validation.error || 'API request failed');
  }

  try {
    const data = await response.json();
    return data;
  } catch (parseError) {
    console.error('Error parsing response:', parseError);
    toast.error('Error processing server response');
    throw new Error('Error processing server response');
  }
}