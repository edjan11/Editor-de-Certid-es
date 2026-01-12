-- =============================================
-- PASSO 1: CRIAR AS TABELAS (EXECUTE ISSO PRIMEIRO!)
-- =============================================

-- Tabela principal: registros de serviços
CREATE TABLE IF NOT EXISTS registros (
    id SERIAL PRIMARY KEY,
    
    -- Identificadores externos
    crc_id VARCHAR(50) UNIQUE NOT NULL,
    termo VARCHAR(20),
    
    -- Dados do registrado
    nome_registrado VARCHAR(200) NOT NULL,
    nome_mae VARCHAR(200),
    nome_pai VARCHAR(200),
    data_nascimento DATE,
    
    -- Selo do TJ
    selo_numero VARCHAR(50),
    selo_codigo VARCHAR(50),
    selo_vinculado_em TIMESTAMP,
    
    -- Controle de status
    status VARCHAR(30) NOT NULL DEFAULT 'pendente',
    
    -- Metadados
    tipo_certidao VARCHAR(20) NOT NULL,
    oficio INTEGER NOT NULL,
    json_path VARCHAR(500),
    
    -- Auditoria
    criado_em TIMESTAMP NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMP NOT NULL DEFAULT NOW(),
    
    CONSTRAINT check_status CHECK (status IN ('pendente', 'selo_vinculado', 'emitido', 'impresso', 'erro')),
    CONSTRAINT check_tipo CHECK (tipo_certidao IN ('nascimento', 'casamento', 'obito'))
);

CREATE INDEX idx_registros_crc_id ON registros(crc_id);
CREATE INDEX idx_registros_status ON registros(status);
CREATE INDEX idx_registros_criado_em ON registros(criado_em DESC);

-- Tabela de selos disponíveis
CREATE TABLE IF NOT EXISTS selos_disponiveis (
    id SERIAL PRIMARY KEY,
    
    selo_numero VARCHAR(50) NOT NULL,
    selo_codigo VARCHAR(50) NOT NULL,
    nome_registrado VARCHAR(200) NOT NULL,
    data_nascimento VARCHAR(20),
    tipo_certidao VARCHAR(20),
    
    usado BOOLEAN NOT NULL DEFAULT FALSE,
    usado_em TIMESTAMP,
    usado_por_registro_id INTEGER REFERENCES registros(id),
    
    importado_em TIMESTAMP NOT NULL DEFAULT NOW(),
    
    CONSTRAINT unique_selo UNIQUE(selo_numero, selo_codigo)
);

CREATE INDEX idx_selos_disponiveis_usado ON selos_disponiveis(usado);
CREATE INDEX idx_selos_nome ON selos_disponiveis(nome_registrado);

-- Tabela de logs
CREATE TABLE IF NOT EXISTS logs (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
    registro_id INTEGER REFERENCES registros(id) ON DELETE SET NULL,
    acao VARCHAR(50) NOT NULL,
    detalhes JSONB,
    origem VARCHAR(50) NOT NULL,
    nivel VARCHAR(20) NOT NULL DEFAULT 'info',
    
    CONSTRAINT check_nivel CHECK (nivel IN ('debug', 'info', 'warning', 'error', 'critical'))
);

CREATE INDEX idx_logs_timestamp ON logs(timestamp DESC);
CREATE INDEX idx_logs_registro_id ON logs(registro_id);

-- Trigger para atualizar 'atualizado_em'
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_registros_modtime
    BEFORE UPDATE ON registros
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- View útil
CREATE OR REPLACE VIEW v_pendentes_com_selo AS
SELECT 
    r.id,
    r.crc_id,
    r.nome_registrado,
    r.status,
    s.selo_numero,
    s.selo_codigo,
    r.criado_em
FROM registros r
LEFT JOIN selos_disponiveis s 
    ON LOWER(s.nome_registrado) LIKE LOWER(r.nome_registrado || '%')
    AND s.usado = FALSE
WHERE r.status = 'pendente'
ORDER BY r.criado_em ASC;

-- =============================================
-- PASSO 2: INSERIR DADOS DE TESTE
-- =============================================

-- Criar 3 registros
INSERT INTO registros (crc_id, nome_registrado, nome_mae, nome_pai, tipo_certidao, oficio, json_path, status, criado_em, atualizado_em)
VALUES 
('CRC-2026-001', 'MARIA JOSE DA SILVA', 'ANA PAULA DA SILVA', 'JOSE CARLOS DA SILVA', 'nascimento', 9, '2026-01-11/MARIA_JOSE_DA_SILVA_nascimento.json', 'pendente', NOW(), NOW()),
('CRC-2026-002', 'JOYCE DE OLIVEIRA E CARLOS SANTOS', NULL, NULL, 'casamento', 9, '2026-01-11/JOYCE_OLIVEIRA_CARLOS_SANTOS_casamento.json', 'pendente', NOW(), NOW()),
('CRC-2026-003', 'ANTONIO PEREIRA DOS SANTOS', 'MARIA PEREIRA', NULL, 'obito', 12, '2026-01-11/ANTONIO_PEREIRA_obito.json', 'pendente', NOW(), NOW());

-- Criar 4 selos
INSERT INTO selos_disponiveis (selo_numero, selo_codigo, nome_registrado, usado)
VALUES
('SE-20260111-001234', 'ABC123XYZ', 'MARIA JOSE DA SILVA', false),
('SE-20260111-001235', 'DEF456UVW', 'JOYCE DE OLIVEIRA', false),
('SE-20260111-001236', 'GHI789RST', 'ANTONIO PEREIRA DOS SANTOS', false),
('SE-20260111-001237', 'JKL012MNO', 'CARLOS SANTOS', false);

-- =============================================
-- PASSO 3: VERIFICAR OS DADOS
-- =============================================

SELECT 'REGISTROS CRIADOS:' as mensagem;
SELECT id, crc_id, nome_registrado, tipo_certidao, status FROM registros;

SELECT 'SELOS DISPONIVEIS:' as mensagem;
SELECT id, selo_numero, selo_codigo, nome_registrado, usado FROM selos_disponiveis;

-- =============================================
-- PASSO 4: TESTAR OPERAÇÕES
-- =============================================

-- Buscar selo para MARIA JOSE
SELECT * FROM selos_disponiveis 
WHERE usado = false 
AND nome_registrado ILIKE '%MARIA JOSE%';

-- Vincular selo ao registro
UPDATE registros 
SET 
    selo_numero = 'SE-20260111-001234',
    selo_codigo = 'ABC123XYZ',
    selo_vinculado_em = NOW(),
    status = 'selo_vinculado',
    atualizado_em = NOW()
WHERE crc_id = 'CRC-2026-001';

-- Marcar selo como usado
UPDATE selos_disponiveis
SET 
    usado = true,
    usado_em = NOW()
WHERE selo_numero = 'SE-20260111-001234';

-- Verificar resultado
SELECT id, crc_id, nome_registrado, status, selo_numero FROM registros WHERE crc_id = 'CRC-2026-001';

-- =============================================
-- PASSO 5: ESTATÍSTICAS
-- =============================================

SELECT 'RESUMO POR STATUS:' as mensagem;
SELECT status, COUNT(*) as total FROM registros GROUP BY status;

SELECT 'RESUMO POR TIPO:' as mensagem;
SELECT tipo_certidao, COUNT(*) as total FROM registros GROUP BY tipo_certidao;

SELECT 'SELOS USADOS vs DISPONIVEIS:' as mensagem;
SELECT usado, COUNT(*) as total FROM selos_disponiveis GROUP BY usado;
