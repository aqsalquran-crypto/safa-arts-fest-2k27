
-- ============================================
-- SAFA ARTS FEST 2K27
-- MIGRATION 002: SECURITY AND AUDIT
-- ============================================


-- 1. ENABLE ROW LEVEL SECURITY

alter table public.categories enable row level security;
alter table public.teams enable row level security;
alter table public.admin_profiles enable row level security;
alter table public.participants enable row level security;
alter table public.competitions enable row level security;
alter table public.competition_categories enable row level security;
alter table public.competition_registrations enable row level security;
alter table public.competition_groups enable row level security;
alter table public.competition_group_members enable row level security;
alter table public.result_sets enable row level security;
alter table public.result_entries enable row level security;
alter table public.announcements enable row level security;
alter table public.programme_settings enable row level security;
alter table public.audit_logs enable row level security;


-- 2. ADMIN CHECK FUNCTION

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_profiles
    where id = (select auth.uid())
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;


-- 3. REMOVE DEFAULT TABLE PERMISSIONS

revoke all on all tables in schema public from anon;
revoke all on all tables in schema public from authenticated;


-- 4. PUBLIC READ PERMISSIONS

grant select on public.categories to anon, authenticated;
grant select on public.teams to anon, authenticated;

-- Public visitors can see only approved participant columns.
grant select (
  id,
  full_name,
  tag_number,
  category_id,
  team_id
) on public.participants to anon, authenticated;

grant select on public.competitions to anon, authenticated;
grant select on public.competition_categories to anon, authenticated;
grant select on public.competition_groups to anon, authenticated;
grant select on public.competition_group_members to anon, authenticated;
grant select on public.result_sets to anon, authenticated;
grant select on public.result_entries to anon, authenticated;
grant select on public.announcements to anon, authenticated;
grant select on public.programme_settings to anon, authenticated;


-- 5. ADMIN TABLE PERMISSIONS

grant select, insert, update, delete
on public.categories,
   public.teams,
   public.participants,
   public.competitions,
   public.competition_categories,
   public.competition_registrations,
   public.competition_groups,
   public.competition_group_members,
   public.result_sets,
   public.result_entries,
   public.announcements,
   public.programme_settings
to authenticated;

grant select on public.admin_profiles to authenticated;
grant select on public.audit_logs to authenticated;


-- 6. PUBLIC READ POLICIES

create policy "Public read categories"
on public.categories
for select to anon, authenticated
using (true);

create policy "Public read teams"
on public.teams
for select to anon, authenticated
using (true);

create policy "Public read participants"
on public.participants
for select to anon, authenticated
using (true);

create policy "Public read visible competitions"
on public.competitions
for select to anon, authenticated
using (is_public = true);

create policy "Public read eligible categories"
on public.competition_categories
for select to anon, authenticated
using (
  exists (
    select 1
    from public.competitions c
    where c.id = competition_id
      and c.is_public = true
  )
);

create policy "Public read visible groups"
on public.competition_groups
for select to anon, authenticated
using (
  exists (
    select 1
    from public.competitions c
    where c.id = competition_id
      and c.is_public = true
  )
);

create policy "Public read visible group members"
on public.competition_group_members
for select to anon, authenticated
using (
  exists (
    select 1
    from public.competitions c
    where c.id = competition_id
      and c.is_public = true
  )
);

create policy "Public read published result sets"
on public.result_sets
for select to anon, authenticated
using (status = 'PUBLISHED');

create policy "Public read published result entries"
on public.result_entries
for select to anon, authenticated
using (
  exists (
    select 1
    from public.result_sets rs
    where rs.id = result_set_id
      and rs.status = 'PUBLISHED'
  )
);

create policy "Public read published announcements"
on public.announcements
for select to anon, authenticated
using (is_published = true);

create policy "Public read programme settings"
on public.programme_settings
for select to anon, authenticated
using (true);


-- 7. ADMIN PROFILE POLICY

create policy "Admins read admin profiles"
on public.admin_profiles
for select to authenticated
using (public.is_admin());


-- 8. ADMIN MANAGEMENT POLICIES

create policy "Admins manage categories"
on public.categories
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins update team profiles"
on public.teams
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins manage participants"
on public.participants
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins manage competitions"
on public.competitions
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins manage competition categories"
on public.competition_categories
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins manage registrations"
on public.competition_registrations
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins manage competition groups"
on public.competition_groups
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins manage group members"
on public.competition_group_members
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins manage result sets"
on public.result_sets
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins manage result entries"
on public.result_entries
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins manage announcements"
on public.announcements
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins manage programme settings"
on public.programme_settings
for all to authenticated
using (public.is_admin())
with check (public.is_admin());


-- 9. AUDIT LOG READ POLICY

create policy "Admins read audit logs"
on public.audit_logs
for select to authenticated
using (public.is_admin());


-- 10. AUTOMATIC AUDIT LOGGING FUNCTION

create or replace function public.record_audit_log()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  old_record jsonb;
  new_record jsonb;
  affected_id uuid;
begin
  if TG_OP = 'INSERT' then
    new_record := to_jsonb(NEW);
    affected_id := (new_record ->> 'id')::uuid;

  elsif TG_OP = 'UPDATE' then
    old_record := to_jsonb(OLD);
    new_record := to_jsonb(NEW);
    affected_id := (new_record ->> 'id')::uuid;

  elsif TG_OP = 'DELETE' then
    old_record := to_jsonb(OLD);
    affected_id := (old_record ->> 'id')::uuid;
  end if;

  insert into public.audit_logs (
    admin_id,
    action,
    table_name,
    record_id,
    old_data,
    new_data
  )
  values (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    affected_id,
    old_record,
    new_record
  );

  if TG_OP = 'DELETE' then
    return OLD;
  end if;

  return NEW;
end;
$$;


-- 11. ATTACH AUDIT TRIGGERS

create trigger audit_participants
after insert or update or delete on public.participants
for each row execute function public.record_audit_log();

create trigger audit_competitions
after insert or update or delete on public.competitions
for each row execute function public.record_audit_log();

create trigger audit_competition_groups
after insert or update or delete on public.competition_groups
for each row execute function public.record_audit_log();

create trigger audit_group_members
after insert or update or delete on public.competition_group_members
for each row execute function public.record_audit_log();

create trigger audit_result_sets
after insert or update or delete on public.result_sets
for each row execute function public.record_audit_log();

create trigger audit_result_entries
after insert or update or delete on public.result_entries
for each row execute function public.record_audit_log();

create trigger audit_announcements
after insert or update or delete on public.announcements
for each row execute function public.record_audit_log();

create trigger audit_teams
after insert or update or delete on public.teams
for each row execute function public.record_audit_log();


-- ============================================
-- END OF SECURITY MIGRATION
-- ============================================
