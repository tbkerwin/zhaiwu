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

  // 记账
  document.getElementById('quickExpenseBtn').addEventListener('click', () => openTxModal('expense'));
  document.getElementById('quickIncomeBtn').addEventListener('click', () => openTxModal('income'));
  document.getElementById('txModalClose').addEventListener('click', closeTxModal);
  document.getElementById('txModalSave').addEventListener('click', saveTxFromModal);
  document.getElementById('txDeleteBtn').addEventListener('click', deleteCurrentTx);

  // 资产编辑
  document.getElementById('addAssetBtn').addEventListener('click', () => openAssetModal());
  document.getElementById('assetModalClose').addEventListener('click', closeAssetModal);
  document.getElementById('assetModalSave').addEventListener('click', saveAssetFromModal);
  document.getElementById('assetDeleteBtn').addEventListener('click', deleteCurrentAsset);
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

  // 净资产 + 资产
  renderAssets();
}

function renderAssets() {
  const total = totalAssets(appData);
  const debt = totalDebt(appData);
  const net = netWorth(appData);

  const totalEl = document.getElementById('totalAssets');
  const netEl = document.getElementById('netWorth');
  const listEl = document.getElementById('assetList');
  if (!totalEl) return;

  totalEl.textContent = formatMoney(total);
  netEl.textContent = formatMoney(net);
  netEl.className = 'overview-amount ' + (net < 0 ? 'expense' : net > 0 ? 'income' : '');

  const subHint = document.getElementById('netWorthHint');
  if (subHint) {
    subHint.textContent = net < 0
      ? `总负债 ${formatMoney(debt)} 超出资产 ${formatMoney(Math.abs(net))}`
      : `净资产已为正，扣除 ${formatMoney(debt)} 负债后`;
  }

  const assets = appData.assets || [];
  if (assets.length === 0) {
    listEl.innerHTML = '<div class="muted" style="padding:8px 0">暂无资产，可在 assets.json 添加或编辑本地数据</div>';
    return;
  }

  listEl.innerHTML = assets.map(a => {
    const meta = getAssetCategoryMeta(a.category);
    return `
      <div class="asset-row" data-asset-id="${a.id}">
        <div class="asset-icon">${meta.icon}</div>
        <div class="asset-info">
          <div class="asset-name">${a.name}</div>
          <div class="asset-category">${meta.name}${a.note ? ' · ' + a.note : ''}</div>
        </div>
        <div class="asset-balance">${formatMoney(a.balance)}</div>
      </div>
    `;
  }).join('');
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
      <span class="month-label">每月工资</span>
      <span class="month-value">${formatMoney(appData.settings.monthlyIncome)}</span>
    </div>
    <div class="month-row">
      <span class="month-label">每月生活费</span>
      <span class="month-value">${formatMoney(appData.settings.monthlyExpense)}</span>
    </div>
    <div class="month-row">
      <span class="month-label">滴滴月收入</span>
      <span class="month-value" style="color:#34c759">+${formatMoney(appData.settings.didiIncome || 0)}</span>
    </div>
    <div class="month-row">
      <span class="month-label">月可支配</span>
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

// ============================================
// 记账模块
// ============================================

function renderTransactions() {
  const b = getCurrentMonthBudget(appData);

  document.getElementById('budgetMonthTitle').textContent = `${b.yyyy} 年 ${b.mm + 1} 月 · 预算状态`;
  document.getElementById('budgetMonthly').textContent = formatMoney(b.monthlyBudget);
  document.getElementById('budgetSpent').textContent = formatMoney(b.totalExpense);

  const remainingEl = document.getElementById('budgetRemaining');
  remainingEl.textContent = formatMoney(b.remainingBudget);
  remainingEl.className = 'budget-value ' + (b.remainingBudget > 0 ? 'income' : b.overBudget > 0 ? 'expense' : '');

  const overHint = document.getElementById('budgetOverHint');
  if (b.overBudget > 0) {
    overHint.innerHTML = `<div class="budget-hint expense">⚠️ 已超支 ${formatMoney(b.overBudget)}，注意控制下半月</div>`;
  } else {
    overHint.innerHTML = '';
  }

  document.getElementById('budgetIncome').textContent = formatMoney(b.effectiveIncome);
  document.getElementById('budgetRepayment').textContent = formatMoney(b.repayment);

  const availEl = document.getElementById('budgetAvailable');
  const availHint = document.getElementById('budgetAvailableHint');
  availEl.textContent = formatMoney(b.availableCash);
  availEl.className = 'budget-value ' + (b.availableCash > 0 ? 'income' : b.availableCash < 0 ? 'expense' : '');

  if (b.availableCash < 0) {
    availHint.innerHTML = `<div class="budget-hint expense">本月已无余裕，需控制后续支出或动用备用金</div>`;
  } else if (b.availableCash === 0) {
    availHint.innerHTML = `<div class="budget-hint subtle">收支基本持平</div>`;
  } else {
    availHint.innerHTML = `<div class="budget-hint income">✓ 余裕可用于储蓄或提前还款</div>`;
  }

  // 交易列表
  const listEl = document.getElementById('txList');
  const allTx = (appData.transactions || []).slice().sort((a, b) => new Date(b.date) - new Date(a.date));
  document.getElementById('txCount').textContent = `${allTx.length} 笔`;

  if (allTx.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📝</div>
        <div class="empty-state-text">还没有记录</div>
        <div class="empty-state-sub">点击上方按钮记一笔</div>
      </div>
    `;
    return;
  }

  // 按日期分组
  const grouped = {};
  allTx.forEach(t => {
    const key = t.date.slice(0, 10);
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(t);
  });

  const dayNames = ['日', '一', '二', '三', '四', '五', '六'];
  const todayStr = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  listEl.innerHTML = Object.keys(grouped).slice(0, 30).map(key => {
    const txList = grouped[key];
    const total = txList.reduce((s, t) => s + (t.type === 'expense' ? -t.amount : t.amount), 0);
    let label = key;
    if (key === todayStr) label = '今天';
    else if (key === yesterday) label = '昨天';
    else {
      const d = new Date(key);
      label = `${d.getMonth() + 1}/${d.getDate()} 周${dayNames[d.getDay()]}`;
    }

    return `
      <div class="tx-day-group">
        <div class="tx-day-header">
          <span class="tx-day-label">${label}</span>
          <span class="tx-day-total ${total < 0 ? 'expense' : total > 0 ? 'income' : ''}">${total === 0 ? '±0' : (total > 0 ? '+' : '') + formatMoney(total)}</span>
        </div>
        ${txList.map(t => {
          const meta = getCategoryMeta(t.category, t.type);
          return `
            <div class="tx-row" data-tx-id="${t.id}">
              <div class="tx-icon">${meta.icon}</div>
              <div class="tx-info">
                <div class="tx-category">${meta.name}${t.note ? ` · ${t.note}` : ''}</div>
                <div class="tx-time">${new Date(t.date).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
              <div class="tx-amount ${t.type}">${t.type === 'expense' ? '−' : '+'}${formatMoney(t.amount)}</div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }).join('');

  listEl.querySelectorAll('.tx-row').forEach(el => {
    el.addEventListener('click', () => {
      const id = el.getAttribute('data-tx-id');
      openTxModal(null, id);
    });
  });
}

let currentTxId = null;
let currentTxType = 'expense';

function openTxModal(type, txId) {
  currentTxId = txId || null;
  currentTxType = type || 'expense';

  const modal = document.getElementById('txModal');
  const title = document.getElementById('txModalTitle');
  const amountInput = document.getElementById('txAmount');
  const dateInput = document.getElementById('txDate');
  const noteInput = document.getElementById('txNote');
  const deleteBtn = document.getElementById('txDeleteBtn');

  if (txId) {
    const tx = appData.transactions.find(t => t.id === txId);
    if (!tx) return;
    title.textContent = '编辑记录';
    amountInput.value = tx.amount;
    dateInput.value = tx.date.slice(0, 10);
    noteInput.value = tx.note || '';
    currentTxType = tx.type;
    deleteBtn.style.display = 'block';
  } else {
    title.textContent = type === 'income' ? '记一笔收入' : '记一笔支出';
    amountInput.value = '';
    dateInput.value = new Date().toISOString().slice(0, 10);
    noteInput.value = '';
    deleteBtn.style.display = 'none';
  }

  // 切换类型按钮
  document.querySelectorAll('#txTypeSwitch .tx-type-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.type === currentTxType);
  });

  // 渲染分类
  renderTxCategoryGrid(currentTxType, txId ? appData.transactions.find(t => t.id === txId).category : null);

  modal.classList.add('show');
  setTimeout(() => amountInput.focus(), 100);
}

function renderTxCategoryGrid(type, selectedId) {
  const list = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const grid = document.getElementById('txCategoryGrid');
  grid.innerHTML = list.map(c => `
    <button class="tx-cat-btn ${selectedId === c.id ? 'active' : ''}" data-cat-id="${c.id}">
      <span class="tx-cat-icon">${c.icon}</span>
      <span class="tx-cat-name">${c.name}</span>
    </button>
  `).join('');

  grid.querySelectorAll('.tx-cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      grid.querySelectorAll('.tx-cat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // 类型切换
  document.querySelectorAll('#txTypeSwitch .tx-type-btn').forEach(btn => {
    btn.onclick = () => {
      currentTxType = btn.dataset.type;
      document.querySelectorAll('#txTypeSwitch .tx-type-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderTxCategoryGrid(currentTxType, null);
    };
  });
}

function closeTxModal() {
  document.getElementById('txModal').classList.remove('show');
  currentTxId = null;
}

function saveTxFromModal() {
  const amount = parseFloat(document.getElementById('txAmount').value);
  const date = document.getElementById('txDate').value;
  const note = document.getElementById('txNote').value.trim();
  const selectedCat = document.querySelector('#txCategoryGrid .tx-cat-btn.active');

  if (!amount || amount <= 0) {
    showToast('请输入有效金额');
    return;
  }
  if (!selectedCat) {
    showToast('请选择分类');
    return;
  }

  const dateObj = new Date(date);
  const fullDate = new Date(dateObj.getTime() + (dateObj.getHours() === 0 ? new Date().getHours() * 3600000 : 0)).toISOString();

  if (!appData.transactions) appData.transactions = [];

  if (currentTxId) {
    const tx = appData.transactions.find(t => t.id === currentTxId);
    if (tx) {
      tx.amount = amount;
      tx.type = currentTxType;
      tx.category = selectedCat.dataset.catId;
      tx.date = fullDate;
      tx.note = note;
    }
  } else {
    appData.transactions.push({
      id: generateId(),
      type: currentTxType,
      amount,
      category: selectedCat.dataset.catId,
      note,
      date: fullDate
    });
  }

  saveData(appData);
  closeTxModal();
  renderAll();
  showToast('已保存');
}

function deleteCurrentTx() {
  if (!currentTxId) return;
  if (!confirm('确定要删除这笔记录吗？')) return;
  appData.transactions = (appData.transactions || []).filter(t => t.id !== currentTxId);
  saveData(appData);
  closeTxModal();
  renderAll();
  showToast('已删除');
}

function renderCalendar() {
  const container = document.getElementById('calendar');
  const today = new Date();
  const startDate = new Date(appData.settings.startDate);

  // 模拟每月还款推演：从 startDate 开始，按债务的 remainingPeriods 逐月递减
  const debtStates = appData.debts.map(d => ({
    name: d.name,
    type: d.type,
    monthlyPayment: d.monthlyPayment,
    dueDay: d.dueDay,
    monthsLeft: d.remainingPeriods
  }));

  const disposable = appData.settings.monthlyIncome - appData.settings.monthlyExpense;
  const monthlyPlan = [];
  const cursor = new Date(startDate);

  // 最多推演 60 个月
  while (debtStates.some(d => d.monthsLeft > 0) && monthlyPlan.length < 60) {
    const activeDebts = debtStates.filter(d => d.monthsLeft > 0);
    const monthlyTotal = activeDebts.reduce((sum, d) => sum + d.monthlyPayment, 0);
    const remaining = disposable - monthlyTotal;

    monthlyPlan.push({
      date: new Date(cursor),
      totalPayment: monthlyTotal,
      remaining: remaining,
      debts: activeDebts.map(d => ({ name: d.name, amount: d.monthlyPayment, dueDay: d.dueDay })),
      isCurrent: cursor.getFullYear() === today.getFullYear() && cursor.getMonth() === today.getMonth()
    });

    debtStates.forEach(d => { if (d.monthsLeft > 0) d.monthsLeft--; });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  if (monthlyPlan.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🎉</div>
        <div class="empty-state-text">已还清所有债务！</div>
      </div>
    `;
    return;
  }

  // 顶部摘要
  const totalMonths = monthlyPlan.length;
  const lastDate = monthlyPlan[monthlyPlan.length - 1].date;
  const totalRepayment = monthlyPlan.reduce((s, m) => s + m.totalPayment, 0);
  const avgMonthly = totalRepayment / totalMonths;
  const lastDateStr = `${lastDate.getFullYear()} 年 ${lastDate.getMonth() + 1} 月`;

  // 月份列表（当前月 + 后续/历史月份）
  const currentIdx = monthlyPlan.findIndex(m => m.isCurrent);
  const startIdx = currentIdx >= 0 ? Math.max(0, currentIdx - 1) : 0;
  const visibleMonths = monthlyPlan.slice(startIdx);

  container.innerHTML = `
    <div class="calendar-summary">
      <div class="summary-item">
        <div class="summary-label">总期数</div>
        <div class="summary-value">${totalMonths} 个月</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">预计结清</div>
        <div class="summary-value">${lastDateStr}</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">月均还款</div>
        <div class="summary-value">${formatMoney(avgMonthly)}</div>
      </div>
    </div>

    <div class="month-list">
      ${visibleMonths.map(m => {
        const yyyy = m.date.getFullYear();
        const mm = m.date.getMonth() + 1;
        const isDeficit = m.remaining < 0;
        const isSurplus = m.remaining > 0;
        const cls = ['month-card'];
        if (m.isCurrent) cls.push('current');
        return `
          <div class="${cls.join(' ')}">
            <div class="month-card-header">
              <div class="month-card-title">${yyyy} 年 ${mm} 月${m.isCurrent ? ' · 本月' : ''}</div>
              <div class="month-card-payment">${formatMoney(m.totalPayment)}</div>
            </div>
            <div class="month-card-detail">
              <div class="detail-row">
                <span class="detail-label">月工资结余</span>
                <span class="detail-value">${formatMoney(disposable)}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">还款后剩余</span>
                <span class="detail-value ${isDeficit ? 'deficit' : isSurplus ? 'surplus' : ''}">
                  ${formatMoney(m.remaining)}
                </span>
              </div>
              ${isDeficit ? `<div class="detail-hint deficit">需动用备用金 ${formatMoney(-m.remaining)}</div>` : ''}
              ${isSurplus ? `<div class="detail-hint surplus">盈余可累积或提前还款</div>` : ''}
            </div>
            <div class="month-card-debts">
              ${m.debts.map(d => `<span class="debt-tag">${d.name} ${formatMoney(d.amount)}</span>`).join('')}
            </div>
          </div>
        `;
      }).join('')}
    </div>

    ${appData.debts.some(d => d.remainingPeriods > 0) ? `
      <button class="primary-btn full-width" id="openPrepayBtn" style="margin-top:16px">记录提前还款</button>
    ` : ''}
  `;

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
  document.getElementById('didiIncome').value = appData.settings.didiIncome || 400;
  document.getElementById('savings').value = appData.settings.initialSavings;
  document.getElementById('emergencyReserve').value = appData.settings.emergencyReserve || 2500;
}

function saveSettings() {
  appData.settings.monthlyIncome = parseFloat(document.getElementById('monthlyIncome').value) || 0;
  appData.settings.monthlyExpense = parseFloat(document.getElementById('monthlyExpense').value) || 0;
  appData.settings.didiIncome = parseFloat(document.getElementById('didiIncome').value) || 0;
  appData.settings.initialSavings = parseFloat(document.getElementById('savings').value) || 0;
  appData.settings.emergencyReserve = parseFloat(document.getElementById('emergencyReserve').value) || 0;
  saveData(appData);
  renderOverview();
  showToast('设置已保存');
}

function renderProfileAssets() {
  const listEl = document.getElementById('assetListProfile');
  if (!listEl) return;
  const assets = appData.assets || [];
  if (assets.length === 0) {
    listEl.innerHTML = '<div class="muted" style="padding:8px 0">暂无资产，点击右上角添加</div>';
    return;
  }
  listEl.innerHTML = assets.map(a => {
    const meta = getAssetCategoryMeta(a.category);
    return `
      <div class="asset-row" data-asset-id="${a.id}">
        <div class="asset-icon">${meta.icon}</div>
        <div class="asset-info">
          <div class="asset-name">${a.name}</div>
          <div class="asset-category">${meta.name}${a.note ? ' · ' + a.note : ''}</div>
        </div>
        <div class="asset-balance">${formatMoney(a.balance)}</div>
      </div>
    `;
  }).join('');
  listEl.querySelectorAll('.asset-row').forEach(el => {
    el.addEventListener('click', () => openAssetModal(el.getAttribute('data-asset-id')));
  });
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
  renderTransactions();
  renderDebtList();
  renderSettings();
  renderProfileAssets();
  renderCalendar();
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

// ============================================
// 资产编辑
// ============================================

let currentAssetId = null;

function openAssetModal(assetId) {
  currentAssetId = assetId || null;
  const modal = document.getElementById('assetModal');
  const title = document.getElementById('assetModalTitle');
  const nameInput = document.getElementById('assetName');
  const balanceInput = document.getElementById('assetBalance');
  const categorySelect = document.getElementById('assetCategory');
  const noteInput = document.getElementById('assetNote');
  const deleteBtn = document.getElementById('assetDeleteBtn');

  // 填充分类下拉（基于 assets.json 的 categoryMeta）
  const metas = ASSET_CATEGORY_META || { liquid: { name: '流动资金' }, bank: { name: '银行卡' }, other: { name: '其他' } };
  categorySelect.innerHTML = Object.keys(metas).map(k =>
    `<option value="${k}">${metas[k].icon || ''} ${metas[k].name}</option>`
  ).join('');

  if (assetId) {
    const a = appData.assets.find(x => x.id === assetId);
    if (!a) return;
    title.textContent = '编辑资产';
    nameInput.value = a.name;
    balanceInput.value = a.balance;
    categorySelect.value = a.category;
    noteInput.value = a.note || '';
    deleteBtn.style.display = 'block';
  } else {
    title.textContent = '添加资产';
    nameInput.value = '';
    balanceInput.value = '';
    categorySelect.value = 'liquid';
    noteInput.value = '';
    deleteBtn.style.display = 'none';
  }

  modal.classList.add('show');
  setTimeout(() => nameInput.focus(), 100);
}

function closeAssetModal() {
  document.getElementById('assetModal').classList.remove('show');
  currentAssetId = null;
}

function saveAssetFromModal() {
  const name = document.getElementById('assetName').value.trim();
  const balance = parseFloat(document.getElementById('assetBalance').value) || 0;
  const category = document.getElementById('assetCategory').value;
  const note = document.getElementById('assetNote').value.trim();

  if (!name) {
    showToast('请输入资产名称');
    return;
  }
  if (balance < 0) {
    showToast('余额不能为负');
    return;
  }

  const asset = {
    id: currentAssetId || ('asset-' + Date.now().toString(36)),
    type: category,
    name,
    balance,
    category,
    note,
    updatedAt: new Date().toISOString()
  };

  saveAsset(asset);
  closeAssetModal();
  renderAll();
  showToast('已保存');
}

function deleteCurrentAsset() {
  if (!currentAssetId) return;
  if (!confirm('确定要删除这笔资产吗？')) return;
  deleteAsset(currentAssetId);
  closeAssetModal();
  renderAll();
  showToast('已删除');
}