const core = require("@actions/core");
const mapValues = require("lodash/mapValues.js");

const { run } = require("./find-python-projects.js");

describe("find-python-projects", () => {
  const infoMock = jest.spyOn(core, "info").mockImplementation();
  const getInputMock = jest.spyOn(core, "getInput").mockImplementation();
  const setFailedMock = jest.spyOn(core, "setFailed").mockImplementation();
  const setOutputMock = jest.spyOn(core, "setOutput").mockImplementation();

  const inputsDefaults = {
    "desired-export-paths": "",
  };
  let inputs = {};
  let outputs = {};

  beforeEach(() => {
    jest.clearAllMocks();
    inputs = {
      ...inputsDefaults,
    };
    outputs = {};

    // Mock the action's inputs
    getInputMock.mockImplementation((name) => {
      return inputs[name];
    });

    setOutputMock.mockImplementation((name, value) => {
      outputs[name] = value;
    });
  });

  it("finds projects", async () => {
    inputs["root-dir"] = "test-fixtures/multi-project";
    await run();
    expect(deserializeJsonValues(outputs)).toMatchSnapshot();
    expect(infoMock).toHaveBeenCalled();
  });

  it("Calls setFailed on error", async () => {
    inputs["root-dir"] = "test-fixtures/invalid-project";
    await run();
    expect(setFailedMock).toHaveBeenCalled();
  });

  it("Exports keys as instructed", async () => {
    inputs["desired-export-paths"] = "tool.export.me.please,what";
    inputs["root-dir"] = "test-fixtures/project-with-exports";
    await run();
    expect(deserializeJsonValues(outputs)).toMatchSnapshot();
    expect(infoMock).toHaveBeenCalled();
  });
});

function deserializeJsonValues(obj) {
  return mapValues(obj, (val) => JSON.parse(val));
}
