
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "../../../../utils/supabase-server";

export async function publishResultSet(resultSetId: string) {
  if (!resultSetId) {
    return { success: false, message: "Invalid result ID." };
  }

  const supabase = await createClient();

  const { data: { user }, error: authError } =
    await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, message: "Please log in first." };
  }

  const { data, error } = await supabase
    .from("result_sets")
    .update({
      status: "PUBLISHED",
      published_at: new Date().toISOString(),
    })
    .eq("id", resultSetId)
    .eq("status", "DRAFT")
    .select("id")
    .maybeSingle();

  if (error) {
    return { success: false, message: error.message };
  }

  if (!data) {
    return {
      success: false,
      message: "Result not found or already published.",
    };
  }

  revalidatePath("/results");
  revalidatePath("/admin/dashboard/results");

  return { success: true, message: "Results published successfully!" };
}
