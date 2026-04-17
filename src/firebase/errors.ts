
export type SecurityRuleContext = {
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete' | 'write';
  requestResourceData?: any;
};

export class FirestorePermissionError extends Error {
  context: SecurityRuleContext;
  
  constructor(context: SecurityRuleContext) {
    // A more readable, multi-line message for the toast.
    const message = `Firestore Security Rules Denied Request:
    - Operation: ${context.operation}
    - Path: ${context.path}
    - Details: Review Firestore Rules for this path.
    - Data (if available): ${JSON.stringify(context.requestResourceData, null, 2)}`;
    
    super(message);
    this.name = 'FirestorePermissionError';
    this.context = context;
    
    // This is for V8's stack trace API, useful in some environments.
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, FirestorePermissionError);
    }
  }
}
