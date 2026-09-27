<template>
  <div class="page">
    <!-- 资产 -->
    <div class="card">
      <div class="section-title">
        <span>💎 我的资产</span>
        <button class="btn-link" @click="openAsset()">+ 添加</button>
      </div>

      <div v-if="state.assets.length === 0" class="muted">暂无资产，点击右上角添加</div>

      <div
        v-for="a in state.assets"
        :key="a.id"
        class="item"
        style="margin-bottom: 8px"
        @click="openAsset(a)"
      >
        <div class="item-head">
          <div class="item-main">
            <div class="item-icon">{{ assetMeta(a.category).icon }}</div>
            <div style="min-width: 0">
              <div class="item-name">{{ a.name }}</div>
              <div class="item-meta">
                {{ assetMeta(a.category).name }}{{ a.note ? ' · ' + a.note : '' }}
              </div>
            </div>
          </div>
          <div class="item-value">{{ fmt(a.balance) }}</div>
        </div>
      </div>

      <div v-if="state.assets.length > 0" class="card-row">
        <span class="row-label">资产合计</span>
        <span class="row-value">{{ fmt(totals.assets) }}</span>
      </div>
      <div class="muted" style="margin-top: 6px">
        在「记账」中关联资产后，余额会随每笔收支自动增减
      </div>
    </div>

    <!-- 固定扣费 -->
    <div class="card">
      <div class="section-title">
        <span>🔁 固定扣费（硬性支出）</span>
        <button class="btn-link" @click="openFee()">+ 添加</button>
      </div>

      <div v-if="feeList.length === 0" class="muted">暂无固定扣费</div>

      <div
        v-for="f in feeList"
        :key="f.id"
        class="item"
        style="margin-bottom: 8px"
        @click="openFee(f)"
      >
        <div class="item-head">
          <div class="item-name">{{ f.name }}</div>
          <div class="item-value">{{ fmt(f.amount) }}</div>
        </div>
      </div>

      <div v-if="feeList.length > 0" class="card-row">
        <span class="row-label">每月合计</span>
        <span class="row-value">{{ fmt(totals.fixedFees) }}</span>
      </div>
      <div class="muted" style="margin-top: 6px">自动扣款，不可压缩，已计入每月可支配测算</div>
    </div>

    <!-- 每月资金 -->
    <div class="card">
      <div class="section-title">每月资金</div>
      <div class="field">
        <label>每月工资（元）</label>
        <input v-model="form.monthlyIncome" type="number" inputmode="decimal">
      </div>
      <div class="field">
        <label>每月生活费（元）</label>
        <input v-model="form.monthlyExpense" type="number" inputmode="decimal">
      </div>
      <div class="field">
        <label>滴滴月收入目标（元）</label>
        <input v-model="form.didiIncome" type="number" inputmode="decimal">
      </div>
      <div class="field">
        <label>初始备用存款（元）</label>
        <input v-model="form.initialSavings" type="number" inputmode="decimal">
      </div>
      <div class="field">
        <label>应急储备底线（元，原则上不动用）</label>
        <input v-model="form.emergencyReserve" type="number" inputmode="decimal">
      </div>
      <div class="field">
        <label>计划起始月</label>
        <input v-model="form.startDate" type="date">
      </div>
      <div class="card-row">
        <span class="row-label">当前生效的月可支配</span>
        <span class="row-value">{{ fmt(totals.disposable) }}</span>
      </div>
      <button class="btn btn-primary" @click="saveSettingsForm">保存设置</button>
    </div>

    <!-- 数据管理 -->
    <div class="card">
      <div class="section-title">数据管理</div>
      <button class="btn btn-secondary" @click="onForceUpdate">检查更新</button>
      <button class="btn btn-secondary" @click="exportJSON">导出数据</button>
      <button class="btn btn-secondary" @click="fileInput.click()">导入数据</button>
      <button class="btn btn-danger" @click="onReset">重置数据</button>
      <input
        ref="fileInput"
        type="file"
        accept=".json"
        style="display: none"
        @change="onImport"
      >
    </div>

    <!-- 关于 -->
    <div class="card">
      <div class="section-title">关于</div>
      <div class="muted">个人负债消除追踪 PWA</div>
      <div class="muted" style="margin-top: 4px">
        所有数据仅保存在本机浏览器，不上传任何服务器
      </div>
      <div class="muted" style="margin-top: 4px">版本 v2.0（Vue 3 + Vite）</div>
    </div>

    <!-- 资产编辑 -->
    <BaseModal
      :open="assetOpen"
      :title="assetEditingId ? '编辑资产' : '添加资产'"
      @close="assetOpen = false"
      @save="saveAssetItem"
    >
      <div class="field">
        <label>资产名称</label>
        <input v-model="assetForm.name" type="text" placeholder="例如：支付宝余额">
      </div>
      <div class="field">
        <label>余额（元）</label>
        <input v-model="assetForm.balance" type="number" inputmode="decimal" placeholder="0.00">
      </div>
      <div class="field">
        <label>分类</label>
        <div class="cat-grid">
          <button
            v-for="c in ASSET_CATEGORIES"
            :key="c.id"
            class="cat-btn"
            :class="{ active: assetForm.category === c.id }"
            @click="assetForm.category = c.id"
          >
            <span class="cat-icon">{{ c.icon }}</span>
            {{ c.name }}
          </button>
        </div>
      </div>
      <div class="field">
        <label>备注（可选）</label>
        <input v-model="assetForm.note" type="text">
      </div>

      <template #footer>
        <button v-if="assetEditingId" class="btn btn-danger" @click="removeAssetItem">
          删除这笔资产
        </button>
      </template>
    </BaseModal>

    <!-- 固定扣费编辑 -->
    <BaseModal
      :open="feeOpen"
      :title="feeEditingId ? '编辑扣费项' : '添加扣费项'"
      @close="feeOpen = false"
      @save="saveFeeItem"
    >
      <div class="field">
        <label>名称</label>
        <input v-model="feeForm.name" type="text" placeholder="例如：视频会员">
      </div>
      <div class="field">
        <label>每月金额（元）</label>
        <input v-model="feeForm.amount" type="number" inputmode="decimal" placeholder="0.00">
      </div>

      <template #footer>
        <button v-if="feeEditingId" class="btn btn-danger" @click="removeFeeItem">删除此扣费项</button>
      </template>
    </BaseModal>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import BaseModal from './BaseModal.vue'
import {
  state,
  totals,
  updateSettings,
  exportJSON,
  importJSON,
  resetAll,
  forceUpdate,
  saveAsset,
  deleteAsset,
  saveFixedFee,
  deleteFixedFee
} from '../store'
import { formatMoney, getAssetCategoryMeta, ASSET_CATEGORIES } from '../lib/data'
import { showToast } from '../lib/toast'

const fmt = formatMoney
const assetMeta = getAssetCategoryMeta
const fileInput = ref(null)

// ===== 固定扣费 =====
const feeList = computed(() => state.settings.fixedFees || [])
const feeOpen = ref(false)
const feeEditingId = ref(null)
const feeForm = reactive({ name: '', amount: '' })

function openFee(fee = null) {
  feeEditingId.value = fee ? fee.id : null
  feeForm.name = fee ? fee.name : ''
  feeForm.amount = fee ? String(fee.amount) : ''
  feeOpen.value = true
}

function saveFeeItem() {
  if (!feeForm.name.trim()) {
    showToast('请填写名称')
    return
  }
  saveFixedFee({
    id: feeEditingId.value || undefined,
    name: feeForm.name.trim(),
    amount: parseFloat(feeForm.amount) || 0
  })
  feeOpen.value = false
  showToast('已保存')
}

function removeFeeItem() {
  if (!feeEditingId.value) return
  if (!confirm('确定删除此扣费项吗？')) return
  deleteFixedFee(feeEditingId.value)
  feeOpen.value = false
  showToast('已删除')
}

// ===== 设置 =====
const form = reactive({
  monthlyIncome: state.settings.monthlyIncome,
  monthlyExpense: state.settings.monthlyExpense,
  didiIncome: state.settings.didiIncome,
  initialSavings: state.settings.initialSavings,
  emergencyReserve: state.settings.emergencyReserve,
  startDate: state.settings.startDate
})

function saveSettingsForm() {
  updateSettings({
    monthlyIncome: parseFloat(form.monthlyIncome) || 0,
    monthlyExpense: parseFloat(form.monthlyExpense) || 0,
    didiIncome: parseFloat(form.didiIncome) || 0,
    initialSavings: parseFloat(form.initialSavings) || 0,
    emergencyReserve: parseFloat(form.emergencyReserve) || 0,
    startDate: form.startDate || state.settings.startDate
  })
  showToast('设置已保存')
}

// ===== 资产 =====
const assetOpen = ref(false)
const assetEditingId = ref(null)
const assetForm = reactive({ name: '', balance: '', category: 'liquid', note: '' })

function openAsset(asset = null) {
  assetEditingId.value = asset ? asset.id : null
  Object.assign(assetForm, {
    name: asset ? asset.name : '',
    balance: asset ? String(asset.balance) : '',
    category: asset ? asset.category : 'liquid',
    note: asset ? asset.note : ''
  })
  assetOpen.value = true
}

function saveAssetItem() {
  if (!assetForm.name.trim()) {
    showToast('请填写资产名称')
    return
  }
  saveAsset({
    id: assetEditingId.value || undefined,
    name: assetForm.name.trim(),
    balance: parseFloat(assetForm.balance) || 0,
    category: assetForm.category,
    note: assetForm.note.trim()
  })
  assetOpen.value = false
  showToast('已保存')
}

function removeAssetItem() {
  if (!assetEditingId.value) return
  if (!confirm('确定删除这笔资产吗？')) return
  deleteAsset(assetEditingId.value)
  assetOpen.value = false
  showToast('已删除')
}

// ===== 数据管理 =====
async function onImport(e) {
  const file = e.target.files && e.target.files[0]
  if (!file) return
  try {
    await importJSON(file)
    showToast('数据已导入')
  } catch (err) {
    showToast('导入失败：' + err.message)
  }
  e.target.value = ''
}

function onReset() {
  if (!confirm('确定要重置所有数据吗？此操作不可恢复！')) return
  resetAll()
  showToast('已重置为初始数据')
}

async function onForceUpdate() {
  showToast('正在检查更新…')
  await forceUpdate()
}
</script>
