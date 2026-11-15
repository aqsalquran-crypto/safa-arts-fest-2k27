
import { Suspense } from "react";
import { connection } from "next/server";
import { createClient } from "../../utils/supabase-server";

type Participant = {
  id: string;
  full_name: string | null;
  tag_number: string | null;
  team_id: string | null;
};

type TeamRow = {
  id: string;
  name: string;
  color: string | null;
  logo_url: string | null;
  introduction: string | null;
  manager: { full_name: string | null } | null;
  captain: { full_name: string | null } | null;
  vice_captain: { full_name: string | null } | null;
};

async function TeamsData() {
  await connection();

  const supabase = await createClient();

  const [
    { data: teamRows, error: teamError },
    { data: participantRows, error: participantError },
  ] = await Promise.all([
    supabase
      .from("teams")
      .select(`
        id,
        name,
        color,
        logo_url,
        introduction,
        manager:participants!teams_manager_id_fkey (
          full_name
        ),
        captain:participants!teams_captain_id_fkey (
          full_name
        ),
        vice_captain:participants!teams_vice_captain_id_fkey (
          full_name
        )
      `)
      .order("name"),

    supabase
      .from("participants")
      .select("id, full_name, tag_number, team_id")
      .order("tag_number"),
  ]);

  if (teamError || participantError) {
    return (
      <main className="min-h-screen bg-[#0b0b0b] px-5 py-16 text-white">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-4xl font-extrabold">Our Teams</h1>
          <p className="mt-6 text-red-400">
            Could not load team information. Please check Supabase public read permissions.
          </p>
        </div>
      </main>
    );
  }

  const teams = (teamRows ?? []) as unknown as TeamRow[];
  const participants = (participantRows ?? []) as Participant[];

  return (
    <main className="min-h-screen bg-[#0b0b0b] px-5 py-16 text-white sm:px-10">
      <div className="mx-auto max-w-6xl">

        <p className="text-sm font-semibold tracking-[0.3em] text-green-400">
          SAFA ARTS FEST 2K27
        </p>

        <h1 className="mt-4 text-4xl font-extrabold sm:text-5xl">
          Our Teams
        </h1>

        <p className="mt-4 max-w-2xl leading-7 text-gray-400">
          Meet the teams of SAFA ARTS FEST 2K27.
        </p>

        {teams.length === 0 ? (
          <div className="mt-12 rounded-xl border border-white/10 p-8 text-center text-gray-400">
            No teams have been added yet.
          </div>
        ) : (
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {teams.map((team) => {
              const color = team.color || "#168343";

              const members = participants
                .filter((participant) => participant.team_id === team.id)
                .sort((a, b) =>
                  (a.tag_number ?? "").localeCompare(
                    b.tag_number ?? "",
                    undefined,
                    { numeric: true, sensitivity: "base" }
                  )
                );

              return (
                <div
                  key={team.id}
                  className="rounded-2xl border p-8"
                  style={{
                    borderColor: `${color}80`,
                    backgroundColor: `${color}12`,
                  }}
                >
                  <div className="flex items-center gap-4">
                    {team.logo_url ? (
                      <img
                        src={team.logo_url}
                        alt={`${team.name} logo`}
                        className="h-16 w-16 rounded-full border border-white/10 object-cover"
                      />
                    ) : (
                      <div
                        className="h-14 w-14 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                    )}

                    <h2
                      className="text-4xl font-extrabold"
                      style={{ color }}
                    >
                      {team.name}
                    </h2>
                  </div>

                  <p className="mt-5 leading-7 text-gray-300">
                    {team.introduction || "A team of SAFA ARTS FEST 2K27."}
                  </p>

                  {/* Leadership */}
                  <div className="mt-8 border-t border-white/10 pt-6">
                    <h3 className="font-semibold">Team Leadership</h3>

                    <div className="mt-4 space-y-3 text-sm text-gray-400">
                      <p>
                        Manager: {team.manager?.full_name || "Not assigned"}
                      </p>
                      <p>
                        Captain: {team.captain?.full_name || "Not assigned"}
                      </p>
                      <p>
                        Vice-Captain: {team.vice_captain?.full_name || "Not assigned"}
                      </p>
                    </div>
                  </div>

                  {/* Members */}
                  <div className="mt-8 border-t border-white/10 pt-6">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-semibold">Team Members</h3>
                      <span className="text-sm text-gray-400">
                        {members.length} Members
                      </span>
                    </div>

                    {members.length === 0 ? (
                      <p className="mt-4 text-sm text-gray-500">
                        No participants assigned yet.
                      </p>
                    ) : (
                      <div className="mt-4 overflow-hidden rounded-xl border border-white/10">
                        {members.map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center justify-between gap-4 border-b border-white/5 px-4 py-3 last:border-b-0"
                          >
                            <span className="text-sm text-gray-300">
                              {member.full_name}
                            </span>

                            <span className="shrink-0 font-mono text-sm text-gray-500">
                              {member.tag_number || "—"}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Team Statistics */}
                  <div className="mt-8">
                    <div className="rounded-xl bg-white/5 p-4">
                      <p className="text-xs text-gray-400">
                        Total Participants
                      </p>
                      <p className="mt-2 text-xl font-bold">
                        {members.length}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

export default function TeamsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#0b0b0b] text-white">
          Loading teams...
        </div>
      }
    >
      <TeamsData />
    </Suspense>
  );
}
