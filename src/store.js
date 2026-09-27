// ============================================
// 应用状态：单一数据源 + 自动持久化
// ============================================

import { reactive, computed, watch } from 'vue'
import {
  STORAGE_KEY,
  getDefaultData,
  normalizeData,
  generateId,
  totalDebt,
  totalOriginal,
  totalPaid,
  totalRemainingPeriods,
  monthlyDisposable,
  totalFixedFees,
  currentMonthPayment,
  getCurrentStage,
  buildMonthlyPlan,
  buildMonthTimelines
} from './lib/data'

function readStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return getDefaultData()
    return normalizeData(JSON.parse(raw))
  } catch (e) {
    console.error('读取本地数据失败：', e)
    return getDefaultData()
  }
}

export const state = reactive(readStored())

// 任何改动自动写回 localStorage
watch(state, () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (e) {
    console.error('保存本地数据失败：', e)
  }
}, { deep: true })

// ============================================
// 派生数据
// ============================================

export const totals = computed(() => ({
  debt: totalDebt(state),
  original: totalOriginal(state),
  paid: totalPaid(state),
  remainingPeriods: totalRemainingPeriods(state),
  paidPercent: totalOriginal(state) > 0
    ? Math.round((totalPaid(state) / totalOriginal(state)) * 100)
    : 0,
  disposable: monthlyDisposable(state.settings),
  fixedFees: totalFixedFees(state.settings),
  monthPayment: currentMonthPayment(state),
  stage: getCurrentStage()
}))

// 债务按剩余本金升序（小额优先）
export const sortedDebts = computed(() =>
  [...state.debts].sort((a, b) => (a.principal || 0) - (b.principal || 0))
)

export const monthlyPlan = computed(() => buildMonthlyPlan(state))

// 日级时间线：每月按日列出收入与还款，含每日余额与资金流向
export const monthTimelines = computed(() => buildMonthTimelines(state))

// ============================================
// 债务操作
// ============================================

export function saveDebt(debt) {
  const idx = state.debts.findIndex(d => d.id === debt.id)
  if (idx >= 0) {
    state.debts[idx] = { ...state.debts[idx], ...debt }
  } else {
    state.debts.push({
      id: generateId('d'),
      paidHistory: [],
      originalPrincipal: debt.principal || 0,
      ...debt
    })
  }
}

export function deleteDebt(id) {
  state.debts = state.debts.filter(d => d.id !== id)
}

// 提前还款：减少剩余本金，本金归零时结束该笔债务
export function prepayDebt(id, amount) {
  const debt = state.debts.find(d => d.id === id)
  if (!debt || !amount || amount <= 0) return
  debt.paidHistory = debt.paidHistory || []
  debt.paidHistory.push({ date: new Date().toISOString(), amount })
  debt.principal = Math.max(0, debt.principal - amount)
  if (debt.principal === 0) debt.remainingPeriods = 0
}

// ============================================
// 固定扣费（会员等自动扣款）
// ============================================

export function saveFixedFee(fee) {
  const list = state.settings.fixedFees
  const idx = list.findIndex(f => f.id === fee.id)
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...fee }
  } else {
    list.push({ id: generateId('f'), name: '扣费项', amount: 0, ...fee })
  }
}

export function deleteFixedFee(id) {
  state.settings.fixedFees = state.settings.fixedFees.filter(f => f.id !== id)
}

// ============================================
// 设置与数据管理
// ============================================

export function updateSettings(patch) {
  Object.assign(state.settings, patch)
}

export function exportJSON() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `负债数据_${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export async function importJSON(file) {
  const text = await file.text()
  const data = normalizeData(JSON.parse(text))
  if (!Array.isArray(data.debts) || !data.settings) {
    throw new Error('数据格式不正确')
  }
  Object.assign(state, data)
}

export function resetAll() {
  Object.assign(state, getDefaultData())
}

// 清理 Service Worker 与缓存后重新加载（用于卡在旧版本的设备）
export async function forceUpdate() {
  try {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations()
      await Promise.all(regs.map(r => r.unregister()))
    }
  } catch (e) { /* 忽略 */ }
  try {
    if (window.caches) {
      const keys = await caches.keys()
      await Promise.all(keys.map(k => caches.delete(k)))
    }
  } catch (e) { /* 忽略 */ }
  const url = new URL(location.href)
  url.searchParams.set('t', Date.now())
  location.replace(url.toString())
}
