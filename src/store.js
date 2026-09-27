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
  totalAssets,
  netWorth,
  monthlyDisposable,
  currentMonthPayment,
  getCurrentStage,
  buildMonthlyPlan
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
  assets: totalAssets(state),
  net: netWorth(state),
  paidPercent: totalOriginal(state) > 0
    ? Math.round((totalPaid(state) / totalOriginal(state)) * 100)
    : 0,
  disposable: monthlyDisposable(state.settings),
  monthPayment: currentMonthPayment(state),
  stage: getCurrentStage()
}))

// 债务按剩余本金升序（小额优先）
export const sortedDebts = computed(() =>
  [...state.debts].sort((a, b) => (a.principal || 0) - (b.principal || 0))
)

export const monthlyPlan = computed(() => buildMonthlyPlan(state))

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
// 记账操作
// ============================================

export function saveTransaction(tx) {
  const idx = state.transactions.findIndex(t => t.id === tx.id)
  if (idx >= 0) {
    state.transactions[idx] = { ...state.transactions[idx], ...tx }
  } else {
    state.transactions.push({
      id: generateId('t'),
      date: new Date().toISOString(),
      note: '',
      ...tx
    })
  }
}

export function deleteTransaction(id) {
  state.transactions = state.transactions.filter(t => t.id !== id)
}

// ============================================
// 资产操作
// ============================================

export function saveAsset(asset) {
  const idx = state.assets.findIndex(a => a.id === asset.id)
  if (idx >= 0) {
    state.assets[idx] = { ...state.assets[idx], ...asset }
  } else {
    state.assets.push({
      id: generateId('a'),
      note: '',
      ...asset
    })
  }
}

export function deleteAsset(id) {
  state.assets = state.assets.filter(a => a.id !== id)
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

// 本地资产为空时，从 assets.json 补齐默认资产（保留用户已有资产）
export async function syncAssetsIfEmpty() {
  if (state.assets.length > 0) return
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}assets.json?t=${Date.now()}`)
    if (!res.ok) return
    const json = await res.json()
    if (json && Array.isArray(json.assets) && json.assets.length > 0) {
      state.assets = json.assets
    }
  } catch (e) {
    console.warn('加载 assets.json 失败：', e)
  }
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
