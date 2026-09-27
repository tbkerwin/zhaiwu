// ============================================
// 应用主逻辑
// ============================================

let appData = loadData();
let currentEditingDebtId = null;
let calendarDate = new Date();

// ============================================
// 初始化
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  registerServiceWorker();
  bindEvents();
  renderAll();
});

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(err => {
      console.log('SW 注册失败：', err);
    });
  }
}

function bindEvents() {
  // 底部 Tab 切换
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // 添加债务
  document.getElementById('addDebtBtn').addEventListener('click', () => openDebtModal());

  // 债务模态框
  document.getElementById('debtModalClose').addEventListener('click', closeDebtModal);
  document.getElementById('debtModalSave').addEventListener('click', saveDebtFromModal);
  document.getElementById('deleteDebtBtn').addEventListener('click', deleteCurrentDebt);

  // 提前还款模态框
  document.getElementById('prepayModalClose').addEventListener('click', closePrepayModal);
  document.getElementById('prepayModalSave').addEventListener('click', confirmPrepayment);

  // 设置
  document.getElementById('saveSettingsBtn').addEventListener('click', saveSettings);

  // 数据管理
  document.getElementById('exportBtn').addEventListener('click', exportData);
  document.getElementById('importBtn').addEventListener('click', () => {
    document.getElementById('importFile').click();
  });
  document.getElementById('importFile').addEventListener('change', handleImport);
  document.getElementById('resetBtn').addEventListener('click', handleReset);

  // 设置按钮 - 跳到我的 tab
  document.getElementById('settingsBtn').addEventListener('click', () => switchTab('profile'));
}

// ============================================
// Tab 切换
// ============================================

function switchTab(tabName) {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.toggle('active', content.id === `tab-${tabName}`);
  });

  // 切换到日历 tab 时重新渲染
  if (tabName === 'calendar') {
    renderCalendar();
  }
}

// ============================================
// 总览渲染
// ============================================

function renderOverview() {
  const total = totalDebt(appData);
  const original = totalOriginal(appData);
  const paid = totalPaid(appData);
  const remainingPeriods = totalRemainingPeriods(appData);

  // 总负债
  document.getElementById('totalDebt').textContent = formatMoney(total);

  // 进度环
  const percent = original > 0 ? Math.round((paid / original) * 100) : 0;
  document.getElementById('paidPercent').textContent = `${percent}%`;
  const circumference = 2 * Math.PI * 54;
  const offset = circumference * (1 - paid / original);
  const ring = document.getElementById('progressRing');
  ring.style.strokeDasharray = circumference;
  ring.style.strokeDashoffset = isFinite(offset) ? offset : circumference;

  // 已还金额
  document.getElementById('paidAmount').textContent = formatMoney(paid);

  // 剩余期数
  document.getElementById('remainingPeriods').textContent = remainingPeriods;

  // 阶段列表
  renderStages();

  // 本月待还
  renderMonthSummary();
}

function renderStages() {
  const list = document.getElementById('stageList');
  const now = new Date();
  list.innerHTML = STAGES.map(stage => {
    const endDate = new Date(stage.endDate);
    const isCompleted = now > endDate;
    const isCurrent = !isCompleted && STAGES[STAGES.indexOf(stage) - 1]
      ? now > new Date(STAGES[STAGES.indexOf(stage) - 1].endDate)
      : STAGES.indexOf(stage) === 0;

    let cls = 'stage-item';
    if (isCompleted) cls += ' completed';
    else if (isCurrent) cls += ' current';

    return `
      <div class="${cls}">
        <div class="stage-name">${stage.name}</div>
        <div class="stage-period">${stage.period}</div>
        <div class="stage-desc">${stage.desc}</div>
      </div>
    `;
  }).join('');
}

function renderMonthSummary() {
  const container = document.getElementById('monthSummary');
  const monthly = appData.debts.filter(d => d.remainingPeriods > 0);
  const totalMonthly = currentMonthPayment(appData);
  const disposable = getMonthlyDisposable(appData);
  const availableCash = getAvailableCash(appData);
  const emergencyReserve = appData.settings.emergencyReserve || 0;
  const availableForDebt = Math.max(0, availableCash - emergencyReserve);
  const monthlyGap = totalMonthly - disposable;
  const needFromSavings = monthlyGap > 0 ? monthlyGap : 0;

  if (monthly.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🎉</div>
        <div class="empty-state-text">已还清所有债务！</div>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="month-row">
      <span class="month-label">每月收入</span>
      <span class="month-value">${formatMoney(appData.settings.monthlyIncome)}</span>
    </div>
    <div class="month-row">
      <span class="month-label">每月生活费</span>
      <span class="month-value">${formatMoney(appData.settings.monthlyExpense)}</span>
    </div>
    <div class="month-row">
      <span class="month-label">每月可支配</span>
      <span class="month-value">${formatMoney(disposable)}</span>
    </div>
    <div class="month-row">
      <span class="month-label">备用存款</span>
      <span class="month-value">${formatMoney(availableCash)}</span>
    </div>
    <div class="month-row">
      <span class="month-label" style="color:#8e8e93">↳ 应急储备（不动）</span>
      <span class="month-value" style="color:#8e8e93">${formatMoney(emergencyReserve)}</span>
    </div>
    <div class="month-row">
      <span class="month-label">可用于还款的备用金</span>
      <span class="month-value">${formatMoney(availableForDebt)}</span>
    </div>
    ${needFromSavings > 0 ? `
    <div class="month-row">
      <span class="month-label" style="color:#ff9500">⚠️ 本月工资缺口</span>
      <span class="month-value" style="color:#ff9500">${formatMoney(needFromSavings)}</span>
    </div>
    ` : `
    <div class="month-row">
      <span class="month-label" style="color:#34c759">✓ 本月盈余</span>
      <span class="month-value" style="color:#34c759">${formatMoney(-monthlyGap)}</span>
    </div>
    `}
    <div class="month-row total">
      <span class="month-label">本月待还总额</span>
      <span class="month-value">${formatMoney(totalMonthly)}</span>
    </div>
  `;
}

// ============================================
// 债务列表
// ============================================

function renderDebtList() {
  const list = document.getElementById('debtList');

  if (appData.debts.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📝</div>
        <div class="empty-state-text">还没有债务记录</div>
      </div>
    `;
    return;
  }

  // 按剩余本金排序（小额优先）
  const sorted = [...appData.debts].sort((a, b) => a.principal - b.principal);

  list.innerHTML = sorted.map(debt => {
    const paidPercent = debt.originalPrincipal > 0
      ? ((debt.originalPrincipal - debt.principal) / debt.originalPrincipal * 100).toFixed(0)
      : 0;
    const typeIcon = getTypeIcon(debt.type);
    const isCleared = debt.principal <= 0;

    return `
      <div class="debt-card" data-id="${debt.id}">
        <div class="debt-card-header">
          <div class="debt-name">
            <div class="debt-type-icon ${debt.type}">${typeIcon}</div>
            ${debt.name}
          </div>
          <div class="debt-remaining">${formatMoney(debt.principal)}</div>
        </div>
        <div class="debt-card-body">
          <span>每月 ${formatMoney(debt.monthlyPayment)} · ${debt.dueDay} 日</span>
          <span>剩 ${debt.remainingPeriods} 期</span>
        </div>
        <div class="debt-progress">
          <div class="debt-progress-bar" style="width:${paidPercent}%"></div>
        </div>
      </div>
    `;
  }).join('');

  // 绑定点击编辑
  list.querySelectorAll('.debt-card').forEach(card => {
    card.addEventListener('click', () => openDebtModal(card.dataset.id));
  });
}

function getTypeIcon(type) {
  const map = {
    '车贷': '🚗',
    '信用卡': '💳',
    '花呗': '🛒',
    '网贷': '💰',
    '其他': '📄'
  };
  return map[type] || '📄';
}

// ============================================
// 债务模态框（添加/编辑）
// ============================================

function openDebtModal(debtId = null) {
  currentEditingDebtId = debtId;
  const modal = document.getElementById('debtModal');
  const title = document.getElementById('debtModalTitle');
  const deleteBtn = document.getElementById('deleteDebtBtn');

  if (debtId) {
    const debt = appData.debts.find(d => d.id === debtId);
    if (!debt) return;
    title.textContent = '编辑债务';
    deleteBtn.style.display = 'block';
    document.getElementById('debtName').value = debt.name;
    document.getElementById('debtType').value = debt.type;
    document.getElementById('debtPrincipal').value = debt.principal;
    document.getElementById('debtMonthly').value = debt.monthlyPayment;
    document.getElementById('debtPeriods').value = debt.remainingPeriods;
    document.getElementById('debtDueDay').value = debt.dueDay;
    document.getElementById('debtNote').value = debt.note || '';
  } else {
    title.textContent = '添加债务';
    deleteBtn.style.display = 'none';
    document.getElementById('debtName').value = '';
    document.getElementById('debtType').value = '信用卡';
    document.getElementById('debtPrincipal').value = '';
    document.getElementById('debtMonthly').value = '';
    document.getElementById('debtPeriods').value = '';
    document.getElementById('debtDueDay').value = 5;
    document.getElementById('debtNote').value = '';
  }

  modal.classList.add('active');
}

function closeDebtModal() {
  document.getElementById('debtModal').classList.remove('active');
  currentEditingDebtId = null;
}

function saveDebtFromModal() {
  const name = document.getElementById('debtName').value.trim();
  const principal = parseFloat(document.getElementById('debtPrincipal').value);
  const monthly = parseFloat(document.getElementById('debtMonthly').value);
  const periods = parseInt(document.getElementById('debtPeriods').value);
  const dueDay = parseInt(document.getElementById('debtDueDay').value) || 5;

  if (!name) {
    showToast('请输入债务名称');
    return;
  }
  if (isNaN(principal) || principal < 0) {
    showToast('请输入有效的本金');
    return;
  }
  if (isNaN(monthly) || monthly < 0) {
    showToast('请输入有效的月还款');
    return;
  }
  if (isNaN(periods) || periods < 0) {
    showToast('请输入有效的期数');
    return;
  }

  const debtData = {
    name,
    type: document.getElementById('debtType').value,
    principal,
    monthlyPayment: monthly,
    remainingPeriods: periods,
    dueDay,
    note: document.getElementById('debtNote').value.trim(),
    originalPrincipal: principal,
    paidHistory: []
  };

  if (currentEditingDebtId) {
    const idx = appData.debts.findIndex(d => d.id === currentEditingDebtId);
    if (idx >= 0) {
      // 保留原始本金和还款记录
      debtData.originalPrincipal = appData.debts[idx].originalPrincipal;
      debtData.paidHistory = appData.debts[idx].paidHistory;
      appData.debts[idx] = { ...appData.debts[idx], ...debtData };
    }
  } else {
    debtData.id = generateId();
    appData.debts.push(debtData);
  }

  saveData(appData);
  closeDebtModal();
  renderAll();
  showToast('保存成功');
}

function deleteCurrentDebt() {
  if (!currentEditingDebtId) return;
  if (!confirm('确定要删除这笔债务吗？')) return;

  appData.debts = appData.debts.filter(d => d.id !== currentEditingDebtId);
  saveData(appData);
  closeDebtModal();
  renderAll();
  showToast('已删除');
}

// ============================================
// 提前还款
// ============================================

function openPrepayModal() {
  const select = document.getElementById('prepayDebtId');
  select.innerHTML = appData.debts
    .filter(d => d.principal > 0)
    .map(d => `<option value="${d.id}">${d.name} - ${formatMoney(d.principal)}</option>`)
    .join('');

  document.getElementById('prepayAmount').value = '';
  document.getElementById('prepayDate').value = new Date().toISOString().slice(0, 10);
  document.getElementById('prepayModal').classList.add('active');
}

function closePrepayModal() {
  document.getElementById('prepayModal').classList.remove('active');
}

function confirmPrepayment() {
  const id = document.getElementById('prepayDebtId').value;
  const amount = parseFloat(document.getElementById('prepayAmount').value);
  const date = document.getElementById('prepayDate').value;

  if (!id) {
    showToast('请选择债务');
    return;
  }
  if (isNaN(amount) || amount <= 0) {
    showToast('请输入有效金额');
    return;
  }

  const debt = appData.debts.find(d => d.id === id);
  if (!debt) return;

  if (amount > debt.principal) {
    if (!confirm(`金额超过剩余本金 ${formatMoney(debt.principal)}，将按实际本金结清。是否继续？`)) {
      return;
    }
  }

  const actualAmount = Math.min(amount, debt.principal);
  debt.principal -= actualAmount;
  debt.paidHistory.push({ date, amount: actualAmount });

  // 如果本金清零，减少期数
  if (debt.principal <= 0.01) {
    debt.principal = 0;
    debt.remainingPeriods = 0;
    debt.monthlyPayment = 0;
    showToast(`🎉 ${debt.name} 已还清！`);
  } else {
    showToast(`已记录还款 ${formatMoney(actualAmount)}`);
  }

  saveData(appData);
  closePrepayModal();
  renderAll();
}

// ============================================
// 日历
// ============================================

function renderCalendar() {
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const today = new Date();

  const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  const weekdayNames = ['日', '一', '二', '三', '四', '五', '六'];

  // 计算当月所有还款日
  const dueDays = [...new Set(appData.debts
    .filter(d => d.remainingPeriods > 0)
    .map(d => d.dueDay))].sort((a, b) => a - b);

  // 计算当月每日还款金额
  const dailyPayments = {};
  dueDays.forEach(day => {
    const dayDebts = appData.debts.filter(d => d.remainingPeriods > 0 && d.dueDay === day);
    dailyPayments[day] = dayDebts.reduce((sum, d) => sum + d.monthlyPayment, 0);
  });

  // 渲染
  const container = document.getElementById('calendar');
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  let daysHtml = '';
  // 空白格
  for (let i = 0; i < firstDay; i++) {
    daysHtml += '<div class="calendar-day empty"></div>';
  }
  // 日期格
  for (let day = 1; day <= daysInMonth; day++) {
    const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
    const isPayment = dueDays.includes(day);
    const cls = ['calendar-day'];
    if (isToday) cls.push('today');
    if (isPayment) cls.push('has-payment');

    const tooltip = isPayment ? ` title="待还 ${formatMoney(dailyPayments[day])}"` : '';
    daysHtml += `<div class="${cls.join(' ')}"${tooltip}>${day}</div>`;
  }

  container.innerHTML = `
    <div class="calendar-header">
      <button class="calendar-nav" id="prevMonth">‹</button>
      <div class="calendar-title">${year} 年 ${monthNames[month]}</div>
      <button class="calendar-nav" id="nextMonth">›</button>
    </div>
    <div class="calendar-weekdays">
      ${weekdayNames.map(w => `<div>${w}</div>`).join('')}
    </div>
    <div class="calendar-days">${daysHtml}</div>
    <div class="calendar-legend">
      <span class="legend-dot"></span>
      <span>还款日（点击日期查看详情）</span>
    </div>

    ${dueDays.length > 0 ? `
      <div style="margin-top:16px;padding-top:16px;border-top:1px solid #f0f0f3">
        <div style="font-size:13px;color:#8e8e93;margin-bottom:8px">本月还款计划</div>
        ${dueDays.map(day => `
          <div class="month-row">
            <span class="month-label">${month + 1} 月 ${day} 日</span>
            <span class="month-value">${formatMoney(dailyPayments[day])}</span>
          </div>
        `).join('')}
        <button class="primary-btn full-width" id="openPrepayBtn" style="margin-top:16px">记录提前还款</button>
      </div>
    ` : ''}
  `;

  document.getElementById('prevMonth').addEventListener('click', () => {
    calendarDate.setMonth(month - 1);
    renderCalendar();
  });
  document.getElementById('nextMonth').addEventListener('click', () => {
    calendarDate.setMonth(month + 1);
    renderCalendar();
  });

  const prepayBtn = document.getElementById('openPrepayBtn');
  if (prepayBtn) {
    prepayBtn.addEventListener('click', openPrepayModal);
  }
}

// ============================================
// 设置
// ============================================

function renderSettings() {
  document.getElementById('monthlyIncome').value = appData.settings.monthlyIncome;
  document.getElementById('monthlyExpense').value = appData.settings.monthlyExpense;
  document.getElementById('savings').value = appData.settings.initialSavings;
  document.getElementById('emergencyReserve').value = appData.settings.emergencyReserve || 2500;
}

function saveSettings() {
  appData.settings.monthlyIncome = parseFloat(document.getElementById('monthlyIncome').value) || 0;
  appData.settings.monthlyExpense = parseFloat(document.getElementById('monthlyExpense').value) || 0;
  appData.settings.initialSavings = parseFloat(document.getElementById('savings').value) || 0;
  appData.settings.emergencyReserve = parseFloat(document.getElementById('emergencyReserve').value) || 0;
  saveData(appData);
  renderOverview();
  showToast('设置已保存');
}

// ============================================
// 数据管理
// ============================================

async function handleImport(e) {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const data = await importData(file);
    appData = data;
    renderAll();
    showToast('数据已导入');
  } catch (err) {
    showToast('导入失败：' + err.message);
  }
  e.target.value = '';
}

function handleReset() {
  if (!confirm('确定要重置所有数据吗？此操作不可恢复！')) return;
  appData = resetData();
  renderAll();
  showToast('已重置为初始数据');
}

// ============================================
// 渲染调度
// ============================================

function renderAll() {
  renderOverview();
  renderDebtList();
  renderSettings();
  if (document.getElementById('tab-calendar').classList.contains('active')) {
    renderCalendar();
  }
}

// ============================================
// Toast
// ============================================

let toastTimer = null;
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2000);
}