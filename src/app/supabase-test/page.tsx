
import { createClient } from "@/utils/supabase-server";

export default async function SupabaseTestPage() {
  const supabase = await createClient();

  const { error } = await supabase
    .from("connection_test")
    .select("*")
    .limit(1);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0b0b0b] px-6 text-white">
      <div className="max-w-lg rounded-2xl border border-white/10 bg-white/5 p-10 text-center">
        <h1 className="text-3xl font-bold">
          Supabase Connection Test
        </h1>

        {error?.code === "42P01" ? (
          <p className="mt-5 text-green-400">
            Connection successful! The test table does not exist yet.
          </p>
        ) : error ? (
          <p className="mt-5 text-red-400">
            Connection error: {error.message}
          </p>
        ) : (
          <p className="mt-5 text-green-400">
            Supabase connection successful!
          </p>
        )}
      </div>
    </main>
  );
}
