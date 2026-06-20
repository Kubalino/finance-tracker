export const transactionToRemote = (row, userId) => ({
  id: row.id,
  user_id: userId,
  hash: row.hash,
  date: row.date,
  effective_date: row.effectiveDate,
  type: row.type,
  category: row.category,
  amount: row.amount,
  details: row.details,
  source: row.source,
  import_batch: row.importBatch,
  created_at: row.createdAt,
  updated_at: row.updatedAt,
});

export const transactionFromRemote = (row) => ({
  id: row.id,
  hash: row.hash,
  date: row.date,
  effectiveDate: row.effective_date,
  type: row.type,
  category: row.category,
  amount: row.amount,
  details: row.details,
  source: row.source,
  importBatch: row.import_batch,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const categoryToRemote = (row, userId) => ({
  id: row.id,
  user_id: userId,
  type: row.type,
  name: row.name,
  order: row.order,
  updated_at: row.updatedAt,
});

export const categoryFromRemote = (row) => ({
  id: row.id,
  type: row.type,
  name: row.name,
  order: row.order,
  updatedAt: row.updated_at,
});

export const keywordToRemote = (row, userId) => ({
  id: row.id,
  user_id: userId,
  keyword: row.keyword,
  type: row.type,
  category: row.category,
  updated_at: row.updatedAt,
});

export const keywordFromRemote = (row) => ({
  id: row.id,
  keyword: row.keyword,
  type: row.type,
  category: row.category,
  updatedAt: row.updated_at,
});

export const settingsToRemote = (row, userId) => ({
  id: row.id,
  user_id: userId,
  late_income_shift: row.lateIncomeShift,
  late_income_start_day: row.lateIncomeStartDay,
  savings_rate_calc: row.savingsRateCalc,
  theme: row.theme,
  updated_at: row.updatedAt,
});

export const settingsFromRemote = (row) => ({
  id: row.id,
  lateIncomeShift: row.late_income_shift,
  lateIncomeStartDay: row.late_income_start_day,
  savingsRateCalc: row.savings_rate_calc,
  theme: row.theme,
  updatedAt: row.updated_at,
});
