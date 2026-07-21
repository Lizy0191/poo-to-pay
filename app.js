const STORAGE_KEY = 'poop-to-pay-state-v1';

const now = new Date();
const dateKey = (date = now) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
const todayKey = dateKey();

const seededEntries = [
  { id: 'seed-1', date: todayKey, time: '09:12', quality: '顺畅', feeling: '状态不错，轻装上阵', note: '', demo: true },
  { id: 'seed-2', date: dateKey(new Date(now.getTime() - 86400000)), time: '08:46', quality: '顺畅', feeling: '早起一身轻', note: '', demo: true },
  { id: 'seed-3', date: dateKey(new Date(now.getTime() - 2 * 86400000)), time: '22:18', quality: '偏硬', feeling: '今天水喝少了', note: '', demo: true },
  { id: 'seed-4', date: dateKey(new Date(now.getTime() - 3 * 86400000)), time: '08:30', quality: '顺畅', feeling: '规律的一天', note: '', demo: true },
  { id: 'seed-5', date: dateKey(new Date(now.getTime() - 4 * 86400000)), time: '12:05', quality: '偏稀', feeling: '肚子有点闹', note: '', demo: true },
  { id: 'seed-6', date: dateKey(new Date(now.getTime() - 5 * 86400000)), time: '09:02', quality: '顺畅', feeling: '轻松', note: '', demo: true },
  { id: 'seed-7', date: dateKey(new Date(now.getTime() - 6 * 86400000)), time: '08:53', quality: '顺畅', feeling: '很有精神', note: '', demo: true }
];

const defaultState = {
  name: '小便便', rate: 8.8, target: 2, water: 1250, activeView: 'today', entries: seededEntries
};

let state;
try { state = JSON.parse(localStorage.getItem(STORAGE_KEY)) || defaultState; } catch { state = defaultState; }
state.entries = Array.isArray(state.entries) ? state.entries : seededEntries;

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
const money = (value) => `¥${Number(value).toFixed(1)}`;
const formatDate = (key) => {
  const date = new Date(`${key}T12:00:00`);
  return `${date.getMonth() + 1}月${date.getDate()}日`;
};
const getEntries = (key = todayKey) => state.entries.filter(item => item.date === key).sort((a, b) => b.time.localeCompare(a.time));
const saveState = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
const qualityClass = (quality) => quality === '顺畅' ? 'good' : quality === '偏稀' ? 'alert' : '';

function getWeekData() {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now.getTime() - (6 - index) * 86400000);
    const key = dateKey(date);
    return { key, label: index === 6 ? '今天' : `${date.getMonth() + 1}/${date.getDate()}`, count: getEntries(key).length, today: key === todayKey };
  });
}

function renderToday() {
  const todayEntries = getEntries();
  const todayTotal = todayEntries.length * state.rate;
  const progress = Math.min(100, Math.round(todayEntries.length / state.target * 100));
  const week = getWeekData();
  const maxCount = Math.max(2, ...week.map(item => item.count));
  return `
    <section class="page">
      <div class="page-heading">
        <div><span class="eyebrow">TODAY'S SHIFT · ${formatDate(todayKey)}</span><h1>早上好，${escapeHtml(state.name)}。</h1><p class="subheading">今天也要顺顺利利，把每一次上班都变成小小的收获。</p></div>
        <span class="date-chip">${todayEntries.length ? '● 今日已开工' : '○ 等待第一次开工'}</span>
      </div>
      <div class="overview-grid">
        <article class="earnings-card">
          <div class="earnings-top"><div><span class="eyebrow">今日已结算工资</span><h2>${money(todayTotal)}</h2><p>${todayEntries.length ? `完成 ${todayEntries.length} 次打卡，继续保持好状态` : '记录第一次打卡，领取今天的第一笔工资'}</p></div><div class="mascot" aria-label="可爱的便便吉祥物"><div class="poop-shape"></div><div class="face"><i class="eye left"></i><i class="eye right"></i><i class="smile"></i><i class="blush left"></i><i class="blush right"></i></div></div></div>
          <div class="earnings-bottom"><div class="progress-track"><div class="progress-fill" style="width:${progress}%"></div></div><span class="progress-label">${todayEntries.length}/${state.target} 次健康目标</span></div>
        </article>
        <div class="quick-stats">
          <article class="mini-card"><div class="mini-icon">↗</div><div class="mini-copy"><span>连续开工</span><strong>${getStreak()} <small>天</small></strong></div><button class="mini-link" data-view="history">查看</button></article>
          <article class="mini-card"><div class="mini-icon">♨</div><div class="mini-copy"><span>本周累计</span><strong>${money(week.reduce((sum, item) => sum + item.count * state.rate, 0))}</strong></div><span class="mini-link">稳步涨薪</span></article>
        </div>
      </div>
      <div class="section-grid">
        <article class="panel"><div class="panel-head"><div><h2>今日上班记录</h2><p>把身体的小信号，好好记下来。</p></div><button class="button button-primary" data-scroll="addRecord">＋ 记录一次</button></div><div class="record-list">${renderTodayEntries(todayEntries)}</div></article>
        <article class="panel add-panel" id="addRecord"><div class="panel-head"><div><h2>完成一次结算</h2><p>大方记录，不用害羞。</p></div><span class="eyebrow">+ ${money(state.rate)}</span></div>${renderRecordForm()}</article>
      </div>
      <div class="section-grid">
        <article class="panel"><div class="panel-head"><div><h2>本周开工节奏</h2><p>规律，比次数更重要。</p></div><span class="tag good">近 7 天</span></div><div class="week-chart">${week.map(item => `<div class="bar-col ${item.today ? 'today' : ''}"><span class="bar-value">${item.count || ''}</span><div class="bar" style="height:${Math.max(5, item.count / maxCount * 83)}%"></div><span class="bar-label">${item.label}</span></div>`).join('')}</div></article>
        <article class="panel"><div class="panel-head"><div><h2>今日饮水</h2><p>让肠道也喝饱水。</p></div><span class="tag">${Math.round(state.water / 250)} 杯</span></div><div class="water-summary"><strong>${state.water} ml</strong><span>建议 ${state.target * 750} ml</span></div><div class="water-bar"><div class="water-fill" style="width:${Math.min(100, state.water / (state.target * 750) * 100)}%"></div></div><div class="water-actions"><button data-water="250">＋250 ml</button><button data-water="500">＋500 ml</button><button data-water="reset">清零</button></div></article>
      </div>
    </section>`;
}

function renderTodayEntries(items) {
  if (!items.length) return '<div class="empty-state"><b>☁</b>今天还没有记录，身体在等你发工资。</div>';
  return items.map(item => `<div class="record-row"><div class="record-dot">${item.quality === '顺畅' ? '☀' : item.quality === '偏硬' ? '◒' : '≈'}</div><div class="record-copy"><strong>${item.time} · ${item.quality}</strong><span>${escapeHtml(item.feeling || item.note || '认真完成一次身体打卡')}</span></div><span class="record-money">+${money(state.rate)}</span></div>`).join('');
}

function renderRecordForm() {
  return `<form id="recordForm"><div class="field-grid"><div class="field-group"><label class="field-label" for="recordTime">时间</label><input class="field-input" id="recordTime" type="time" value="${new Date().toTimeString().slice(0, 5)}" required /></div><div class="field-group"><label class="field-label" for="recordFeeling">体感</label><select class="field-select" id="recordFeeling"><option>状态不错，轻装上阵</option><option>早起一身轻</option><option>今天水喝少了</option><option>肚子有点闹</option></select></div></div><div class="field-group"><span class="field-label">状态</span><div class="quality-options"><input id="qualityGood" name="quality" value="顺畅" type="radio" checked /><label for="qualityGood">☀ 顺畅</label><input id="qualityHard" name="quality" value="偏硬" type="radio" /><label for="qualityHard">◒ 偏硬</label><input id="qualitySoft" name="quality" value="偏稀" type="radio" /><label for="qualitySoft">≈ 偏稀</label></div></div><div class="field-group"><label class="field-label" for="recordNote">备注 <span style="font-weight:400;color:#aaa">（可选）</span></label><textarea class="field-textarea" id="recordNote" maxlength="80" placeholder="比如：昨晚吃了火锅、今天睡得很好..."></textarea></div><button class="button button-primary form-submit" type="submit">完成打卡，领取 ${money(state.rate)} →</button></form>`;
}

function renderHistory() {
  const sorted = [...state.entries].sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`));
  return `<section class="page"><div class="page-heading"><div><span class="eyebrow">ARCHIVE · YOUR BODY LOG</span><h1>历史记录</h1><p class="subheading">每一次规律，都是给未来的自己发红包。</p></div><div class="date-chip">累计结算 <strong>${money(state.entries.length * state.rate)}</strong></div></div><article class="panel"><div class="panel-head"><div><h2>全部上班明细</h2><p>共 ${state.entries.length} 条记录</p></div><div class="history-total">${money(state.entries.length * state.rate)}</div></div><div class="history-toolbar"><input class="search-input" id="historySearch" placeholder="搜索日期、状态或备注..." /><button class="button button-ghost" data-export>导出记录</button></div><div class="table-wrap"><table class="history-table"><thead><tr><th>日期</th><th>时间</th><th>状态</th><th>体感 / 备注</th><th>工资</th></tr></thead><tbody id="historyBody">${renderHistoryRows(sorted)}</tbody></table></div></article></section>`;
}

function renderHistoryRows(items) {
  if (!items.length) return '<tr><td colspan="5"><div class="empty-state">没有找到匹配的记录。</div></td></tr>';
  return items.map(item => `<tr><td>${formatDate(item.date)}</td><td>${item.time}</td><td><span class="tag ${qualityClass(item.quality)}">${item.quality}</span></td><td>${escapeHtml(item.feeling || item.note || '—')}</td><td class="record-money">+${money(state.rate)}</td></tr>`).join('');
}

function renderAdvice() {
  const todayItems = getEntries();
  const hardCount = state.entries.filter(item => item.quality === '偏硬').length;
  const softCount = state.entries.filter(item => item.quality === '偏稀').length;
  const waterPercent = Math.min(100, Math.round(state.water / (state.target * 750) * 100));
  return `<section class="page"><div class="page-heading"><div><span class="eyebrow">CARE GUIDE · GENTLE REMINDERS</span><h1>健康建议</h1><p class="subheading">不追求满分，只和身体保持一点点默契。</p></div><span class="date-chip">今日状态：${todayItems.length ? '已开工' : '待开工'}</span></div><div class="advice-grid"><article class="advice-card"><span class="advice-icon">🥝</span><h3>膳食纤维加一点</h3><p>每天安排蔬菜、水果、全谷物或豆类。纤维增加要慢慢来，同时记得补充水分。</p></article><article class="advice-card"><span class="advice-icon">💧</span><h3>你的饮水进度 ${waterPercent}%</h3><p>${waterPercent < 60 ? '今天还可以再喝两杯水，温水会是肠道很好的小帮手。' : '做得不错，继续分次饮水，别一次性猛灌。'}</p></article><article class="advice-card"><span class="advice-icon">🚶</span><h3>饭后走一走</h3><p>轻松散步 10 到 20 分钟，有助于维持规律的生活节奏，也让心情透透气。</p></article><article class="advice-card"><span class="advice-icon">🛌</span><h3>给规律留个位置</h3><p>固定作息、感到便意时及时处理。${hardCount > softCount ? '你最近偏硬记录较多，试试早点睡并增加饮水。' : '保持现在的节奏，别给自己太大压力。'}</p></article></div><div class="health-note"><strong>温柔提醒：</strong>这个小工具只用于生活记录，不替代医生诊断。如果持续出现明显腹痛、便血、黑便，或排便习惯长时间改变，请及时咨询专业医生。近期偏稀记录：${softCount} 次，偏硬记录：${hardCount} 次。</div></section>`;
}

function render() {
  const root = $('#viewRoot');
  root.innerHTML = state.activeView === 'history' ? renderHistory() : state.activeView === 'advice' ? renderAdvice() : renderToday();
  $$('.nav-item').forEach(button => button.classList.toggle('is-active', button.dataset.view === state.activeView));
  $('#profileName').textContent = state.name;
  $('#headerDate').textContent = `今天，正在为健康上班 · ${formatDate(todayKey)}`;
  bindViewEvents();
}

function bindViewEvents() {
  $$('[data-view]').forEach(button => button.addEventListener('click', () => { state.activeView = button.dataset.view; saveState(); render(); window.scrollTo({ top: 0, behavior: 'smooth' }); }));
  $$('[data-scroll]').forEach(button => button.addEventListener('click', () => document.getElementById(button.dataset.scroll)?.scrollIntoView({ behavior: 'smooth', block: 'center' })));
  $$('[data-water]').forEach(button => button.addEventListener('click', () => { state.water = button.dataset.water === 'reset' ? 0 : state.water + Number(button.dataset.water); saveState(); render(); showToast(button.dataset.water === 'reset' ? '饮水记录已清零' : `已记录 ${button.dataset.water} ml 饮水`); }));
  $('#recordForm')?.addEventListener('submit', (event) => { event.preventDefault(); const quality = $('input[name="quality"]:checked').value; state.entries.push({ id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()), date: todayKey, time: $('#recordTime').value, quality, feeling: $('#recordFeeling').value, note: $('#recordNote').value.trim() }); saveState(); render(); showToast(`打卡成功，${money(state.rate)} 已到账`); });
  $('#historySearch')?.addEventListener('input', (event) => { const keyword = event.target.value.trim().toLowerCase(); const filtered = state.entries.filter(item => `${item.date} ${item.time} ${item.quality} ${item.feeling} ${item.note}`.toLowerCase().includes(keyword)).sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`)); $('#historyBody').innerHTML = renderHistoryRows(filtered); });
  $('[data-export]')?.addEventListener('click', exportRecords);
}

function getStreak() {
  const days = new Set(state.entries.map(item => item.date)); let streak = 0; const cursor = new Date(now);
  while (days.has(dateKey(cursor))) { streak += 1; cursor.setDate(cursor.getDate() - 1); }
  return streak;
}

function escapeHtml(value = '') { return value.replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char])); }
function showToast(message) { const toast = $('#toast'); toast.textContent = message; toast.classList.add('show'); clearTimeout(window.toastTimer); window.toastTimer = setTimeout(() => toast.classList.remove('show'), 2300); }
function exportRecords() { const lines = [['日期', '时间', '状态', '体感', '备注', '工资'], ...state.entries.map(item => [item.date, item.time, item.quality, item.feeling, item.note, state.rate])]; const csv = '\ufeff' + lines.map(row => row.map(value => `"${String(value ?? '').replace(/"/g, '""')}"`).join(',')).join('\n'); const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); link.download = `便便打工人-${todayKey}.csv`; link.click(); URL.revokeObjectURL(link.href); showToast('记录已导出为 CSV'); }

function openSettings() { const dialog = $('#settingsDialog'); $('#nameInput').value = state.name; $('#rateInput').value = state.rate; $('#targetInput').value = state.target; dialog.showModal(); }
$('#openSettings').addEventListener('click', openSettings);
$('#mobileSettings').addEventListener('click', openSettings);
$('#settingsForm').addEventListener('submit', (event) => { if (event.submitter?.value === 'cancel') return; event.preventDefault(); state.name = $('#nameInput').value.trim() || '小便便'; state.rate = Number($('#rateInput').value) || 0; state.target = Number($('#targetInput').value) || 1; saveState(); $('#settingsDialog').close(); render(); showToast('设置已更新'); });

render();
