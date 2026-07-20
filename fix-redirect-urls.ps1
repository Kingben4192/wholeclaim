# fix-redirect-urls.ps1 — add the custom domain to Supabase Auth's Redirect
# URLs allow-list via the Management API.
#
# ROOT CAUSE (confirmed live, 2026-07-20): requesting a magic-link redirect
# to https://www.getwholeclaim.com/auth/callback (or the bare
# https://getwholeclaim.com) is silently rejected by Supabase's redirect
# allow-list, which falls back to the Site URL root
# (https://wholeclaim.vercel.app) instead — landing the user on the
# homepage with the session tokens unused in the URL fragment, never
# reaching /auth/callback's session-setting code at all. Confirmed the
# .vercel.app domain and localhost:3000 ARE both currently allowed.
#
# Field names (site_url, uri_allow_list) verified against Supabase's
# self-hosting config docs (GOTRUE_SITE_URL / GOTRUE_URI_ALLOW_LIST),
# following the same GOTRUE_* -> snake_case mapping already confirmed
# correct for the SMTP fields in fix-smtp.ps1. uri_allow_list is a single
# comma-separated string field, not an array — this script reads the
# CURRENT value first and appends to it, rather than blindly overwriting,
# specifically so it can't silently drop an allow-list entry it doesn't
# know about.

# EDIT BEFORE RUNNING (reuse the same token from fix-smtp.ps1 if you still have it):
$SUPABASE_TOKEN = "SUPABASE_TOKEN_HERE"   # Supabase Dashboard -> Account -> Access Tokens

# Known-correct, not a placeholder.
$PROJECT_REF = "hkjqyjhunfbdcnwyjaqd"

$CONFIG_URL = "https://api.supabase.com/v1/projects/$PROJECT_REF/config/auth"
$headers = @{
    "Authorization" = "Bearer $SUPABASE_TOKEN"
    "Content-Type"  = "application/json"
}

Write-Host "Reading current auth config..."
$current = Invoke-RestMethod -Method Get -Uri $CONFIG_URL -Headers $headers

Write-Host "Current site_url:        $($current.site_url)"
Write-Host "Current uri_allow_list:  $($current.uri_allow_list)"
Write-Host ""

$requiredEntries = @(
    "https://www.getwholeclaim.com/**"
    "https://getwholeclaim.com/**"
)

$existing = @()
if ($current.uri_allow_list) {
    $existing = $current.uri_allow_list -split "," | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne "" }
}

$merged = @($existing)
foreach ($entry in $requiredEntries) {
    if ($merged -notcontains $entry) {
        $merged += $entry
    }
}
$newAllowList = ($merged -join ",")

# Site URL is currently resolving to the .vercel.app domain (that's what
# unmatched redirects fall back to) — updating it to the real canonical
# domain too, since it's also used to construct links in auth emails.
$newSiteUrl = "https://www.getwholeclaim.com"

if ($newAllowList -eq ($current.uri_allow_list) -and $newSiteUrl -eq $current.site_url) {
    Write-Host "Nothing to change — already correct. Exiting without a PATCH."
    exit 0
}

Write-Host "New site_url:       $newSiteUrl"
Write-Host "New uri_allow_list: $newAllowList"
Write-Host ""

$body = @{
    site_url       = $newSiteUrl
    uri_allow_list = $newAllowList
} | ConvertTo-Json

$response = Invoke-RestMethod -Method Patch -Uri $CONFIG_URL -Headers $headers -Body $body

Write-Host "Response:"
$response | ConvertTo-Json -Depth 10

Write-Host ""
Write-Host "Verify: site_url and uri_allow_list above should now include the getwholeclaim.com domain."
Write-Host "Existing entries (wholeclaim.vercel.app, localhost:3000) were preserved, not replaced."
