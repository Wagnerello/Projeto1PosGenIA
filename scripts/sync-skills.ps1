# Script Bidirecional de Sincronizacao de Skills (Wagnerello)
$ErrorActionPreference = "Stop"
$skillsPath = "C:\Users\wagne\.gemini\config\skills"

if (-not (Test-Path $skillsPath)) {
    New-Item -ItemType Directory -Path $skillsPath -Force | Out-Null
}

Set-Location $skillsPath

# 1. Inicializa o Git se necessario
if (-not (Test-Path "$skillsPath\.git")) {
    Write-Host "[1/5] Inicializando repositorio Git..." -ForegroundColor Yellow
    git init
    git branch -M main
    git remote add origin https://github.com/Wagnerello/minhas-ai-skills.git
}

# 2. Baixa atualizacoes remotas
Write-Host "[2/5] Baixando novidades do GitHub..." -ForegroundColor Cyan
try {
    git pull origin main --allow-unrelated-histories --no-edit
} catch {
    Write-Host "Aviso no git pull: $_" -ForegroundColor Yellow
}

# 3. Protecao contra aninhamento duplicado (skills/skills)
if (Test-Path "$skillsPath\skills") {
    Write-Host "[3/5] Detectada subpasta duplicada 'skills'. Desaninhando..." -ForegroundColor Yellow
    Get-ChildItem -Path "$skillsPath\skills" -Directory | ForEach-Object {
        $dest = Join-Path $skillsPath $_.Name
        if (-not (Test-Path $dest)) {
            Move-Item -Path $_.FullName -Destination $skillsPath -Force
        }
    }
    Remove-Item -Path "$skillsPath\skills" -Recurse -Force -ErrorAction SilentlyContinue
    git rm -r -f --ignore-unmatch skills 2>$null
}

# 4. Atualiza o Catalogo completo no README.md
$catalogScript = Join-Path (Split-Path $skillsPath -Parent) "generate_catalog.py"
if (Test-Path $catalogScript) {
    Write-Host "[4/5] Atualizando Catalogo de Skills no README.md..." -ForegroundColor Cyan
    python $catalogScript
}

# 5. Adiciona, commita e envia alteracoes
Write-Host "[5/5] Sincronizando com o GitHub..." -ForegroundColor Cyan
git add -A

$status = git status --porcelain
$skillsCount = (Get-ChildItem -Path $skillsPath -Directory | Where-Object { $_.Name -ne '.git' -and $_.Name -ne 'skills' }).Count

if ($status) {
    $now = Get-Date -Format "dd/MM/yyyy HH:mm:ss"
    $hostName = $env:COMPUTERNAME
    $commitMsg = "sync: $skillsCount skills ativas - atualizado em $now [$hostName]"
    
    git commit -m $commitMsg
    git push origin main
    Write-Host "Novidades locais enviadas com sucesso para o GitHub!" -ForegroundColor Green
} else {
    Write-Host "Nenhuma alteracao pendente para envio." -ForegroundColor Yellow
}

Write-Host "========================================================" -ForegroundColor Green
Write-Host "Sincronizacao Bidirecional Concluida com Sucesso!" -ForegroundColor Green
Write-Host "Total de Skills ativas lidas pelo Antigravity: $skillsCount" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
