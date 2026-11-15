
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "../../../../utils/supabase-server";

export async function addParticipant(input: {
  full_name: string;
  tag_number: string;
  category_name: string;
  team_name: string;
}) {
  const supabase = await createClient();

  // Verify the logged-in user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "Please log in again." };
  }

  // Verify admin permission
  const { data: admin } = await supabase
    .from("admin_profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (!admin) {
    return { success: false, message: "Admin access required." };
  }

  const full_name = input.full_name.trim();
  const tag_number = input.tag_number.trim();

  if (
    !full_name ||
    !tag_number ||
    !input.category_name ||
    !input.team_name
  ) {
    return { success: false, message: "Please complete all fields." };
  }

  // Find the selected category
  const { data: category, error: categoryError } = await supabase
    .from("categories")
    .select("id")
    .eq("name", input.category_name)
    .maybeSingle();

  if (categoryError || !category) {
    return { success: false, message: "Selected category was not found." };
  }

  // Find the selected team
  const { data: team, error: teamError } = await supabase
    .from("teams")
    .select("id")
    .eq("name", input.team_name)
    .maybeSingle();

  if (teamError || !team) {
    return { success: false, message: "Selected team was not found." };
  }

  // Save participant
  const { error: insertError } = await supabase
    .from("participants")
    .insert({
      full_name,
      tag_number,
      category_id: category.id,
      team_id: team.id,
    });

  if (insertError) {
    return {
      success: false,
      message: insertError.code === "23505"
        ? "This tag number already exists."
        : "Could not save participant. Check database permissions.",
    };
  }

  revalidatePath("/admin/dashboard/participants");
  revalidatePath("/participants");

  return { success: true, message: "Participant added successfully!" };
}

export async function deleteParticipant(id: string) {
  const supabase = await createClient();

  // Verify logged-in user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "Please log in again." };
  }

  // Verify admin permission
  const { data: admin } = await supabase
    .from("admin_profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (!admin) {
    return { success: false, message: "Admin access required." };
  }

  if (!id) {
    return { success: false, message: "Invalid participant." };
  }

  const { data, error } = await supabase
    .from("participants")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    return {
      success: false,
      message: "Could not delete participant. Check database permissions or related records.",
    };
  }

  if (!data) {
    return { success: false, message: "Participant not found or deletion not permitted." };
  }

  revalidatePath("/admin/dashboard/participants");

  return { success: true, message: "Participant deleted successfully." };
}
