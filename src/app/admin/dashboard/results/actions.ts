
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "../../../../utils/supabase-server";

// ==========================================
// PUBLISH RESULT SET
// ==========================================

export async function publishResultSet(resultSetId: string) {
  if (!resultSetId) {
    return { success: false, message: "Invalid result ID." };
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

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
    return {
      success: false,
      message: `Publish failed: ${error.message}`,
    };
  }

  if (!data) {
    return {
      success: false,
      message: "Result not found or already published.",
    };
  }

  revalidatePath("/results");
  revalidatePath("/admin/dashboard/results");
  revalidatePath("/leaderboard");

  return {
    success: true,
    message: "Results published successfully!",
  };
}

// ==========================================
// UNPUBLISH RESULT SET
// ==========================================

export async function unpublishResultSet(resultSetId: string) {
  if (!resultSetId) {
    return { success: false, message: "Invalid result ID." };
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, message: "Please log in first." };
  }

  const { data, error } = await supabase
    .from("result_sets")
    .update({
      status: "DRAFT",
      published_at: null,
    })
    .eq("id", resultSetId)
    .eq("status", "PUBLISHED")
    .select("id")
    .maybeSingle();

  if (error) {
    return {
      success: false,
      message: `Unpublish failed: ${error.message}`,
    };
  }

  if (!data) {
    return {
      success: false,
      message: "Result not found or not published.",
    };
  }

  revalidatePath("/results");
  revalidatePath("/admin/dashboard/results");
  revalidatePath("/leaderboard");

  return {
    success: true,
    message: "Results unpublished successfully!",
  };
}

// ==========================================
// DELETE RESULT SET
// ==========================================

export async function deleteResultSet(resultSetId: string) {
  if (!resultSetId) {
    return { success: false, message: "Invalid result ID." };
  }

  const supabase = await createClient();

  // 1. Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      message: "Please log in first.",
    };
  }

  // 2. Find the result set
  const { data: existingSet, error: findError } = await supabase
    .from("result_sets")
    .select("id, status")
    .eq("id", resultSetId)
    .maybeSingle();

  if (findError) {
    return {
      success: false,
      message: `Find failed: ${findError.message}`,
    };
  }

  if (!existingSet) {
    return {
      success: false,
      message: "Result set not found or access denied.",
    };
  }

  // 3. Get existing entries before deletion
  const { data: existingEntries, error: entriesFindError } =
    await supabase
      .from("result_entries")
      .select("id")
      .eq("result_set_id", resultSetId);

  if (entriesFindError) {
    return {
      success: false,
      message: `Could not read result entries: ${entriesFindError.message}`,
    };
  }

  const expectedCount = existingEntries?.length ?? 0;

  // 4. Delete result entries and request deleted IDs
  const { data: deletedEntries, error: entriesDeleteError } =
    await supabase
      .from("result_entries")
      .delete()
      .eq("result_set_id", resultSetId)
      .select("id");

  if (entriesDeleteError) {
    return {
      success: false,
      message: `Entry deletion failed: ${entriesDeleteError.message}`,
    };
  }

  const deletedCount = deletedEntries?.length ?? 0;

  // 5. Verify the number of deleted entries
  if (deletedCount !== expectedCount) {
    return {
      success: false,
      message:
        `Entry deletion incomplete. Expected ${expectedCount}, ` +
        `but deleted ${deletedCount}. Check admin permissions and RLS policies.`,
    };
  }

  // 6. Check whether any entries remain
  const { data: remainingEntries, error: verifyEntriesError } =
    await supabase
      .from("result_entries")
      .select("id")
      .eq("result_set_id", resultSetId);

  if (verifyEntriesError) {
    return {
      success: false,
      message: `Entry verification failed: ${verifyEntriesError.message}`,
    };
  }

  if (remainingEntries && remainingEntries.length > 0) {
    return {
      success: false,
      message:
        `${remainingEntries.length} result entries still remain. ` +
        "Result set was not deleted.",
    };
  }

  // 7. Delete the result set
  const { data: deletedSet, error: deleteSetError } = await supabase
    .from("result_sets")
    .delete()
    .eq("id", resultSetId)
    .select("id")
    .maybeSingle();

  if (deleteSetError) {
    return {
      success: false,
      message: `Result set deletion failed: ${deleteSetError.message}`,
    };
  }

  if (!deletedSet) {
    return {
      success: false,
      message:
        "Result entries were deleted, but the result set could not be deleted. Check admin permissions.",
    };
  }

  // 8. Final verification
  const { data: finalCheck, error: finalCheckError } = await supabase
    .from("result_sets")
    .select("id")
    .eq("id", resultSetId)
    .maybeSingle();

  if (finalCheckError) {
    return {
      success: false,
      message: `Final verification failed: ${finalCheckError.message}`,
    };
  }

  if (finalCheck) {
    return {
      success: false,
      message: "Result set still exists in the database.",
    };
  }

  // 9. Refresh affected pages
  revalidatePath("/results");
  revalidatePath("/admin/dashboard/results");
  revalidatePath("/leaderboard");

  return {
    success: true,
    message:
      `Result set deleted successfully! ${deletedCount} entries removed from Supabase.`,
  };
}
