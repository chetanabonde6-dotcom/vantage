# Vantage — Debt Freedom Strategy Lab

Capstone project repository for an explainable BFSI debt-planning application.

Vantage is an explainable BFSI capstone that helps a user compare debt repayment strategies across credit cards and loans. It projects payoff time and interest, recommends a strategy from visible portfolio features, and stress-tests whether the monthly commitment survives an income or expense shock.

This project is intentionally focused on **debt optimization**, not loan eligibility, credit approval or credit-score prediction.

## Core modules

- Cash-flow profile: income, essential expenses and a chosen repayment budget.
- Debt portfolio: up to 12 balances with APR and minimum-payment data.
- Explainable recommendation engine: recommends Avalanche, Snowball or Balanced and displays its reasoning.
- Strategy comparison: independently simulates all three approaches month by month.
- Resilience test: applies income-drop and unexpected-expense scenarios.
- Decision summary: creates a plain-language outcome and printable view.
- Local plan storage: saves only in the current browser using `localStorage`.

## Why the project is distinct

The application does not decide whether someone qualifies for a loan. It solves a different BFSI problem: how to prioritize existing debts while protecting monthly cash flow. The interface, calculation engine, visual language, documentation and data model were designed around that goal.

## Run locally

No build step or API key is required.

```bash
npm run dev
```

Open `http://localhost:4173`.

## Validate the project

```bash
npm test
npm run check
```

## Deploy with GitHub Pages

This repository includes an automatic Pages workflow. After the files are pushed
to the `main` branch, open **Settings → Pages** in GitHub and select **GitHub
Actions** as the source. Each new push will update the live website.

The tests cover repayment completion, strategy comparison, minimum-payment stress, recommendation behavior and cash-flow shocks.

## Calculation approach

For every simulated month, Vantage:

1. Adds monthly interest using `balance × APR / 1200`.
2. Pays each required minimum, limited by the available budget.
3. Sends the remaining budget to debts in the selected strategy order.
4. Repeats until all balances are closed, the plan stops reducing debt, or the 600-month safety limit is reached.

Strategy priority:

- **Avalanche:** highest APR first.
- **Snowball:** smallest outstanding balance first.
- **Balanced:** blended score based on APR and relative balance.

The recommendation engine is a transparent expert system. It uses APR spread, balance distribution and cash-flow margin; it is not a trained credit model and does not claim to predict approval.

## Privacy and limitations

- No bank, bureau or lender connection.
- No account, contact or identity data is requested.
- Saved plans stay in the current browser until the user clears site data.
- Projections assume fixed interest rates and a consistent monthly budget.
- Results are educational and are not financial advice.

## Deployment

This is a static application. It can be hosted directly with GitHub Pages, Vercel, Netlify or any static web server.

See [docs/CAPSTONE_REPORT.md](docs/CAPSTONE_REPORT.md) for the full project report and [docs/DEMO_GUIDE.md](docs/DEMO_GUIDE.md) for a presentation flow.
