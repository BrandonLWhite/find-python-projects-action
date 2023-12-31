const process = require('process');
const cp = require('child_process');
const path = require('path');
const findPythonProjects = require('./find-python-projects')

// test('throws invalid number', async () => {
//   await expect(wait('foo')).rejects.toThrow('milliseconds not a number');
// });

// test('wait 500 ms', async () => {
//   const start = new Date();
//   await wait(500);
//   const end = new Date();
//   var delta = Math.abs(end - start);
//   expect(delta).toBeGreaterThanOrEqual(500);
// });

// shows how the runner will run a javascript action with env / stdout protocol
test('test runs', () => {
  process.env['ROOT_PATH'] = '';
  const ip = path.join(__dirname, 'index.js');
  const result = cp.execSync(`node ${ip}`, {env: process.env}).toString();
  console.log(result);
})

test('finds projects', async () => {
  await findPythonProjects('test-fixtures/multi-project');
  // expect(delta).toBeGreaterThanOrEqual(500);
});
