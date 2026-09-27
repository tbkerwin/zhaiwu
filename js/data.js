// ============================================
// 数据层：负债管理与持久化
// ============================================

const STORAGE_KEY = 'zhaiwu_data_v1';

// 默认初始数据（基于个人负债消除计划书 - 修订版）
// 修订原则：10000 元备用金尽量保留，仅启动月被动用；
// 不再做原计划中"10 月批量提前结清 4 笔小额债务"的激进操作；
// 月生活费节流至 1300 元以保证覆盖前 11 个月的刚性月供缺口。
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
  initialSavings: 10000,
  emergencyReserve: 2500, // 应急储备底线（原则上不动用）
  startDate: '2026-10-01',
  strategy: 'conservative' // 修订版策略：能不用备用金就不用
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
        version: 2
      };
      saveData(initial);
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
    return data;
  } catch (e) {
    console.error('加载数据失败：', e);
    return {
      debts: DEFAULT_DEBTS,
      settings: DEFAULT_SETTINGS,
      customStages: STAGES,
      version: 2
    };
  }
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
  return data.debts
    .filter(d => d.remainingPeriods > 0)
    .reduce((sum, d) => sum + d.monthlyPayment, 0);
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
  return data.settings.monthlyIncome - data.settings.monthlyExpense;
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