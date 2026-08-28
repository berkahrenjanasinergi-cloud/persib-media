create table if not exists posts(id bigint primary key, platform text, content text, image_url text, scheduled_at timestamptz, status text default 'draft', result text, created_at timestamptz default now());
create table if not exists events(id bigint primary key, kind text, meta jsonb, created_at timestamptz default now());
create table if not exists assets(id bigint primary key, kind text, url text, prompt text, tags text, created_at timestamptz default now());
create table if not exists revenue(id bigint primary key, stream text, kind text, amount numeric, note text, created_at timestamptz default now());
alter table posts enable row level security; alter table events enable row level security; alter table assets enable row level security; alter table revenue enable row level security;
create policy p_all on posts for all using (true) with check (true);
create policy e_all on events for all using (true) with check (true);
create policy a_all on assets for all using (true) with check (true);
create policy r_all on revenue for all using (true) with check (true);