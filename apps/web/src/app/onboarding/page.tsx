import { OnboardingExperience } from "@/components/onboarding-experience";
import { TokenWordmark } from "@/components/tokenfc-ui";

export default function OnboardingPage() {
  return (
    <div className="simple-flow-page simple-flow-page-onboarding">
      <header className="marketing-header">
        <div className="marketing-header-inner shell-width">
          <TokenWordmark />
        </div>
      </header>
      <main className="shell-width flow-main">
        <OnboardingExperience />
      </main>
    </div>
  );
}
