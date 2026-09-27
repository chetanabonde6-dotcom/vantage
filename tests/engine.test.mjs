import test from "node:test";
import assert from "node:assert/strict";
import {
  calculatePlan,
  compareStrategies,
  recommendStrategy,
  stressTest,
  validatePortfolio,
} from "../src/engine.js";

const debts = [
  { id: "card", name: "Credit card", type: "Credit card", balance: 180000, apr: 36, minimum: 6000 },
  { id: "personal", name: "Personal loan", type: "Personal loan", balance: 420000, apr: 14.5, minimum: 10500 },
  { id: "education", name: "Education loan", type: "Education loan", balance: 260000, apr: 10.25, minimum: 5500 },
];

test("avalanche plan repays a valid portfolio", () => {
  const plan = calculatePlan(debts, 30000, "avalanche");
  assert.equal(plan.completed, true);
  assert.ok(plan.months > 0 && plan.months < 120);
  assert.ok(plan.totalInterest > 0);
  assert.ok(plan.totalPaid > plan.principal);
});

test("comparison returns three independent strategies", () => {
  const plans = compareStrategies(debts, 30000);
  assert.deepEqual(plans.map((plan) => plan.strategy), ["avalanche", "snowball", "balanced"]);
  assert.ok(plans.every((plan) => plan.history.length === plan.months));
});

test("portfolio validation detects an underfunded minimum budget", () => {
  const portfolio = validatePortfolio(debts, 10000);
  assert.equal(portfolio.underfunded, true);
  assert.equal(portfolio.minimumRequired, 22000);
});

test("recommendation favors avalanche when APR spread is large", () => {
  const recommendation = recommendStrategy(debts, {
    monthlyIncome: 90000,
    essentialExpenses: 42000,
    monthlyBudget: 30000,
  });
  assert.equal(recommendation.strategy, "avalanche");
  assert.ok(recommendation.confidence >= 70);
});

test("stress test reports a negative buffer after a severe shock", () => {
  const result = stressTest({ monthlyIncome: 90000, essentialExpenses: 42000, monthlyBudget: 30000 }, 30, 5000);
  assert.equal(result.status, "At risk");
  assert.ok(result.buffer < 0);
});
