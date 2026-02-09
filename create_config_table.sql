-- Criação da tabela de configuração da loja
create table if not exists public.store_config (
  id uuid default gen_random_uuid() primary key,
  key text unique not null,
  value text not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Inserindo o número do WhatsApp atual
insert into public.store_config (key, value)
values ('whatsapp_number', '5521964788628')
on conflict (key) do update set value = excluded.value;

-- Habilitar RLS
alter table public.store_config enable row level security;

-- Política de leitura pública
create policy "Configurações visíveis para todos"
on public.store_config for select
using (true);

-- Política de edição (temporariamente aberta para facilitar)
create policy "Edição permitida"
on public.store_config for update
using (true)
with check (true);
