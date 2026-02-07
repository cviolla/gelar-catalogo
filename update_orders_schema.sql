-- 1. Adicionar coluna deleted_at para controle da Lixeira
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;

-- 2. Habilitar permissões de UPDATE (necessário para "Excluir" para lixeira e "Restaurar")
-- Nota: Isso permite que qualquer um com a chave anon edite. Em um app real com login de usuário, você restringiria isso.
create policy "Permitir Update para Todos (MVP)"
on public.orders
for update
to anon, authenticated
using (true)
with check (true);

-- 3. Habilitar permissões de DELETE (necessário para "Excluir Permanentemente")
create policy "Permitir Delete para Todos (MVP)"
on public.orders
for delete
to anon, authenticated
using (true);
