/* Browser-only POC records. Official and Test workbooks remain separate. */
window.PDHRecords = (() => {
  const storageKey = 'pdhRecordsV1';
  function load() {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return {official: [], tests: []};
    const data = JSON.parse(raw);
    if (!Array.isArray(data.official) || !Array.isArray(data.tests)) throw new Error('Invalid saved PD Hierarchy records');
    return data;
  }
  function save(data) { localStorage.setItem(storageKey, JSON.stringify(data)); }
  function official(year) { return load().official.find(x => x.year === String(year)) || null; }
  function baseline(year) {
    const record = official(year);
    return record?.book || null;
  }
  function saveTest(id, state, meta) {
    const data = load(), old = data.tests.find(x => x.id === id);
    const record = {...old, id: id || crypto.randomUUID(), ...meta, updatedAt: new Date().toISOString(), state: JSON.parse(JSON.stringify(state))};
    if (old) data.tests[data.tests.indexOf(old)] = record;
    else data.tests.unshift(record);
    save(data); return record;
  }
  function payload(record) {
    return {recordId: record.id, year: record.year, effectiveDate: record.effectiveDate, remark: record.remark,
      name: record.state.test?.name || 'Converted Hierarchy', converted: record.state.converted,
      mapping: record.state.reviews, primarySources: record.state.case3, baseline: baseline(record.year)};
  }
  function promote(payload, effectiveDate) {
    const data = load(), record = data.tests.find(x => x.id === payload.recordId);
    if (!record) throw new Error('找不到本次 Test 記錄，請返回 Test 列表重新選擇。');
    const current = data.official.find(x => x.year === String(payload.year));
    const after = {id: crypto.randomUUID(), year: String(payload.year), remark: payload.remark || '', effectiveDate,
      book: JSON.parse(JSON.stringify(payload.converted)), originalBase64: record.state.originalBase64, originalBook: record.state.test, addedRows: record.state.addedRows || [], sourceTestId: record.id, updatedAt: new Date().toISOString()};
    if (current) data.official[data.official.indexOf(current)] = after; else data.official.unshift(after);
    record.goLiveAt = after.updatedAt; record.effectiveDate = effectiveDate;
    save(data);
  }
  return {load, save, official, baseline, saveTest, payload, promote};
})();
