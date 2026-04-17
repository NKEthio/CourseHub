
'use client';

import * as React from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import type { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';
import { Terminal } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function FirebaseErrorListener() {
  const { toast } = useToast();

  React.useEffect(() => {
    const handlePermissionError = (error: FirestorePermissionError) => {
      console.error("Caught Firestore Permission Error:", error); // Keep console log for devs

      // Display a detailed toast notification instead of just throwing the error.
      // This is more reliable for catching errors from async operations.
      toast({
        variant: "destructive",
        title: "Firestore: Permission Denied",
        description: (
          <div className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
             <AlertDescription>
              <pre className="text-xs whitespace-pre-wrap">
                {error.message}
              </pre>
            </AlertDescription>
          </div>
        ),
        duration: 20000, // Give user time to read
      });
    };

    errorEmitter.on('permission-error', handlePermissionError);

    return () => {
      errorEmitter.removeListener('permission-error', handlePermissionError);
    };
  }, [toast]);

  return null; // This component does not render anything
}
