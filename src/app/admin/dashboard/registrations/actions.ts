"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "../../../../utils/supabase-server";

const REGISTRATIONS_PATH = "/admin/dashboard/registrations";

async function verifyAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      supabase: null,
      error: "Please log in as admin.",
    };
  }

  const { data: admin, error: adminError } = await supabase
    .from("admin_profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (adminError || !admin) {
    return {
      supabase: null,
      error: "Admin access required.",
    };
  }

  return {
    supabase,
    error: null,
  };
}

export async function registerParticipant(
  participantId: string,
  competitionIds: string[]
) {
  try {
    const { supabase, error } = await verifyAdmin();

    if (!supabase) {
      return {
        success: false,
        message: error ?? "Admin access required.",
      };
    }

    const uniqueIds = [
      ...new Set(
        (competitionIds ?? []).filter(
          (id) => typeof id === "string" && id.trim() !== ""
        )
      ),
    ];

    if (!participantId || uniqueIds.length === 0) {
      return {
        success: false,
        message: "Select a participant and at least one competition.",
      };
    }

    const { data: participant, error: participantError } =
      await supabase
        .from("participants")
        .select("id, category_id")
        .eq("id", participantId)
        .maybeSingle();

    if (participantError || !participant) {
      return {
        success: false,
        message: "Participant not found.",
      };
    }

    if (!participant.category_id) {
      return {
        success: false,
        message: "This participant does not have a category assigned.",
      };
    }

    // Verify that all selected competitions belong to this category.
    const { data: eligibleLinks, error: eligibilityError } =
      await supabase
        .from("competition_categories")
        .select("competition_id")
        .eq("category_id", participant.category_id)
        .in("competition_id", uniqueIds);

    if (eligibilityError) {
      console.error("Eligibility error:", eligibilityError);

      return {
        success: false,
        message: "Could not verify competition eligibility.",
      };
    }

    const eligibleIds = new Set(
      (eligibleLinks ?? []).map((item) => item.competition_id)
    );

    const invalidIds = uniqueIds.filter(
      (id) => !eligibleIds.has(id)
    );

    if (invalidIds.length > 0) {
      return {
        success: false,
        message:
          "Some competitions are not available for this participant's category.",
      };
    }

    // Check existing registrations.
    const { data: existing, error: existingError } =
      await supabase
        .from("competition_registrations")
        .select("competition_id")
        .eq("participant_id", participantId)
        .in("competition_id", uniqueIds);

    if (existingError) {
      console.error("Existing registration error:", existingError);

      return {
        success: false,
        message: "Could not check existing registrations.",
      };
    }

    const existingIds = new Set(
      (existing ?? []).map((item) => item.competition_id)
    );

    const newIds = uniqueIds.filter(
      (id) => !existingIds.has(id)
    );

    if (newIds.length === 0) {
      return {
        success: true,
        message: "All selected competitions are already registered.",
      };
    }

    // Insert new registrations.
    const rows = newIds.map((competitionId) => ({
      participant_id: participantId,
      competition_id: competitionId,
      registered_at: new Date().toISOString(),
    }));

    const { error: insertError } = await supabase
      .from("competition_registrations")
      .insert(rows);

    if (insertError) {
      console.error("Registration insert error:", insertError);

      return {
        success: false,
        message: "Could not save registrations: " + insertError.message,
      };
    }

    revalidatePath(REGISTRATIONS_PATH);

    return {
      success: true,
      message: `${newIds.length} competition(s) registered successfully.`,
    };
  } catch (error) {
    console.error("Registration error:", error);

    return {
      success: false,
      message: "Unexpected error while registering participant.",
    };
  }
}

export async function removeRegistration(registrationId: string) {
  try {
    const { supabase, error } = await verifyAdmin();

    if (!supabase) {
      return {
        success: false,
        message: error ?? "Admin access required.",
      };
    }

    if (!registrationId) {
      return {
        success: false,
        message: "Invalid registration ID.",
      };
    }

    const { data, error: deleteError } = await supabase
      .from("competition_registrations")
      .delete()
      .eq("id", registrationId)
      .select("id")
      .maybeSingle();

    if (deleteError) {
      console.error("Registration delete error:", deleteError);

      return {
        success: false,
        message: "Could not remove registration: " + deleteError.message,
      };
    }

    if (!data) {
      return {
        success: false,
        message: "Registration not found.",
      };
    }

    revalidatePath(REGISTRATIONS_PATH);

    return {
      success: true,
      message: "Registration removed successfully.",
    };
  } catch (error) {
    console.error("Remove registration error:", error);

    return {
      success: false,
      message: "Unexpected error while removing registration.",
    };
  }
}