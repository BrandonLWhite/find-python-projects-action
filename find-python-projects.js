const fs = require('fs/promises')
const path = require('path');
const globby = require('globby')
const TOML = require('@iarna/toml')

module.exports = async function findPythonProjects(rootPath) {
    const pyprojectPaths = await globby("**/pyproject.toml", {
        cwd: rootPath,
        gitignore: true
    })
    console.log(pyprojectPaths)
    for await (const pyprojectPath of pyprojectPaths) {
        projectToml = await fs.readFile(path.join(rootPath, pyprojectPath))
        projectTomlParsed = await TOML.parse(projectToml)
        console.log(projectTomlParsed)
    }
}