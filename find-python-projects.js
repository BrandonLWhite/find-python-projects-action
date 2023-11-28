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
    pyprojectPaths = []

    for await (const candidatePath of candidatePaths) {
        pyprojectPath = path.join(rootPath, candidatePath)
        projectToml = await fs.readFile(pyprojectPath)
        projectTomlParsed = await TOML.parse(projectToml)

        if (projectTomlParsed['build-system']) {
            pyprojectPaths.push(pyprojectPath)
        }
    }

    console.log(pyprojectPaths)
    return {
        paths: pyprojectPaths
    }
}