# Vantage — Debt Freedom Strategy Lab

## 1. Abstract

Vantage is a browser-based BFSI decision-support prototype for people managing multiple debts. Users enter monthly cash-flow figures and the balance, annual percentage rate and minimum payment of each debt. The application simulates three payoff strategies, estimates debt-free time and interest, recommends a strategy with visible reasons, and tests the plan under temporary financial stress. The system is educational: it does not connect to lenders, retrieve credit reports or make credit decisions.

## 2. Problem statement

Borrowers with several accounts often know their individual minimum payments but cannot easily answer four practical questions:

1. Which debt should receive the next extra rupee?
2. How long will the full portfolio take to repay?
3. How much interest changes between common strategies?
4. Will the commitment still fit after an income or expense shock?

Most simple EMI calculators model only one new loan. Vantage instead treats existing debts as a portfolio and makes the strategy trade-offs explicit.

## 3. Objectives

- Collect only the financial inputs required for a debt plan.
- Simulate repayment month by month rather than using a single approximate score.
- Compare cost-first, quick-win and blended strategies.
- Explain why the recommendation engine prefers one strategy.
- Detect underfunded plans where the budget is below total minimum payments.
- Test repayment resilience under adverse cash-flow scenarios.
- Keep all default calculations and saved plans inside the browser.

## 4. Scope

### Included

- Multiple debt accounts.
- Fixed APR and minimum-payment inputs.
- Avalanche, Snowball and Balanced strategies.
- Interest and repayment-duration projections.
- Explainable strategy recommendation.
- Income-drop and expense-shock stress tests.
- Local storage and printable summary.

### Excluded

- Real bank or bureau data.
- Loan approval or eligibility decisions.
- Variable interest-rate schedules.
- Late fees, taxes, foreclosure or legal advice.
- Payment execution.

## 5. System modules

| Module | Inputs | Outputs |
|---|---|---|
| Cash-flow profile | Income, essentials, repayment budget | Free monthly margin |
| Debt portfolio | Name, type, balance, APR, minimum | Validated portfolio and minimum total |
| Recommendation engine | APR spread, balance distribution, cash margin | Strategy, confidence and visible reasons |
| Repayment simulator | Portfolio, budget, selected strategy | Monthly history, time, interest and completion state |
| Strategy comparison | Same portfolio across three orderings | Comparable payoff and interest results |
| Stress test | Income drop and expense shock | Stressed cash buffer and risk status |
| Local plan | Current application state | Browser-local save and restore |

## 6. Methodology

### 6.1 Input validation

The system removes zero-balance rows, limits APR to 0–60%, accepts at most 12 debts and requires a positive monthly repayment budget. It calculates the sum of minimum payments and flags a budget that does not cover that amount.

### 6.2 Monthly repayment simulation

For each active debt, monthly interest is calculated as:

`monthly interest = current balance × annual percentage rate / 1200`

Interest is added before payment. Minimum payments are allocated first. Any remaining budget is routed according to the selected priority:

- Avalanche: descending APR.
- Snowball: ascending balance.
- Balanced: 65% rate signal plus 35% small-balance signal.

The simulation stops when all debts are repaid, the balance fails to decrease for 12 consecutive months, or 600 months are reached.

### 6.3 Explainable recommendation engine

The recommendation engine is a deterministic expert system:

- A large APR spread favors Avalanche because expensive debt dominates cost.
- Several accounts with one small balance may favor Snowball because an early closure releases a minimum payment.
- Similar APRs favor Balanced because cost differences are smaller.
- A narrow cash margin produces an additional warning to preserve an emergency buffer.

Every selected rule is returned as a readable reason. This is safer and easier to audit than presenting an unexplained approval probability.

### 6.4 Stress testing

Stressed income is:

`income × (1 − income-drop percentage)`

The remaining buffer is:

`stressed income − essential expenses − unexpected expense − repayment budget`

The result is classified as Resilient, Tight or At risk. The label describes the test scenario only; it does not describe the user as a credit risk.

## 7. Technology stack

- HTML5 for semantic structure.
- CSS3 for the responsive editorial interface and print view.
- JavaScript ES modules for state, calculations and DOM updates.
- Node.js built-in test runner for automated calculation tests.
- Browser `localStorage` for optional same-device persistence.

No framework, database or paid API is required.

## 8. Privacy and security

The prototype does not request a name, phone number, account number, PAN, Aadhaar number or bank credentials. It makes no network request for calculations. A saved plan is stored only under the application origin in the current browser. Users are informed that clearing browser data removes the saved plan.

## 9. Verification

Automated tests verify that:

- A valid portfolio completes under a sufficient budget.
- All three strategies produce independent projections.
- An underfunded budget is detected.
- A wide APR spread produces an Avalanche recommendation.
- A severe shock produces a negative cash-flow buffer.

Manual checks should also cover adding and removing debts, mobile layout, keyboard focus, local save/restore and print preview.

## 10. Limitations

Real repayment schedules may use daily interest, fees, changing rates, prepayment rules and lender-specific allocation methods. Vantage uses a simplified monthly model for education and comparison. Its recommendation is not personalized financial advice.

## 11. Future enhancements

- Import an anonymized transaction CSV with explicit user consent.
- Add variable-rate and fee schedules.
- Create account-backed plans with authentication and deletion controls.
- Generate an accessible PDF comparison.
- Add multilingual explanations.
- Validate strategy outcomes against lender-provided repayment schedules.

## 12. Conclusion

Vantage demonstrates how transparent algorithms can support financial planning without pretending to know a lender’s decision. Its main contribution is the combination of multi-debt simulation, explainable strategy selection and cash-flow stress testing in a privacy-first browser application.
