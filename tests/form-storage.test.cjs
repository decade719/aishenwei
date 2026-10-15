const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const code = readFileSync(require('node:path').join(__dirname, '../form-submission-manager.js'), 'utf8');
function createManager(storage) {
  const context = { window: {}, localStorage: storage };
  vm.runInNewContext(code, context);
  return context.window.formSubmissionManager;
}
function memoryStorage() {
  const values = new Map();
  return { values, getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
}
test('opening a page does not create personal-data collections', () => {
  const storage = memoryStorage(); createManager(storage);
  assert.equal(storage.values.size, 0);
});
test('drafts survive another manager instance and remain separated', () => {
  const storage = memoryStorage(); const first = createManager(storage);
  first.saveMessage({ name: '测试用户', email: 'test@example.com', message: '本地测试' });
  first.saveResume({ name: '测试用户', resumeFile: 'sample.pdf' });
  const order = first.saveOrder({ product: 'indoor', quantity: '1' });
  const second = createManager(storage);
  assert.equal(second.getMessages()[0].message, '本地测试');
  assert.equal(second.getResumes()[0].resumeFile, 'sample.pdf');
  assert.equal(second.getOrders()[0].id, order.id);
  assert.equal(second.getStats().pendingOrders, 1);
});
test('corrupt records are never silently overwritten', () => {
  for (const raw of ['invalid-json', '{}', 'null']) {
    const storage = memoryStorage(); storage.setItem('contactMessages', raw);
    const manager = createManager(storage);
    assert.throws(() => manager.saveMessage({ message: 'test' }));
    assert.equal(storage.getItem('contactMessages'), raw);
  }
});
test('storage denial is surfaced only when saving, never reported as success', () => {
  const storage = memoryStorage(); storage.setItem = () => { throw new Error('QuotaExceededError'); };
  const manager = createManager(storage);
  assert.throws(() => manager.saveMessage({ message: 'test' }), /QuotaExceededError/);
  assert.equal(storage.values.size, 0);
});
