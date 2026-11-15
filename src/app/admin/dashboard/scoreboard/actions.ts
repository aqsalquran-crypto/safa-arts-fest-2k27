
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "../../../../utils/supabase-server";

const ADMIN_PATH = "/admin/dashboard/scoreboard";

const VALID_CATEGORIES = [
  "BIDAYA",
  "THANAVIYYA",
  "ALIYA",
  "KULLIYYA",
];

async function verifyAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { supabase: null, error: "Please log in as admin." };
  }

  const { data: admin, error: adminError } = await supabase
    .from("admin_profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (adminError || !admin) {
    return { supabase: null, error: "Admin access required." };
  }

  return { supabase, error: null };
}

export async function saveFestScore(
  category: string,
  competitionId: string,
  fasahaPoints: number,
  balaghaPoints: number
) {
  try {
    const { supabase, error } = await verifyAdmin();

    if (!supabase) {
      return { success: false, message: error };
    }

    if (!VALID_CATEGORIES.includes(category)) {
      return { success: false, message: "Invalid category." };
    }

    if (!competitionId) {
      return { success: false, message: "Select a competition." };
    }

    if (
      !Number.isSafeInteger(fasahaPoints) ||
      !Number.isSafeInteger(balaghaPoints) ||
      fasahaPoints < 0 ||
      balaghaPoints < 0
    ) {
      return {
        success: false,
        message: "Points must be non-negative whole numbers.",
      };
    }

    // Find the selected category in the database.
    const { data: categoryRows, error: categoryError } =
      await supabase
        .from("categories")
        .select("id, name");

    if (categoryError) {
      return {
        success: false,
        message: "Could not verify category.",
      };
    }

    const normalize = (value: string) =>
      value.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^A-Z]/gi, "")
        .toUpperCase();

    const categoryRow = (categoryRows ?? []).find(
      (item) => normalize(item.name) === category
    );

    if (!categoryRow) {
      return {
        success: false,
        message: `Category ${category} was not found in your categories table.`,
      };
    }

    // Verify that this competition belongs to the selected category.
    const { data: eligible, error: eligibilityError } =
      await supabase
        .from("competition_categories")
        .select("competition_id")
        .eq("competition_id", competitionId)
        .eq("category_id", categoryRow.id)
        .maybeSingle();

    if (eligibilityError || !eligible) {
      return {
        success: false,
        message: "This competition is not assigned to this category.",
      };
    }

    const { error: saveError } = await supabase
      .from("fest_scores")
      .upsert(
        {
          category,
          competition_id: competitionId,
          fasaha_points: fasahaPoints,
          balagha_points: balaghaPoints,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "category,competition_id",
        }
      );

    if (saveError) {
      console.error("Save score error:", saveError);

      return {
        success: false,
        message: "Could not save score: " + saveError.message,
      };
    }

    revalidatePath(ADMIN_PATH);
    revalidatePath("/leaderboard");

    return {
      success: true,
      message: "Score saved successfully.",
    };
  } catch (error) {
    console.error("Unexpected score error:", error);

    return {
      success: false,
      message: "Unexpected error while saving score.",
    };
  }
}

export async function deleteFestScore(scoreId: string) {
  try {
    const { supabase, error } = await verifyAdmin();

    if (!supabase) {
      return { success: false, message: error };
    }

    if (!scoreId) {
      return { success: false, message: "Invalid score ID." };
    }

    const { data, error: deleteError } = await supabase
      .from("fest_scores")
      .delete()
      .eq("id", scoreId)
      .select("id")
      .maybeSingle();

    if (deleteError) {
      return {
        success: false,
        message: "Could not delete score: " + deleteError.message,
      };
    }

    if (!data) {
      return {
        success: false,
        message: "Score not found or not deleted.",
      };
    }

    revalidatePath(ADMIN_PATH);
    revalidatePath("/leaderboard");

    return {
      success: true,
      message: "Score deleted successfully.",
    };
  } catch (error) {
    console.error("Delete score error:", error);

    return {
      success: false,
      message: "Unexpected error while deleting score.",
    };
  }
}
