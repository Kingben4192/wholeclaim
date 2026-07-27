import { ClaimWizard } from "./ClaimWizard";
import { AccountMenu } from "@/app/AccountMenu";
import { BottomNav } from "@/app/BottomNav";

// Onboarding Step 4 — the flat single-page form is replaced by the 4-step
// wizard. Same route, same URL, no route explosion: this file is now just
// a thin server wrapper around the client wizard component.
//
// BottomNav (Decision #67) added here, not inside ClaimWizard.tsx itself
// -- that file is on the standing do-not-touch list, so its own internal
// layout has no matching bottom padding added; the fixed nav may sit
// close to the wizard's own bottom content on mobile as a result.
export default function NewClaimPage() {
  return (
    <>
      <AccountMenu />
      <ClaimWizard />
      <BottomNav />
    </>
  );
}
