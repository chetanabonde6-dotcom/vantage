import {
  calculatePlan,
  compareStrategies,
  formatINR,
  monthsLabel,
  recommendStrategy,
  stressTest,
} from "./engine.js";

const STORAGE_KEY = "vantage-debt-plan-v1";

const sampleState = () => ({
  monthlyIncome: 90000,
  essentialExpenses: 42000,
  monthlyBudget: 30000,
  strategy: "avalanche",
  incomeDrop: 15,
  expenseShock: 5000,
  debts: [
    { id: crypto.randomUUID(), name: "Everyday credit card", type: "Credit card", balance: 180000, apr: 36, minimum: 6000 },
    { id: crypto.randomUUID(), name: "Personal loan", type: "Personal loan", balance: 420000, apr: 14.5, minimum: 10500 },
    { id: crypto.randomUUID(), name: "Education loan", type: "Education loan", balance: 260000, apr: 10.25, minimum: 5500 },
  ],
});

const strategyMeta = {
  avalanche: {
    name: "Avalanche",
    code: "COST FIRST",
    description: "Targets the highest APR first to reduce projected interest.",
  },
  snowball: {
    name: "Snowball",
    code: "QUICK WINS",
    description: "Targets the smallest balance first to close accounts earlier.",
  },
  balanced: {
    name: "Balanced",
    code: "BLENDED",
    description: "Combines interest rate and balance size in one priority score.",
  },
};

const elements = {
  monthlyIncome: document.querySelector("#monthly-income"),
  essentialExpenses: document.querySelector("#essential-expenses"),
  monthlyBudget: document.querySelector("#monthly-budget"),
  cashMargin: document.querySelector("#cash-margin"),
  marginMessage: document.querySelector("#margin-message"),
  debtRows: document.querySelector("#debt-rows"),
  debtTemplate: document.querySelector("#debt-row-template"),
  formError: document.querySelector("#form-error"),
  recommendedStrategy: document.querySelector("#recommended-strategy"),
  confidenceValue: document.querySelector("#confidence-value"),
  confidenceBar: document.querySelector("#confidence-bar"),
  recommendationReasons: document.querySelector("#recommendation-reasons"),
  strategyCards: document.querySelector("#strategy-cards"),
  selectedName: document.querySelector("#selected-name"),
  selectedDuration: document.querySelector("#selected-duration"),
  selectedInterest: document.querySelector("#selected-interest"),
  balanceChart: document.querySelector("#balance-chart"),
  chartCaption: document.querySelector("#chart-caption"),
  incomeDrop: document.querySelector("#income-drop"),
  incomeDropLabel: document.querySelector("#income-drop-label"),
  expenseShock: document.querySelector("#expense-shock"),
  expenseShockLabel: document.querySelector("#expense-shock-label"),
  stressStatus: document.querySelector("#stress-status"),
  stressedIncome: document.querySelector("#stressed-income"),
  stressedBuffer: document.querySelector("#stressed-buffer"),
  stressAdvice: document.querySelector("#stress-advice"),
  decisionSummary: document.querySelector("#decision-summary"),
  saveMessage: document.querySelector("#save-message"),
};

let state = sampleState();

function valueOf(input) {
  const value = Number(input.value);
  return Number.isFinite(value) ? value : 0;
}

function readProfile() {
  state.monthlyIncome = valueOf(elements.monthlyIncome);
  state.essentialExpenses = valueOf(elements.essentialExpenses);
  state.monthlyBudget = valueOf(elements.monthlyBudget);
  state.incomeDrop = valueOf(elements.incomeDrop);
  state.expenseShock = valueOf(elements.expenseShock);
}

function writeProfile() {
  elements.monthlyIncome.value = state.monthlyIncome;
  elements.essentialExpenses.value = state.essentialExpenses;
  elements.monthlyBudget.value = state.monthlyBudget;
  elements.incomeDrop.value = state.incomeDrop;
  elements.expenseShock.value = state.expenseShock;
  const radio = document.querySelector(`input[name="strategy"][value="${state.strategy}"]`);
  if (radio) radio.checked = true;
}

function renderDebtRows() {
  elements.debtRows.replaceChildren();
  state.debts.forEach((debt) => {
    const row = elements.debtTemplate.content.firstElementChild.cloneNode(true);
    const nameInput = row.querySelector(".debt-name");
    const typeInput = row.querySelector(".debt-type");
    const balanceInput = row.querySelector(".debt-balance");
    const aprInput = row.querySelector(".debt-apr");
    const minimumInput = row.querySelector(".debt-minimum");
    const removeButton = row.querySelector(".remove-debt");

    nameInput.value = debt.name;
    typeInput.value = debt.type;
    balanceInput.value = debt.balance;
    aprInput.value = debt.apr;
    minimumInput.value = debt.minimum;
    removeButton.setAttribute("aria-label", `Remove ${debt.name || "debt"}`);

    const updateDebt = () => {
      debt.name = nameInput.value.trim() || "Unnamed debt";
      debt.type = typeInput.value;
      debt.balance = valueOf(balanceInput);
      debt.apr = valueOf(aprInput);
      debt.minimum = valueOf(minimumInput);
      removeButton.setAttribute("aria-label", `Remove ${debt.name}`);
      renderResults();
    };

    [nameInput, typeInput, balanceInput, aprInput, minimumInput].forEach((input) => {
      input.addEventListener("input", updateDebt);
      input.addEventListener("change", updateDebt);
    });

    removeButton.addEventListener("click", () => {
      state.debts = state.debts.filter((item) => item.id !== debt.id);
      renderDebtRows();
      renderResults();
    });

    elements.debtRows.append(row);
  });
}

function renderMargin() {
  const margin = state.monthlyIncome - state.essentialExpenses - state.monthlyBudget;
  elements.cashMargin.textContent = `${margin < 0 ? "−" : ""}${formatINR(Math.abs(margin))}`;
  elements.cashMargin.style.color = margin < 0 ? "#9d3028" : "";
  elements.marginMessage.textContent = margin < 0
    ? "The repayment budget is higher than the available monthly cash flow."
    : margin < state.monthlyIncome * 0.1
      ? "The plan fits, but the remaining monthly buffer is narrow."
      : "A positive buffer protects the plan from small shocks.";
}

function renderRecommendation(recommendation) {
  const meta = strategyMeta[recommendation.strategy];
  elements.recommendedStrategy.textContent = meta.name;
  elements.confidenceValue.textContent = `${recommendation.confidence}%`;
  elements.confidenceBar.style.width = `${recommendation.confidence}%`;
  elements.recommendationReasons.replaceChildren();
  recommendation.reasons.forEach((reason) => {
    const item = document.createElement("li");
    item.textContent = reason;
    elements.recommendationReasons.append(item);
  });
}

function renderStrategyCards(plans, recommended) {
  elements.strategyCards.replaceChildren();
  plans.forEach((plan) => {
    const meta = strategyMeta[plan.strategy];
    const card = document.createElement("article");
    card.className = `strategy-card${plan.strategy === state.strategy ? " selected" : ""}${plan.strategy === recommended ? " recommended" : ""}`;

    const header = document.createElement("header");
    const title = document.createElement("h3");
    title.textContent = meta.name;
    const code = document.createElement("span");
    code.textContent = meta.code;
    header.append(title, code);

    const description = document.createElement("p");
    description.textContent = meta.description;

    const metrics = document.createElement("div");
    metrics.className = "strategy-metrics";
    metrics.innerHTML = `
      <div><span>Payoff time</span><strong>${plan.completed ? monthsLabel(plan.months) : "Plan stalls"}</strong></div>
      <div><span>Total interest</span><strong>${formatINR(plan.totalInterest)}</strong></div>
    `;

    const button = document.createElement("button");
    button.type = "button";
    button.textContent = plan.strategy === state.strategy ? "Selected strategy" : `Use ${meta.name}`;
    button.setAttribute("aria-pressed", String(plan.strategy === state.strategy));
    button.addEventListener("click", () => {
      state.strategy = plan.strategy;
      const radio = document.querySelector(`input[name="strategy"][value="${plan.strategy}"]`);
      if (radio) radio.checked = true;
      renderResults();
    });

    card.append(header, description, metrics, button);
    elements.strategyCards.append(card);
  });
}

function renderChart(plan) {
  elements.balanceChart.replaceChildren();
  if (!plan.history.length) return;

  const desiredBars = Math.min(36, plan.history.length);
  const step = Math.max(1, Math.floor(plan.history.length / desiredBars));
  const sampled = plan.history.filter((_, index) => index % step === 0).slice(0, desiredBars - 1);
  if (sampled.at(-1) !== plan.history.at(-1)) sampled.push(plan.history.at(-1));
  const max = Math.max(plan.principal, ...sampled.map((point) => point.remainingBalance), 1);

  sampled.forEach((point) => {
    const bar = document.createElement("span");
    bar.className = "chart-bar";
    bar.style.height = `${Math.max(2, (point.remainingBalance / max) * 100)}%`;
    bar.title = `Month ${point.month}: ${formatINR(point.remainingBalance)} remaining`;
    elements.balanceChart.append(bar);
  });

  elements.balanceChart.setAttribute(
    "aria-label",
    `${strategyMeta[plan.strategy].name} projection: ${formatINR(plan.principal)} falls to ${formatINR(plan.remainingBalance)} over ${plan.months} months.`,
  );
}

function renderStress() {
  const result = stressTest(state, state.incomeDrop, state.expenseShock);
  elements.incomeDropLabel.textContent = `${state.incomeDrop}%`;
  elements.expenseShockLabel.textContent = formatINR(state.expenseShock);
  elements.stressStatus.textContent = result.status;
  elements.stressedIncome.textContent = formatINR(result.stressedIncome);
  elements.stressedBuffer.textContent = `${result.buffer < 0 ? "−" : ""}${formatINR(Math.abs(result.buffer))}`;
  elements.stressStatus.style.color = result.status === "Resilient" ? "#24705b" : result.status === "Tight" ? "#a45b20" : "#9d3028";
  elements.stressedBuffer.style.color = result.buffer < 0 ? "#9d3028" : "";
  elements.stressAdvice.textContent = result.status === "Resilient"
    ? "The committed payment still leaves a useful buffer under this scenario."
    : result.status === "Tight"
      ? "The plan still fits, but there is little room for another unexpected cost."
      : `This scenario creates a ${formatINR(Math.abs(result.buffer))} monthly shortfall. Reduce the commitment or build a reserve first.`;
}

function renderDecision(plan, recommendation) {
  const selectedMeta = strategyMeta[plan.strategy];
  if (!plan.completed) {
    elements.decisionSummary.textContent = "The current repayment budget does not reduce the portfolio reliably. Increase the budget, reduce expenses or contact the lender before missing payments.";
    return;
  }
  const mismatch = recommendation.strategy !== plan.strategy
    ? ` The model currently prefers ${strategyMeta[recommendation.strategy].name}, so review the interest and motivation trade-off before deciding.`
    : " This also matches the model recommendation for the current portfolio.";
  elements.decisionSummary.textContent = `${selectedMeta.name} projects a debt-free timeline of ${monthsLabel(plan.months)} with approximately ${formatINR(plan.totalInterest)} in interest.${mismatch}`;
}

function renderResults() {
  readProfile();
  renderMargin();
  renderStress();
  elements.formError.textContent = "";

  try {
    const recommendation = recommendStrategy(state.debts, state);
    const plans = compareStrategies(state.debts, state.monthlyBudget);
    const selectedPlan = plans.find((plan) => plan.strategy === state.strategy) || plans[0];

    renderRecommendation(recommendation);
    renderStrategyCards(plans, recommendation.strategy);
    renderChart(selectedPlan);
    renderDecision(selectedPlan, recommendation);

    elements.selectedName.textContent = strategyMeta[selectedPlan.strategy].name;
    elements.selectedDuration.textContent = selectedPlan.completed ? monthsLabel(selectedPlan.months) : "Plan stalls";
    elements.selectedInterest.textContent = formatINR(selectedPlan.totalInterest);
    elements.chartCaption.textContent = selectedPlan.underfunded
      ? `Minimum payments total ${formatINR(selectedPlan.minimumRequired)}, above the current budget.`
      : "Projection based on the current monthly repayment budget.";
  } catch (error) {
    elements.formError.textContent = error instanceof Error ? error.message : "Check the portfolio values.";
    elements.strategyCards.replaceChildren();
    elements.balanceChart.replaceChildren();
    elements.confidenceValue.textContent = "—";
    elements.confidenceBar.style.width = "0";
    elements.decisionSummary.textContent = "Complete your portfolio to generate a plain-language summary.";
  }
}

function restoreSample() {
  state = sampleState();
  writeProfile();
  renderDebtRows();
  renderResults();
  elements.saveMessage.textContent = "Sample portfolio restored.";
}

function loadSavedState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (!saved || !Array.isArray(saved.debts)) return false;
    state = {
      ...sampleState(),
      ...saved,
      debts: saved.debts.map((debt) => ({ ...debt, id: debt.id || crypto.randomUUID() })),
    };
    return true;
  } catch {
    return false;
  }
}

[elements.monthlyIncome, elements.essentialExpenses, elements.monthlyBudget].forEach((input) => {
  input.addEventListener("input", renderResults);
});

[elements.incomeDrop, elements.expenseShock].forEach((input) => {
  input.addEventListener("input", renderResults);
});

document.querySelectorAll('input[name="strategy"]').forEach((radio) => {
  radio.addEventListener("change", (event) => {
    state.strategy = event.target.value;
    renderResults();
  });
});

document.querySelector("#add-debt").addEventListener("click", () => {
  if (state.debts.length >= 12) {
    elements.formError.textContent = "This prototype supports up to 12 active debts.";
    return;
  }
  state.debts.push({
    id: crypto.randomUUID(),
    name: `New debt ${state.debts.length + 1}`,
    type: "Other",
    balance: 50000,
    apr: 12,
    minimum: 2500,
  });
  renderDebtRows();
  renderResults();
});

document.querySelector("#restore-sample").addEventListener("click", restoreSample);

document.querySelector("#clear-plan").addEventListener("click", () => {
  if (!window.confirm("Clear the saved plan and all figures on this page?")) return;
  localStorage.removeItem(STORAGE_KEY);
  state = { ...sampleState(), debts: [] };
  state.monthlyIncome = 0;
  state.essentialExpenses = 0;
  state.monthlyBudget = 0;
  writeProfile();
  renderDebtRows();
  renderResults();
  elements.saveMessage.textContent = "Local plan cleared.";
});

document.querySelector("#save-plan").addEventListener("click", () => {
  readProfile();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  elements.saveMessage.textContent = "Saved in this browser. No data was sent anywhere.";
});

document.querySelector("#print-plan").addEventListener("click", () => window.print());

const restored = loadSavedState();
writeProfile();
renderDebtRows();
renderResults();
if (restored) elements.saveMessage.textContent = "Your saved local plan was restored.";
