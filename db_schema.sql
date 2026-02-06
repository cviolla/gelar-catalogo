-- Criação da tabela de produtos
create table public.products (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  volume text,
  category text,
  image_url text,
  prices jsonb default '[]'::jsonb -- Armazena a lista de preços flexível
);

-- Habilitar RLS (Segurança) mas deixar aberto para este MVP
alter table public.products enable row level security;

-- Política de acesso (Pública para leitura e escrita por enquanto - Cuidado em produção!)
create policy "Acesso Total Público"
on public.products
for all
using (true)
with check (true);

-- Bucket para Imagens (Storage)
insert into storage.buckets (id, name, public) 
values ('products', 'products', true);

create policy "Imagens Públicas"
on storage.objects for select
using ( bucket_id = 'products' );

create policy "Upload de Imagens"
on storage.objects for insert
with check ( bucket_id = 'products' );
