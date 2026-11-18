<#
.SYNOPSIS
    ApexCommerce - Worldwide AWS Deployment Automation Script
.DESCRIPTION
    Automates the complete deployment of ApexCommerce to AWS across Global CloudFront CDN,
    Application Load Balancer (ALB), ECS Fargate, Amazon RDS PostgreSQL, and S3.
#>

param (
    [Parameter(Position = 0)]
    [ValidateSet("all", "infra", "build-push", "refresh-ecs", "status", "destroy", "help")]
    [string]$Action = "all"
)

$ErrorActionPreference = "Stop"
$ScriptRoot = $PSScriptRoot

# ANSI Colors for Clean Terminal Output
function Write-Header ($text) {
    Write-Host "`n========================================================" -ForegroundColor Cyan
    Write-Host "  $text" -ForegroundColor Cyan
    Write-Host "========================================================`n" -ForegroundColor Cyan
}

function Write-Success ($text) {
    Write-Host "[✓] $text" -ForegroundColor Green
}

function Write-Info ($text) {
    Write-Host "[i] $text" -ForegroundColor Yellow
}

function Write-Err ($text) {
    Write-Host "[✗] $text" -ForegroundColor Red
}

# Load credentials from .env.aws if present
$envAwsPath = Join-Path $ScriptRoot ".env.aws"
if (Test-Path $envAwsPath) {
    Get-Content $envAwsPath | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#") -and $line.Contains("=")) {
            $parts = $line.Split("=", 2)
            $key = $parts[0].Trim()
            $val = $parts[1].Trim()
            [System.Environment]::SetEnvironmentVariable($key, $val, "Process")
        }
    }
}

# 1. Resolve Terraform Executable
$TerraformExe = Join-Path $ScriptRoot "bin\terraform.exe"
if (-not (Test-Path $TerraformExe)) {
    $foundTf = Get-Command terraform -ErrorAction SilentlyContinue
    if ($foundTf) {
        $TerraformExe = $foundTf.Source
    }
    else {
        Write-Err "Terraform executable not found at bin\terraform.exe or in PATH!"
        exit 1
    }
}

# 2. Check Prerequisites
function Check-Prerequisites {
    Write-Header "Checking Cloud Deployment Prerequisites"

    # Check AWS Credentials
    if ($env:AWS_ACCESS_KEY_ID -and $env:AWS_SECRET_ACCESS_KEY) {
        Write-Success "AWS Access Key configured: $($env:AWS_ACCESS_KEY_ID.Substring(0, 8))... (Region: $env:AWS_REGION)"
    }
    else {
        Write-Err "AWS credentials not detected in .env.aws or environment variables."
        exit 1
    }

    # Check AWS CLI
    $foundAws = Get-Command aws -ErrorAction SilentlyContinue
    if (-not $foundAws) {
        $standardAwsPath = "$env:ProgramFiles\Amazon\AWSCLIV2\aws.exe"
        if (Test-Path $standardAwsPath) {
            $env:Path += ";$env:ProgramFiles\Amazon\AWSCLIV2"
            $foundAws = Get-Command aws -ErrorAction SilentlyContinue
        }
    }

    if (-not $foundAws) {
        if ($Action -eq "infra") {
            Write-Info "AWS CLI not found in PATH, but Terraform has direct access via AWS API keys."
        }
        else {
            Write-Err "AWS CLI is required to push Docker images to Amazon ECR."
            Write-Info "Install AWS CLI using winget:  winget install Amazon.AWSCLI"
            Write-Info "Or download official MSI:     https://awscli.amazonaws.com/AWSCLIV2.msi"
            exit 1
        }
    }
    else {
        Write-Success "AWS CLI is installed: $(& aws --version)"
    }

    # Check Docker (needed for container builds)
    if ($Action -ne "infra" -and $Action -ne "status") {
        $foundDocker = Get-Command docker -ErrorAction SilentlyContinue
        if (-not $foundDocker) {
            Write-Err "Docker is not installed or not in PATH."
            exit 1
        }
        try {
            docker info > $null 2>&1
            Write-Success "Docker engine is running."
        }
        catch {
            Write-Err "Docker Desktop is not currently running. Please launch Docker Desktop and retry."
            exit 1
        }
    }

    Write-Success "Terraform binary detected: $TerraformExe"
}

# 3. Deploy Infrastructure (Terraform)
function Deploy-Infrastructure {
    Write-Header "Step 1: Provisioning Worldwide AWS Infrastructure with Terraform"
    Push-Location (Join-Path $ScriptRoot "terraform")
    try {
        Write-Info "Initializing Terraform AWS Provider & Modules..."
        & $TerraformExe init
        if ($LASTEXITCODE -ne 0) {
            Write-Err "Terraform init failed."
            exit $LASTEXITCODE
        }

        # Unblock downloaded provider executables for Windows execution policy
        Get-ChildItem -Path ".terraform" -Recurse -Filter "*.exe" -ErrorAction SilentlyContinue | ForEach-Object {
            Unblock-File $_.FullName
        }

        Write-Info "Executing Terraform Plan..."
        & $TerraformExe plan -out=tfplan
        if ($LASTEXITCODE -ne 0) {
            Write-Err "Terraform plan failed."
            exit $LASTEXITCODE
        }

        Write-Info "Applying Infrastructure (VPC, Multi-AZ Subnets, ALB, ECS, RDS, S3, CloudFront CDN)..."
        & $TerraformExe apply tfplan
        if ($LASTEXITCODE -ne 0) {
            Write-Err "Terraform apply failed."
            exit $LASTEXITCODE
        }

        Write-Success "Infrastructure provisioned successfully!"
    }
    finally {
        Pop-Location
    }
}

# 4. Build and Push Container Images to Amazon ECR
function Build-And-Push-Containers {
    Write-Header "Step 2: Building and Pushing Docker Containers to Amazon ECR"

    Push-Location (Join-Path $ScriptRoot "terraform")
    try {
        $albDns = (& $TerraformExe output -raw alb_dns_name).Trim()
        $backendRepo = (& $TerraformExe output -raw ecr_backend_repository_url).Trim()
        $frontendRepo = (& $TerraformExe output -raw ecr_frontend_repository_url).Trim()
        $awsRegion = if ($env:AWS_REGION) { $env:AWS_REGION } else { "ap-south-1" }
    }
    finally {
        Pop-Location
    }

    $identity = aws sts get-caller-identity --output json | ConvertFrom-Json
    $accountId = $identity.Account

    Write-Info "Logging into Amazon ECR ($backendRepo)..."
    aws ecr get-login-password --region $awsRegion | docker login --username AWS --password-stdin "$accountId.dkr.ecr.$awsRegion.amazonaws.com"

    # Backend Build & Push
    Write-Info "Building Backend Production Docker Image..."
    Push-Location (Join-Path $ScriptRoot "backend")
    try {
        docker build -t "$backendRepo`:latest" .
        Write-Info "Pushing Backend Image to ECR..."
        docker push "$backendRepo`:latest"
        Write-Success "Backend container deployed to ECR!"
    }
    finally {
        Pop-Location
    }

    # Frontend Build & Push
    Write-Info "Building Frontend Next.js Production Docker Image..."
    Push-Location (Join-Path $ScriptRoot "frontend")
    try {
        $apiUrl = "http://$albDns/api"
        docker build `
            --build-arg NEXT_PUBLIC_API_URL="$apiUrl" `
            --build-arg NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_placeholder" `
            --build-arg NEXT_PUBLIC_SITE_NAME="ApexCommerce" `
            -t "$frontendRepo`:latest" .
        Write-Info "Pushing Frontend Image to ECR..."
        docker push "$frontendRepo`:latest"
        Write-Success "Frontend container deployed to ECR!"
    }
    finally {
        Pop-Location
    }
}

# 5. Refresh ECS Fargate Services
function Refresh-ECS-Services {
    Write-Header "Step 3: Rolling out Container Services on ECS Fargate"

    Push-Location (Join-Path $ScriptRoot "terraform")
    try {
        $clusterName = (& $TerraformExe output -raw ecs_cluster_name).Trim()
    }
    finally {
        Pop-Location
    }

    Write-Info "Triggering zero-downtime deployment on Backend service..."
    aws ecs update-service --cluster $clusterName --service apex-backend-service --force-new-deployment | Out-Null
    Write-Success "Backend ECS service updated."

    Write-Info "Triggering zero-downtime deployment on Frontend service..."
    aws ecs update-service --cluster $clusterName --service apex-frontend-service --force-new-deployment | Out-Null
    Write-Success "Frontend ECS service updated."
}

# 6. Display Status and Global URLs
function Show-Status {
    Write-Header "ApexCommerce Worldwide AWS Endpoints"

    Push-Location (Join-Path $ScriptRoot "terraform")
    try {
        $worldwideUrl = (& $TerraformExe output -raw worldwide_website_url).Trim()
        $albDns = (& $TerraformExe output -raw alb_dns_name).Trim()
        $albUrl = (& $TerraformExe output -raw public_website_url).Trim()
        $imagesCdn = (& $TerraformExe output -raw cloudfront_url).Trim()
        $rds = (& $TerraformExe output -raw rds_endpoint).Trim()
        $s3 = (& $TerraformExe output -raw s3_bucket_name).Trim()
        $cluster = (& $TerraformExe output -raw ecs_cluster_name).Trim()

        Write-Host "🌐 Worldwide CloudFront CDN URL:   $worldwideUrl" -ForegroundColor Cyan -BackgroundColor Black
        Write-Host "   (Accelerated across 400+ Edge Locations globally with HTTPS)`n"
        Write-Host "⚖️ ALB Public Direct URL:         $albUrl" -ForegroundColor White
        Write-Host "🖼️ S3 Media CloudFront CDN:        $imagesCdn" -ForegroundColor White
        Write-Host "🗄️ AWS RDS PostgreSQL:            $rds" -ForegroundColor White
        Write-Host "📦 Amazon S3 Bucket:              $s3" -ForegroundColor White
        Write-Host "🚀 Amazon ECS Fargate Cluster:    $cluster" -ForegroundColor White
        Write-Host "`nDefault Admin Login:" -ForegroundColor Yellow
        Write-Host "  Email:    admin@example.com"
        Write-Host "  Password: Admin@123456"
        Write-Host "  URL:      $worldwideUrl/admin"
    }
    catch {
        Write-Err "Could not retrieve Terraform outputs. Has the infrastructure been deployed yet?"
    }
    finally {
        Pop-Location
    }
}

# 7. Destroy Infrastructure
function Destroy-Infrastructure {
    Write-Header "Destroying AWS Infrastructure"
    Push-Location (Join-Path $ScriptRoot "terraform")
    try {
        & $TerraformExe destroy
    }
    finally {
        Pop-Location
    }
}

# Execution Flow
switch ($Action) {
    "all" {
        Check-Prerequisites
        Deploy-Infrastructure
        Build-And-Push-Containers
        Refresh-ECS-Services
        Show-Status
    }
    "infra" {
        Check-Prerequisites
        Deploy-Infrastructure
        Show-Status
    }
    "build-push" {
        Check-Prerequisites
        Build-And-Push-Containers
    }
    "refresh-ecs" {
        Check-Prerequisites
        Refresh-ECS-Services
    }
    "status" {
        Show-Status
    }
    "destroy" {
        Destroy-Infrastructure
    }
    "help" {
        Write-Header "ApexCommerce AWS Deployment CLI Options"
        Write-Host ".\deploy.ps1             - Complete automated deployment (Infra + Build + Push + Deploy)"
        Write-Host ".\deploy.ps1 infra       - Provision AWS infrastructure only with Terraform"
        Write-Host ".\deploy.ps1 build-push  - Build and push Docker images to Amazon ECR"
        Write-Host ".\deploy.ps1 refresh-ecs - Force new ECS Fargate deployment"
        Write-Host ".\deploy.ps1 status      - Print all global CloudFront URLs & endpoints"
        Write-Host ".\deploy.ps1 destroy     - Tear down all AWS resources created by Terraform"
    }
}
