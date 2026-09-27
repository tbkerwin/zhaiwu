// ============================================
// 数据层：负债管理与持久化
// ============================================

const STORAGE_KEY = 'zhaiwu_data_v1';

// 默认初始数据（基于个人负债消除计划书 - 修订版 v2）
// 修订原则：10000 元备用金尽量保留，仅启动月被动用；
// 不再做原计划中"10 月批量提前结清 4 笔小额债务"的激进操作；
// 月生活费节流至 1300 元；
// 每月新增滴滴收入 400 元（每周跑 1 天，每天净收入 100 元，压力可控）。
const DEFAULT_DEBTS = [
  {
    id: 'd1',
    name: '车贷',
    type: '车贷',
    principal: 73418.23,
    monthlyPayment: 2368.33,
    remainingPeriods: 31,
    dueDay: 15,
    note: '分期 31 期，2026/10 - 2029/04',
    originalPrincipal: 73418.23,
    paidHistory: []
  },
  {
    id: 'd2',
    name: '信用卡 5',
    type: '信用卡',
    principal: 3685.11,
    monthlyPayment: 3685.11,
    remainingPeriods: 1,
    dueDay: 5,
    note: '10/5 一次性还款，9 月账单，无分期',
    originalPrincipal: 3685.11,
    paidHistory: []
  },
  {
    id: 'd3',
    name: '信用卡 6',
    type: '信用卡',
    principal: 5301.18,
    monthlyPayment: 443.85,
    remainingPeriods: 12,
    dueDay: 5,
    note: '首月 418.83，后续每月 443.85',
    originalPrincipal: 5301.18,
    paidHistory: []
  },
  {
    id: 'd4',
    name: '信用卡 4',
    type: '信用卡',
    principal: 3586.96,
    monthlyPayment: 448.37,
    remainingPeriods: 8,
    dueDay: 5,
    note: '分期 8 期',
    originalPrincipal: 3586.96,
    paidHistory: []
  },
  {
    id: 'd5',
    name: '信用卡 3',
    type: '信用卡',
    principal: 2071.57,
    monthlyPayment: 109.03,
    remainingPeriods: 19,
    dueDay: 5,
    note: '分期 19 期',
    originalPrincipal: 2071.57,
    paidHistory: []
  },
  {
    id: 'd6',
    name: '信用卡 2',
    type: '信用卡',
    principal: 1491.84,
    monthlyPayment: 93.24,
    remainingPeriods: 16,
    dueDay: 5,
    note: '分期 16 期',
    originalPrincipal: 1491.84,
    paidHistory: []
  },
  {
    id: 'd7',
    name: '花呗',
    type: '花呗',
    principal: 548.87,
    monthlyPayment: 78.41,
    remainingPeriods: 7,
    dueDay: 5,
    note: '分期 7 期',
    originalPrincipal: 548.87,
    paidHistory: []
  },
  {
    id: 'd8',
    name: '信用卡 1',
    type: '信用卡',
    principal: 481.32,
    monthlyPayment: 68.76,
    remainingPeriods: 7,
    dueDay: 5,
    note: '分期 7 期',
    originalPrincipal: 481.32,
    paidHistory: []
  }
];

const DEFAULT_SETTINGS = {
  monthlyIncome: 4400,
  monthlyExpense: 1300,
  didiIncome: 400, // 滴滴月目标收入（每周 1 天，每天净 100 元）
  initialSavings: 10000,
  emergencyReserve: 2500, // 应急储备底线（原则上不动用）
  startDate: '2026-10-01',
  strategy: 'conservative', // 修订版策略：能不用备用金就不用
  // 按月计划收入覆盖（如某月只有部分收入，可单独指定）
  monthlyIncomeOverrides: {
    '2026-09': 400 // 9 月仅 28 号一笔 400 元
  }
};

const STAGES = [
  {
    id: 1,
    name: '阶段 1：启动期',
    period: '2026 年 10 月',
    desc: '仅覆盖刚性还款，动用 4170 元备用金，保留应急储备',
    endDate: '2026-10-31'
  },
  {
    id: 2,
    name: '阶段 2：过渡期',
    period: '2026/11 - 2027/09',
    desc: '持续 11 个月靠备用金补缺口，月供 3014-3609 元',
    endDate: '2027-09-30'
  },
  {
    id: 3,
    name: '阶段 3：正向积累期',
    period: '2027/10 - 2028/04',
    desc: '开始月度盈余 529-622 元，恢复备用金至 6100 元',
    endDate: '2028-04-30'
  },
  {
    id: 4,
    name: '阶段 4：车贷冲刺期',
    period: '2028/05 - 2029/02',
    desc: '集中提前结清车贷，月净结余 731 元，预计提前 2 个月结清',
    endDate: '2029-02-28'
  }
];

// 记账分类
const EXPENSE_CATEGORIES = [
  { id: 'food', name: '餐饮', icon: '🍚' },
  { id: 'transport', name: '交通', icon: '🚇' },
  { id: 'shopping', name: '购物', icon: '🛍️' },
  { id: 'bill', name: '生活缴费', icon: '💡' },
  { id: 'medical', name: '医疗', icon: '💊' },
  { id: 'entertainment', name: '娱乐', icon: '🎬' },
  { id: 'social', name: '人情', icon: '🎁' },
  { id: 'other_expense', name: '其他', icon: '📦' }
];

const INCOME_CATEGORIES = [
  { id: 'salary', name: '工资', icon: '💰' },
  { id: 'didi', name: '滴滴', icon: '🚗' },
  { id: 'bonus', name: '奖金', icon: '🎉' },
  { id: 'refund', name: '退款', icon: '↩️' },
  { id: 'other_income', name: '其他', icon: '💵' }
];

// ============================================
// 数据访问层
// ============================================

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = {
        debts: DEFAULT_DEBTS,
        settings: DEFAULT_SETTINGS,
        customStages: STAGES,
        transactions: [],
        assets: [],
        version: 5
      };
      saveData(initial);
      // 首次安装时尝试从 assets.json 同步默认资产
      syncAssetsFromJSONIfEmpty();
      return initial;
    }
    const data = JSON.parse(raw);
    // 数据迁移：旧版本升级到 v2，应用修订版默认值
    if (!data.version || data.version < 2) {
      data.settings.monthlyExpense = 1300;
      data.settings.strategy = 'conservative';
      if (typeof data.settings.emergencyReserve === 'undefined') {
        data.settings.emergencyReserve = 2500;
      }
      data.version = 2;
      saveData(data);
    }
    // 数据迁移 v2 → v3：新增滴滴收入字段
    if (data.version < 3) {
      if (typeof data.settings.didiIncome === 'undefined') {
        data.settings.didiIncome = 400;
      }
      data.version = 3;
      saveData(data);
    }
    // 数据迁移 v3 → v4：新增交易记录
    if (data.version < 4) {
      if (!Array.isArray(data.transactions)) {
        data.transactions = [];
      }
      data.version = 4;
      saveData(data);
    }
    // 数据迁移 v4 → v5：新增资产字段，并尝试从 assets.json 同步
    if (data.version < 5) {
      if (!Array.isArray(data.assets)) {
        data.assets = [];
      }
      data.version = 5;
      saveData(data);
    }
    // 本地资产为空时，尝试从 assets.json 补齐（self-heal，每次会话只尝试一次）
    if ((data.assets || []).length === 0) {
      syncAssetsFromJSONIfEmpty();
    }
    // 字段完整性修复：处理用户可能存在的字段缺失或类型错误
    return normalizeData(data);
  } catch (e) {
    console.error('加载数据失败：', e);
    return {
      debts: DEFAULT_DEBTS,
      settings: DEFAULT_SETTINGS,
      customStages: STAGES,
      transactions: [],
      assets: [],
      version: 5
    };
  }
}

// 字段完整性规范化：保证所有字段类型正确，缺失字段用默认值补全
// 即使 localStorage 中数据损坏也能恢复渲染
function normalizeData(data) {
  if (!data || typeof data !== 'object') {
    return getDefaultData();
  }

  // 顶层字段类型保证
  if (!Array.isArray(data.debts)) data.debts = [];
  if (!Array.isArray(data.transactions)) data.transactions = [];
  if (!Array.isArray(data.assets)) data.assets = [];
  if (!Array.isArray(data.customStages)) data.customStages = [...STAGES];
  if (!data.settings || typeof data.settings !== 'object') {
    data.settings = { ...DEFAULT_SETTINGS };
  }

  // settings 字段补全（用 typeof 检查兼容旧版本未定义字段）
  const s = data.settings;
  const def = DEFAULT_SETTINGS;
  if (typeof s.monthlyIncome !== 'number') s.monthlyIncome = def.monthlyIncome;
  if (typeof s.monthlyExpense !== 'number') s.monthlyExpense = def.monthlyExpense;
  if (typeof s.didiIncome !== 'number') s.didiIncome = def.didiIncome;
  if (typeof s.initialSavings !== 'number') s.initialSavings = def.initialSavings;
  if (typeof s.emergencyReserve !== 'number') s.emergencyReserve = def.emergencyReserve;
  if (typeof s.startDate !== 'string') s.startDate = def.startDate;
  if (typeof s.strategy !== 'string') s.strategy = def.strategy;
  if (!s.monthlyIncomeOverrides || typeof s.monthlyIncomeOverrides !== 'object') {
    s.monthlyIncomeOverrides = { ...def.monthlyIncomeOverrides };
  }

  // debts 每项校验
  data.debts = data.debts.filter(d => d && typeof d === 'object').map(d => ({
    id: d.id || ('d_' + Math.random().toString(36).slice(2, 9)),
    type: d.type || '其他',
    name: d.name || '未命名',
    principal: typeof d.principal === 'number' ? d.principal : 0,
    originalPrincipal: typeof d.originalPrincipal === 'number' ? d.originalPrincipal : (typeof d.principal === 'number' ? d.principal : 0),
    monthlyPayment: typeof d.monthlyPayment === 'number' ? d.monthlyPayment : 0,
    dueDay: typeof d.dueDay === 'number' ? d.dueDay : 5,
    remainingPeriods: typeof d.remainingPeriods === 'number' ? d.remainingPeriods : 0,
    paidHistory: Array.isArray(d.paidHistory) ? d.paidHistory : []
  }));

  // transactions 每项校验
  data.transactions = data.transactions.filter(t => t && typeof t === 'object').map(t => ({
    id: t.id || ('t_' + Math.random().toString(36).slice(2, 9)),
    type: t.type === 'income' ? 'income' : 'expense',
    amount: typeof t.amount === 'number' ? t.amount : 0,
    category: t.category || 'other_expense',
    note: typeof t.note === 'string' ? t.note : '',
    date: typeof t.date === 'string' ? t.date : new Date().toISOString()
  }));

  // assets 每项校验
  data.assets = data.assets.filter(a => a && typeof a === 'object').map(a => ({
    id: a.id || ('a_' + Math.random().toString(36).slice(2, 9)),
    type: a.type || a.category || 'other',
    name: a.name || '未命名',
    balance: typeof a.balance === 'number' ? a.balance : 0,
    category: a.category || a.type || 'other',
    note: typeof a.note === 'string' ? a.note : ''
  }));

  data.version = 5;
  return data;
}

function getDefaultData() {
  return {
    debts: DEFAULT_DEBTS,
    settings: DEFAULT_SETTINGS,
    customStages: STAGES,
    transactions: [],
    assets: [],
    version: 5
  };
}

function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (e) {
    console.error('保存数据失败：', e);
    return false;
  }
}

function resetData() {
  localStorage.removeItem(STORAGE_KEY);
  // 允许重置后重新从 assets.json 补齐默认资产
  assetsSyncAttempted = false;
  return loadData();
}

function exportData() {
  const data = loadData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `负债数据_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importData(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.debts && data.settings) {
          saveData(data);
          resolve(data);
        } else {
          reject(new Error('数据格式不正确'));
        }
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

// ============================================
// 计算工具
// ============================================

function formatMoney(n) {
  return '¥' + Number(n).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatMoneyShort(n) {
  if (n >= 10000) {
    return '¥' + (n / 10000).toFixed(2) + '万';
  }
  return '¥' + Number(n).toLocaleString('zh-CN', { maximumFractionDigits: 0 });
}

function totalDebt(data) {
  return data.debts.reduce((sum, d) => sum + d.principal, 0);
}

function totalOriginal(data) {
  return data.debts.reduce((sum, d) => sum + d.originalPrincipal, 0);
}

function totalPaid(data) {
  return data.debts.reduce((sum, d) => sum + (d.originalPrincipal - d.principal), 0);
}

function totalRemainingPeriods(data) {
  return data.debts.reduce((sum, d) => sum + d.remainingPeriods, 0);
}

function currentMonthPayment(data) {
  // 模拟从 startDate 到当前月的递减，得到当前月真实应还月供
  const start = new Date(data.settings.startDate);
  const now = new Date();
  const monthsElapsed = Math.max(0, (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth()));

  let total = 0;
  data.debts.forEach(d => {
    if (d.remainingPeriods > monthsElapsed) {
      total += d.monthlyPayment;
    }
  });
  return total;
}

function getCurrentStage(data) {
  const now = new Date();
  for (let i = STAGES.length - 1; i >= 0; i--) {
    if (now >= new Date(STAGES[i].endDate)) {
      return STAGES[i];
    }
  }
  return STAGES[0];
}

function getMonthlyDisposable(data) {
  // 月可支配 = 月工资 - 月生活费 + 滴滴月收入
  return data.settings.monthlyIncome - data.settings.monthlyExpense + (data.settings.didiIncome || 0);
}

function getAvailableCash(data) {
  // 简化模型：假设存款 - 已还 + 每月可支配
  const paid = totalPaid(data);
  return data.settings.initialSavings + (paid > 0 ? paid * 0.1 : 0);
}

// 生成唯一 ID
function generateId() {
  return 'd' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
}

// ============================================
// 资产模块
// ============================================

let ASSET_CATEGORY_META = null;

async function loadAssetsFromJSON() {
  try {
    const res = await fetch('./assets.json');
    if (!res.ok) return null;
    const json = await res.json();
    if (json.categoryMeta) ASSET_CATEGORY_META = json.categoryMeta;
    return json;
  } catch (e) {
    console.warn('加载 assets.json 失败：', e);
    return null;
  }
}

// 本地资产为空时，从 assets.json 补齐默认资产，并通知 UI 刷新
// 每次会话只尝试一次，避免重复请求
let assetsSyncAttempted = false;
function syncAssetsFromJSONIfEmpty() {
  if (assetsSyncAttempted) return;
  assetsSyncAttempted = true;

  loadAssetsFromJSON().then(json => {
    if (!json || !Array.isArray(json.assets) || json.assets.length === 0) return;

    let stored = null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      stored = raw ? JSON.parse(raw) : null;
    } catch (e) {
      return;
    }
    if (!stored) return;
    // 本地已有资产则不覆盖（保留用户在 App 内编辑的结果）
    if (Array.isArray(stored.assets) && stored.assets.length > 0) return;

    stored.assets = json.assets;
    stored.version = 5;
    saveData(stored);

    // 通知 UI 重新读取数据并渲染
    try {
      window.dispatchEvent(new CustomEvent('zhaiwu:data-updated'));
    } catch (e) {
      if (typeof renderAll === 'function') renderAll();
    }
  }).catch(() => {});
}

function getAssetCategoryMeta(categoryId) {
  if (ASSET_CATEGORY_META && ASSET_CATEGORY_META[categoryId]) {
    return ASSET_CATEGORY_META[categoryId];
  }
  return { name: '其他', icon: '📦' };
}

function totalAssets(data) {
  return (data.assets || []).reduce((s, a) => s + a.balance, 0);
}

function netWorth(data) {
  // 净资产 = 资产 - 负债
  const debt = totalDebt(data);
  return totalAssets(data) - debt;
}

function saveAsset(asset) {
  if (!appData) return;
  if (!appData.assets) appData.assets = [];
  const idx = appData.assets.findIndex(a => a.id === asset.id);
  if (idx >= 0) {
    appData.assets[idx] = asset;
  } else {
    appData.assets.push(asset);
  }
  saveData(appData);
}

function deleteAsset(id) {
  if (!appData) return;
  appData.assets = (appData.assets || []).filter(a => a.id !== id);
  saveData(appData);
}

// ============================================
// 记账模块
// ============================================

function getCategoryMeta(categoryId, type) {
  const list = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  return list.find(c => c.id === categoryId) || list[list.length - 1];
}

// 计算当前自然月的预算状态
function getCurrentMonthBudget(data) {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = now.getMonth();
  const monthKey = `${yyyy}-${String(mm + 1).padStart(2, '0')}`;
  const startDate = new Date(data.settings.startDate);
  const isAfterPlanStart = now >= startDate;

  // 当前月所有交易
  const monthTx = (data.transactions || []).filter(t => {
    const d = new Date(t.date);
    return d.getFullYear() === yyyy && d.getMonth() === mm;
  });

  const totalExpense = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const totalIncomeRecorded = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);

  // 月生活费预算
  const monthlyBudget = data.settings.monthlyExpense || 0;
  const remainingBudget = Math.max(0, monthlyBudget - totalExpense);
  const overBudget = totalExpense > monthlyBudget ? totalExpense - monthlyBudget : 0;

  // 本月计划还款（按当前月模拟计算）
  const repayment = isAfterPlanStart ? currentMonthPayment(data) : 0;

  // 本月计划收入：优先用按月覆盖，否则按规则
  let plannedIncome;
  const overrides = data.settings.monthlyIncomeOverrides || {};
  if (overrides[monthKey] !== undefined) {
    plannedIncome = overrides[monthKey];
  } else if (isAfterPlanStart) {
    plannedIncome = data.settings.monthlyIncome + (data.settings.didiIncome || 0);
  } else {
    plannedIncome = data.settings.monthlyIncome;
  }

  // 取"已记录收入"和"计划收入"的较大值作为可用收入基准
  const effectiveIncome = Math.max(plannedIncome, totalIncomeRecorded);

  // 可自由支配 = 收入 - 还款预留 - 已支出
  const availableCash = effectiveIncome - repayment - totalExpense;

  return {
    yyyy,
    mm,
    monthKey,
    monthTx,
    totalExpense,
    totalIncomeRecorded,
    monthlyBudget,
    remainingBudget,
    overBudget,
    repayment,
    plannedIncome,
    effectiveIncome,
    availableCash,
    isOverride: overrides[monthKey] !== undefined
  };
}