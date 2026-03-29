/**
 * Universal API Error Helper
 * Safely extracts human-readable error messages from diverse backend responses
 * (Legacy strings, new objects, network failures, etc.)
 */
export function getErrorMessage(err) {
  // 1. New Structured Format: { error: { message: "..." } }
  if (err?.response?.data?.error?.message) {
    return err.response.data.error.message;
  }

  // 2. Medium Structured Format: { message: "..." }
  if (err?.response?.data?.message) {
    return err.response.data.message;
  }

  // 3. Simple Object Format: { error: "..." }
  if (err?.response?.data?.error) {
    return typeof err.response.data.error === 'string' 
      ? err.response.data.error 
      : JSON.stringify(err.response.data.error);
  }

  // 4. Raw Axios Error or Network Error
  if (err?.message) {
    return err.message;
  }

  // 5. Fallback
  return "Something went wrong. Please try again later.";
}
