# fix-smtp.ps1 — configure Supabase Auth custom SMTP via the Management API
#
# Field names verified against Supabase's official docs (auth-smtp.mdx,
# supabase/supabase repo) as of this writing — not guessed. That said, this
# is a real config change to a live Supabase project via an API surface that
# can change; review the fields below against the current docs
# (https://supabase.com/docs/guides/auth/auth-smtp) before running,
# especially `external_email_enabled`, whose exact current semantics you
# should confirm.
#
# EDIT THESE TWO BEFORE RUNNING:
$SUPABASE_TOKEN = "SUPABASE_TOKEN_HERE"   # Supabase Dashboard -> Account -> Access Tokens -> Generate new token
$RESEND_KEY     = "RESEND_KEY_HERE"       # Resend Dashboard -> API Keys (an SMTP-scoped key is fine; the existing send-only key should also work)

# Known-correct, not placeholders — from this project's real config.
$PROJECT_REF = "hkjqyjhunfbdcnwyjaqd"

# Sender address must be on a domain Resend has actually finished verifying.
# mail.getwholeclaim.com was still missing its SPF/return-path record
# (send.mail.getwholeclaim.com) as of the last check — confirm in the Resend
# dashboard that this domain shows "Verified" before running, or the SMTP
# send itself will fail even once these settings are saved correctly.
$SENDER_EMAIL = "noreply@mail.getwholeclaim.com"
$SENDER_NAME  = "WholeClaim"

$body = @{
    external_email_enabled = $true
    smtp_admin_email        = $SENDER_EMAIL
    smtp_host                = "smtp.resend.com"
    smtp_port                = 587
    smtp_user                = "resend"
    smtp_pass                = $RESEND_KEY
    smtp_sender_name         = $SENDER_NAME
} | ConvertTo-Json

Write-Host "PATCH https://api.supabase.com/v1/projects/$PROJECT_REF/config/auth"
Write-Host "Body:"
Write-Host $body
Write-Host ""

$response = Invoke-RestMethod `
    -Method Patch `
    -Uri "https://api.supabase.com/v1/projects/$PROJECT_REF/config/auth" `
    -Headers @{
        "Authorization" = "Bearer $SUPABASE_TOKEN"
        "Content-Type"  = "application/json"
    } `
    -Body $body

Write-Host "Response:"
$response | ConvertTo-Json -Depth 10

# Note (from the same docs): after this is set, Supabase imposes a low rate
# limit (documented as 30 messages/hour) for a period before trusting the
# new SMTP config at full volume — don't be alarmed if a burst of test sends
# starts failing partway through.
