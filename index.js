const core = require('@actions/core');
const findPythonProjects = require('./find-python-projects')

async function run() {
  try {
    const rootPath = core.getInput('root-path');
    core.info(`Searching in "${rootPath}" ...`);

    output = await findPythonProjects(rootPath)

    console.log(output)
    // console.log(JSON.stringify(output.paths))

    core.setOutput('projects', JSON.stringify(output.projects));
    core.setOutput('paths', JSON.stringify(output.paths));
    core.setOutput('testable-projects', JSON.stringify(output.testableProjects));

  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
