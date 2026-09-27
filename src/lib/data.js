// ============================================
// 数据层：常量与纯计算逻辑（与框架无关）
// ============================================

export const STORAGE_KEY = 'zhaiwu_data_v1'

// 默认初始数据（基于个人负债消除计划书 - 修订版）
export const DEFAULT_DEBTS = [
  {
    id: 'd1', name: '车贷', type: '车贷',
    principal: 73418.23, monthlyPayment: 2368.33,
    remainingPeriods: 31, dueDay: 15,
    note: '分期 31 期，2026/10 - 2029/04',
    originalPrincipal: 73418.23, paidHistory: []
  },
  {
    id: 'd2', name: '信用卡 5', type: '信用卡',
    principal: 3685.11, monthlyPayment: 3685.11,
    remainingPeriods: 1, dueDay: 5,
    note: '10/5 一次性还款，9 月账单，无分期',
    originalPrincipal: 3685.11, paidHistory: []
  },
  {
    id: 'd3', name: '信用卡 6', type: '信用卡',
    principal: 5301.18, monthlyPayment: 443.85,
    remainingPeriods: 12, dueDay: 5,
    note: '首月 418.83，后续每月 443.85',
    originalPrincipal: 5301.18, paidHistory: []
  },
  {
    id: 'd4', name: '信用卡 4', type: '信用卡',
    principal: 3586.96, monthlyPayment: 448.37,
    remainingPeriods: 8, dueDay: 5,
    note: '分期 8 期',
    originalPrincipal: 3586.96, paidHistory: []
  },
  {
    id: 'd5', name: '信用卡 3', type: '信用卡',
    principal: 2071.57, monthlyPayment: 109.03,
    remainingPeriods: 19, dueDay: 5,
    note: '分期 19 期',
    originalPrincipal: 2071.57, paidHistory: []
  },
  {
    id: 'd6', name: '信用卡 2', type: '信用卡',
    principal: 1491.84, monthlyPayment: 93.24,
    remainingPeriods: 16, dueDay: 5,
    note: '分期 16 期',
    originalPrincipal: 1491.84, paidHistory: []
  },
  {
    id: 'd7', name: '花呗', type: '花呗',
    principal: 548.87, monthlyPayment: 78.41,
    remainingPeriods: 7, dueDay: 5,
    note: '分期 7 期',
    originalPrincipal: 548.87, paidHistory: []
  },
  {
    id: 'd8', name: '信用卡 1', type: '信用卡',
    principal: 481.32, monthlyPayment: 68.76,
    remainingPeriods: 7, dueDay: 5,
    note: '分期 7 期',
    originalPrincipal: 481.32, paidHistory: []
  }
]

export const DEFAULT_SETTINGS = {
  monthlyIncome: 4400,
  monthlyExpense: 1300,
  didiIncome: 400,          // 滴滴月目标收入（每周 1 天 × 100 元）
  initialSavings: 10000,
  emergencyReserve: 2500,   // 应急储备底线（原则上不动用）
  startDate: '2026-10-01',
  strategy: 'conservative',
  monthlyIncomeOverrides: {
    '2026-09': 400          // 9 月仅 28 号一笔 400 元
  }
}

export const STAGES = [
  {
    id: 1, name: '阶段 1：启动期', period: '2026 年 10 月',
    desc: '仅覆盖刚性还款，动用约 4170 元备用金，保留应急储备',
    endDate: '2026-10-31'
  },
  {
    id: 2, name: '阶段 2：过渡期', period: '2026/11 - 2027/09',
    desc: '靠备用金补缺口，月供 3014-3609 元',
    endDate: '2027-09-30'
  },
  {
    id: 3, name: '阶段 3：正向积累期', period: '2027/10 - 2028/04',
    desc: '开始月度盈余 529-622 元，逐步补回备用金',
    endDate: '2028-04-30'
  },
  {
    id: 4, name: '阶段 4：车贷冲刺期', period: '2028/05 - 2029/02',
    desc: '集中提前结清车贷，预计提前 2 个月结清',
    endDate: '2029-02-28'
  }
]

export const EXPENSE_CATEGORIES = [
  { id: 'food', name: '餐饮', icon: '🍚' },
  { id: 'transport', name: '交通', icon: '🚇' },
  { id: 'shopping', name: '购物', icon: '🛍️' },
  { id: 'bill', name: '生活缴费', icon: '💡' },
  { id: 'medical', name: '医疗', icon: '💊' },
  { id: 'entertainment', name: '娱乐', icon: '🎬' },
  { id: 'social', name: '人情', icon: '🎁' },
  { id: 'other_expense', name: '其他', icon: '📦' }
]

export const INCOME_CATEGORIES = [
  { id: 'salary', name: '工资', icon: '💰' },
  { id: 'didi', name: '滴滴', icon: '🚗' },
  { id: 'bonus', name: '奖金', icon: '🎉' },
  { id: 'refund', name: '退款', icon: '↩️' },
  { id: 'other_income', name: '其他', icon: '💵' }
]

export const ASSET_CATEGORIES = [
  { id: 'liquid', name: '流动资金', icon: '💧' },
  { id: 'alipay', name: '支付宝', icon: '💙' },
  { id: 'bank', name: '银行卡', icon: '🏦' },
  { id: 'wechat', name: '微信', icon: '💚' },
  { id: 'cash', name: '现金', icon: '💵' },
  { id: 'receivable', name: '应收款', icon: '📨' },
  { id: 'investment', name: '投资', icon: '📈' },
  { id: 'other', name: '其他', icon: '📦' }
]

export const DEBT_TYPES = ['车贷', '信用卡', '花呗', '网贷', '亲友借款', '其他']

// ============================================
// 格式化
// ============================================

export function formatMoney(n) {
  const v = Number(n) || 0
  const sign = v < 0 ? '-' : ''
  return sign + '¥' + Math.abs(v).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

export function formatMoneyShort(n) {
  const v = Number(n) || 0
  if (Math.abs(v) >= 10000) return '¥' + (v / 10000).toFixed(2) + '万'
  return '¥' + v.toLocaleString('zh-CN', { maximumFractionDigits: 0 })
}

export function generateId(prefix = 'd') {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 5)
}

// ============================================
// 分类元信息
// ============================================

export function getCategoryMeta(categoryId, type) {
  const list = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES
  return list.find(c => c.id === categoryId) || list[list.length - 1]
}

export function getAssetCategoryMeta(categoryId) {
  return ASSET_CATEGORIES.find(c => c.id === categoryId) ||
    ASSET_CATEGORIES[ASSET_CATEGORIES.length - 1]
}

export function getDebtTypeIcon(type) {
  const map = {
    '车贷': '🚗',
    '信用卡': '💳',
    '花呗': '🌸',
    '网贷': '📱',
    '亲友借款': '👥',
    '其他': '📄'
  }
  return map[type] || '📄'
}

// ============================================
// 默认数据与规范化
// ============================================

export function getDefaultData() {
  return {
    debts: JSON.parse(JSON.stringify(DEFAULT_DEBTS)),
    settings: JSON.parse(JSON.stringify(DEFAULT_SETTINGS)),
    transactions: [],
    assets: [],
    version: 5
  }
}

// 保证所有字段类型正确，缺失字段用默认值补全（兼容旧版本数据）
export function normalizeData(data) {
  if (!data || typeof data !== 'object') return getDefaultData()

  if (!Array.isArray(data.debts)) data.debts = []
  if (!Array.isArray(data.transactions)) data.transactions = []
  if (!Array.isArray(data.assets)) data.assets = []
  if (!data.settings || typeof data.settings !== 'object') {
    data.settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS))
  }

  const s = data.settings
  const def = DEFAULT_SETTINGS
  if (typeof s.monthlyIncome !== 'number') s.monthlyIncome = def.monthlyIncome
  if (typeof s.monthlyExpense !== 'number') s.monthlyExpense = def.monthlyExpense
  if (typeof s.didiIncome !== 'number') s.didiIncome = def.didiIncome
  if (typeof s.initialSavings !== 'number') s.initialSavings = def.initialSavings
  if (typeof s.emergencyReserve !== 'number') s.emergencyReserve = def.emergencyReserve
  if (typeof s.startDate !== 'string') s.startDate = def.startDate
  if (typeof s.strategy !== 'string') s.strategy = def.strategy
  if (!s.monthlyIncomeOverrides || typeof s.monthlyIncomeOverrides !== 'object') {
    s.monthlyIncomeOverrides = { ...def.monthlyIncomeOverrides }
  }

  data.debts = data.debts
    .filter(d => d && typeof d === 'object')
    .map(d => ({
      id: d.id || generateId('d'),
      name: d.name || '未命名',
      type: d.type || '其他',
      principal: typeof d.principal === 'number' ? d.principal : 0,
      originalPrincipal: typeof d.originalPrincipal === 'number'
        ? d.originalPrincipal
        : (typeof d.principal === 'number' ? d.principal : 0),
      monthlyPayment: typeof d.monthlyPayment === 'number' ? d.monthlyPayment : 0,
      remainingPeriods: typeof d.remainingPeriods === 'number' ? d.remainingPeriods : 0,
      dueDay: typeof d.dueDay === 'number' ? d.dueDay : 5,
      note: typeof d.note === 'string' ? d.note : '',
      paidHistory: Array.isArray(d.paidHistory) ? d.paidHistory : []
    }))

  data.transactions = data.transactions
    .filter(t => t && typeof t === 'object')
    .map(t => ({
      id: t.id || generateId('t'),
      type: t.type === 'income' ? 'income' : 'expense',
      amount: typeof t.amount === 'number' ? t.amount : 0,
      category: t.category || (t.type === 'income' ? 'other_income' : 'other_expense'),
      note: typeof t.note === 'string' ? t.note : '',
      date: typeof t.date === 'string' ? t.date : new Date().toISOString()
    }))

  data.assets = data.assets
    .filter(a => a && typeof a === 'object')
    .map(a => ({
      id: a.id || generateId('a'),
      name: a.name || '未命名',
      category: a.category || 'other',
      balance: typeof a.balance === 'number' ? a.balance : 0,
      note: typeof a.note === 'string' ? a.note : ''
    }))

  data.version = 5
  return data
}

// ============================================
// 计算
// ============================================

export function totalDebt(data) {
  return (data.debts || []).reduce((sum, d) => sum + d.principal, 0)
}

export function totalOriginal(data) {
  return (data.debts || []).reduce((sum, d) => sum + d.originalPrincipal, 0)
}

export function totalPaid(data) {
  return (data.debts || []).reduce((sum, d) => sum + (d.originalPrincipal - d.principal), 0)
}

export function totalRemainingPeriods(data) {
  return (data.debts || []).reduce((sum, d) => sum + d.remainingPeriods, 0)
}

export function totalAssets(data) {
  return (data.assets || []).reduce((sum, a) => sum + a.balance, 0)
}

export function netWorth(data) {
  return totalAssets(data) - totalDebt(data)
}

// 月可支配 = 工资 + 滴滴收入 - 生活费
export function monthlyDisposable(settings) {
  return (settings.monthlyIncome || 0)
    + (settings.didiIncome || 0)
    - (settings.monthlyExpense || 0)
}

// 距 startDate 已过去的月数
export function monthsElapsedSince(settings, now = new Date()) {
  const start = new Date(settings.startDate)
  if (isNaN(start.getTime())) return 0
  return Math.max(0,
    (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth()))
}

// 当月应还月供（按剩余期数递减推算）
export function currentMonthPayment(data, now = new Date()) {
  const elapsed = monthsElapsedSince(data.settings, now)
  return (data.debts || []).reduce((sum, d) => {
    return d.remainingPeriods > elapsed ? sum + d.monthlyPayment : sum
  }, 0)
}

export function getCurrentStage(now = new Date()) {
  for (let i = STAGES.length - 1; i >= 0; i--) {
    if (now >= new Date(STAGES[i].endDate)) return STAGES[i]
  }
  return STAGES[0]
}

// 全周期月度还款推演：每月还款额 + 工资剩余
export function buildMonthlyPlan(data, maxMonths = 60) {
  const start = new Date(data.settings.startDate)
  if (isNaN(start.getTime())) return []

  const disposable = monthlyDisposable(data.settings)
  const states = (data.debts || []).map(d => ({
    name: d.name,
    monthlyPayment: d.monthlyPayment,
    dueDay: d.dueDay,
    monthsLeft: d.remainingPeriods
  }))

  const now = new Date()
  const plan = []
  const cursor = new Date(start)

  while (states.some(s => s.monthsLeft > 0) && plan.length < maxMonths) {
    const active = states.filter(s => s.monthsLeft > 0)
    const totalPayment = active.reduce((sum, s) => sum + s.monthlyPayment, 0)
    plan.push({
      year: cursor.getFullYear(),
      month: cursor.getMonth() + 1,
      totalPayment,
      disposable,
      remaining: disposable - totalPayment,
      debts: active.map(s => ({ name: s.name, amount: s.monthlyPayment, dueDay: s.dueDay })),
      isCurrent: cursor.getFullYear() === now.getFullYear() && cursor.getMonth() === now.getMonth()
    })
    states.forEach(s => { if (s.monthsLeft > 0) s.monthsLeft -= 1 })
    cursor.setMonth(cursor.getMonth() + 1)
  }

  return plan
}

// 某月计划收入：优先取按月覆盖值，否则为「工资 + 滴滴」
export function plannedIncomeOfMonth(settings, year, month) {
  const key = `${year}-${String(month).padStart(2, '0')}`
  const override = (settings.monthlyIncomeOverrides || {})[key]
  if (typeof override === 'number') return override
  return (settings.monthlyIncome || 0) + (settings.didiIncome || 0)
}

// 某月账目汇总
export function monthlyBudget(data, year, month) {
  const prefix = `${year}-${String(month).padStart(2, '0')}`
  const list = (data.transactions || []).filter(t => (t.date || '').slice(0, 7) === prefix)

  const spent = list.filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)
  const earned = list.filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)

  const expenseBudget = data.settings.monthlyExpense || 0
  const plannedIncome = plannedIncomeOfMonth(data.settings, year, month)

  // 当月应还：按该月距起始日的月数推算
  const elapsed = Math.max(0,
    (year - new Date(data.settings.startDate).getFullYear()) * 12 +
    (month - 1 - new Date(data.settings.startDate).getMonth()))
  const plannedPayment = (data.debts || []).reduce((sum, d) => {
    return d.remainingPeriods > elapsed ? sum + d.monthlyPayment : sum
  }, 0)

  return {
    list,
    spent,
    earned,
    expenseBudget,
    expenseLeft: expenseBudget - spent,
    plannedIncome,
    plannedPayment,
    freeToSpend: plannedIncome - plannedPayment - spent
  }
}
