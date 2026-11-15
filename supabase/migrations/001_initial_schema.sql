
-- =====================================================
-- SAFA ARTS FEST 2K27
-- MIGRATION 001: INITIAL DATABASE SCHEMA
-- =====================================================

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
  updated_at timestamptz not null default now(),

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

create index participants_category_idx
on public.participants(category_id);

create index participants_team_idx
on public.participants(team_id);


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
    references public.participants(id) on delete restrict,

  registered_at timestamptz not null default now(),

  constraint unique_competition_registration
    unique (competition_id, participant_id)
);

create index registrations_participant_idx
on public.competition_registrations(participant_id);


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

  constraint unique_group_reference
    unique (id, competition_id)
);

create unique index unique_group_name_per_competition
on public.competition_groups (
  competition_id,
  lower(trim(group_name))
);

create index competition_groups_team_idx
on public.competition_groups(team_id);


-- 9. COMPETITION GROUP MEMBERS

create table public.competition_group_members (
  id uuid primary key default gen_random_uuid(),

  competition_id uuid not null,

  group_id uuid not null,

  participant_id uuid not null
    references public.participants(id) on delete restrict,

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

create index group_members_participant_idx
on public.competition_group_members(participant_id);


-- 10. UPDATED_AT FUNCTION

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


-- 11. PERMANENT PARTICIPANT TEAM

create or replace function public.prevent_participant_team_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.team_id is distinct from old.team_id then
    raise exception
      'A participant team assignment is permanent.';
  end if;

  return new;
end;
$$;

create trigger prevent_participant_team_change
before update of team_id
on public.participants
for each row
execute function public.prevent_participant_team_change();


-- 12. PERMANENT GROUP TEAM

create or replace function public.prevent_group_team_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.team_id is distinct from old.team_id then
    raise exception
      'A competition group team assignment is permanent.';
  end if;

  return new;
end;
$$;

create trigger prevent_group_team_change
before update of team_id
on public.competition_groups
for each row
execute function public.prevent_group_team_change();


-- 13. VALIDATE INDIVIDUAL REGISTRATION
-- Participant category must be eligible.

create or replace function public.validate_individual_registration()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  participant_category uuid;
  competition_kind text;
begin
  select p.category_id
  into participant_category
  from public.participants p
  where p.id = new.participant_id;

  if not found then
    raise exception 'Participant does not exist.';
  end if;

  select c.competition_type
  into competition_kind
  from public.competitions c
  where c.id = new.competition_id;

  if not found then
    raise exception 'Competition does not exist.';
  end if;

  if competition_kind <> 'INDIVIDUAL' then
    raise exception 'Individual registration requires an INDIVIDUAL competition.';
  end if;

  if not exists (
    select 1
    from public.competition_categories cc
    where cc.competition_id = new.competition_id
      and cc.category_id = participant_category
  ) then
    raise exception 'Participant category is not eligible for this competition.';
  end if;

  return new;
end;
$$;

create trigger validate_individual_registration_trigger
before insert or update
on public.competition_registrations
for each row
execute function public.validate_individual_registration();


-- 14. VALIDATE GROUP MEMBERSHIP
-- Every member must belong to the group's team
-- and be eligible for the competition.

create or replace function public.validate_group_member()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  group_team_id uuid;
  participant_team_id uuid;
  participant_category uuid;
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
    raise exception 'Group membership requires a GROUP competition.';
  end if;

  select p.team_id, p.category_id
  into participant_team_id, participant_category
  from public.participants p
  where p.id = new.participant_id;

  if not found then
    raise exception 'Participant does not exist.';
  end if;

  if participant_team_id <> group_team_id then
    raise exception 'A group member must belong to the same team as the group.';
  end if;

  if not exists (
    select 1
    from public.competition_categories cc
    where cc.competition_id = new.competition_id
      and cc.category_id = participant_category
  ) then
    raise exception 'Participant category is not eligible for this competition.';
  end if;

  return new;
end;
$$;

create trigger validate_group_member_trigger
before insert or update
on public.competition_group_members
for each row
execute function public.validate_group_member();


-- 15. RESULT SETS

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


-- 16. RESULT ENTRIES

create table public.result_entries (
  id uuid primary key default gen_random_uuid(),

  result_set_id uuid not null
    references public.result_sets(id) on delete cascade,

  participant_id uuid
    references public.participants(id) on delete restrict,

  group_id uuid
    references public.competition_groups(id) on delete restrict,

  position integer not null,

  points numeric(10,2) not null default 0,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now(),

  constraint valid_result_position check (position > 0),

  constraint valid_result_points check (points >= 0),

  constraint exactly_one_result_target check (
    num_nonnulls(participant_id, group_id) = 1
  )
);

create unique index unique_participant_result
on public.result_entries (result_set_id, participant_id)
where participant_id is not null;

create unique index unique_group_result
on public.result_entries (result_set_id, group_id)
where group_id is not null;

create index result_entries_result_set_idx
on public.result_entries(result_set_id);


-- 17. VALIDATE RESULT ENTRIES

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

    if not exists (
      select 1
      from public.competition_group_members gm
      where gm.group_id = new.group_id
    ) then
      raise exception 'A group must have members before receiving a result.';
    end if;
  end if;

  return new;
end;
$$;

create trigger validate_result_entry_trigger
before insert or update
on public.result_entries
for each row
execute function public.validate_result_entry();


-- 18. VALIDATE RESULT PUBLICATION



create or replace function public.validate_result_publication()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  competition_kind text;
begin
  if new.status = 'PUBLISHED' then

    select c.competition_type
    into competition_kind
    from public.competitions c
    where c.id = new.competition_id;

    if not found then
      raise exception 'Competition does not exist.';
    end if;

    if not exists (
      select 1
      from public.result_entries re
      where re.result_set_id = new.id
    ) then
      raise exception 'Cannot publish results without result entries.';
    end if;

    -- Validate individual results
    if competition_kind = 'INDIVIDUAL' and exists (
      select 1
      from public.result_entries re
      where re.result_set_id = new.id
        and (
          re.participant_id is null
          or not exists (
            select 1
            from public.competition_registrations cr
            where cr.competition_id = new.competition_id
              and cr.participant_id = re.participant_id
          )
        )
    ) then
      raise exception
        'Every individual result must belong to a registered participant.';
    end if;

    -- Validate group results
    if competition_kind = 'GROUP' and exists (
      select 1
      from public.result_entries re
      left join public.competition_groups g
        on g.id = re.group_id
       and g.competition_id = new.competition_id
      where re.result_set_id = new.id
        and (
          re.participant_id is not null
          or g.id is null
          or not exists (
            select 1
            from public.competition_group_members gm
            where gm.group_id = g.id
          )
        )
    ) then
      raise exception
        'Every group result must belong to a valid group with members.';
    end if;

    if new.published_at is null then
      new.published_at = now();
    end if;

  else
    new.published_at = null;
  end if;

  return new;
end;
$$;

create trigger validate_result_publication_trigger
before insert or update of status
on public.result_sets
for each row
execute function public.validate_result_publication();


-- 19. ANNOUNCEMENTS AND POSTERS

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
  ),

  constraint valid_announcement_title check (
    length(trim(title)) > 0
  )
);


-- 20. PROGRAMME SETTINGS

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

insert into public.programme_settings (
  programme_date,
  timezone
)
values (
  '2027-01-02 18:00:00+05:30',
  'Asia/Kolkata'
);


-- 21. AUDIT LOGS

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


-- 22. UPDATED_AT TRIGGERS

create trigger participants_updated_at
before update on public.participants
for each row execute function public.set_updated_at();

create trigger teams_updated_at
before update on public.teams
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
-- PROTECT PUBLISHED RESULTS
-- ============================================

create or replace function public.prevent_published_result_changes()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  old_status text;
  new_status text;
begin
  if TG_OP <> 'INSERT' then
    select status into old_status
    from public.result_sets
    where id = OLD.result_set_id
    for update;

    if old_status = 'PUBLISHED' then
      raise exception
        'Unpublish the result set before changing its entries.';
    end if;
  end if;

  if TG_OP <> 'DELETE' then
    select status into new_status
    from public.result_sets
    where id = NEW.result_set_id
    for update;

    if new_status = 'PUBLISHED' then
      raise exception
        'Unpublish the result set before changing its entries.';
    end if;
  end if;

  if TG_OP = 'DELETE' then
    return OLD;
  end if;

  return NEW;
end;
$$;

create trigger protect_published_result_entries
before insert or update or delete
on public.result_entries
for each row
execute function public.prevent_published_result_changes();


-- Prevent deletion of published result sets

create or replace function public.prevent_published_result_set_deletion()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if OLD.status = 'PUBLISHED' then
    raise exception
      'Unpublish the result set before deleting it.';
  end if;

  return OLD;
end;
$$;

create trigger protect_published_result_set_deletion
before delete on public.result_sets
for each row
execute function public.prevent_published_result_set_deletion();

-- ============================================
-- PREVENT CATEGORY CHANGES AFTER PARTICIPATION
-- ============================================

create or replace function public.prevent_participant_category_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if NEW.category_id is distinct from OLD.category_id then

    if exists (
      select 1
      from public.competition_registrations
      where participant_id = OLD.id
    ) or exists (
      select 1
      from public.competition_group_members
      where participant_id = OLD.id
    ) then

      raise exception
        'Remove the participant from all competition entries before changing their category.';

    end if;

  end if;

  return NEW;
end;
$$;

create trigger protect_participant_category
before update of category_id
on public.participants
for each row
execute function public.prevent_participant_category_change();

-- ============================================
-- PREVENT COMPETITION TYPE CHANGES
-- AFTER PARTICIPATION BEGINS
-- ============================================

create or replace function public.prevent_competition_type_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if NEW.competition_type is distinct from OLD.competition_type then

    if exists (
      select 1
      from public.competition_registrations
      where competition_id = OLD.id
    ) or exists (
      select 1
      from public.competition_groups
      where competition_id = OLD.id
    ) or exists (
      select 1
      from public.result_sets
      where competition_id = OLD.id
    ) then

      raise exception
        'Cannot change competition type after registrations, groups or results exist.';

    end if;

  end if;

  return NEW;
end;
$$;

create trigger protect_competition_type
before update of competition_type
on public.competitions
for each row
execute function public.prevent_competition_type_change();

-- ============================================
-- PROTECT PARTICIPATION AFTER RESULTS ARE PUBLISHED
-- ============================================



create or replace function public.prevent_published_participation_changes()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  old_competition_id uuid;
  new_competition_id uuid;
begin
  if TG_TABLE_NAME = 'competition_registrations' then

    if TG_OP <> 'INSERT' then
      old_competition_id := OLD.competition_id;
    end if;

    if TG_OP <> 'DELETE' then
      new_competition_id := NEW.competition_id;
    end if;

  else

    if TG_OP <> 'INSERT' then
      select competition_id into old_competition_id
      from public.competition_groups
      where id = OLD.group_id;
    end if;

    if TG_OP <> 'DELETE' then
      select competition_id into new_competition_id
      from public.competition_groups
      where id = NEW.group_id;
    end if;

  end if;

  -- Lock relevant result sets before checking publication status.
  perform rs.id
  from public.result_sets rs
  where rs.competition_id = old_competition_id
     or rs.competition_id = new_competition_id
  order by rs.id
  for update;

  if exists (
    select 1
    from public.result_sets rs
    where rs.status = 'PUBLISHED'
      and (
        rs.competition_id = old_competition_id
        or rs.competition_id = new_competition_id
      )
  ) then
    raise exception
      'Unpublish the competition results before changing participation.';
  end if;

  if TG_OP = 'DELETE' then
    return OLD;
  end if;

  return NEW;
end;
$$;

create trigger protect_published_registrations
before insert or update or delete
on public.competition_registrations
for each row
execute function public.prevent_published_participation_changes();

create trigger protect_published_group_members
before insert or update or delete
on public.competition_group_members
for each row
execute function public.prevent_published_participation_changes();


-- ============================================
-- PROTECT COMPETITION CATEGORY ELIGIBILITY
-- ============================================

create or replace function public.prevent_eligibility_changes_after_participation()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  old_competition_id uuid;
  new_competition_id uuid;
begin
  if TG_OP <> 'INSERT' then
    old_competition_id := OLD.competition_id;
  end if;

  if TG_OP <> 'DELETE' then
    new_competition_id := NEW.competition_id;
  end if;

  if exists (
    select 1
    from public.competition_registrations cr
    where cr.competition_id = old_competition_id
       or cr.competition_id = new_competition_id
  ) or exists (
    select 1
    from public.competition_groups cg
    where cg.competition_id = old_competition_id
       or cg.competition_id = new_competition_id
  ) or exists (
    select 1
    from public.result_sets rs
    where rs.competition_id = old_competition_id
       or rs.competition_id = new_competition_id
  ) then

    raise exception
      'Clear competition registrations, groups and results before changing eligible categories.';

  end if;

  if TG_OP = 'DELETE' then
    return OLD;
  end if;

  return NEW;
end;
$$;

create trigger protect_competition_eligibility
before insert or update or delete
on public.competition_categories
for each row
execute function public.prevent_eligibility_changes_after_participation();


-- ============================================
-- PREVENT GROUP COMPETITION CHANGES
-- ============================================

create or replace function public.prevent_group_competition_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if NEW.competition_id is distinct from OLD.competition_id then

    if exists (
      select 1
      from public.competition_group_members
      where group_id = OLD.id
    ) or exists (
      select 1
      from public.result_entries
      where group_id = OLD.id
    ) then

      raise exception
        'Cannot move a group after members or results have been added.';

    end if;

  end if;

  return NEW;
end;
$$;

create trigger protect_group_competition
before update of competition_id
on public.competition_groups
for each row
execute function public.prevent_group_competition_change();


-- ============================================
-- ENFORCE SINGLE PROGRAMME SETTINGS RECORD
-- ============================================

create unique index programme_settings_single_record
on public.programme_settings ((true));


-- =====================================================
-- END OF MIGRATION 001
-- =====================================================
