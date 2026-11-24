-- Run once in Supabase → SQL Editor. Then Authentication → Providers: enable Email (optionally disable "Confirm email" for instant sign-up).
create table projects(id uuid primary key default gen_random_uuid(), owner_id uuid not null default auth.uid(), owner_email text default lower(auth.jwt()->>'email'), title text, data jsonb, updated_at timestamptz default now());
create table groups(id uuid primary key default gen_random_uuid(), name text not null, owner_id uuid not null default auth.uid(), owner_email text default lower(auth.jwt()->>'email'));
create table group_members(group_id uuid references groups on delete cascade, email text, primary key(group_id,email));
create table shares(id uuid primary key default gen_random_uuid(), project_id uuid references projects on delete cascade, email text, group_id uuid references groups on delete cascade, role text not null default 'view' check(role in ('view','edit')), check(email is not null or group_id is not null));

create function me() returns text language sql stable as $$ select lower(auth.jwt()->>'email') $$;
create function in_group(g uuid) returns boolean language sql security definer stable as $$ select exists(select 1 from groups where id=g and owner_id=auth.uid()) or exists(select 1 from group_members where group_id=g and lower(email)=me()) $$;
create function can_view(p uuid) returns boolean language sql security definer stable as $$ select exists(select 1 from projects where id=p and owner_id=auth.uid()) or exists(select 1 from shares s where s.project_id=p and (lower(s.email)=me() or (s.group_id is not null and in_group(s.group_id)))) $$;
create function can_edit(p uuid) returns boolean language sql security definer stable as $$ select exists(select 1 from projects where id=p and owner_id=auth.uid()) or exists(select 1 from shares s where s.project_id=p and s.role='edit' and (lower(s.email)=me() or (s.group_id is not null and in_group(s.group_id)))) $$;
create function owns_project(p uuid) returns boolean language sql security definer stable as $$ select exists(select 1 from projects where id=p and owner_id=auth.uid()) $$;
create function owns_group(g uuid) returns boolean language sql security definer stable as $$ select exists(select 1 from groups where id=g and owner_id=auth.uid()) $$;

alter table projects enable row level security; alter table groups enable row level security; alter table group_members enable row level security; alter table shares enable row level security;
create policy p_sel on projects for select using(can_view(id));
create policy p_ins on projects for insert with check(owner_id=auth.uid());
create policy p_upd on projects for update using(can_edit(id));
create policy p_del on projects for delete using(owner_id=auth.uid());
create policy s_sel on shares for select using(can_view(project_id));
create policy s_ins on shares for insert with check(owns_project(project_id));
create policy s_upd on shares for update using(owns_project(project_id));
create policy s_del on shares for delete using(owns_project(project_id));
create policy g_sel on groups for select using(in_group(id));
create policy g_ins on groups for insert with check(owner_id=auth.uid());
create policy g_upd on groups for update using(owner_id=auth.uid());
create policy g_del on groups for delete using(owner_id=auth.uid());
create policy m_sel on group_members for select using(in_group(group_id) or lower(email)=me());
create policy m_ins on group_members for insert with check(owns_group(group_id));
create policy m_del on group_members for delete using(owns_group(group_id));
