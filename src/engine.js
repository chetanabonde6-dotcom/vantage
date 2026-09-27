const MAX_MONTHS = 600;

const numeric = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export function formatINR(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Math.max(0, numeric(value)));
}

export function normalizeDebt(debt, index = 0) {
  const balance = Math.max(0, numeric(debt.balance));
  return {
    id: debt.id || `debt-${index + 1}`,
    name: String(debt.name || `Debt ${index + 1}`).trim().slice(0, 40),
    type: String(debt.type || "Other"),
    balance,
    apr: Math.min(60, Math.max(0, numeric(debt.apr))),
    minimum: Math.min(balance, Math.max(0, numeric(debt.minimum))),
  };
}

export function validatePortfolio(debts, monthlyBudget) {
  const normalized = debts.map(normalizeDebt).filter((debt) => debt.balance > 0);
  if (!normalized.length) throw new Error("Add at least one debt with a balance above zero.");
  if (normalized.length > 12) throw new Error("This prototype supports up to 12 active debts.");

  const budget = numeric(monthlyBudget);
  if (budget <= 0) throw new Error("Monthly repayment budget must be greater than zero.");

  const minimumRequired = normalized.reduce((sum, debt) => sum + debt.minimum, 0);
  return {
    debts: normalized,
    budget,
    minimumRequired,
    underfunded: budget + 0.01 < minimumRequired,
  };
}

function strategyOrder(debts, strategy) {
  const copy = [...debts];
  if (strategy === "snowball") {
    return copy.sort((a, b) => a.balance - b.balance || b.apr - a.apr);
  }
  if (strategy === "balanced") {
    const maxBalance = Math.max(...copy.map((debt) => debt.balance), 1);
    return copy.sort((a, b) => {
      const scoreA = a.apr * 0.65 + (1 - a.balance / maxBalance) * 35;
      const scoreB = b.apr * 0.65 + (1 - b.balance / maxBalance) * 35;
      return scoreB - scoreA;
    });
  }
  return copy.sort((a, b) => b.apr - a.apr || a.balance - b.balance);
}

export function calculatePlan(rawDebts, monthlyBudget, strategy = "avalanche") {
  const portfolio = validatePortfolio(rawDebts, monthlyBudget);
  const debts = portfolio.debts.map((debt) => ({ ...debt }));
  const originalPrincipal = debts.reduce((sum, debt) => sum + debt.balance, 0);
  const history = [];
  let totalInterest = 0;
  let totalPaid = 0;
  let month = 0;
  let stalledMonths = 0;
  let previousBalance = originalPrincipal;

  while (month < MAX_MONTHS && debts.some((debt) => debt.balance > 0.01)) {
    month += 1;
    const active = debts.filter((debt) => debt.balance > 0.01);
    let available = portfolio.budget;
    let interestThisMonth = 0;
    let paidThisMonth = 0;

    for (const debt of active) {
      const interest = debt.balance * (debt.apr / 1200);
      debt.balance += interest;
      interestThisMonth += interest;
      totalInterest += interest;
    }

    const minimums = active.map((debt) => ({
      debt,
      due: Math.min(debt.balance, debt.minimum),
    }));
    const totalMinimum = minimums.reduce((sum, item) => sum + item.due, 0);
    const minimumScale = totalMinimum > 0 ? Math.min(1, available / totalMinimum) : 0;

    for (const item of minimums) {
      const payment = Math.min(item.debt.balance, item.due * minimumScale);
      item.debt.balance -= payment;
      available -= payment;
      paidThisMonth += payment;
    }

    const ordered = strategyOrder(active.filter((debt) => debt.balance > 0.01), strategy);
    for (const debt of ordered) {
      if (available <= 0.01) break;
      const payment = Math.min(debt.balance, available);
      debt.balance -= payment;
      available -= payment;
      paidThisMonth += payment;
    }

    totalPaid += paidThisMonth;
    const remainingBalance = debts.reduce((sum, debt) => sum + Math.max(0, debt.balance), 0);
    stalledMonths = remainingBalance >= previousBalance - 0.01 ? stalledMonths + 1 : 0;
    previousBalance = remainingBalance;

    history.push({
      month,
      remainingBalance,
      interest: interestThisMonth,
      paid: paidThisMonth,
    });

    if (stalledMonths >= 12) break;
  }

  const remainingBalance = debts.reduce((sum, debt) => sum + Math.max(0, debt.balance), 0);
  const completed = remainingBalance <= 0.01;
  return {
    strategy,
    completed,
    months: month,
    years: month / 12,
    principal: originalPrincipal,
    totalInterest,
    totalPaid,
    remainingBalance,
    minimumRequired: portfolio.minimumRequired,
    underfunded: portfolio.underfunded,
    history,
  };
}

export function compareStrategies(debts, monthlyBudget) {
  return ["avalanche", "snowball", "balanced"].map((strategy) =>
    calculatePlan(debts, monthlyBudget, strategy),
  );
}

export function recommendStrategy(debts, profile) {
  const normalized = debts.map(normalizeDebt).filter((debt) => debt.balance > 0);
  if (!normalized.length) {
    return { strategy: "avalanche", confidence: 0, reasons: ["Add debts to receive a recommendation."] };
  }

  const aprs = normalized.map((debt) => debt.apr);
  const aprSpread = Math.max(...aprs) - Math.min(...aprs);
  const smallestShare = Math.min(...normalized.map((debt) => debt.balance)) /
    normalized.reduce((sum, debt) => sum + debt.balance, 0);
  const monthlyIncome = Math.max(1, numeric(profile.monthlyIncome));
  const essentials = Math.max(0, numeric(profile.essentialExpenses));
  const budget = Math.max(0, numeric(profile.monthlyBudget));
  const cashMargin = (monthlyIncome - essentials - budget) / monthlyIncome;

  if (aprSpread >= 8) {
    return {
      strategy: "avalanche",
      confidence: Math.min(96, Math.round(72 + aprSpread)),
      reasons: [
        `Your interest-rate spread is ${aprSpread.toFixed(1)} percentage points.`,
        "Paying the costliest debt first is likely to reduce total interest.",
        cashMargin < 0.1 ? "Your cash-flow margin is tight, so preserve a small emergency buffer." : "Your current cash-flow margin can support a cost-first plan.",
      ],
    };
  }

  if (normalized.length >= 3 && smallestShare <= 0.15) {
    return {
      strategy: "snowball",
      confidence: 78,
      reasons: [
        "One balance is small enough to close relatively early.",
        "An early payoff can free a minimum payment for the remaining debts.",
        "This approach favors visible progress over the lowest possible interest.",
      ],
    };
  }

  return {
    strategy: "balanced",
    confidence: 70,
    reasons: [
      "Your interest rates are relatively close together.",
      "A blended score can balance quick wins with interest reduction.",
      "Compare all three projections before choosing a plan.",
    ],
  };
}

export function stressTest(profile, incomeDropPercent = 0, expenseShock = 0) {
  const income = Math.max(0, numeric(profile.monthlyIncome));
  const essentials = Math.max(0, numeric(profile.essentialExpenses));
  const committed = Math.max(0, numeric(profile.monthlyBudget));
  const stressedIncome = income * (1 - Math.min(90, Math.max(0, numeric(incomeDropPercent))) / 100);
  const availableAfterNeeds = stressedIncome - essentials - Math.max(0, numeric(expenseShock));
  const buffer = availableAfterNeeds - committed;
  const coverage = committed > 0 ? availableAfterNeeds / committed : 0;

  return {
    stressedIncome,
    availableAfterNeeds,
    buffer,
    coverage,
    status: buffer >= committed * 0.25 ? "Resilient" : buffer >= 0 ? "Tight" : "At risk",
  };
}

export function monthsLabel(months) {
  if (!Number.isFinite(months) || months >= MAX_MONTHS) return "Beyond model range";
  const years = Math.floor(months / 12);
  const remainder = months % 12;
  if (!years) return `${remainder} month${remainder === 1 ? "" : "s"}`;
  return `${years}y ${remainder}m`;
}
