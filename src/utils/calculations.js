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
