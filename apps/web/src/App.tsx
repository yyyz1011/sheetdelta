import { useMemo, useRef, useState } from 'react';
import { ArrowDownToLine, ArrowLeftRight, ArrowRight, BookOpen, Check, ChevronLeft, ChevronRight, CircleHelp, Code2, FileSpreadsheet, FolderOpen, Layers2, LoaderCircle, Plus, Save, Search, ShieldCheck, SlidersHorizontal, Sparkles, Trash2, Upload, X } from 'lucide-react';
import { exportDiffCsv, type ColumnPair, type CompareOptions, type DiffResult, type DiffRow, type Status } from 'sheetdelta-core';
import { ProcessingError, runWorker } from './client';
import { sampleFiles, type Sheet, type SourceFile } from './data';

type Preset = { id: string; name: string; options: CompareOptions };
type Source = { file: SourceFile; sheetIndex: number };
type Filter = Status | 'differences' | 'all';
const labels: Record<Status, string> = { changed: '已修改', added: '新增', removed: '已删除', unchanged: '未变化' };
const STORAGE_KEY = 'sheetdelta.rules.v1';
function readRules(): Preset[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((p): p is Preset => p && typeof p.id === 'string' && typeof p.name === 'string' && p.options && Array.isArray(p.options.keys) && p.options.keys.length > 0 && Array.isArray(p.options.columns) && p.options.columns.length > 0 && [...p.options.keys, ...p.options.columns].every(pair => pair && typeof pair.left === 'string' && typeof pair.right === 'string' && (pair.numericTolerance == null || typeof pair.numericTolerance === 'number' && Number.isFinite(pair.numericTolerance) && pair.numericTolerance >= 0))).slice(0, 20);
  } catch { return []; }
}
const activeSheet = (source: Source | undefined) => source?.file.sheets[source.sheetIndex];
function guessOptions(left: Sheet, right: Sheet): CompareOptions {
  const common = left.headers.filter(header => right.headers.includes(header));
  const key = common.find(header => /^(sku|id|ean|编号|商品编号|订单号|商品编码)$/i.test(header)) ?? common[0];
  const keys = [{ left: key ?? left.headers[0], right: key ?? right.headers[0] }];
  return { keys, columns: common.filter(header => header !== key).map(header => ({ left: header, right: header })), trim: true, ignoreCase: false };
}

function FileSlot({ side, source, busy, onFile, onSheet, onRemove }: { side: 'left' | 'right'; source?: Source; busy: boolean; onFile: (file: File) => void; onSheet: (index: number) => void; onRemove: () => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const title = side === 'left' ? '原始表格' : '更新后的表格';
  const sheet = activeSheet(source);
  return <section className={`file-slot ${source ? 'loaded' : ''} ${drag ? 'dragging' : ''}`} onDragOver={event => { event.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={event => { event.preventDefault(); setDrag(false); if (!busy && event.dataTransfer.files[0]) onFile(event.dataTransfer.files[0]); }}>
    <div className="slot-heading"><span className={`version-dot ${side}`} /><h3>{title}</h3><span className="slot-tag">{side === 'left' ? '比较前' : '比较后'}</span>{source && <button className="icon-button remove-file" aria-label={`移除${title}`} onClick={onRemove} disabled={busy}><X size={16} /></button>}</div>
    <input ref={input} className="file-input" type="file" accept=".csv,.tsv,.xlsx,.xls" aria-label={`选择${title}`} disabled={busy} onChange={event => { const file = event.target.files?.[0]; if (file) onFile(file); event.target.value = ''; }} />
    {busy ? <div className="upload-body"><LoaderCircle className="spin" size={30} /><strong>正在读取表格…</strong><span>文件只在当前浏览器中处理</span></div> : source ? <>
      <button className="selected-file" onClick={() => input.current?.click()} title="点击更换文件"><span className="file-symbol"><FileSpreadsheet size={28} strokeWidth={1.6} /></span><span><strong>{source.file.name}</strong><small>{sheet?.rows.length.toLocaleString()} 行 · {sheet?.headers.length} 列{source.file.sample ? ' · 示例数据' : ''}</small></span><Check className="file-check" size={18} /></button>
      {source.file.sheets.length > 1 && <label className="sheet-picker">工作表<select aria-label={`${title}工作表`} value={source.sheetIndex} onChange={event => onSheet(Number(event.target.value))}>{source.file.sheets.map((s, i) => <option value={i} key={i}>{s.name} · {s.rows.length} 行</option>)}</select></label>}
      <div className="file-bottom"><span>{sheet?.headers.slice(0, 4).join(' · ')}{(sheet?.headers.length ?? 0) > 4 ? ' …' : ''}</span><button className="text-button" onClick={() => input.current?.click()}>更换文件</button></div>
    </> : <button className="upload-body upload-button" onClick={() => input.current?.click()}><span className="upload-symbol"><Upload size={25} strokeWidth={1.7} /></span><strong>拖入文件，或<span>点击选择</span></strong><small>Excel、CSV 或 TSV · 单文件不超过 10 MB</small></button>}
  </section>;
}

function ValueCell({ row, pair }: { row: DiffRow; pair: ColumnPair }) {
  const before = row.before?.[pair.left], after = row.after?.[pair.right];
  const changed = row.changes.some(change => change.leftColumn === pair.left && change.rightColumn === pair.right);
  const render = (value: unknown) => value == null || value === '' ? <span className="empty-value">空值</span> : String(value);
  if (changed) return <td className="changed-cell"><span className="old-value">{render(before)}</span><span className="new-value"><ArrowRight size={12} />{render(after)}</span></td>;
  return <td>{render(row.status === 'removed' ? before : after)}</td>;
}

export default function App() {
  const [left, setLeft] = useState<Source>();
  const [right, setRight] = useState<Source>();
  const [loading, setLoading] = useState({ left: false, right: false });
  const [busy, setBusy] = useState(false);
  const [options, setOptions] = useState<CompareOptions>({ keys: [], columns: [], trim: true, ignoreCase: false });
  const [result, setResult] = useState<DiffResult>();
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const [filter, setFilter] = useState<Filter>('differences');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rules, setRules] = useState<Preset[]>(readRules);
  const [showSave, setShowSave] = useState(false);
  const [ruleName, setRuleName] = useState('');
  const [advanced, setAdvanced] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [pendingRule, setPendingRule] = useState<Preset>();
  const generation = useRef(0);
  const sourceVersion = useRef({ left: 0, right: 0 });
  const sources = useRef<{ left?: Source; right?: Source }>({});
  const resultsRef = useRef<HTMLElement>(null);
  const leftSheet = activeSheet(left), rightSheet = activeSheet(right);
  const ready = !!leftSheet && !!rightSheet;
  const working = busy || loading.left || loading.right;
  function invalidate() { generation.current++; setResult(undefined); setError(undefined); setBusy(false); setPage(0); }
  function changeOptions(value: CompareOptions) { invalidate(); setOptions(value); setPendingRule(undefined); }
  function replaceSource(side: 'left' | 'right', source?: Source) {
    sources.current[side] = source;
    (side === 'left' ? setLeft : setRight)(source);
    invalidate();
    const a = activeSheet(sources.current.left), b = activeSheet(sources.current.right);
    if (a && b) setOptions(guessOptions(a, b)); else setOptions({ keys: [], columns: [], trim: true, ignoreCase: false });
  }
  async function loadFile(side: 'left' | 'right', file: File) {
    const version = ++sourceVersion.current[side];
    invalidate(); setNotice(undefined); setLoading(current => ({ ...current, [side]: true }));
    replaceSource(side, undefined);
    try {
      const parsed = await runWorker<SourceFile>('parse', file);
      if (sourceVersion.current[side] !== version) return;
      replaceSource(side, { file: parsed, sheetIndex: 0 });
    } catch (e) { if (sourceVersion.current[side] === version) setError(e instanceof Error ? e.message : '文件读取失败。'); }
    finally { if (sourceVersion.current[side] === version) setLoading(current => ({ ...current, [side]: false })); }
  }
  async function compare(a = leftSheet, b = rightSheet, settings = options) {
    if (!a || !b) return;
    const version = ++generation.current;
    setBusy(true); setError(undefined); setNotice(undefined); setResult(undefined);
    try {
      const value = await runWorker<DiffResult>('compare', { left: a.rows, right: b.rows, options: settings });
      if (version !== generation.current) return;
      setResult(value); setFilter('differences'); setQuery(''); setPage(0);
      window.dispatchEvent(new CustomEvent('sheetdelta:compare-complete', { detail: { sample: !!sources.current.left?.file.sample && !!sources.current.right?.file.sample } }));
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' }), 80);
    } catch (e) {
      if (version !== generation.current) return;
      if (e instanceof ProcessingError && e.issues?.length) {
        const issue = e.issues[0];
        const sideName = issue.side === 'left' ? '原始表格' : '更新后的表格';
        const rowNumbers = issue.rows.slice(0, 6).map(i => (issue.side === 'left' ? a : b).rowNumbers[i - 1] ?? i + 1).join('、');
        setError(issue.code === 'duplicate-key' ? `${sideName}的编号「${issue.key?.join(' + ')}」重复（第 ${rowNumbers} 行）。请选择唯一编号列，或修正重复数据后重试。` : issue.code === 'missing-key' ? `${sideName}第 ${rowNumbers} 行的匹配编号为空，请补全后重试。` : `${sideName}缺少「${issue.column}」列，请重新选择比较字段。`);
      } else setError(e instanceof Error && /Select at least one comparison/.test(e.message) ? '请至少选择一个需要比较的字段。' : e instanceof Error ? e.message : '比较失败，请重试。');
    } finally { if (version === generation.current) setBusy(false); }
  }
  function useSample() {
    sourceVersion.current.left++; sourceVersion.current.right++;
    const [a, b] = sampleFiles();
    const first = { file: a, sheetIndex: 0 }, second = { file: b, sheetIndex: 0 };
    sources.current = { left: first, right: second }; setLeft(first); setRight(second); setLoading({ left: false, right: false });
    const settings = guessOptions(a.sheets[0], b.sheets[0]); setOptions(settings); setPendingRule(undefined); setAdvanced(false);
    void compare(a.sheets[0], b.sheets[0], settings);
  }
  function swap() {
    sources.current = { left: right, right: left }; setLeft(right); setRight(left); invalidate();
    const flip = (pair: ColumnPair) => ({ ...pair, left: pair.right, right: pair.left });
    setOptions({ ...options, keys: options.keys.map(flip), columns: options.columns.map(flip) });
  }
  function saveRule() {
    if (!options.keys.length || !options.columns.length || !ruleName.trim()) return;
    if (rules.length >= 20) { setNotice('最多保存 20 条规则，请先删除不再使用的规则。'); return; }
    const preset: Preset = { id: crypto.randomUUID(), name: ruleName.trim().slice(0, 40), options: structuredClone(options) };
    const next = [preset, ...rules];
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); setRules(next); setShowSave(false); setRuleName(''); setNotice('规则已保存在此浏览器，下次导入文件后可以直接应用。'); }
    catch { setNotice('浏览器无法保存规则，请检查存储权限或可用空间。'); }
  }
  function applyRule(preset: Preset) {
    if (!leftSheet || !rightSheet) { setPendingRule(preset); setShowRules(false); setNotice(`请先导入两份表格，然后应用「${preset.name}」。`); return; }
    if (![...preset.options.keys, ...preset.options.columns].every(pair => leftSheet.headers.includes(pair.left) && rightSheet.headers.includes(pair.right))) { setError('这条规则的列名与当前表格不匹配。请确认工作表，或重新设置字段。'); return; }
    changeOptions(structuredClone(preset.options)); setAdvanced(true); setShowRules(false); setNotice(`已应用「${preset.name}」，点击开始比较查看结果。`);
  }
  function deleteRule(id: string) {
    const next = rules.filter(rule => rule.id !== id);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); setRules(next); if (pendingRule?.id === id) setPendingRule(undefined); }
    catch { setNotice('无法删除规则，请检查浏览器存储权限。'); }
  }
  function download() {
    if (!result) return;
    const exportResult: DiffResult = { ...result, rows: result.rows.map(row => ({ ...row, leftIndex: row.leftIndex == null ? undefined : (leftSheet?.rowNumbers[row.leftIndex] ?? row.leftIndex + 2) - 2, rightIndex: row.rightIndex == null ? undefined : (rightSheet?.rowNumbers[row.rightIndex] ?? row.rightIndex + 2) - 2 })) };
    const blob = new Blob([exportDiffCsv(exportResult)], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob), anchor = document.createElement('a');
    anchor.href = url; anchor.download = 'sheetdelta-差异结果.csv'; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
    setNotice('已导出全部差异记录（不含未变化记录），与当前搜索和筛选无关。');
    window.dispatchEvent(new CustomEvent('sheetdelta:export-complete'));
  }
  const visibleRows = useMemo(() => result?.rows.filter(row => (filter === 'all' || filter === 'differences' && row.status !== 'unchanged' || row.status === filter) && (!query || [row.key, Object.values(row.before ?? {}), Object.values(row.after ?? {})].flat().join(' ').toLowerCase().includes(query.toLowerCase()))) ?? [], [result, filter, query]);
  const pageRows = visibleRows.slice(page * 25, (page + 1) * 25);
  const displayColumns = result?.options.columns ?? [];
  const changeKey = (side: 'left' | 'right', value: string) => {
    const key = { ...options.keys[0], [side]: value };
    const columns = options.columns.filter(pair => pair.left !== key.left && pair.right !== key.right);
    changeOptions({ ...options, keys: [key], columns });
  };
  return <div className="app-shell">
    <a href="#workspace" className="skip-link">跳到表格对比</a>
    <aside className="sidebar">
      <a className="brand" href={import.meta.env.BASE_URL}><span className="brand-mark"><Layers2 size={24} /></span><span>表里<small>SheetDelta</small></span></a>
      <nav aria-label="主导航"><span className="nav-group-label">工作台</span><a className="nav-item active" href={import.meta.env.BASE_URL} aria-current="page"><ArrowLeftRight size={18} />表格对比</a><button className={`nav-item ${showRules ? 'selected' : ''}`} onClick={() => setShowRules(!showRules)}><FolderOpen size={18} />我的规则<span className="nav-count">{rules.length}</span></button><span className="nav-group-label resources-label">使用与接入</span><a className="nav-item" href={import.meta.env.BASE_URL === '/' ? '/guide/' : '/docs/zh/browser-tool.html'}><BookOpen size={18} />使用指南</a><a className="nav-item" href="/docs/"><Code2 size={18} />开发者文档</a></nav>
      <div className="sidebar-note"><ShieldCheck size={21} /><strong>文件留在你手里</strong><p>读取与比较均在浏览器内完成，无需上传服务器。</p></div><div className="sidebar-footer"><span className="status-dot" />本地开发版 <span>v0.1</span></div>
    </aside>
    <div className="main-shell"><header className="topbar"><div className="mobile-brand"><Layers2 size={20} />表里</div><button className="mobile-rules" onClick={() => setShowRules(!showRules)}><FolderOpen size={16} />我的规则 {rules.length}</button><span className="breadcrumb">工作台 <ChevronRight size={14} /><strong>表格对比</strong></span><a href={import.meta.env.BASE_URL === '/' ? '/guide/' : '/docs/zh/browser-tool.html'} className="help-link"><CircleHelp size={16} />如何使用</a></header>
    <main id="workspace"><p className="sr-only" role="status">{busy ? '正在比较表格' : result ? `比较完成：${result.summary.changed} 行修改，${result.summary.added} 行新增，${result.summary.removed} 行删除。` : ''}</p>
      <div className="page-intro"><div><h1>看清每一处<span>数据变化</span><span className="title-period">。</span></h1><p>两份表格，一目了然。按编号匹配，轻松找出新增、删除与修改。</p></div><button className="button sample-button" onClick={useSample} disabled={working}><Sparkles size={17} />试用商品示例<ArrowRight size={15} /></button></div>
      {showRules && <section className="rules-panel"><div className="panel-title"><h2>我的比较规则</h2><button className="icon-button" aria-label="关闭我的规则" onClick={() => setShowRules(false)}><X size={18} /></button></div>{rules.length ? <ul>{rules.map(rule => <li key={rule.id}><button onClick={() => applyRule(rule)}><FolderOpen size={18} /><span><strong>{rule.name}</strong><small>{rule.options.keys.map(pair => pair.left).join(' + ')} · {rule.options.columns.length} 个比较字段</small></span><ArrowRight size={16} /></button><button className="icon-button" aria-label={`删除规则 ${rule.name}`} onClick={() => deleteRule(rule.id)}><Trash2 size={16} /></button></li>)}</ul> : <p className="empty-rules">还没有保存的规则。导入两份表格并设置字段后，点击「保存规则」，下次就能直接复用。</p>}</section>}
      <section className="workspace-panel" aria-labelledby="upload-title">
        <div className="section-heading"><span className="step">1</span><h2 id="upload-title">放入需要比较的表格</h2><span className="section-description">第一行为表头</span></div>
        <div className="file-pair"><FileSlot side="left" source={left} busy={loading.left} onFile={file => void loadFile('left', file)} onSheet={i => replaceSource('left', { file: left!.file, sheetIndex: i })} onRemove={() => replaceSource('left')} /><button className="swap-button" onClick={swap} disabled={!ready || working} aria-label="交换原始与更新表格" title="交换两份表格"><ArrowLeftRight size={18} /></button><FileSlot side="right" source={right} busy={loading.right} onFile={file => void loadFile('right', file)} onSheet={i => replaceSource('right', { file: right!.file, sheetIndex: i })} onRemove={() => replaceSource('right')} /></div>
        <div className="upload-footnote"><ShieldCheck size={14} />本地处理，无需注册<span>支持 .xlsx / .xls / .csv / .tsv</span></div>
        <div className="rules-section"><div className="section-heading"><span className="step">2</span><h2>选择如何匹配</h2>{ready && <button className="text-button save-trigger" onClick={() => setShowSave(!showSave)} disabled={!options.columns.length}><Save size={15} />保存规则</button>}</div>
          <div className="matching-row"><div className="matching-fields"><label>原始表格的编号列<select aria-label="原始表格的编号列" disabled={!ready || working} value={options.keys[0]?.left ?? ''} onChange={event => changeKey('left', event.target.value)}>{!ready && <option value="">导入表格后选择</option>}{leftSheet?.headers.map(header => <option key={header}>{header}</option>)}</select></label><ArrowRight className="mapping-arrow" size={20} /><label>更新表格的编号列<select aria-label="更新表格的编号列" disabled={!ready || working} value={options.keys[0]?.right ?? ''} onChange={event => changeKey('right', event.target.value)}>{!ready && <option value="">导入表格后选择</option>}{rightSheet?.headers.map(header => <option key={header}>{header}</option>)}</select></label></div><button className="button primary compare-button" onClick={() => void compare()} disabled={!ready || working || !options.columns.length}>{busy ? <LoaderCircle size={17} className="spin" /> : <ArrowLeftRight size={17} />}{busy ? '正在比较…' : '开始比较'}{!busy && <ArrowRight size={16} />}</button></div>
          <div className="matching-hint">{ready && !options.columns.length ? '还没有选择比较字段。展开下方「比较字段」，勾选并对应两份表格的列。' : '选择每行唯一的 SKU、订单号等编号。即使顺序改变，也能正确匹配。'}</div>
          <div className="options-bar"><label className="checkbox-label"><input type="checkbox" checked={options.trim ?? false} disabled={!ready || working} onChange={event => changeOptions({ ...options, trim: event.target.checked })} />忽略首尾空格</label><label className="checkbox-label"><input type="checkbox" checked={options.ignoreCase ?? false} disabled={!ready || working} onChange={event => changeOptions({ ...options, ignoreCase: event.target.checked })} />忽略大小写</label><button className="text-button advanced-toggle" onClick={() => setAdvanced(!advanced)} disabled={!ready || working} aria-expanded={advanced}><SlidersHorizontal size={15} />比较字段{ready && <span> {options.columns.length}</span>}<ChevronRight size={14} className={advanced ? 'rotate' : ''} /></button></div>
          {pendingRule && ready && <button className="pending-rule" onClick={() => applyRule(pendingRule)}><FolderOpen size={16} />应用已选择的规则：{pendingRule.name}<ArrowRight size={15} /></button>}
          {ready && advanced && <div className="field-mappings"><p>勾选需要比较的字段；两边列名不同，也可以手动对应。数值容差留空时按文本比较。</p><div className="mapping-head"><span>原始字段</span><span>对应更新字段</span><span>数值容差（可选）</span></div>{leftSheet.headers.filter(header => header !== options.keys[0]?.left).map(header => {
            const pair = options.columns.find(p => p.left === header);
            const available = rightSheet.headers.filter(h => h !== options.keys[0]?.right && !options.columns.some(p => p.left !== header && p.right === h));
            return <div className="mapping-line" key={header}><label className="checkbox-label"><input type="checkbox" checked={!!pair} disabled={working || !pair && !available.length} onChange={event => changeOptions({ ...options, columns: event.target.checked ? [...options.columns, { left: header, right: available.includes(header) ? header : available[0] }] : options.columns.filter(p => p.left !== header) })} />{header}</label><select aria-label={`${header}对应字段`} disabled={!pair || working} value={pair?.right ?? ''} onChange={event => changeOptions({ ...options, columns: options.columns.map(p => p.left === header ? { ...p, right: event.target.value } : p) })}>{!pair && <option value="">不比较</option>}{available.map(h => <option key={h}>{h}</option>)}</select><input aria-label={`${header}数值容差`} type="number" min="0" step="any" placeholder="按文本比较" disabled={!pair || working} value={pair?.numericTolerance ?? ''} onChange={event => changeOptions({ ...options, columns: options.columns.map(p => p.left === header ? { ...p, numericTolerance: event.target.value === '' ? undefined : Number(event.target.value) } : p) })} /></div>;
          })}</div>}
          {showSave && <form className="save-form" onSubmit={event => { event.preventDefault(); saveRule(); }}><label htmlFor="rule-name">给这条规则起个名字</label><div><input id="rule-name" placeholder="例如：每周商品价格与库存" value={ruleName} maxLength={40} onChange={event => setRuleName(event.target.value)} required autoFocus /><button className="button primary" type="submit" disabled={!ruleName.trim()}>保存</button><button className="icon-button" type="button" aria-label="取消保存" onClick={() => setShowSave(false)}><X size={18} /></button></div><small>只保存列名和比较选项，不保存文件内容。</small></form>}
        </div>
      </section>
      {error && <div className="error-message" role="alert"><CircleHelp size={19} /><span>{error}</span><button className="icon-button" aria-label="关闭错误提示" onClick={() => setError(undefined)}><X size={16} /></button></div>}
      {notice && <div className="notice" role="status"><Check size={17} /><span>{notice}</span><button className="icon-button" aria-label="关闭提示" onClick={() => setNotice(undefined)}><X size={16} /></button></div>}
      {result ? <section className="results-panel" ref={resultsRef} aria-labelledby="results-title"><div className="results-heading"><div><h2 id="results-title">比较结果{left?.file.sample && right?.file.sample && <span className="sample-badge">示例数据</span>}</h2><p>原始 {result.summary.before.toLocaleString()} 行，更新后 {result.summary.after.toLocaleString()} 行 · 已按 {result.options.keys.map(pair => pair.left).join(' + ')} 匹配</p></div><button className="button export-button" onClick={download}><ArrowDownToLine size={17} />导出差异 CSV</button></div>
        <div className="result-summary">{(['changed', 'added', 'removed', 'unchanged'] as Status[]).map(status => <button className={`summary-item ${status} ${filter === status ? 'chosen' : ''}`} key={status} onClick={() => { setFilter(status); setPage(0); }} aria-pressed={filter === status}><span className="summary-label"><span className={`status-marker ${status}`} />{labels[status]}</span><strong>{result.summary[status].toLocaleString()}<small>行</small></strong></button>)}</div>
        <div className="table-toolbar"><div className="result-tabs"><button className={filter === 'differences' ? 'active' : ''} onClick={() => { setFilter('differences'); setPage(0); }}>仅看差异 <span>{result.summary.total - result.summary.unchanged}</span></button><button className={filter === 'all' ? 'active' : ''} onClick={() => { setFilter('all'); setPage(0); }}>全部记录</button>{!['differences', 'all'].includes(filter) && <span className="active-status-filter">{labels[filter as Status]}</span>}</div><label className="search-field"><Search size={16} /><input aria-label="搜索比较结果" placeholder="搜索编号或内容" value={query} onChange={event => { setQuery(event.target.value); setPage(0); }} /></label></div>
        <p className="table-scroll-hint"><ArrowLeftRight size={14} />左右滑动查看全部字段，修改前后的值会同时显示。</p><div className="table-scroll" tabIndex={0} role="region" aria-label="差异明细，可左右滚动查看所有字段"><table className="diff-table"><thead><tr><th scope="col">状态</th><th scope="col">{result.options.keys.map(pair => pair.left).join(' + ')}</th>{displayColumns.map(pair => <th scope="col" key={pair.left}>{pair.left}{pair.right !== pair.left && <small> → {pair.right}</small>}</th>)}</tr></thead><tbody>{pageRows.map(row => <tr key={JSON.stringify(row.key)} className={`row-${row.status}`}><td><span className={`status-badge ${row.status}`}>{row.status === 'added' ? <Plus size={12} /> : row.status === 'removed' ? <X size={12} /> : row.status === 'changed' ? <ArrowLeftRight size={12} /> : <Check size={12} />}{labels[row.status]}</span></td><td className="key-cell">{row.key.join(' + ')}</td>{displayColumns.map(pair => <ValueCell key={pair.left} row={row} pair={pair} />)}</tr>)}</tbody></table>{!visibleRows.length && <div className="empty-results"><Check size={26} /><strong>{query ? '没有找到匹配的记录' : filter === 'differences' ? '所选字段没有变化' : '这个分类下没有记录'}</strong><p>{query ? '试试其他编号或关键词。' : '可以切换到全部记录，查看完整比较结果。'}</p></div>}</div>
        <div className="table-footer"><span>{visibleRows.length ? `${page * 25 + 1}–${Math.min((page + 1) * 25, visibleRows.length)}` : '0'} / {visibleRows.length.toLocaleString()} 条记录</span><span className="table-legend"><span className="legend-old">原始值</span><ArrowRight size={12} /><span>更新值</span></span><div className="pagination"><button className="icon-button" aria-label="上一页" disabled={page === 0} onClick={() => setPage(page - 1)}><ChevronLeft size={17} /></button><span>{page + 1} / {Math.max(1, Math.ceil(visibleRows.length / 25))}</span><button className="icon-button" aria-label="下一页" disabled={(page + 1) * 25 >= visibleRows.length} onClick={() => setPage(page + 1)}><ChevronRight size={17} /></button></div></div>
      </section> : <section className="welcome-preview"><div className="preview-copy"><span className="preview-icon"><ArrowLeftRight size={22} /></span><h2>顺序变了，<br />也不会看错变化。</h2><p>按唯一编号找到同一条记录，<br />把真正需要关注的变化留给你。</p><button className="text-button" onClick={useSample} disabled={working}>用一组商品数据试试看<ArrowRight size={15} /></button></div><div className="mini-comparison" aria-label="差异展示示意"><div className="mini-caption">差异展示示意<span>按 SKU 匹配</span></div><table><thead><tr><th>商品</th><th>原始价格</th><th>更新价格</th><th>变化</th></tr></thead><tbody><tr><td>日常随行杯</td><td className="mini-old">129.00</td><td className="mini-new">119.00</td><td><span className="status-badge changed">已修改</span></td></tr><tr><td>旅行收纳袋</td><td>—</td><td>89.00</td><td><span className="status-badge added">新增</span></td></tr><tr><td>便携折叠伞</td><td>159.00</td><td>—</td><td><span className="status-badge removed">已删除</span></td></tr></tbody></table></div></section>}
      <footer className="page-footer"><span>表里 SheetDelta <span className="footer-dot">·</span> 让数据变化有迹可循</span><div><a href={import.meta.env.BASE_URL === '/' ? '/guide/' : '/docs/zh/browser-tool.html'}>使用指南</a><a href="/docs/">npm 接入文档<ArrowRight size={13} /></a></div></footer>
    </main></div>
  </div>;
}
