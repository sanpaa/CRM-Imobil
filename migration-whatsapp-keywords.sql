-- Migration: Add has_keywords column to whatsapp_messages table
-- This column stores whether a message contains real estate related keywords
-- Run this SQL in your Supabase dashboard

-- Add has_keywords column to whatsapp_messages table
ALTER TABLE whatsapp_messages 
ADD COLUMN IF NOT EXISTS has_keywords BOOLEAN DEFAULT false;

-- Create index for filtering by has_keywords
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_keywords 
ON whatsapp_messages(company_id, has_keywords, is_group, is_from_me);

-- Update existing messages to set has_keywords based on content
-- NOTE: This regex must be kept in sync with keywords in WhatsAppService.js
-- If you update keywords in the code, update this regex pattern as well
-- Current keywords: imóvel, imovel, interessado, interessada, preço, preco, visita,
--                  aluguel, alugar, compra, comprar, vender, venda, fotos, foto,
--                  disponível, disponivel, valor, orçamento, orcamento, apartamento,
--                  apto, ap, casa, condomínio, condominio, condições, condicoes
UPDATE whatsapp_messages
SET has_keywords = (
    LOWER(body) ~ 'imóvel|imovel|interessado|interessada|preço|preco|visita|aluguel|alugar|compra|comprar|vender|venda|fotos|foto|disponível|disponivel|valor|orçamento|orcamento|apartamento|apto|ap|casa|condomínio|condominio|condições|condicoes'
)
WHERE body IS NOT NULL;

COMMENT ON COLUMN whatsapp_messages.has_keywords IS 'Indica se a mensagem contém palavras-chave relacionadas a imóveis';
