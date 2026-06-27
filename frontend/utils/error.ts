export function getErrorMessage(errData: any, defaultMsg = "An error occurred"): string {
  if (!errData) return defaultMsg;
  
  // FastAPI validation errors structure
  if (errData.detail) {
    if (Array.isArray(errData.detail)) {
      return errData.detail.map((err: any) => {
        // format field loc info if available, e.g. "body.phone: message"
        const field = err.loc && err.loc.length > 1 ? err.loc.slice(1).join(".") : "";
        return field ? `${field}: ${err.msg}` : err.msg;
      }).join(", ");
    }
    if (typeof errData.detail === "string") {
      return errData.detail;
    }
  }

  if (errData.message) {
    return errData.message;
  }

  return defaultMsg;
}
