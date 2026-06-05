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

Require-Command "node"
Require-Command "tar"

$nodeMajor = [int](& node -p "Number(process.versions.node.split('.')[0])")
if ($nodeMajor -lt 22) {
	Fail "Node.js 22+ is required. Found: $(& node --version)"
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
} elseif ($cleanVersion -match "^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?(\+[0-9A-Za-z.-]+)?$") {
	$url = "$baseUrl/releases/download/v$cleanVersion/assinafy-$target.tar.gz"
} else {
	Fail "Version must be a semantic version, for example v1.0.0"
}

$tmpDir = Join-Path ([IO.Path]::GetTempPath()) "assinafy-$([Guid]::NewGuid())"
$archive = Join-Path $tmpDir "assinafy.tar.gz"
$extractDir = Join-Path $tmpDir "extract"

try {
	New-Item -ItemType Directory -Path $binDir, $extractDir -Force | Out-Null
	Info "Downloading Assinafy CLI for $target"
	Invoke-WebRequest -Uri $url -OutFile $archive -UseBasicParsing
	tar -xzf $archive -C $extractDir

	$cmdSource = Join-Path $extractDir "assinafy.cmd"
	$cjsSource = Join-Path $extractDir "assinafy.cjs"
	if (-not (Test-Path $cmdSource) -or -not (Test-Path $cjsSource)) {
		Fail "Release archive did not contain the Windows Assinafy executable"
	}

	Copy-Item $cmdSource $exe -Force
	Copy-Item $cjsSource (Join-Path $binDir "assinafy.cjs") -Force
	foreach ($file in @("README.md", "LICENSE", "VERSION")) {
		$source = Join-Path $extractDir $file
		if (Test-Path $source) {
			Copy-Item $source (Join-Path $installDir $file) -Force
		}
	}

	Add-UserPath $binDir
	$installedVersion = & $exe --version
	if ([string]::IsNullOrWhiteSpace($installedVersion)) {
		Fail "Installed executable did not run. Confirm Node.js 22+ is available on PATH."
	}

	Success "Installed $installedVersion to $exe"
	Write-Host "Open a new terminal if assinafy is not immediately available on PATH."
} finally {
	Remove-Item $tmpDir -Recurse -Force -ErrorAction SilentlyContinue
}
