const findPythonProjects = require('./find-python-projects.js');

describe('index', () => {
  const runMock = jest.spyOn(findPythonProjects, 'run').mockImplementation();

  it('calls run when imported', () => {
    require('./index.js')

    expect(runMock).toHaveBeenCalled()
  })
})

