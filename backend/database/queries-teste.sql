-- =============================================
-- QUERIES SQL PARA TESTE MANUAL NO NEON
-- Execute no SQL Editor: https://console.neon.tech
-- =============================================

-- 1. CRIAR REGISTRO DE NASCIMENTO
INSERT INTO registros (
    crc_id, nome_registrado, nome_mae, nome_pai,
    tipo_certidao, oficio, json_path, status, criado_em, atualizado_em
) VALUES (
    'CRC-2026-001',
    'MARIA JOSE DA SILVA',
    'ANA PAULA DA SILVA',
    'JOSE CARLOS DA SILVA',
    'nascimento',
    9,
    '2026-01-11/MARIA_JOSE_DA_SILVA_nascimento.json',
    'pendente',
    NOW(),
    NOW()
);

-- 2. CRIAR REGISTRO DE CASAMENTO
INSERT INTO registros (
    crc_id, nome_registrado, tipo_certidao, oficio,
    json_path, status, criado_em, atualizado_em
) VALUES (
    'CRC-2026-002',
    'JOYCE DE OLIVEIRA E CARLOS SANTOS',
    'casamento',
    9,
    '2026-01-11/JOYCE_OLIVEIRA_CARLOS_SANTOS_casamento.json',
    'pendente',
    NOW(),
    NOW()
);

-- 3. CRIAR REGISTRO DE ÓBITO
INSERT INTO registros (
    crc_id, nome_registrado, nome_mae, tipo_certidao,
    oficio, json_path, status, criado_em, atualizado_em
) VALUES (
    'CRC-2026-003',
    'ANTONIO PEREIRA DOS SANTOS',
    'MARIA PEREIRA',
    'obito',
    12,
    '2026-01-11/ANTONIO_PEREIRA_obito.json',
    'pendente',
    NOW(),
    NOW()
);

-- 4. IMPORTAR SELOS
INSERT INTO selos_disponiveis (selo_numero, selo_codigo, nome_registrado, usado) VALUES
('SE-20260111-001234', 'ABC123XYZ', 'MARIA JOSE DA SILVA', false),
('SE-20260111-001235', 'DEF456UVW', 'JOYCE DE OLIVEIRA', false),
('SE-20260111-001236', 'GHI789RST', 'ANTONIO PEREIRA DOS SANTOS', false),
('SE-20260111-001237', 'JKL012MNO', 'CARLOS SANTOS', false);

-- 5. BUSCAR SELOS DISPONÍVEIS
SELECT * FROM selos_disponiveis WHERE usado = false;

-- 6. BUSCAR SELO POR NOME (exemplo: MARIA JOSE)
SELECT * FROM selos_disponiveis 
WHERE usado = false 
AND nome_registrado ILIKE '%MARIA JOSE%';

-- 7. VINCULAR SELO AO REGISTRO
UPDATE registros 
SET 
    selo_numero = 'SE-20260111-001234',
    selo_codigo = 'ABC123XYZ',
    selo_vinculado_em = NOW(),
    status = 'selo_vinculado',
    atualizado_em = NOW()
WHERE crc_id = 'CRC-2026-001';

-- 8. MARCAR SELO COMO USADO
UPDATE selos_disponiveis
SET 
    usado = true,
    usado_em = NOW()
WHERE selo_numero = 'SE-20260111-001234';

-- 9. ATUALIZAR STATUS PARA EMITIDO
UPDATE registros 
SET 
    status = 'emitido',
    atualizado_em = NOW()
WHERE crc_id = 'CRC-2026-001';

-- 10. GRAVAR LOG
INSERT INTO logs (registro_id, acao, detalhes, origem, nivel, timestamp) 
SELECT 
    id,
    'certidao_emitida',
    '{"automatico": false, "selo": "SE-20260111-001234"}',
    'manual',
    'info',
    NOW()
FROM registros 
WHERE crc_id = 'CRC-2026-001';

-- =============================================
-- QUERIES DE CONSULTA
-- =============================================

-- VER TODOS OS REGISTROS
SELECT id, crc_id, nome_registrado, tipo_certidao, status, selo_numero
FROM registros
ORDER BY criado_em DESC;

-- VER REGISTROS PENDENTES
SELECT * FROM registros WHERE status = 'pendente';

-- VER REGISTROS COM SELO VINCULADO
SELECT * FROM registros WHERE status = 'selo_vinculado';

-- VER REGISTROS EMITIDOS
SELECT * FROM registros WHERE status = 'emitido';

-- VER SELOS DISPONÍVEIS
SELECT * FROM selos_disponiveis WHERE usado = false;

-- VER SELOS USADOS
SELECT * FROM selos_disponiveis WHERE usado = true;

-- VER LOGS
SELECT 
    l.timestamp,
    r.crc_id,
    r.nome_registrado,
    l.acao,
    l.origem,
    l.nivel
FROM logs l
JOIN registros r ON l.registro_id = r.id
ORDER BY l.timestamp DESC
LIMIT 20;

-- ESTATÍSTICAS GERAIS
SELECT 
    status,
    COUNT(*) as total
FROM registros
GROUP BY status;

-- ESTATÍSTICAS POR TIPO
SELECT 
    tipo_certidao,
    COUNT(*) as total
FROM registros
GROUP BY tipo_certidao;

-- ESTATÍSTICAS POR OFÍCIO
SELECT 
    oficio,
    COUNT(*) as total
FROM registros
GROUP BY oficio
ORDER BY oficio;

-- =============================================
-- QUERIES AVANÇADAS
-- =============================================

-- REGISTROS PENDENTES COM SELO DISPONÍVEL (usando a VIEW)
SELECT * FROM v_pendentes_com_selo;

-- REGISTROS SEM SELO COMPATÍVEL
SELECT r.* 
FROM registros r
LEFT JOIN selos_disponiveis s ON s.nome_registrado ILIKE '%' || SPLIT_PART(r.nome_registrado, ' ', 1) || '%'
    AND s.usado = false
WHERE r.status = 'pendente'
AND s.id IS NULL;

-- TEMPO MÉDIO ENTRE CRIAÇÃO E EMISSÃO
SELECT 
    AVG(EXTRACT(EPOCH FROM (atualizado_em - criado_em))/3600) as horas_media
FROM registros
WHERE status = 'emitido';

-- REGISTROS CRIADOS HOJE
SELECT * FROM registros
WHERE DATE(criado_em) = CURRENT_DATE
ORDER BY criado_em DESC;

-- =============================================
-- LIMPEZA (use com cuidado!)
-- =============================================

-- Deletar todos os registros de teste (CUIDADO!)
-- DELETE FROM registros WHERE crc_id LIKE 'CRC-2026-%';

-- Deletar todos os selos de teste (CUIDADO!)
-- DELETE FROM selos_disponiveis WHERE selo_numero LIKE 'SE-20260111-%';

-- Deletar todos os logs (CUIDADO!)
-- DELETE FROM logs WHERE origem = 'manual';
