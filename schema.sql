-- Design decisions flywheel
create table design_decisions (
  id uuid default gen_random_uuid() primary key,
  user_id text not null,
  prompt text not null,
  classification jsonb,
  clarifying_questions jsonb,
  answers jsonb,
  output text,
  rationale text,
  models_used jsonb,
  cost numeric,
  latency_ms integer,
  user_override text,
  shipped boolean default false,
  created_at timestamp default now()
);

-- Brand briefs
create table brand_briefs (
  id uuid default gen_random_uuid() primary key,
  user_id text not null,
  name text not null,
  content jsonb not null,
  version integer default 1,
  active boolean default true,
  created_at timestamp default now()
);

-- User taste profiles
create table taste_profiles (
  user_id text primary key,
  preferences jsonb default '{}',
  override_patterns jsonb default '[]',
  generic_score_avg numeric default 50,
  updated_at timestamp default now()
);

-- Enable RLS
alter table design_decisions enable row level security;
alter table brand_briefs enable row level security;
alter table taste_profiles enable row level security;

create policy "Users can only see their own data"
  on design_decisions for all
  using (auth.uid()::text = user_id);

create policy "Users can only see their own briefs"
  on brand_briefs for all
  using (auth.uid()::text = user_id);
