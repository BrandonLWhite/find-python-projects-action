const fs = require('fs/promises')
const path = require('path');
const globby = require('globby')
const TOML = require('@iarna/toml')

module.exports = async function findPythonProjects(rootPath) {
    globbyOpts = {
        gitignore: true
    }
    if (rootPath) {
        globbyOpts.cwd = rootPath
    }

    const candidatePaths = await globby("**/pyproject.toml", globbyOpts)

    projects = []

    for await (const candidatePath of candidatePaths) {
        pyprojectPath = path.join(rootPath, candidatePath)
        projectToml = await fs.readFile(pyprojectPath)
        projectTomlParsed = await TOML.parse(projectToml)

        projectName = projectTomlParsed?.tool?.poetry?.name || projectTomlParsed?.project?.name
        pythonVersion = projectTomlParsed?.project?.['requires-python'] || projectTomlParsed?.tool?.poetry?.dependencies?.python

        buildSystem = projectTomlParsed['build-system']
        buildBackend = buildSystem['build-backend']
        usePoetry = (buildBackend || '').startsWith('poetry')
        installCommand = usePoetry ? 'poetry install' : 'pip install'
        testCommand = projectTomlParsed?.project?.tasks?.test
        packageCommand = projectTomlParsed?.project?.tasks?.package

        projects.push({
            name: projectName,
            path: pyprojectPath,
            directory: path.dirname(pyprojectPath),
            buildBackend: buildBackend,
            pythonVersion: pythonVersion,
            installCommand: installCommand,
            testCommand: testCommand,
            packageCommand: packageCommand
        })
    }

    return {
        projects: projects,
        paths: projects.map(project => project.path),
        testableProjects: projects.filter(project => project.testCommand),
        packageableProjects: projects.filter(project => project.packageCommand)
    }
}