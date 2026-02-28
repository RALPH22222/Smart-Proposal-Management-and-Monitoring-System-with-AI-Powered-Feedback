<#
.SYNOPSIS
  Sync a .env file into AWS SSM Parameter Store.

.DESCRIPTION
  Reads KEY=VALUE pairs from a .env file and upserts each as an SSM parameter
  under /finova/<env>/<KEY>. Keys matching secret-like patterns are stored as
  SecureString; all others as String.

.PARAMETER Env
  Environment name (required). Becomes the SSM path segment (e.g. nightly, production).

.PARAMETER File
  Path to .env file. Defaults to .env in the current directory.

.PARAMETER Profile
  AWS CLI profile. Defaults to $env:AWS_PROFILE or "default".

.PARAMETER Region
  AWS region. Defaults to $env:AWS_REGION or "ap-southeast-1".

.PARAMETER DryRun
  Print what would be upserted without making any AWS calls.

.EXAMPLE
  .\scripts\upsert-ssm.ps1 -Env nightly -File apps\backend\.env -Profile finova-nightly

.EXAMPLE
  .\scripts\upsert-ssm.ps1 -Env production -DryRun
#>

[CmdletBinding()]
param(
  [Parameter(Mandatory)]
  [string]$Env,

  [string]$File = ".env",

  [string]$Profile = ($env:AWS_PROFILE, "default" -ne $null)[0],

  [string]$Region = ($env:AWS_REGION, "us-east-1" -ne $null)[0],

  [switch]$DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$SsmBase = "/pms/backend"

# ── Validate ─────────────────────────────────────────────────────────────────

if (-not (Test-Path $File))
{
  Write-Host "Error: .env file not found: $File" -ForegroundColor Red
  exit 1
}

$Prefix = "$SsmBase"

# ── Header ───────────────────────────────────────────────────────────────────

Write-Host "SSM Parameter Upsert" -ForegroundColor White -NoNewline
Write-Host ""
Write-Host "  Environment : $Env"
Write-Host "  SSM prefix  : $Prefix"
Write-Host "  File        : $File"
Write-Host "  Profile     : $Profile"
Write-Host "  Region      : $Region"
if ($DryRun)
{
  Write-Host "  Mode        : DRY RUN" -ForegroundColor Yellow
}
Write-Host ""

# ── Helpers ──────────────────────────────────────────────────────────────────

function Get-SsmType([string]$Key)
{
  $lower = $Key.ToLower()
  if ($lower -match '(secret|password|api_key|token|webhook|private_key|credentials)')
  {
    return "SecureString"
  }
  return "String"
}

function Remove-InlineComment([string]$Value)
{
  # Remove everything from the first ' #' onwards (unquoted inline comment).
  return ($Value -replace '\s*#.*$', '')
}

function Remove-Quotes([string]$Value)
{
  if (($Value.StartsWith('"') -and $Value.EndsWith('"')) -or
    ($Value.StartsWith("'") -and $Value.EndsWith("'")))
  {
    return $Value.Substring(1, $Value.Length - 2)
  }
  return $Value
}

# ── Main loop ────────────────────────────────────────────────────────────────

$upserted = 0
$skipped  = 0
$errors   = 0

foreach ($rawLine in Get-Content -Path $File -Encoding UTF8)
{
  $line = $rawLine.TrimEnd("`r")

  # Skip blank lines and comment lines.
  if ([string]::IsNullOrWhiteSpace($line))
  { continue
  }
  if ($line.TrimStart() -match '^\s*#')
  { continue
  }

  # Match KEY=VALUE — key must start with a letter or underscore.
  if ($line -match '^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)$')
  {
    $key      = $Matches[1]
    $rawValue = $Matches[2]

    # Determine if value is quoted.
    if ($rawValue.Length -gt 0 -and ($rawValue[0] -eq '"' -or $rawValue[0] -eq "'"))
    {
      $value = Remove-Quotes $rawValue
    } else
    {
      $value = (Remove-InlineComment $rawValue).TrimEnd()
    }

    if ([string]::IsNullOrEmpty($value))
    {
      Write-Host "  SKIP   $key (empty value)" -ForegroundColor Yellow
      $skipped++
      continue
    }

    $paramName = "$Prefix/$key"
    $paramType = Get-SsmType $key
    $displayValue = if ($value.Length -gt 30)
    { $value.Substring(0, 30) + "..."
    } else
    { $value
    }

    if ($DryRun)
    {
      Write-Host -NoNewline "  "
      Write-Host -NoNewline "DRY" -ForegroundColor Cyan
      Write-Host -NoNewline "    $paramName  "
      Write-Host -NoNewline "($paramType)" -ForegroundColor Yellow
      Write-Host "  =  $displayValue"
      $upserted++
    } else
    {
      try
      {
        aws ssm put-parameter `
          --name $paramName `
          --value $value `
          --type $paramType `
          --overwrite `
          --profile $Profile `
          --region $Region `
          --output text `
          --query "Version" | Out-Null

        Write-Host -NoNewline "  "
        Write-Host -NoNewline "OK" -ForegroundColor Green
        Write-Host -NoNewline "     $paramName  "
        Write-Host "($paramType)" -ForegroundColor Yellow
        $upserted++
      } catch
      {
        Write-Host "  ERROR  $paramName" -ForegroundColor Red
        $errors++
      }
    }
  }
}

# ── Summary ──────────────────────────────────────────────────────────────────

Write-Host ""
if ($DryRun)
{
  Write-Host "Dry run complete: $upserted would be upserted, $skipped skipped"
} elseif ($errors -gt 0)
{
  Write-Host -NoNewline "Done: "
  Write-Host -NoNewline "$upserted upserted" -ForegroundColor Green
  Write-Host -NoNewline ", $skipped skipped" -ForegroundColor Yellow
  Write-Host ", $errors errors" -ForegroundColor Red
  exit 1
} else
{
  Write-Host -NoNewline "Done: "
  Write-Host -NoNewline "$upserted upserted" -ForegroundColor Green
  Write-Host ", $skipped skipped" -ForegroundColor Yellow
}
