const fs = require('fs/promises');
const path = require('path');
const globby = require('globby');
const TOML = require('@iarna/toml');
const _get = require('lodash/get');

module.exports = async function findPythonProjects(rootPath) {
    globbyOpts = {
        gitignore: true
    }
    if (rootPath) {
        globbyOpts.cwd = rootPath
    }

    const candidatePaths = await globby("**/pyproject.toml", globbyOpts);

    projects = [];

    for await (const candidatePath of candidatePaths) {
        pyprojectPath = path.join(rootPath, candidatePath);
        projectToml = await fs.readFile(pyprojectPath);
        projectTomlParsed = await TOML.parse(projectToml);

        projectName = projectTomlParsed?.tool?.poetry?.name || projectTomlParsed?.project?.name;
        pythonVersion = get_best_config(projectTomlParsed, PYTHON_VERSION_PATHS);

        buildBackend = projectTomlParsed?.['build-system']?.['build-backend'];
        usePoetry = (buildBackend || '').startsWith('poetry');
        installCommand = buildBackend && (usePoetry ? 'poetry install' : 'pip install');
        testCommand = get_best_config(projectTomlParsed, TEST_COMMAND_PATHS);
        packageCommand = get_best_config(projectTomlParsed, PACKAGE_COMMAND_PATHS);
        useTox = testCommand && command_regex('tox').test(testCommand);

        projects.push({
            name: projectName,
            path: pyprojectPath,
            directory: path.dirname(pyprojectPath),
            buildBackend: buildBackend,
            pythonVersion: pythonVersion,
            installCommand: installCommand,
            testCommand: testCommand,
            packageCommand: packageCommand,
            usePoetry: usePoetry,
            useTox: useTox
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
        value = _get(configRoot, knownPath);
        if (value) return value;
    }
    return defaultValue;
}

function command_regex(command) {
    return new RegExp(`(^|[\s'"])${command}($|[\s'"])`);
}

const PYTHON_VERSION_PATHS = [
    'project.requires-python',
    'tool.poetry.dependencies.python'
];

const TEST_COMMAND_PATHS = [
    'tool.tasks.test',
    'tool.poe.tasks.test'
];

const PACKAGE_COMMAND_PATHS = [
    'tool.tasks.package',
    'tool.poe.tasks.package'
];