-- ============================================
-- SQL CRÍTICO - EXECUTAR NO SUPABASE ANTES DO DEPLOY
-- ============================================

-- 1. Verificar se a coluna company_id existe na tabela users
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users' 
  AND column_name = 'company_id';

-- 2. Se não existir, criar a coluna (OBRIGATÓRIO)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);

-- 3. Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);

-- 4. Verificar usuário específico do problema
SELECT 
    id, 
    username, 
    email, 
    company_id,
    created_at
FROM users 
WHERE id = 'dcffbe62-4247-4e6d-98dc-50097c0d6a64';

-- 5. Atualizar company_id do usuário (se estiver NULL)
-- IMPORTANTE: Substitua o company_id pelo correto
UPDATE users 
SET company_id = '3b1bee0c-cbee-4de1-88f1-d6e890f4c995' 
WHERE id = 'dcffbe62-4247-4e6d-98dc-50097c0d6a64'
  AND company_id IS NULL;

-- 6. Verificar se há outros usuários sem company_id
SELECT 
    id, 
    username, 
    email
FROM users 
WHERE company_id IS NULL;

-- 7. Verificar se a company existe
SELECT 
    id,
    name,
    created_at
FROM companies
WHERE id = '3b1bee0c-cbee-4de1-88f1-d6e890f4c995';

-- 8. (OPCIONAL) Se precisar criar a company
/*
INSERT INTO companies (id, name, domain, active)
VALUES (
    '3b1bee0c-cbee-4de1-88f1-d6e890f4c995',
    'Nome da Empresa',
    'dominio.com.br',
    true
);
*/

-- 9. Verificar integridade dos dados
SELECT 
    u.id as user_id,
    u.username,
    u.company_id,
    c.name as company_name
FROM users u
LEFT JOIN companies c ON u.company_id = c.id
WHERE u.id = 'dcffbe62-4247-4e6d-98dc-50097c0d6a64';

-- ============================================
-- VALIDAÇÃO FINAL
-- ============================================

-- Deve retornar 1 linha com company_id preenchido
SELECT COUNT(*) as users_with_company
FROM users
WHERE id = 'dcffbe62-4247-4e6d-98dc-50097c0d6a64'
  AND company_id IS NOT NULL;

-- Se retornar 0, o problema persiste!

-- ============================================
-- COMANDOS ÚTEIS PARA DEBUG
-- ============================================

-- Ver todas as conexões WhatsApp
SELECT 
    wc.id,
    wc.company_id,
    wc.user_id,
    wc.phone_number,
    wc.is_connected,
    wc.last_connected_at,
    u.username,
    c.name as company_name
FROM whatsapp_connections wc
LEFT JOIN users u ON wc.user_id = u.id
LEFT JOIN companies c ON wc.company_id = c.id
ORDER BY wc.created_at DESC;

-- Ver mensagens recentes
SELECT 
    wm.id,
    wm.company_id,
    wm.from_number,
    wm.to_number,
    wm.body,
    wm.contact_name,
    wm.timestamp
FROM whatsapp_messages wm
WHERE wm.company_id = '3b1bee0c-cbee-4de1-88f1-d6e890f4c995'
ORDER BY wm.timestamp DESC
LIMIT 10;
