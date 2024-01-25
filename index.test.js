const findPythonProjects = require('./find-python-projects');

describe('index', () => {
  const runMock = jest.spyOn(findPythonProjects, 'run').mockImplementation();

  it('calls run when imported', () => {
    require('./index')

    expect(runMock).toHaveBeenCalled()
  })
})

