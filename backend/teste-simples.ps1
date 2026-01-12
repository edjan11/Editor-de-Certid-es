# ========================================
# TESTE COMPLETO DO SISTEMA
# ========================================

Write-Host "`nINICIANDO TESTES COMPLETOS..." -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# 1. HEALTHCHECK
Write-Host "1. Testando Healthcheck..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:3100/health" -Method Get
    Write-Host "OK Backend respondendo: $($health.status)" -ForegroundColor Green
} catch {
    Write-Host "ERRO no healthcheck: $_" -ForegroundColor Red
    exit 1
}

Start-Sleep -Seconds 1

# 2. CRIAR REGISTRO DE NASCIMENTO
Write-Host "`n2. Criando registro de NASCIMENTO..." -ForegroundColor Yellow

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
    Write-Host "OK - Registro criado com ID: $($result1.dados.id)" -ForegroundColor Green
} catch {
    Write-Host "ERRO ao criar registro: $_" -ForegroundColor Red
}

Write-Host "`n✅ TESTE CONCLUÍDO!" -ForegroundColor Green
