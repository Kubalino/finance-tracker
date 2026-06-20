export function totalByType(transactions, type) {
  return transactions
    .filter((tx) => tx.type === type)
    .reduce((sum, tx) => sum + tx.amount, 0);
}

export function aggregateByCategory(transactions, type) {
  const totals = new Map();
  transactions
    .filter((tx) => tx.type === type)
    .forEach((tx) => {
      totals.set(tx.category, (totals.get(tx.category) || 0) + tx.amount);
    });
  return Array.from(totals, ([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
}

export function trackingBalance(transactions) {
  const income = totalByType(transactions, 'Income');
  const expenses = totalByType(transactions, 'Expenses');
  const savings = totalByType(transactions, 'Savings');
  return income - expenses - savings;
}

export function savingsRate(transactions, method = 'allocated') {
  const income = totalByType(transactions, 'Income');
  if (income === 0) return 0;

  if (method === 'passive') {
    const expenses = totalByType(transactions, 'Expenses');
    return ((income - expenses) / income) * 100;
  }

  const savings = totalByType(transactions, 'Savings');
  return (savings / income) * 100;
}

export function signedAmount(tx) {
  return tx.type === 'Income' ? tx.amount : -tx.amount;
}

/** Returns a Map of transaction id -> cumulative balance, computed in chronological order. */
export function computeRunningBalances(transactions) {
  const chronological = [...transactions].sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt));
  const balances = new Map();
  let running = 0;
  for (const tx of chronological) {
    running += signedAmount(tx);
    balances.set(tx.id, running);
  }
  return balances;
}

export function monthlyTotals(transactions, year) {
  const months = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    Income: 0,
    Expenses: 0,
    Savings: 0,
  }));

  transactions.forEach((tx) => {
    const txYear = Number(tx.effectiveDate.slice(0, 4));
    if (txYear !== year) return;
    const txMonth = Number(tx.effectiveDate.slice(5, 7));
    months[txMonth - 1][tx.type] += tx.amount;
  });

  return months;
}
