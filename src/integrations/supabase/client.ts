// Stub implementation of Supabase client and edge function invocation.
// This file provides a mock of the Supabase `invokeEdgeFunction` API used in
// various components. It always returns a canned response so that the
// application can run in a standalone environment without a configured
// Supabase backend. In a real project, replace this file with the actual
// generated Supabase client (see your main repo).

export type FunctionInvokeOptions = {
  body?: any;
  headers?: Record<string, string>;
};

// Export a minimal supabase-like object for compatibility
export const supabase = {
  functions: {
    invoke: async <T = unknown>(
      functionName: string,
      options: FunctionInvokeOptions = {},
    ): Promise<{ data: T | null; error: any }> => {
      return invokeEdgeFunction<T>(functionName, options);
    },
  },
};

/**
 * Generic wrapper mimicking the real invokeEdgeFunction from the main project.
 * Here, it returns a fake feedback for `analyze-drawing` and no data for others.
 */
export const invokeEdgeFunction = async <T = unknown>(
  functionName: string,
  options: FunctionInvokeOptions = {},
): Promise<{ data: T | null; error: any }> => {
  // In a real implementation, this would call Supabase:
  // return supabase.functions.invoke<T>(functionName, { ...options });
  if (functionName === "analyze-drawing") {
    const exerciseTitle = options.body?.exerciseTitle ?? "exercice";
    return {
      data: {
        feedback: `✨ Analyse fictive pour ${exerciseTitle} : continue de tracer avec confiance et concentrez-vous sur les proportions. 🎨`,
      } as T,
      error: null,
    };
  }
  return { data: null, error: null };
};