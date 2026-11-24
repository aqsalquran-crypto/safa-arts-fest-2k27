
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

// --------------------------------------------------
// INDIVIDUAL REGISTRATION
// --------------------------------------------------

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

    const { data: competitionRows, error: competitionError } =
      await supabase
        .from("competitions")
        .select("id, competition_type")
        .in("id", uniqueIds);

    if (competitionError || !competitionRows) {
      return {
        success: false,
        message: "Could not verify competitions.",
      };
    }

    if (
      competitionRows.length !== uniqueIds.length ||
      competitionRows.some(
        (item) => item.competition_type !== "INDIVIDUAL"
      )
    ) {
      return {
        success: false,
        message: "Individual registration accepts only INDIVIDUAL competitions.",
      };
    }

    const { data: eligibleLinks, error: eligibilityError } =
      await supabase
        .from("competition_categories")
        .select("competition_id")
        .eq("category_id", participant.category_id)
        .in("competition_id", uniqueIds);

    if (eligibilityError) {
      return {
        success: false,
        message: "Could not verify competition eligibility.",
      };
    }

    const eligibleIds = new Set(
      (eligibleLinks ?? []).map((item) => item.competition_id)
    );

    if (uniqueIds.some((id) => !eligibleIds.has(id))) {
      return {
        success: false,
        message: "Some competitions are not available for this participant's category.",
      };
    }

    const { data: existing, error: existingError } =
      await supabase
        .from("competition_registrations")
        .select("competition_id")
        .eq("participant_id", participantId)
        .in("competition_id", uniqueIds);

    if (existingError) {
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
      message: `${newIds.length} individual competition(s) registered successfully.`,
    };
  } catch (error) {
    console.error("Registration error:", error);

    return {
      success: false,
      message: "Unexpected error while registering participant.",
    };
  }
}

// --------------------------------------------------
// REMOVE INDIVIDUAL REGISTRATION
// --------------------------------------------------

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
      message: "Individual registration removed successfully.",
    };
  } catch (error) {
    console.error("Remove registration error:", error);

    return {
      success: false,
      message: "Unexpected error while removing registration.",
    };
  }
}

// --------------------------------------------------
// GROUP REGISTRATION
// --------------------------------------------------

export async function registerGroup(
  competitionId: string,
  teamId: string,
  groupName: string,
  participantIds: string[]
) {
  try {
    const { supabase, error } = await verifyAdmin();

    if (!supabase) {
      return {
        success: false,
        message: error ?? "Admin access required.",
      };
    }

    const cleanGroupName = groupName?.trim();

    const uniqueParticipantIds = [
      ...new Set(
        (participantIds ?? []).filter(
          (id) => typeof id === "string" && id.trim() !== ""
        )
      ),
    ];

    if (!competitionId || !teamId || !cleanGroupName) {
      return {
        success: false,
        message: "Select a competition, team and group name.",
      };
    }

    if (cleanGroupName.length > 100) {
      return {
        success: false,
        message: "Group name must not exceed 100 characters.",
      };
    }

    if (uniqueParticipantIds.length === 0) {
      return {
        success: false,
        message: "Select at least one participant for this group.",
      };
    }

    // Verify competition type.

    const { data: competition, error: competitionError } =
      await supabase
        .from("competitions")
        .select("id, competition_type")
        .eq("id", competitionId)
        .maybeSingle();

    if (competitionError || !competition) {
      return {
        success: false,
        message: "Competition not found.",
      };
    }

    if (competition.competition_type !== "GROUP") {
      return {
        success: false,
        message: "Group registration requires a GROUP competition.",
      };
    }

    // Verify all participants belong to the selected team.

    const { data: participants, error: participantError } =
      await supabase
        .from("participants")
        .select("id, category_id, team_id")
        .in("id", uniqueParticipantIds);

    if (participantError || !participants) {
      return {
        success: false,
        message: "Could not verify selected participants.",
      };
    }

    if (participants.length !== uniqueParticipantIds.length) {
      return {
        success: false,
        message: "One or more selected participants were not found.",
      };
    }

    if (participants.some((item) => item.team_id !== teamId)) {
      return {
        success: false,
        message: "All group members must belong to the selected team.",
      };
    }

    if (participants.some((item) => !item.category_id)) {
      return {
        success: false,
        message: "Every participant must have a category assigned.",
      };
    }

    // Verify category eligibility for every participant.

    const categoryIds = [
      ...new Set(
        participants.map((item) => item.category_id as string)
      ),
    ];

    const { data: eligibleLinks, error: eligibilityError } =
      await supabase
        .from("competition_categories")
        .select("category_id")
        .eq("competition_id", competitionId)
        .in("category_id", categoryIds);

    if (eligibilityError) {
      return {
        success: false,
        message: "Could not verify group eligibility.",
      };
    }

    const eligibleCategoryIds = new Set(
      (eligibleLinks ?? []).map((item) => item.category_id)
    );

    if (categoryIds.some((id) => !eligibleCategoryIds.has(id))) {
      return {
        success: false,
        message: "Some participants are not eligible for this competition.",
      };
    }

    // Check whether any participant is already in another group
    // for this same competition.

    const { data: existingMembers, error: existingError } =
      await supabase
        .from("competition_group_members")
        .select("participant_id")
        .eq("competition_id", competitionId)
        .in("participant_id", uniqueParticipantIds);

    if (existingError) {
      return {
        success: false,
        message: "Could not check existing group memberships.",
      };
    }

    if ((existingMembers ?? []).length > 0) {
      return {
        success: false,
        message: "One or more participants already belong to a group in this competition.",
      };
    }

    // Create the group.

    const { data: group, error: groupError } = await supabase
      .from("competition_groups")
      .insert({
        competition_id: competitionId,
        team_id: teamId,
        group_name: cleanGroupName,
      })
      .select("id")
      .single();

    if (groupError || !group) {
      console.error("Group creation error:", groupError);

      return {
        success: false,
        message: "Could not create group: " + (groupError?.message ?? "Unknown error"),
      };
    }

    // Add participants to the group.

    const memberRows = uniqueParticipantIds.map((participantId) => ({
      competition_id: competitionId,
      group_id: group.id,
      participant_id: participantId,
    }));

    const { error: memberError } = await supabase
      .from("competition_group_members")
      .insert(memberRows);

    if (memberError) {
      console.error("Group member insertion error:", memberError);

      // Attempt to remove the newly created empty/failed group.
      const { error: rollbackError } = await supabase
        .from("competition_groups")
        .delete()
        .eq("id", group.id);

      if (rollbackError) {
        console.error("Group rollback error:", rollbackError);
      }

      return {
        success: false,
        message: "Group was created, but adding members failed: " + memberError.message,
      };
    }

    revalidatePath(REGISTRATIONS_PATH);

    return {
      success: true,
      message: `${cleanGroupName} registered successfully with ${uniqueParticipantIds.length} participant(s).`,
    };
  } catch (error) {
    console.error("Group registration error:", error);

    return {
      success: false,
      message: "Unexpected error while registering group.",
    };
  }
}

// --------------------------------------------------
// REMOVE GROUP
// --------------------------------------------------

export async function removeGroup(groupId: string) {
  try {
    const { supabase, error } = await verifyAdmin();

    if (!supabase) {
      return {
        success: false,
        message: error ?? "Admin access required.",
      };
    }

    if (!groupId) {
      return {
        success: false,
        message: "Invalid group ID.",
      };
    }

    const { data, error: deleteError } = await supabase
      .from("competition_groups")
      .delete()
      .eq("id", groupId)
      .select("id")
      .maybeSingle();

    if (deleteError) {
      console.error("Group removal error:", deleteError);

      return {
        success: false,
        message: "Could not remove group: " + deleteError.message,
      };
    }

    if (!data) {
      return {
        success: false,
        message: "Group not found.",
      };
    }

    revalidatePath(REGISTRATIONS_PATH);

    return {
      success: true,
      message: "Group removed successfully.",
    };
  } catch (error) {
    console.error("Remove group error:", error);

    return {
      success: false,
      message: "Unexpected error while removing group.",
    };
  }
}
