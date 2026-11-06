-- Ejecutar una vez en un proyecto nuevo desde Supabase SQL Editor.
begin;
create table public.profiles(id uuid primary key references auth.users(id) on delete cascade, role text not null check(role in ('Administrador','Programación','Dulcería','Consulta')), active boolean not null default true);
alter table public.profiles enable row level security;
revoke all on public.profiles from anon,authenticated;
grant select on public.profiles to authenticated;
create policy own_profile on public.profiles for select to authenticated using (id=(select auth.uid()));
create function public.ccu_can_edit(section_name text) returns boolean language sql stable security invoker set search_path='' as $$
select exists(select 1 from public.profiles where id=(select auth.uid()) and active and (role='Administrador' or (role='Programación' and section_name in ('movies','upcoming')) or (role='Dulcería' and section_name='candy')));
$$;
revoke all on function public.ccu_can_edit(text) from public;
grant execute on function public.ccu_can_edit(text) to authenticated;
do $$
declare t text;
begin
foreach t in array array['movies','candy','upcoming'] loop
execute format('create table public.%I (id uuid primary key default gen_random_uuid(), payload jsonb not null check (jsonb_typeof(payload)=''object'' and payload ? ''title'' and length(trim(payload->>''title''))>0))',t);
execute format('alter table public.%I enable row level security',t);
execute format('revoke all on public.%I from anon, authenticated',t);
execute format('grant select on public.%I to anon, authenticated',t);
execute format('grant insert, update, delete on public.%I to authenticated',t);
execute format('create policy display on public.%I for select to anon, authenticated using (%s)',t,case when t='movies' then 'true' else 'payload->>''active'' = ''true''' end);
execute format('create policy edit on public.%I for all to authenticated using (public.ccu_can_edit(%L)) with check(public.ccu_can_edit(%L))',t,t,t);
end loop;
end $$;
commit;
