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
      // TODO: projects-by-command

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

        const projectName = getBestConfig(projectTomlParsed, PROJECT_NAME_PATHS);
        const pythonVersion = getBestConfig(projectTomlParsed, PYTHON_VERSION_PATHS);

        const commands = generateCommands(projectTomlParsed);

        projects.push({
            name: projectName,
            path: pyprojectPath,
            directory: path.dirname(pyprojectPath),
            buildBackend: getBuildBackend(projectTomlParsed),
            pythonVersion: pythonVersion,
            installCommand: commands.install, // TODO: Remove
            testCommand: commands.test, // TODO: Remove
            packageCommand: commands.package, // TODO: Remove
            commands: commands
        });
    }

    return {
        projects: projects,
        paths: projects.map(project => project.path),
        testableProjects: projects.filter(project => project.testCommand),
        packageableProjects: projects.filter(project => project.packageCommand)
        // TODO: projectsByCommand
    }
}

function getBestConfig(configRoot, knownPaths, defaultValue = null) {
    for (const knownPath of knownPaths) {
        const value = _get(configRoot, knownPath);
        if (value) return value;
    }
    return defaultValue;
}

function getBuildBackend(projectTomlParsed) {
    return projectTomlParsed?.['build-system']?.['build-backend'];
}

function generateCommands(projectTomlParsed) {
    const commands = {}

    for(const source of KNOWN_COMMAND_SOURCES) {
        const sourceCommands = _get(projectTomlParsed, source.tomlPath)
        if (!sourceCommands) continue;

        for(const [commandName, commandTomlValue] of Object.entries(sourceCommands)) {
            // Skip if the command has already been set.
            if (commands[commandName]) continue;

            runnerPrefix = source.context.runnerPrefix
            if(runnerPrefix) {
                commands[commandName] = runnerPrefix + ' ' + commandName;
            }
            else {
                commands[commandName] = commandTomlValue;
            }
        }
    }

    if (!commands.install) {
        commands.install = determineInstallCommand(projectTomlParsed);
    }

    return commands;
}

function determineInstallCommand(projectTomlParsed) {
    const buildBackend = getBuildBackend(projectTomlParsed);

    if (!buildBackend) return null;

    const buildBackendPackage = buildBackend.split('.')[0];

    return INSTALL_COMMANDS_BY_BUILD_BACKEND_PACKAGE[buildBackendPackage] ?? null;
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

const POE_RUN_PREFIX = 'poe run'
const PDM_RUN_PREFIX = 'pdm run'

const KNOWN_COMMAND_SOURCES = [
    {tomlPath: 'tool.tasks', context: {}},
    {tomlPath: 'tool.pdm.scripts', context: {runnerPrefix: PDM_RUN_PREFIX}},
    {tomlPath: 'tool.poe.tasks', context: {runnerPrefix: POE_RUN_PREFIX}}
]
