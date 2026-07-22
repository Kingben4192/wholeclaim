import { ClaimWizard } from "./ClaimWizard";

// Onboarding Step 4 — the flat single-page form is replaced by the 4-step
// wizard. Same route, same URL, no route explosion: this file is now just
// a thin server wrapper around the client wizard component.
export default function NewClaimPage() {
  return <ClaimWizard />;
}
