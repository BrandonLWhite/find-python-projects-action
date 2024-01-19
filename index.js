const core = require('@actions/core');
const findPythonProjects = require('./find-python-projects')

async function run() {
  try {
    const rootPath = core.getInput('root-path');
    core.info(`Searching in "${rootPath}" ...`);

    const output = await findPythonProjects(rootPath);

    core.setOutput('projects', JSON.stringify(output.projects));
    core.setOutput('paths', JSON.stringify(output.paths));
    core.setOutput('testable-projects', JSON.stringify(output.testableProjects));
    core.setOutput('packageable-projects', JSON.stringify(output.packageableProjects));

  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
