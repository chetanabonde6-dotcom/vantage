# Vantage demo guide

## Two-minute presentation flow

### 1. Introduce the problem

“Vantage is for a person who already has multiple debts and wants to decide where an extra monthly payment should go. It is not a loan-approval checker.”

### 2. Explain the sample profile

Point to the monthly income, essential expenses and ₹30,000 repayment budget. Explain that the purple card shows cash remaining after the commitment.

### 3. Walk through the portfolio

Show the credit card, personal loan and education loan. Explain that each account has a balance, APR and minimum payment. Add a fourth debt to demonstrate live recalculation.

### 4. Present the recommendation

Read the three visible reasons. Explain that the engine recommends Avalanche because the credit-card APR is much higher than the other rates. Emphasize that the model is explainable rather than a hidden score.

### 5. Compare strategies

Switch between Avalanche, Snowball and Balanced. Compare payoff time and total interest. Explain that Snowball may help motivation while Avalanche usually prioritizes cost.

### 6. Run the stress test

Increase the income drop and unexpected expense until the plan becomes “At risk.” Explain that this tests the repayment commitment, not the person’s creditworthiness.

### 7. Close with privacy

Save the plan and explain that the data stays in the current browser. No bank account, identity document or credit report is collected.

## Likely viva questions

### Why did you choose this problem?

Most calculators handle one EMI, but users with several debts need to choose a repayment order and understand the effect on their full cash flow.

### Is this machine learning?

The current recommendation layer is an explainable expert system. It applies published project rules to portfolio features. The simulator itself is deterministic. A future version could evaluate a trained model, but the current prototype avoids claiming accuracy without a suitable dataset.

### Why are three strategies needed?

They represent different goals: minimum interest, faster account closures and a compromise between the two.

### How is interest calculated?

Every month the application adds `balance × APR / 1200`, pays required minimums and routes the remaining budget according to strategy priority.

### What happens if the budget is too small?

The app flags that the budget does not cover total minimum payments. If balances stop decreasing for 12 months, it reports that the plan stalls.

### Where is user data stored?

Only in browser local storage when the user selects Save. The default calculations make no network requests.

### What is the biggest limitation?

The model assumes fixed monthly rates and does not include lender-specific fees or daily interest. It is an educational comparison, not a payment schedule from a bank.
