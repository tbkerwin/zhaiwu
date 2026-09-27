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
    firstMonthPayment: 418.83, // 首月金额与后续不同
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
    remainingPeriods: 7, dueDay: 15,
    note: '分期 7 期，每月 15 日还款',
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
  emergencyReserve: 4800,   // 应急储备底线（备用金最低点 4975，红线 4800）
  startDate: '2026-10-01',
  strategy: 'conservative',
  // 每月固定会员扣费（自动扣款，计入硬性支出）
  fixedFees: [
    { id: 'fee1', name: '会员扣费 1', amount: 68 },
    { id: 'fee2', name: '会员扣费 2', amount: 11 }
  ],
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
    version: 6
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
  // 兼容 v2 及更早数据：补齐固定扣费字段（已存在则保留，包括空数组）
  if (!Array.isArray(s.fixedFees)) {
    s.fixedFees = JSON.parse(JSON.stringify(def.fixedFees))
  } else {
    s.fixedFees = s.fixedFees
      .filter(f => f && typeof f === 'object')
      .map(f => ({
        id: f.id || generateId('f'),
        name: f.name || '扣费项',
        amount: typeof f.amount === 'number' ? f.amount : 0
      }))
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
      firstMonthPayment: typeof d.firstMonthPayment === 'number' ? d.firstMonthPayment : null,
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
      date: typeof t.date === 'string' ? t.date : new Date().toISOString(),
      // 关联资产：assetId 记录资金来自/去往哪个资产，
      // assetDelta 记录当时对资产余额的增减，便于编辑/删除时精确还原
      assetId: typeof t.assetId === 'string' ? t.assetId : null,
      assetDelta: typeof t.assetDelta === 'number' ? t.assetDelta : null
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

  // 一次性修正：花呗还款日为每月 15 日（早期数据默认写成了 5 日）
  if (!data.version || data.version < 6) {
    data.debts.forEach(d => {
      if (d.name === '花呗' && d.dueDay === 5) d.dueDay = 15
    })
  }

  data.version = 6
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

// 每月固定扣费合计（会员等自动扣款，计入硬性支出）
export function totalFixedFees(settings) {
  return (settings.fixedFees || []).reduce((sum, f) => sum + (f.amount || 0), 0)
}

// 月可支配 = 工资 + 滴滴收入 − 生活费 − 固定扣费
export function monthlyDisposable(settings) {
  return (settings.monthlyIncome || 0)
    + (settings.didiIncome || 0)
    - (settings.monthlyExpense || 0)
    - totalFixedFees(settings)
}

// 距 startDate 已过去的月数
export function monthsElapsedSince(settings, now = new Date()) {
  const start = new Date(settings.startDate)
  if (isNaN(start.getTime())) return 0
  return Math.max(0,
    (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth()))
}

// 当月应还月供（按剩余期数递减推算，首月按 firstMonthPayment 计）
export function currentMonthPayment(data, now = new Date()) {
  const start = new Date(data.settings.startDate)
  if (isNaN(start.getTime())) return 0

  const elapsed = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth())
  if (elapsed < 0) return 0 // 计划尚未开始

  return (data.debts || []).reduce((sum, d) => {
    if (d.remainingPeriods <= elapsed) return sum
    return sum + paymentOfMonth(d, elapsed)
  }, 0)
}

// 某笔债务在指定月序（0 = 起始月）的应还金额
export function paymentOfMonth(debt, monthIndex) {
  return monthIndex === 0 && debt.firstMonthPayment
    ? debt.firstMonthPayment
    : debt.monthlyPayment
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
    firstMonthPayment: d.firstMonthPayment,
    dueDay: d.dueDay,
    monthsLeft: d.remainingPeriods
  }))

  const now = new Date()
  const plan = []
  const cursor = new Date(start)

  while (states.some(s => s.monthsLeft > 0) && plan.length < maxMonths) {
    const monthIndex = plan.length
    const active = states.filter(s => s.monthsLeft > 0)
    const totalPayment = active.reduce((sum, s) => sum + paymentOfMonth(s, monthIndex), 0)
    plan.push({
      year: cursor.getFullYear(),
      month: cursor.getMonth() + 1,
      totalPayment,
      disposable,
      remaining: disposable - totalPayment,
      debts: active.map(s => ({
        name: s.name,
        amount: paymentOfMonth(s, monthIndex),
        dueDay: s.dueDay
      })),
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

// 某月刚性还款额：按该月距起始日的月数推算（起始月按 firstMonthPayment 计）
// 早于计划起始月的月份不计还款
export function repaymentOfMonth(data, year, month) {
  const start = new Date(data.settings.startDate)
  if (isNaN(start.getTime())) return 0

  const elapsed = (year - start.getFullYear()) * 12 + (month - 1 - start.getMonth())
  if (elapsed < 0) return 0

  return (data.debts || []).reduce((sum, d) => {
    if (d.remainingPeriods <= elapsed) return sum
    return sum + paymentOfMonth(d, elapsed)
  }, 0)
}

// 某月计划状态：计划收入 / 计划还款 / 固定扣费 / 本月差额
export function monthlyPlanStatus(data, year, month) {
  const plannedIncome = plannedIncomeOfMonth(data.settings, year, month)
  const plannedPayment = repaymentOfMonth(data, year, month)
  const fixedFees = totalFixedFees(data.settings)
  const expense = data.settings.monthlyExpense || 0

  return {
    plannedIncome,
    plannedPayment,
    fixedFees,
    expense,
    // 本月差额 = 计划收入 − 计划还款 − 固定扣费
    balance: plannedIncome - plannedPayment - fixedFees
  }
}

// ============================================
// 日级日历：收入/还款按日排布 + 资金流向
// ============================================

// 发薪日：20 号 4000，28 号余额部分；滴滴按 28 日到账（保守计入）
export const PAYDAY_MAIN = 20
export const PAYDAY_REST = 28
export const SALARY_MAIN_AMOUNT = 4000

export function incomeEventsOfMonth(settings, year, month) {
  const key = `${year}-${String(month).padStart(2, '0')}`
  const override = (settings.monthlyIncomeOverrides || {})[key]

  // 有按月覆盖值的月份（如 2026-09 只有 28 号一笔 400 元）
  if (typeof override === 'number') {
    return override > 0
      ? [{ day: PAYDAY_REST, label: '工资（28 号）', amount: override }]
      : []
  }

  const base = settings.monthlyIncome || 0
  const main = Math.min(SALARY_MAIN_AMOUNT, base)
  const rest = Math.max(0, base - main)

  const events = []
  if (main > 0) events.push({ day: PAYDAY_MAIN, label: '工资（20 号）', amount: main })
  if (rest > 0) events.push({ day: PAYDAY_REST, label: '工资（28 号）', amount: rest })

  const didi = settings.didiIncome || 0
  if (didi > 0) events.push({ day: PAYDAY_REST, label: '滴滴收入（月目标）', amount: didi })

  return events
}

// 生成全周期日级时间线：每月包含收入/还款事件、每日余额、资金流向
export function buildMonthTimelines(data, maxMonths = 60) {
  const settings = data.settings
  const start = new Date(settings.startDate)
  if (isNaN(start.getTime())) return []

  const states = (data.debts || []).map(d => ({
    name: d.name,
    dueDay: d.dueDay || 5,
    monthlyPayment: d.monthlyPayment,
    firstMonthPayment: d.firstMonthPayment,
    monthsLeft: d.remainingPeriods
  }))

  const now = new Date()
  const timelines = []
  const cursor = new Date(start)
  let carry = settings.initialSavings || 0

  while (states.some(s => s.monthsLeft > 0) && timelines.length < maxMonths) {
    const elapsed = timelines.length
    const year = cursor.getFullYear()
    const month = cursor.getMonth() + 1

    // 收入事件
    const incomes = incomeEventsOfMonth(settings, year, month)

    // 还款事件：按还款日分组
    const byDay = new Map()
    states.forEach(s => {
      if (s.monthsLeft <= 0) return
      const day = s.dueDay
      if (!byDay.has(day)) byDay.set(day, [])
      byDay.get(day).push({ name: s.name, amount: paymentOfMonth(s, elapsed) })
    })

    const rawEvents = [
      ...incomes.map(e => ({
        day: e.day, type: 'income', label: e.label, amount: e.amount, items: []
      })),
      ...[...byDay.entries()].map(([day, items]) => ({
        day,
        type: 'payment',
        label: items.map(i => i.name).join(' + '),
        amount: items.reduce((sum, i) => sum + i.amount, 0),
        items
      }))
    ].sort((a, b) => a.day - b.day)

    // 资金池：月初结转 → 各笔已到账收入，支出按到账顺序消耗
    const pool = [{ label: '月初结转', remaining: carry }]
    let balance = carry

    const events = rawEvents.map(ev => {
      if (ev.type === 'income') {
        balance += ev.amount
        pool.push({ label: `${ev.day} 日${ev.label}`, remaining: ev.amount })
        return { ...ev, balanceAfter: balance, sources: [] }
      }

      let need = ev.amount
      const sources = []
      for (const p of pool) {
        if (need <= 0) break
        if (p.remaining <= 0) continue
        const use = Math.min(p.remaining, need)
        p.remaining -= use
        need -= use
        sources.push({ label: p.label, amount: use })
      }
      balance -= ev.amount
      return { ...ev, balanceAfter: balance, sources, shortfall: Math.max(0, need) }
    })

    const totalIncome = incomes.reduce((sum, e) => sum + e.amount, 0)
    const totalPayment = rawEvents
      .filter(e => e.type === 'payment')
      .reduce((sum, e) => sum + e.amount, 0)

    timelines.push({
      year,
      month,
      carryIn: carry,
      carryOut: carry + totalIncome - totalPayment,
      totalIncome,
      totalPayment,
      events,
      isCurrent: year === now.getFullYear() && month === now.getMonth() + 1
    })

    carry = carry + totalIncome - totalPayment
    states.forEach(s => { if (s.monthsLeft > 0) s.monthsLeft -= 1 })
    cursor.setMonth(cursor.getMonth() + 1)
  }

  return timelines
}
