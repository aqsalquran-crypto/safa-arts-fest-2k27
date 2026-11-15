
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "../../../../utils/supabase-server";

type ActionResult = {
  success: boolean;
  message: string;
};

const VALID_TYPES = ["INDIVIDUAL", "GROUP"] as const;

const VALID_COMPETITION_CATEGORIES = [
  "BIDAYA",
  "THANAVIYYA",
  "ALIYA",
  "KULLIYA",
] as const;

const VALID_SECTIONS = [
  "STAGE",
  "OFF_STAGE",
  "SPORTS",
] as const;

// ADD COMPETITION
export async function addCompetition(
  formData: FormData
): Promise<ActionResult> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, message: "Please log in again." };
    }

    const { data: admin, error: adminError } = await supabase
      .from("admin_profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (adminError || !admin) {
      return { success: false, message: "Admin access denied." };
    }

    const name = String(formData.get("name") ?? "").trim();

    const competitionCategory = String(
      formData.get("competition_category") ?? ""
    ).trim().toUpperCase();

    const competitionSection = String(
      formData.get("competition_section") ?? ""
    ).trim().toUpperCase();

    const competitionType = String(
      formData.get("competition_type") ?? ""
    ).trim().toUpperCase();

    const isPublic = formData.get("is_public") === "on";

    const categoryIds = [
      ...new Set(
        formData
          .getAll("category_ids")
          .map((value) => String(value).trim())
          .filter(Boolean)
      ),
    ];

    // Required field validation
    if (
      !name ||
      !competitionCategory ||
      !competitionSection ||
      !competitionType
    ) {
      return {
        success: false,
        message: "Please fill in all required fields.",
      };
    }

    // Validate competition category
    if (
      !VALID_COMPETITION_CATEGORIES.includes(
        competitionCategory as (typeof VALID_COMPETITION_CATEGORIES)[number]
      )
    ) {
      return {
        success: false,
        message: "Invalid competition category.",
      };
    }

    // Validate competition section
    if (
      !VALID_SECTIONS.includes(
        competitionSection as (typeof VALID_SECTIONS)[number]
      )
    ) {
      return {
        success: false,
        message: "Invalid competition section.",
      };
    }

    // Validate competition type
    if (
      !VALID_TYPES.includes(
        competitionType as (typeof VALID_TYPES)[number]
      )
    ) {
      return {
        success: false,
        message: "Invalid competition type.",
      };
    }

    // Verify eligible categories
    if (categoryIds.length > 0) {
      const { data: categories, error: categoryError } = await supabase
        .from("categories")
        .select("id")
        .in("id", categoryIds);

      if (categoryError) {
        return {
          success: false,
          message: "Could not verify categories: " + categoryError.message,
        };
      }

      if ((categories?.length ?? 0) !== categoryIds.length) {
        return {
          success: false,
          message: "One or more selected categories are invalid.",
        };
      }
    }

    // Insert competition
    const { data: competition, error: competitionError } = await supabase
      .from("competitions")
      .insert({
        name,
        competition_category: competitionCategory,
        competition_section: competitionSection,
        competition_type: competitionType,
        is_public: isPublic,
      })
      .select("id")
      .single();

    if (competitionError || !competition) {
      return {
        success: false,
        message:
          competitionError?.message ?? "Could not create competition.",
      };
    }

    // Link eligible categories
    if (categoryIds.length > 0) {
      const links = categoryIds.map((categoryId) => ({
        competition_id: competition.id,
        category_id: categoryId,
      }));

      const { error: linkError } = await supabase
        .from("competition_categories")
        .insert(links);

      if (linkError) {
        const { error: rollbackError } = await supabase
          .from("competitions")
          .delete()
          .eq("id", competition.id);

        return {
          success: false,
          message: rollbackError
            ? `Category linking failed: ${linkError.message}. Cleanup also failed: ${rollbackError.message}`
            : `Could not save eligible categories: ${linkError.message}`,
        };
      }
    }

    revalidatePath("/admin/dashboard/competitions");
    revalidatePath("/competitions");

    return {
      success: true,
      message: "Competition created successfully!",
    };
  } catch (error) {
    console.error("Add competition error:", error);

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "An unexpected error occurred.",
    };
  }
}

// DELETE COMPETITION
export async function deleteCompetition(
  competitionId: string
): Promise<ActionResult> {
  try {
    if (!competitionId || !/^[0-9a-f-]{36}$/i.test(competitionId)) {
      return {
        success: false,
        message: "Invalid competition ID.",
      };
    }

    const supabase = await createClient();

    // Verify signed-in user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        message: "Please log in again.",
      };
    }

    // Verify admin access
    const { data: admin, error: adminError } = await supabase
      .from("admin_profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (adminError || !admin) {
      return {
        success: false,
        message: "Admin access denied.",
      };
    }

    // Delete competition
    const { data: deletedCompetition, error: deleteError } = await supabase
      .from("competitions")
      .delete()
      .eq("id", competitionId)
      .select("id")
      .maybeSingle();

    if (deleteError) {
      if (deleteError.code === "23503") {
        return {
          success: false,
          message:
            "This competition cannot be deleted because it has existing results.",
        };
      }

      return {
        success: false,
        message: "Could not delete competition: " + deleteError.message,
      };
    }

    if (!deletedCompetition) {
      return {
        success: false,
        message:
          "Competition not found or you do not have permission to delete it.",
      };
    }

    revalidatePath("/admin/dashboard/competitions");
    revalidatePath("/competitions");

    return {
      success: true,
      message: "Competition deleted successfully!",
    };
  } catch (error) {
    console.error("Delete competition error:", error);

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "An unexpected error occurred.",
    };
  }
}
