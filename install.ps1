param(
	[string]$Version = ""
)

$ErrorActionPreference = "Stop"

function Fail([string]$Message) {
	Write-Error $Message
	exit 1
}

function Info([string]$Message) {
	Write-Host "==> $Message"
}

function Success([string]$Message) {
	Write-Host "Success: $Message"
}

function Require-Command([string]$Command) {
	if (-not (Get-Command $Command -ErrorAction SilentlyContinue)) {
		Fail "Required command not found: $Command"
	}
}

function Add-UserPath([string]$Directory) {
	$current = [Environment]::GetEnvironmentVariable("Path", "User")
	if ([string]::IsNullOrWhiteSpace($current)) {
		[Environment]::SetEnvironmentVariable("Path", $Directory, "User")
		$env:Path = "$Directory;$env:Path"
		return
	}

	$entries = $current -split ";"
	if ($entries -contains $Directory) {
		return
	}

	[Environment]::SetEnvironmentVariable("Path", "$current;$Directory", "User")
	$env:Path = "$Directory;$env:Path"
}

function Test-ArchiveLayout([string]$Archive, [string]$Target) {
	$entries = @(& tar -tzf $Archive)
	if ($LASTEXITCODE -ne 0) {
		Fail "Unable to read release archive"
	}
	$expectedExecutables = if ($Target.StartsWith("windows-")) {
		@("assinafy.cmd", "assinafy.cjs")
	} else {
		@("assinafy")
	}
	$counts = @{}
	foreach ($entry in $entries) {
		if ([string]::IsNullOrEmpty($entry) -or $entry.StartsWith("/") -or
			$entry.Contains("\") -or $entry -match '(^|/)\.\.(/|$)' -or
			$entry -match '[\x00-\x1F\x7F]') {
			Fail "Release archive contained an unsafe path"
		}
		$allowed = $expectedExecutables -ccontains $entry -or
			$entry -cin @("VERSION", "README.md", "LICENSE", "THIRD_PARTY_NOTICES.md") -or
			$entry -cmatch '^docs/[^/]+\.md$' -or $entry -ceq "docs/api-operations.json"
		if (-not $allowed) {
			Fail "Release archive contained an unexpected path: $entry"
		}
		$counts[$entry] = 1 + [int]($counts[$entry])
	}
	if ([int]($counts["VERSION"]) -ne 1) {
		Fail "Release archive must contain exactly one VERSION file"
	}
	foreach ($expected in $expectedExecutables) {
		if ([int]($counts[$expected]) -ne 1) {
			Fail "Release archive must contain exactly one $expected file"
		}
	}
}

if ($MyInvocation.InvocationName -eq ".") {
	return
}

Require-Command "node"
Require-Command "tar"

$nodeSupported = & node -p "const [major, minor] = process.versions.node.split('.').map(Number); major > 22 || (major === 22 && minor >= 12)"
if ($nodeSupported -ne "true") {
	Fail "Node.js 22.12+ is required. Found: $(& node --version)"
}

$archName = [System.Runtime.InteropServices.RuntimeInformation]::OSArchitecture.ToString().ToLowerInvariant()
switch ($archName) {
	"x64" { $arch = "x64" }
	"arm64" { $arch = "arm64" }
	default { Fail "Unsupported CPU architecture: $archName" }
}

$target = "windows-$arch"
$githubBase = $env:GITHUB_BASE
if ([string]::IsNullOrWhiteSpace($githubBase)) {
	$githubBase = "https://github.com"
}
if (-not $githubBase.StartsWith("https://")) {
	Fail "GITHUB_BASE must start with https://"
}

$repo = $env:ASSINAFY_REPO
if ([string]::IsNullOrWhiteSpace($repo)) {
	$repo = "assinafy/assinafy-cli"
}

$installDir = $env:ASSINAFY_INSTALL
if ([string]::IsNullOrWhiteSpace($installDir)) {
	$installDir = Join-Path $HOME ".assinafy"
}
$binDir = Join-Path $installDir "bin"
$exe = Join-Path $binDir "assinafy.cmd"

$baseUrl = "$($githubBase.TrimEnd('/'))/$repo"
$cleanVersion = $Version.TrimStart("v")
if ([string]::IsNullOrWhiteSpace($cleanVersion)) {
	$url = "$baseUrl/releases/latest/download/assinafy-$target.tar.gz"
	$sumsUrl = "$baseUrl/releases/latest/download/SHA256SUMS"
} elseif ($cleanVersion -match "^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?(\+[0-9A-Za-z.-]+)?$") {
	$url = "$baseUrl/releases/download/v$cleanVersion/assinafy-$target.tar.gz"
	$sumsUrl = "$baseUrl/releases/download/v$cleanVersion/SHA256SUMS"
} else {
	Fail "Version must be a semantic version, for example v1.0.0"
}

$tmpDir = Join-Path ([IO.Path]::GetTempPath()) "assinafy-$([Guid]::NewGuid())"
$archive = Join-Path $tmpDir "assinafy.tar.gz"
$sumsFile = Join-Path $tmpDir "SHA256SUMS"
$extractDir = Join-Path $tmpDir "extract"
$cmdReplacement = $null
$cjsReplacement = $null

try {
	New-Item -ItemType Directory -Path $extractDir -Force | Out-Null
	Info "Downloading Assinafy CLI for $target"
	Invoke-WebRequest -Uri $url -OutFile $archive -UseBasicParsing

	Info "Verifying checksum"
	Invoke-WebRequest -Uri $sumsUrl -OutFile $sumsFile -UseBasicParsing
	$archiveName = "assinafy-$target.tar.gz"
	$expectedHashes = @(Get-Content $sumsFile | ForEach-Object {
		$parts = $_.Trim() -split '\s+'
		if ($parts.Count -eq 2 -and $parts[1] -ceq $archiveName) {
			$parts[0]
		}
	})
	if ($expectedHashes.Count -ne 1) {
		Fail "SHA256SUMS did not contain an entry for $archiveName"
	}
	$expectedHash = $expectedHashes[0]
	if ($expectedHash -notmatch '^[0-9A-Fa-f]{64}$') {
		Fail "SHA256SUMS contained an invalid hash for $archiveName"
	}
	$expectedHash = $expectedHash.ToLowerInvariant()
	$actualHash = (Get-FileHash -Path $archive -Algorithm SHA256).Hash.ToLowerInvariant()
	if ($actualHash -ne $expectedHash) {
		Fail "Checksum mismatch for ${archiveName}: expected $expectedHash, got $actualHash"
	}
	Test-ArchiveLayout $archive $target

	tar -xzf $archive -C $extractDir
	$unsafeEntry = Get-ChildItem $extractDir -Recurse -Force | Where-Object {
		($_.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0
	} | Select-Object -First 1
	if ($unsafeEntry) {
		Fail "Release archive contained a link or special file"
	}

	$cmdSource = Join-Path $extractDir "assinafy.cmd"
	$cjsSource = Join-Path $extractDir "assinafy.cjs"
	if (-not (Test-Path $cmdSource) -or -not (Test-Path $cjsSource)) {
		Fail "Release archive did not contain the Windows Assinafy executable"
	}
	$versionFile = Join-Path $extractDir "VERSION"
	if (-not (Test-Path $versionFile)) {
		Fail "Release archive did not contain VERSION"
	}
	$archiveVersion = (Get-Content $versionFile -Raw).Trim()
	if ($archiveVersion -notmatch "^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?(\+[0-9A-Za-z.-]+)?$") {
		Fail "Release archive contained an invalid VERSION"
	}
	if (-not [string]::IsNullOrWhiteSpace($cleanVersion) -and $archiveVersion -cne $cleanVersion) {
		Fail "Release archive version $archiveVersion does not match requested version $cleanVersion"
	}

	$stagedVersion = (& $cmdSource --version | Out-String).Trim()
	if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($stagedVersion)) {
		Fail "Installed executable did not run. Confirm Node.js 22.12+ is available on PATH."
	}
	if ($stagedVersion -cne "@assinafy/cli v$archiveVersion") {
		Fail "Executable version does not match archive VERSION: $stagedVersion"
	}

	New-Item -ItemType Directory -Path $binDir -Force | Out-Null
	$cmdReplacement = Join-Path $binDir ".assinafy-$([Guid]::NewGuid()).cmd"
	$cjsReplacement = Join-Path $binDir ".assinafy-$([Guid]::NewGuid()).cjs"
	Copy-Item $cmdSource $cmdReplacement
	Copy-Item $cjsSource $cjsReplacement
	Move-Item $cjsReplacement (Join-Path $binDir "assinafy.cjs") -Force
	$cjsReplacement = $null
	Move-Item $cmdReplacement $exe -Force
	$cmdReplacement = $null

	foreach ($file in @("README.md", "LICENSE", "THIRD_PARTY_NOTICES.md", "VERSION")) {
		$source = Join-Path $extractDir $file
		if (Test-Path $source) {
			Copy-Item $source (Join-Path $installDir $file) -Force
		}
	}

	if ($env:ASSINAFY_NO_PATH_UPDATE -ne "1") {
		Add-UserPath $binDir
	}
	Success "Installed $stagedVersion to $exe"
	Write-Host "Open a new terminal if assinafy is not immediately available on PATH."
} finally {
	if ($cmdReplacement) {
		Remove-Item $cmdReplacement -Force -ErrorAction SilentlyContinue
	}
	if ($cjsReplacement) {
		Remove-Item $cjsReplacement -Force -ErrorAction SilentlyContinue
	}
	Remove-Item $tmpDir -Recurse -Force -ErrorAction SilentlyContinue
}
