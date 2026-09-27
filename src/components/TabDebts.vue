<template>
  <div class="page">
    <div class="section-title">
      <span>所有债务（小额优先）</span>
      <button class="btn-link" @click="openDebt()">+ 添加</button>
    </div>

    <div v-if="sortedDebts.length === 0" class="empty">
      <div class="empty-icon">🎉</div>
      <div>还没有债务记录</div>
    </div>

    <div
      v-for="d in sortedDebts"
      :key="d.id"
      class="item"
      @click="openDebt(d)"
    >
      <div class="item-head">
        <div class="item-main">
          <div class="item-icon">{{ typeIcon(d.type) }}</div>
          <div style="min-width: 0">
            <div class="item-name">{{ d.name }}</div>
            <div class="item-meta">
              {{ d.type }} · 每月 {{ fmt(d.monthlyPayment) }} · {{ d.dueDay }} 日
            </div>
            <div class="item-meta">首期 {{ firstDueLabel(d) }}</div>
          </div>
        </div>
        <div style="text-align: right; flex: none">
          <div class="item-value">{{ fmt(d.principal) }}</div>
          <div class="item-meta">剩 {{ d.remainingPeriods }} 期</div>
        </div>
      </div>
      <div class="progress">
        <div class="progress-fill" :style="{ width: paidPercent(d) + '%' }"></div>
      </div>
      <div class="item-meta">已还 {{ paidPercent(d) }}%</div>
      <div v-if="d.note" class="item-meta">{{ d.note }}</div>
      <button class="btn btn-secondary" style="margin-top: 10px" @click.stop="openPrepay(d)">
        提前还款
      </button>
    </div>

    <!-- 债务编辑 -->
    <BaseModal
      :open="debtOpen"
      :title="editingId ? '编辑债务' : '添加债务'"
      @close="debtOpen = false"
      @save="saveDebtItem"
    >
      <div class="field">
        <label>名称</label>
        <input v-model="form.name" type="text" placeholder="例如：信用卡 1">
      </div>
      <div class="field">
        <label>类型</label>
        <select v-model="form.type">
          <option v-for="t in DEBT_TYPES" :key="t" :value="t">{{ t }}</option>
        </select>
      </div>
      <div class="field">
        <label>剩余本金（元）</label>
        <input v-model="form.principal" type="number" inputmode="decimal" placeholder="0.00">
      </div>
      <div class="field">
        <label>每月还款额（元）</label>
        <input v-model="form.monthlyPayment" type="number" inputmode="decimal" placeholder="0.00">
      </div>
      <div class="field">
        <label>剩余期数</label>
        <input v-model="form.remainingPeriods" type="number" inputmode="numeric" placeholder="0">
      </div>
      <div class="field">
        <label>还款日（每月几号）</label>
        <input v-model="form.dueDay" type="number" inputmode="numeric" placeholder="5">
      </div>
      <div class="field">
        <label>首期延后月数（0 = 计划起始月当月开始）</label>
        <input v-model="form.startOffset" type="number" inputmode="numeric" placeholder="0">
      </div>
      <div class="field">
        <label>备注（可选）</label>
        <input v-model="form.note" type="text">
      </div>

      <template #footer>
        <button v-if="editingId" class="btn btn-danger" @click="removeDebtItem">删除此债务</button>
      </template>
    </BaseModal>

    <!-- 提前还款 -->
    <BaseModal
      :open="prepayOpen"
      title="提前还款"
      @close="prepayOpen = false"
      @save="doPrepay"
    >
      <div v-if="prepayTarget" class="muted" style="margin-bottom: 12px">
        {{ prepayTarget.name }} · 当前剩余本金 {{ fmt(prepayTarget.principal) }}
      </div>
      <div class="field">
        <label>提前还款金额（元）</label>
        <input v-model="prepayAmount" type="number" inputmode="decimal" placeholder="0.00">
      </div>
      <div class="muted">本金归零后，该笔债务视为已结清。</div>
    </BaseModal>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import BaseModal from './BaseModal.vue'
import { state, sortedDebts, saveDebt, deleteDebt, prepayDebt } from '../store'
import { formatMoney, getDebtTypeIcon, debtFirstDueMonth, DEBT_TYPES } from '../lib/data'
import { showToast } from '../lib/toast'

const fmt = formatMoney
const typeIcon = getDebtTypeIcon

function paidPercent(d) {
  if (!d.originalPrincipal || d.originalPrincipal <= 0) return 0
  return Math.round(((d.originalPrincipal - d.principal) / d.originalPrincipal) * 100)
}

// 首期年月展示：如「2026/11 · 5 日」
function firstDueLabel(d) {
  const m = debtFirstDueMonth(d, state.settings.startDate)
  if (!m) return '—'
  return `${m.year}/${String(m.month).padStart(2, '0')} · ${d.dueDay} 日`
}

// ===== 编辑债务 =====
const debtOpen = ref(false)
const editingId = ref(null)
const form = reactive({
  name: '', type: '信用卡', principal: '', monthlyPayment: '',
  remainingPeriods: '', dueDay: 5, startOffset: 0, note: ''
})

function openDebt(debt = null) {
  editingId.value = debt ? debt.id : null
  Object.assign(form, {
    name: debt ? debt.name : '',
    type: debt ? debt.type : '信用卡',
    principal: debt ? String(debt.principal) : '',
    monthlyPayment: debt ? String(debt.monthlyPayment) : '',
    remainingPeriods: debt ? String(debt.remainingPeriods) : '',
    dueDay: debt ? String(debt.dueDay) : '5',
    startOffset: debt ? String(debt.startOffset || 0) : '0',
    note: debt ? debt.note : ''
  })
  debtOpen.value = true
}

function saveDebtItem() {
  if (!form.name.trim()) {
    showToast('请填写名称')
    return
  }
  saveDebt({
    id: editingId.value || undefined,
    name: form.name.trim(),
    type: form.type,
    principal: parseFloat(form.principal) || 0,
    monthlyPayment: parseFloat(form.monthlyPayment) || 0,
    remainingPeriods: parseInt(form.remainingPeriods, 10) || 0,
    dueDay: parseInt(form.dueDay, 10) || 5,
    startOffset: Math.max(0, parseInt(form.startOffset, 10) || 0),
    note: form.note.trim()
  })
  debtOpen.value = false
  showToast('已保存')
}

function removeDebtItem() {
  if (!editingId.value) return
  if (!confirm('确定删除此债务吗？')) return
  deleteDebt(editingId.value)
  debtOpen.value = false
  showToast('已删除')
}

// ===== 提前还款 =====
const prepayOpen = ref(false)
const prepayTarget = ref(null)
const prepayAmount = ref('')

function openPrepay(debt) {
  prepayTarget.value = debt
  prepayAmount.value = ''
  prepayOpen.value = true
}

function doPrepay() {
  const amount = parseFloat(prepayAmount.value)
  if (!amount || amount <= 0) {
    showToast('请输入有效金额')
    return
  }
  prepayDebt(prepayTarget.value.id, amount)
  prepayOpen.value = false
  showToast('已记录提前还款')
}
</script>
