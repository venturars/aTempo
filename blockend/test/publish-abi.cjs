const { expect } = require("chai");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const hre = require("hardhat");
const { publishAbi } = require("../scripts/publish-abi.cjs");

describe("publishAbi", function () {
  it("escribe la ABI y el metadata.json que lee Otterscan", async function () {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "atempo-abi-"));
    const address = `0x${"11".repeat(20)}`;
    const published = await publishAbi(hre, address, { root, chainId: 31337 });
    const metadata = JSON.parse(fs.readFileSync(published.sourcifyPath, "utf8"));
    const names = metadata.output.abi.map((item) => item.name);
    expect(names).to.include("getCourseId");
    expect(
      published.sourcifyPath.endsWith(
        path.join(
          "sourcify",
          "contracts",
          "full_match",
          "31337",
          published.checksummed,
          "metadata.json",
        ),
      ),
    ).to.equal(true);
    const abi = JSON.parse(
      fs.readFileSync(path.join(root, "abi", "CourseAttendance.json"), "utf8"),
    );
    expect(abi).to.deep.equal(metadata.output.abi);
  });
});
