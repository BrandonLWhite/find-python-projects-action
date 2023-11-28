const core = require('@actions/core');
const findPythonProjects = require('./find-python-projects')

// most @actions toolkit packages have async methods
async function run() {
  try {
    const root_path = core.getInput('root_path');
    core.info(`Searching in "${root_path}" ...`);

    // core.debug();

    output = await findPythonProjects(root_path)
    console.log(output.paths)
    console.log(JSON.stringify(output.paths))
    core.setOutput('paths', JSON.stringify(output.paths));

  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
