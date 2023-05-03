const extractZipAndBuildJson = require("../src/extractJsonFromZip");

describe("extractZipAndBuildJson", () => {
  it("should extract a zip file and build a JSON object", async () => {
    const zipPath =
      "/home/abbes/iexec_workspace/github/web3Mail/dapp/tests/iexec_in/myProtectedData.zip";
    const result = await extractZipAndBuildJson(zipPath);
    expect(typeof result).toBe("object");
    expect(result).toHaveProperty("email");
  });
});
