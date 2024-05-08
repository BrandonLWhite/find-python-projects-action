# find-python-projects-action
Github Action for dynamically discovering Python projects in a repository and making available some helpful values from `pyproject.toml`, including CI/CD commands like `test`, for each project it finds.

Python projects are identified by the presence of `pyproject.toml`.
Various pieces of information about each project are parsed from `pyproject.toml` and returned in the action outputs as JSON strings, including shell commands for additional CI type operations like `test` and `package`.
This is meant to faciliate downstream actions or workflows such as matrix builds for parallel builds of each project.

This action aims to help you eliminate (or at least reduce) the amount of customization needed in your GHA workflows by pushing your project-specific stuff into `pyproject.toml`.


## Inputs
- **root-dir**: Directory root for where to begin recursively searching for projects.
Python projects contained in this directory or lower will be discovered.  Defaults to your repository's root directory.


## Outputs
- **paths**: JSON array of found project path strings

- **projects**: JSON array of all found projects ([project object](#project-object-output-shape))

- **projects-by-command**: JSON object with keys corresponding to the name of discovered commands
(eg `install`, `test`, `package`, etc.) in all projects, with an array value containing each
[project object](#project-object-output-shape) that implements the command.


## Project object output shape
These are the fields for `project` objects in the output:

- **name**: The name of the project determined by `[project.name]` or `[tool.poetry.name]`

- **path**: The file path to the `pyproject.toml` file for the project.

- **directory**: The directory path where the `pyproject.toml` file resides.

- **buildBackend**: Value of `[build-system.build-backend]` from `pyproject.toml`

- **pythonVersion**: Value of `[project.requires-python]` or `[tool.poetry.dependencies.python]` from `pyproject.toml`

- **commands**: Object with keys for each discovered command and the shell command as the value.
This is dynamically constructed from the `pyproject.toml` content.


## Project Commands
In the absence of Python standards for expressing internal project CI/CD/Dev operations, this action tries to unify the various known ways in the wild.

This action will surface any command you specify in the pyproject.toml files.  Typically you'll
want to define one or more of the following for your CI/CD system::

- `test`
- `package`
- `publish`

In order to make these commands available in the action output, you'll need to define them in `pyproject.toml` using a section appropriate for the particular tools you are using in the project.  You can specify all, some, or none, depending on what you need available.

This action will pull the command from the first entry it finds in any of the following sections in `pyproject.toml`:
- `[tool.tasks]`: Use this field if you aren't already using a separate task runner tool, otherwise use the field that corresponds to that tool.
- `[tool.pdm.scripts]`: [PDM](https://pdm-project.org/latest/usage/scripts/)
- `[tool.poe.tasks]`: [poethepoet](https://github.com/nat-n/poethepoet)

### The `install` command
This action perfoms special treatment for surfacing the `install` command.  Namely, if it is not explicitly specified, the action will attempt to generate a default based on the packaging backend (eg Poetry, PDM) that it discovers.
The intent is that you do not need to specify an `install` command in your pyproject.toml, but you can if necessary.

### Where is the support for `[tool.poetry.scripts]`?
Unfortunately, [Poetry scripts](https://python-poetry.org/docs/pyproject/#scripts) is for specifying commands that are made available to consumers of a package.  It isn't meant for CI/CD or developer operations and doesn't meet those needs, primarily because any scripts you define in this section will be added as executable shortcuts to your virtual environment or any virtual environment your package is installed into.
If you are using Poetry and want to take advantage of this feature from this action, use the catch-all `[tool.tasks]` section.  Alternatively, you
can leverage a task runner tool like [Poe](https://github.com/nat-n/poethepoet) or [Invoke](https://www.pyinvoke.org/)

*If Poetry ever adds support for internal project (CI/CD/Dev) commands separate from published commands, then it will be added to this action.*


### Relevant References / Discussions
https://discuss.python.org/t/a-new-pep-to-specify-dev-scripts-and-or-dev-scripts-providers-in-pyproject-toml/11457

https://discuss.python.org/t/proposal-for-tests-entry-point-in-pyproject-toml/2077

https://stackoverflow.com/questions/70386944/how-should-poetry-scripts-used-in-the-build-process-be-stored-in-the-project

https://github.com/python-poetry/poetry/issues/3386

## Example Workflow
[.github/workflows/examples/example.yml](.github/workflows/examples/example.yml)