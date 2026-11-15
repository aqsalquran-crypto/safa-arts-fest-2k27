
-- ============================================
-- SAFA ARTS FEST 2K27
-- MIGRATION 001: INITIAL DATABASE SCHEMA
-- ============================================

create extension if not exists pgcrypto;

-- 1. PARTICIPANT CATEGORIES

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  constraint valid_category_name check (
    name in ('BIDAYA', 'THANAVIYYA', 'ALIYA', 'KULLIYYA')
  )
);

insert into public.categories (name)
values
  ('BIDAYA'),
  ('THANAVIYYA'),
  ('ALIYA'),
  ('KULLIYYA');


-- 2. TEAMS

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  color text not null,
  logo_url text,
  introduction text,
  manager_name text,
  captain_name text,
  vice_captain_name text,
  created_at timestamptz not null default now(),

  constraint valid_team check (
    (name = 'FASAHA' and color = '#168343')
    or
    (name = 'BALAGHA' and color = '#2463C7')
  )
);

insert into public.teams (name, color)
values
  ('FASAHA', '#168343'),
  ('BALAGHA', '#2463C7');


-- 3. ADMIN PROFILES

create table public.admin_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);


-- 4. PARTICIPANTS

create table public.participants (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  tag_number text not null,
  category_id uuid not null references public.categories(id),
  team_id uuid not null references public.teams(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint valid_participant_name check (
    length(trim(full_name)) > 0
  ),

  constraint valid_tag_number check (
    length(trim(tag_number)) > 0
  )
);

create unique index participants_tag_number_unique
on public.participants (lower(trim(tag_number)));


-- 5. COMPETITIONS

create table public.competitions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  competition_category text,
  competition_type text not null,
  status text not null default 'UPCOMING',
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint valid_competition_type check (
    competition_type in ('INDIVIDUAL', 'GROUP')
  ),

  constraint valid_competition_status check (
    status in ('UPCOMING', 'ONGOING', 'COMPLETED')
  ),

  constraint valid_competition_name check (
    length(trim(name)) > 0
  )
);


-- 6. COMPETITION ELIGIBLE CATEGORIES

create table public.competition_categories (
  competition_id uuid not null
    references public.competitions(id) on delete cascade,

  category_id uuid not null
    references public.categories(id),

  primary key (competition_id, category_id)
);


-- 7. INDIVIDUAL COMPETITION REGISTRATIONS

create table public.competition_registrations (
  id uuid primary key default gen_random_uuid(),

  competition_id uuid not null
    references public.competitions(id) on delete cascade,

  participant_id uuid not null
    references public.participants(id) on delete cascade,

  registered_at timestamptz not null default now(),

  constraint unique_competition_registration
    unique (competition_id, participant_id)
);


-- 8. COMPETITION GROUPS

create table public.competition_groups (
  id uuid primary key default gen_random_uuid(),

  competition_id uuid not null
    references public.competitions(id) on delete cascade,

  team_id uuid not null
    references public.teams(id),

  group_name text not null,

  created_at timestamptz not null default now(),

  constraint valid_group_name check (
    length(trim(group_name)) > 0
  ),

  constraint unique_group_name_per_competition
    unique (competition_id, group_name),

  constraint unique_group_reference
    unique (id, competition_id)
);


-- 9. COMPETITION GROUP MEMBERS

create table public.competition_group_members (
  id uuid primary key default gen_random_uuid(),

  competition_id uuid not null,

  group_id uuid not null,

  participant_id uuid not null
    references public.participants(id) on delete cascade,

  created_at timestamptz not null default now(),

  constraint group_member_group_reference
    foreign key (group_id, competition_id)
    references public.competition_groups(id, competition_id)
    on delete cascade,

  constraint unique_participant_per_competition
    unique (competition_id, participant_id),

  constraint unique_group_member
    unique (group_id, participant_id)
);


-- 10. VALIDATE GROUP MEMBERSHIP
-- A group and all its members must belong to the same team.

create or replace function public.validate_group_member_team()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  group_team_id uuid;
  participant_team_id uuid;
  competition_kind text;
begin
  select g.team_id, c.competition_type
  into group_team_id, competition_kind
  from public.competition_groups g
  join public.competitions c
    on c.id = g.competition_id
  where g.id = new.group_id
    and g.competition_id = new.competition_id;

  if not found then
    raise exception 'Invalid competition group.';
  end if;

  if competition_kind <> 'GROUP' then
    raise exception 'Participants can only join groups in GROUP competitions.';
  end if;

  select p.team_id
  into participant_team_id
  from public.participants p
  where p.id = new.participant_id;

  if participant_team_id is null
     or participant_team_id <> group_team_id then
    raise exception 'A group member must belong to the same team as the group.';
  end if;

  return new;
end;
$$;

create trigger validate_group_member_team_trigger
before insert or update on public.competition_group_members
for each row
execute function public.validate_group_member_team();


-- 11. RESULT SETS

create table public.result_sets (
  id uuid primary key default gen_random_uuid(),

  competition_id uuid not null unique
    references public.competitions(id) on delete restrict,

  status text not null default 'DRAFT',

  published_at timestamptz,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now(),

  constraint valid_result_status check (
    status in ('DRAFT', 'PUBLISHED')
  ),

  constraint valid_publication_timestamp check (
    (status = 'DRAFT' and published_at is null)
    or
    (status = 'PUBLISHED' and published_at is not null)
  )
);


-- 12. RESULT ENTRIES

create table public.result_entries (
  id uuid primary key default gen_random_uuid(),

  result_set_id uuid not null
    references public.result_sets(id) on delete cascade,

  participant_id uuid
    references public.participants(id) on delete restrict,

  team_id uuid
    references public.teams(id) on delete restrict,

  group_id uuid
    references public.competition_groups(id) on delete restrict,

  position integer not null,

  points numeric(10,2) not null default 0,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now(),

  constraint valid_result_position check (position > 0),

  constraint valid_result_points check (points >= 0),

  constraint exactly_one_result_target check (
    num_nonnulls(participant_id, team_id, group_id) = 1
  )
);

create unique index unique_participant_result
on public.result_entries (result_set_id, participant_id)
where participant_id is not null;

create unique index unique_team_result
on public.result_entries (result_set_id, team_id)
where team_id is not null;

create unique index unique_group_result
on public.result_entries (result_set_id, group_id)
where group_id is not null;


-- 13. VALIDATE RESULT TARGETS
-- Result type and competition must match the target.

create or replace function public.validate_result_entry()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  result_competition_id uuid;
  competition_kind text;
  target_competition_id uuid;
begin
  select rs.competition_id, c.competition_type
  into result_competition_id, competition_kind
  from public.result_sets rs
  join public.competitions c
    on c.id = rs.competition_id
  where rs.id = new.result_set_id;

  if not found then
    raise exception 'Invalid result set.';
  end if;

  if new.participant_id is not null then
    if competition_kind <> 'INDIVIDUAL' then
      raise exception 'Individual results require an INDIVIDUAL competition.';
    end if;

    if not exists (
      select 1
      from public.competition_registrations cr
      where cr.competition_id = result_competition_id
        and cr.participant_id = new.participant_id
    ) then
      raise exception 'Participant is not registered for this competition.';
    end if;

  elsif new.group_id is not null then
    if competition_kind <> 'GROUP' then
      raise exception 'Group results require a GROUP competition.';
    end if;

    select g.competition_id
    into target_competition_id
    from public.competition_groups g
    where g.id = new.group_id;

    if target_competition_id is distinct from result_competition_id then
      raise exception 'Group does not belong to this competition.';
    end if;

  elsif new.team_id is not null then
    raise exception 'Use a competition group for team-based group results.';
  end if;

  return new;
end;
$$;

create trigger validate_result_entry_trigger
before insert or update on public.result_entries
for each row
execute function public.validate_result_entry();


-- 14. ANNOUNCEMENTS AND POSTERS

create table public.announcements (
  id uuid primary key default gen_random_uuid(),

  title text not null,

  content text,

  update_type text not null,

  image_url text,

  is_published boolean not null default false,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now(),

  constraint valid_update_type check (
    update_type in (
      'ANNOUNCEMENT',
      'COMPETITION_DATE',
      'POSTER'
    )
  )
);


-- 15. PROGRAMME SETTINGS

create table public.programme_settings (
  id uuid primary key default gen_random_uuid(),

  programme_date timestamptz not null,

  timezone text not null default 'Asia/Kolkata',

  venue text,

  schedule jsonb not null default '[]'::jsonb,

  chief_guests jsonb not null default '[]'::jsonb,

  speakers jsonb not null default '[]'::jsonb,

  updated_at timestamptz not null default now()
);


-- 16. AUDIT LOGS

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),

  admin_id uuid references auth.users(id),

  action text not null,

  table_name text not null,

  record_id uuid,

  old_data jsonb,

  new_data jsonb,

  created_at timestamptz not null default now()
);


-- 17. AUTOMATIC UPDATED_AT FUNCTION

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger participants_updated_at
before update on public.participants
for each row execute function public.set_updated_at();

create trigger competitions_updated_at
before update on public.competitions
for each row execute function public.set_updated_at();

create trigger result_sets_updated_at
before update on public.result_sets
for each row execute function public.set_updated_at();

create trigger result_entries_updated_at
before update on public.result_entries
for each row execute function public.set_updated_at();

create trigger announcements_updated_at
before update on public.announcements
for each row execute function public.set_updated_at();

create trigger programme_settings_updated_at
before update on public.programme_settings
for each row execute function public.set_updated_at();


-- ============================================
-- PERMANENT PARTICIPANT TEAM ASSIGNMENT
-- ============================================

create or replace function public.prevent_participant_team_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if OLD.team_id is not null
     and NEW.team_id is distinct from OLD.team_id then
    raise exception
      'A participant team assignment is permanent and cannot be changed.';
  end if;

  return NEW;
end;
$$;

create trigger prevent_participant_team_change
before update of team_id
on public.participants
for each row
execute function public.prevent_participant_team_change();

-- ============================================
-- PERMANENT COMPETITION GROUP TEAM
-- ============================================

create or replace function public.prevent_group_team_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if NEW.team_id is distinct from OLD.team_id then
    raise exception
      'A competition group team assignment is permanent.';
  end if;

  return NEW;
end;
$$;

create trigger prevent_group_team_change
before update of team_id
on public.competition_groups
for each row
execute function public.prevent_group_team_change();

-- ============================================
-- EVERY PARTICIPANT MUST HAVE A TEAM
-- ============================================

alter table public.participants
alter column team_id set not null;

-- ============================================
-- END OF INITIAL SCHEMA
-- ============================================
