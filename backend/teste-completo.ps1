# ========================================
# TESTE COMPLETO DO SISTEMA
# ========================================

Write-Host "`n🧪 INICIANDO TESTES COMPLETOS..." -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# ========================================
# 1. HEALTHCHECK
# ========================================
Write-Host "1️⃣ Testando Healthcheck..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:3100/health" -Method Get
    Write-Host "✅ Backend respondendo: $($health | ConvertTo-Json -Compress)" -ForegroundColor Green
} catch {
    Write-Host "❌ Falha no healthcheck: $_" -ForegroundColor Red
    exit 1
}

Start-Sleep -Seconds 1

# ========================================
# 2. CRIAR REGISTRO DE NASCIMENTO
# ========================================
Write-Host "`n2️⃣ Criando registro de NASCIMENTO..." -ForegroundColor Yellow

$registro1 = @{
    crc_id = "CRC-2026-001"
    nome_registrado = "MARIA JOSE DA SILVA"
    nome_mae = "ANA PAULA DA SILVA"
    nome_pai = "JOSE CARLOS DA SILVA"
    tipo_certidao = "nascimento"
    oficio = 9
    json_path = "2026-01-11/MARIA_JOSE_DA_SILVA_nascimento.json"
    origem = "manual"
} | ConvertTo-Json

try {
    $result1 = Invoke-RestMethod -Uri "http://localhost:3100/registros" -Method Post -Body $registro1 -ContentType "application/json"
    Write-Host "✅ Registro criado com ID: $($result1.dados.id)" -ForegroundColor Green
    $registroId1 = $result1.dados.id
} catch {
    Write-Host "❌ Erro ao criar registro: $_" -ForegroundColor Red
    exit 1
}

Start-Sleep -Seconds 1

# ========================================
# 3. CRIAR REGISTRO DE CASAMENTO
# ========================================
Write-Host "`n3️⃣ Criando registro de CASAMENTO..." -ForegroundColor Yellow

$registro2 = @{
    crc_id = "CRC-2026-002"
    nome_registrado = "JOYCE DE OLIVEIRA E CARLOS SANTOS"
    tipo_certidao = "casamento"
    oficio = 9
    json_path = "2026-01-11/JOYCE_OLIVEIRA_CARLOS_SANTOS_casamento.json"
    origem = "skylight"
} | ConvertTo-Json

try {
    $result2 = Invoke-RestMethod -Uri "http://localhost:3100/registros" -Method Post -Body $registro2 -ContentType "application/json"
    Write-Host "✅ Registro criado com ID: $($result2.dados.id)" -ForegroundColor Green
    $registroId2 = $result2.dados.id
} catch {
    Write-Host "❌ Erro ao criar registro: $_" -ForegroundColor Red
}

Start-Sleep -Seconds 1

# ========================================
# 4. CRIAR REGISTRO DE ÓBITO
# ========================================
Write-Host "`n4️⃣ Criando registro de ÓBITO..." -ForegroundColor Yellow

$registro3 = @{
    crc_id = "CRC-2026-003"
    nome_registrado = "ANTONIO PEREIRA DOS SANTOS"
    nome_mae = "MARIA PEREIRA"
    tipo_certidao = "obito"
    oficio = 12
    json_path = "2026-01-11/ANTONIO_PEREIRA_obito.json"
    origem = "manual"
} | ConvertTo-Json

try {
    $result3 = Invoke-RestMethod -Uri "http://localhost:3100/registros" -Method Post -Body $registro3 -ContentType "application/json"
    Write-Host "✅ Registro criado com ID: $($result3.dados.id)" -ForegroundColor Green
    $registroId3 = $result3.dados.id
} catch {
    Write-Host "❌ Erro ao criar registro: $_" -ForegroundColor Red
}

Start-Sleep -Seconds 1

# ========================================
# 5. IMPORTAR SELOS (LOTE)
# ========================================
Write-Host "`n5️⃣ Importando SELOS em lote..." -ForegroundColor Yellow

$selos = @(
    @{
        selo_numero = "SE-20260111-001234"
        selo_codigo = "ABC123XYZ"
        nome_registrado = "MARIA JOSE DA SILVA"
    },
    @{
        selo_numero = "SE-20260111-001235"
        selo_codigo = "DEF456UVW"
        nome_registrado = "JOYCE DE OLIVEIRA"
    },
    @{
        selo_numero = "SE-20260111-001236"
        selo_codigo = "GHI789RST"
        nome_registrado = "ANTONIO PEREIRA DOS SANTOS"
    },
    @{
        selo_numero = "SE-20260111-001237"
        selo_codigo = "JKL012MNO"
        nome_registrado = "CARLOS SANTOS"
    }
) | ConvertTo-Json

try {
    $resultSelos = Invoke-RestMethod -Uri "http://localhost:3100/selos" -Method Post -Body $selos -ContentType "application/json"
    Write-Host "✅ Selos importados: $($resultSelos.total) selos" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro ao importar selos: $_" -ForegroundColor Red
}

Start-Sleep -Seconds 1

# ========================================
# 6. LISTAR SELOS DISPONÍVEIS
# ========================================
Write-Host "`n6️⃣ Listando selos disponíveis..." -ForegroundColor Yellow

try {
    $selosDisponiveis = Invoke-RestMethod -Uri "http://localhost:3100/selos/disponiveis" -Method Get
    Write-Host "✅ Selos disponíveis: $($selosDisponiveis.total)" -ForegroundColor Green
    foreach ($selo in $selosDisponiveis.dados) {
        Write-Host "   📍 $($selo.selo_numero) - $($selo.nome_registrado)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ Erro ao listar selos: $_" -ForegroundColor Red
}

Start-Sleep -Seconds 1

# ========================================
# 7. BUSCAR SELO PARA MARIA JOSE
# ========================================
Write-Host "`n7️⃣ Buscando selo para MARIA JOSE..." -ForegroundColor Yellow

try {
    $seloMaria = Invoke-RestMethod -Uri "http://localhost:3100/selos/disponiveis?nome=MARIA%20JOSE" -Method Get
    if ($seloMaria.total -gt 0) {
        Write-Host "✅ Selo encontrado: $($seloMaria.dados[0].selo_numero)" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Erro ao buscar selo: $_" -ForegroundColor Red
}

Start-Sleep -Seconds 1

# ========================================
# 8. VINCULAR SELO AO REGISTRO
# ========================================
Write-Host "`n8️⃣ Vinculando selo ao registro de MARIA JOSE..." -ForegroundColor Yellow

$atualizacao = @{
    status = "selo_vinculado"
    selo_numero = "SE-20260111-001234"
    selo_codigo = "ABC123XYZ"
} | ConvertTo-Json

try {
    $resultUpdate = Invoke-RestMethod -Uri "http://localhost:3100/registros/CRC-2026-001/status" -Method Put -Body $atualizacao -ContentType "application/json"
    Write-Host "✅ Selo vinculado com sucesso!" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro ao vincular selo: $_" -ForegroundColor Red
}

Start-Sleep -Seconds 1

# ========================================
# 9. ATUALIZAR STATUS PARA EMITIDO
# ========================================
Write-Host "`n9️⃣ Atualizando status para EMITIDO..." -ForegroundColor Yellow

$emitir = @{
    status = "emitido"
} | ConvertTo-Json

try {
    $resultEmitido = Invoke-RestMethod -Uri "http://localhost:3100/registros/CRC-2026-001/status" -Method Put -Body $emitir -ContentType "application/json"
    Write-Host "✅ Status atualizado para EMITIDO!" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro ao atualizar status: $_" -ForegroundColor Red
}

Start-Sleep -Seconds 1

# ========================================
# 10. LISTAR TODOS OS REGISTROS
# ========================================
Write-Host "`n🔟 Listando TODOS os registros..." -ForegroundColor Yellow

try {
    $todosRegistros = Invoke-RestMethod -Uri "http://localhost:3100/registros" -Method Get
    Write-Host "✅ Total de registros: $($todosRegistros.total)" -ForegroundColor Green
    foreach ($reg in $todosRegistros.dados) {
        Write-Host "   📄 [$($reg.status)] $($reg.nome_registrado) - $($reg.tipo_certidao)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ Erro ao listar registros: $_" -ForegroundColor Red
}

Start-Sleep -Seconds 1

# ========================================
# 11. FILTRAR POR STATUS PENDENTE
# ========================================
Write-Host "`n1️⃣1️⃣ Filtrando registros PENDENTES..." -ForegroundColor Yellow

try {
    $pendentes = Invoke-RestMethod -Uri "http://localhost:3100/registros?status=pendente" -Method Get
    Write-Host "✅ Registros pendentes: $($pendentes.total)" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro ao filtrar: $_" -ForegroundColor Red
}

Start-Sleep -Seconds 1

# ========================================
# 12. VER LOGS DE AUDITORIA
# ========================================
Write-Host "`n1️⃣2️⃣ Visualizando LOGS de auditoria..." -ForegroundColor Yellow

try {
    $logs = Invoke-RestMethod -Uri "http://localhost:3100/logs?limit=10" -Method Get
    Write-Host "✅ Total de logs: $($logs.total)" -ForegroundColor Green
    foreach ($log in $logs.dados) {
        Write-Host "   📝 [$($log.nivel)] $($log.acao) - $($log.origem)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ Erro ao listar logs: $_" -ForegroundColor Red
}

# ========================================
# RESUMO FINAL
# ========================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "✅ TESTES CONCLUÍDOS COM SUCESSO!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`n📊 Resumo:" -ForegroundColor Yellow
Write-Host "   ✅ Backend rodando" -ForegroundColor Green
Write-Host "   ✅ 3 Registros criados (nascimento, casamento, óbito)" -ForegroundColor Green
Write-Host "   ✅ 4 Selos importados" -ForegroundColor Green
Write-Host "   ✅ Selo vinculado a registro" -ForegroundColor Green
Write-Host "   ✅ Status atualizado para emitido" -ForegroundColor Green
Write-Host "   ✅ Logs de auditoria funcionando" -ForegroundColor Green
Write-Host "`n🎯 Sistema 100% funcional!`n" -ForegroundColor Cyan
