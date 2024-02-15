const core = require('@actions/core');

const fs = require('fs/promises');
const path = require('path');

const globby = require('globby');
const TOML = require('@iarna/toml');
const _get = require('lodash/get');

module.exports = {
    run,
    findPythonProjects
}

async function run() {
    try {
      const rootDir = core.getInput('root-dir');
      core.info(`Searching in "${rootDir}" ...`);

      const output = await findPythonProjects(rootDir);

      core.setOutput('projects', JSON.stringify(output.projects));
      core.setOutput('paths', JSON.stringify(output.paths));
      core.setOutput('testable-projects', JSON.stringify(output.testableProjects));
      core.setOutput('packageable-projects', JSON.stringify(output.packageableProjects));

    } catch (error) {
      core.setFailed(error.message);
    }
  }

async function findPythonProjects(rootDir) {
    const globbyOpts = {
        gitignore: true
    }
    if (rootDir) {
        globbyOpts.cwd = rootDir
    }

    const candidatePaths = await globby("**/pyproject.toml", globbyOpts);

    const projects = [];

    for await (const candidatePath of candidatePaths) {
        const pyprojectPath = path.join(rootDir, candidatePath);
        const projectToml = await fs.readFile(pyprojectPath);
        const projectTomlParsed = TOML.parse(projectToml);

        const projectName = get_best_config(projectTomlParsed, PROJECT_NAME_PATHS);
        const pythonVersion = get_best_config(projectTomlParsed, PYTHON_VERSION_PATHS);

        const buildBackend = projectTomlParsed?.['build-system']?.['build-backend'];
        const installCommand = determine_install_command(projectTomlParsed, buildBackend)

        // TODO : Need to make this more adaptive in how it resolves the final shell command.  For instance,
        // if it is a POE command, the returned shell command should be `poe run test`.  Similarly for other
        // task runners, including PDM (I think).
        const testCommand = get_best_config(projectTomlParsed, TEST_COMMAND_PATHS);
        const packageCommand = get_best_config(projectTomlParsed, PACKAGE_COMMAND_PATHS);

        projects.push({
            name: projectName,
            path: pyprojectPath,
            directory: path.dirname(pyprojectPath),
            buildBackend: buildBackend,
            pythonVersion: pythonVersion,
            installCommand: installCommand,
            testCommand: testCommand,
            packageCommand: packageCommand
        });
    }

    return {
        projects: projects,
        paths: projects.map(project => project.path),
        testableProjects: projects.filter(project => project.testCommand),
        packageableProjects: projects.filter(project => project.packageCommand)
    }
}

function get_best_config(configRoot, knownPaths, defaultValue = null) {
    for (const knownPath of knownPaths) {
        const value = _get(configRoot, knownPath);
        if (value) return value;
    }
    return defaultValue;
}

function determine_install_command(projectTomlParsed, buildBackend) {
    // First check explicit task command
    const explicitInstallCommand = get_best_config(projectTomlParsed, [
        'tool.tasks.install'
    ])
    if (explicitInstallCommand) return explicitInstallCommand

    // Otherwise deduce from the build backend.

    if (!buildBackend) return null

    const buildBackendPackage = buildBackend.split('.')[0]

    return INSTALL_COMMANDS_BY_BUILD_BACKEND_PACKAGE[buildBackendPackage] ?? null
}

const INSTALL_COMMANDS_BY_BUILD_BACKEND_PACKAGE = {
    poetry: 'poetry install',
    pdm: 'pdm install'
}

const PROJECT_NAME_PATHS = [
    'project.name', // PEP-621
    'tool.poetry.name'
];

const PYTHON_VERSION_PATHS = [
    'project.requires-python', // PEP-621
    'tool.poetry.dependencies.python'
];

const TEST_COMMAND_PATHS = [
    'tool.tasks.test',
    'tool.pdm.scripts.test',
    'tool.poe.tasks.test'
];

const PACKAGE_COMMAND_PATHS = [
    'tool.tasks.package',
    'tool.pdm.scripts.package',
    'tool.poe.tasks.package'
];