import { SiteFooter, SiteHeader } from "../site-chrome";
import { Calculator } from "./calculator";

export const metadata = {
  title: "Failed payment calculator: what declined cards cost your SaaS | DeclineKit",
  description:
    "Estimate how much subscription revenue you lose each month and year to declined cards, and how much card-update emails could win back.",
  alternates: { canonical: "/failed-payment-calculator" },
};

export default function FailedPaymentCalculator() {
  return (
    <>
      <SiteHeader />
      <main className="calc-page">
        <h1>What are declined cards costing you?</h1>
        <p className="lede">
          Every month some of your subscription charges fail. Retries win some back. The rest quietly cancel unless
          someone asks the customer for a new card. Adjust the numbers to see what that adds up to.
        </p>
        <Calculator />
      </main>
      <SiteFooter />
    </>
  );
}
