import { LovableAuth } from "@lovable.dev/cloud-auth-js";

export const lovable = new LovableAuth({
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
});
