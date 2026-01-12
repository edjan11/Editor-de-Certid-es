-- ============================================
-- SCHEMA: Sistema de Certidões CRC/TJSE
-- Postgres 14+ (Neon.tech)
-- ============================================

-- Tabela principal: registros de serviços
CREATE TABLE IF NOT EXISTS registros (
    id SERIAL PRIMARY KEY,
    
    -- Identificadores externos
    crc_id VARCHAR(50) UNIQUE NOT NULL,  -- ID do pedido na CRC
    termo VARCHAR(20),                    -- Termo do livro
    
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
    -- valores: pendente, selo_vinculado, emitido, impresso, erro
    
    -- Metadados
    tipo_certidao VARCHAR(20) NOT NULL,  -- nascimento, casamento, obito
    oficio INTEGER NOT NULL,             -- 6, 9, 12, 13, 14, 15
    json_path VARCHAR(500),              -- caminho do JSON salvo pelo UserScript
    
    -- Auditoria
    criado_em TIMESTAMP NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Índices para buscas rápidas
    CONSTRAINT check_status CHECK (status IN ('pendente', 'selo_vinculado', 'emitido', 'impresso', 'erro')),
    CONSTRAINT check_tipo CHECK (tipo_certidao IN ('nascimento', 'casamento', 'obito'))
);

CREATE INDEX idx_registros_crc_id ON registros(crc_id);
CREATE INDEX idx_registros_status ON registros(status);
CREATE INDEX idx_registros_criado_em ON registros(criado_em DESC);


-- Tabela de selos disponíveis (estoque do TJ)
CREATE TABLE IF NOT EXISTS selos_disponiveis (
    id SERIAL PRIMARY KEY,
    
    -- Dados do selo
    selo_numero VARCHAR(50) NOT NULL,
    selo_codigo VARCHAR(50) NOT NULL,
    
    -- Dados do registrado (para validação)
    nome_registrado VARCHAR(200) NOT NULL,
    data_nascimento VARCHAR(20),
    tipo_certidao VARCHAR(20),
    
    -- Controle de uso
    usado BOOLEAN NOT NULL DEFAULT FALSE,
    usado_em TIMESTAMP,
    usado_por_registro_id INTEGER REFERENCES registros(id),
    
    -- Metadados
    importado_em TIMESTAMP NOT NULL DEFAULT NOW(),
    
    CONSTRAINT unique_selo UNIQUE(selo_numero, selo_codigo)
);

CREATE INDEX idx_selos_disponiveis_usado ON selos_disponiveis(usado);
CREATE INDEX idx_selos_nome ON selos_disponiveis(nome_registrado);


-- Tabela de logs (rastreabilidade total)
CREATE TABLE IF NOT EXISTS logs (
    id SERIAL PRIMARY KEY,
    
    -- Timestamp preciso
    timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Referência ao registro (pode ser NULL para logs gerais)
    registro_id INTEGER REFERENCES registros(id) ON DELETE SET NULL,
    
    -- Tipo de ação
    acao VARCHAR(50) NOT NULL,
    -- valores: registro_criado, selo_vinculado, certidao_emitida, erro_validacao, etc
    
    -- Detalhes em JSON (flexível mas rastreável)
    detalhes JSONB,
    
    -- Origem da ação
    origem VARCHAR(50) NOT NULL,
    -- valores: skylight, playwright, backend, manual
    
    -- Nível de severidade
    nivel VARCHAR(20) NOT NULL DEFAULT 'info',
    -- valores: debug, info, warning, error, critical
    
    CONSTRAINT check_nivel CHECK (nivel IN ('debug', 'info', 'warning', 'error', 'critical'))
);

CREATE INDEX idx_logs_timestamp ON logs(timestamp DESC);
CREATE INDEX idx_logs_registro_id ON logs(registro_id);
CREATE INDEX idx_logs_acao ON logs(acao);
CREATE INDEX idx_logs_nivel ON logs(nivel);


-- Trigger para atualizar 'atualizado_em' automaticamente
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


-- View útil: registros pendentes com selo disponível
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


-- Comentários para documentação (aparece em ferramentas de DB)
COMMENT ON TABLE registros IS 'Registros de serviços de 2ª via CRC/TJSE';
COMMENT ON TABLE selos_disponiveis IS 'Estoque de selos do TJ aguardando uso';
COMMENT ON TABLE logs IS 'Log rastreável de todas as operações do sistema';
COMMENT ON COLUMN registros.status IS 'pendente | selo_vinculado | emitido | impresso | erro';
COMMENT ON COLUMN logs.origem IS 'skylight | playwright | backend | manual';
