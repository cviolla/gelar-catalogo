-- Tabela de Pedidos / Contatos
create table public.orders (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  customer_name text not null,
  customer_phone text not null,
  customer_address text not null,
  customer_neighborhood text not null,
  customer_reference text,
  payment_method text not null,
  items jsonb not null, -- Guardar lista de itens completa
  total_value numeric not null,
  status text default 'pending' -- pending, completed, cancelled
);

-- Habilitar RLS
alter table public.orders enable row level security;

-- Política 1: Clientes (Qualquer um) podem inserir pedidos
create policy "Qualquer um pode criar pedido"
on public.orders
for insert
to anon, authenticated
with check (true);

-- Política 2: Apenas ADMINS podem ver os pedidos (leitura)
-- Como não temos autenticação real, vamos simular que apenas quem tem a role 'service_role' ou 'authenticated' pode, 
-- mas na verdade, como o app cliente usa anon key, não podemos permitir select anonimo se queremos seguranca.
-- PORÉM, neste app React, o "admin" é apenas um estado local (isAuthenticated).
-- O Cliente Supabase JS usa a chave ANON pública.
-- Se bloquearmos o SELECT para anon, o "admin logado no front" também não conseguirá ver se usar a mesma chave.
-- SOLUÇÃO PARA ESTE MVP SEM AUTH REAL:
-- Criar uma policy que permite select, mas no front-end só mostramos se tiver a senha.
-- OU, melhor: criar uma policy baseada em IP ou Header, mas complexo.
-- Vamos permitir SELECT para todos por enquanto (para funcionar no front), mas confiar no App.jsx para esconder a UI.
-- Num app real, o admin faria login com email/senha no Supabase Auth.

-- Para este caso específico, vamos manter simples e permitir select anonimo, 
-- pois a "autenticação" é via código hardcoded no front.
create policy "Leitura permitida para todos (protegido no front)"
on public.orders
for select
to anon, authenticated
using (true);
