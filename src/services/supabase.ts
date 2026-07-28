// src/services/supabase.ts
// Web-only mode — sem dependência externa do Supabase

const noop = Promise.resolve();
const noopData = Promise.resolve({ data: null, error: null });

export const supabase = {
  get auth() {
    return {
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      getSession: () => Promise.resolve({ data: { session: null } }),
      signInWithPassword: () => Promise.resolve({ error: null }),
      signUp: () => Promise.resolve({ error: null }),
      signOut: () => Promise.resolve(),
      resetPasswordForEmail: () => Promise.resolve({ error: null }),
      signInWithOAuth: () => Promise.resolve(),
    };
  },
  from: (_table: string) => ({
    upsert: () => noop,
    insert: () => noop,
    select: () => noopData,
  }),
  rpc: () => noopData,
};
