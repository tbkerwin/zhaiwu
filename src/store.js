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
  totalFixedFees,
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
  fixedFees: totalFixedFees(state.settings),
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
// 记账操作（关联资产，余额联动）
// ============================================

function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100
}

// 对某个资产余额施加增量
function applyAssetDelta(assetId, delta) {
  if (!assetId || !delta) return
  const asset = state.assets.find(a => a.id === assetId)
  if (asset) asset.balance = round2(asset.balance + delta)
}

// 撤销一条记录对资产的影响（assetDelta 缺失时按类型推算）
function revertAssetEffect(tx) {
  if (!tx || !tx.assetId) return
  const delta = typeof tx.assetDelta === 'number'
    ? tx.assetDelta
    : (tx.type === 'income' ? tx.amount : -tx.amount)
  applyAssetDelta(tx.assetId, -delta)
}

export function saveTransaction(tx) {
  const list = state.transactions
  const idx = tx.id ? list.findIndex(t => t.id === tx.id) : -1

  // 编辑时先撤销原记录对资产的影响
  if (idx >= 0) revertAssetEffect(list[idx])

  const amount = Number(tx.amount) || 0
  const assetId = tx.assetId || null
  const assetDelta = assetId ? (tx.type === 'income' ? amount : -amount) : 0

  if (idx >= 0) {
    list[idx] = { ...list[idx], ...tx, assetId, assetDelta }
  } else {
    list.push({
      note: '',
      ...tx,
      id: tx.id || generateId('t'),
      date: tx.date || new Date().toISOString(),
      assetId,
      assetDelta
    })
  }

  // 应用新记录对资产的影响
  applyAssetDelta(assetId, assetDelta)
}

export function deleteTransaction(id) {
  const tx = state.transactions.find(t => t.id === id)
  if (tx) revertAssetEffect(tx)
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
