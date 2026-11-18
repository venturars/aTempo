const fs = require("node:fs");
const path = require("node:path");

const COURSE_ATTENDANCE = "contracts/CourseAttendance.sol:CourseAttendance";

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

async function readMetadata(hre, fullyQualifiedName) {
  const buildInfo = await hre.artifacts.getBuildInfo(fullyQualifiedName);
  if (!buildInfo) {
    throw new Error(`no hay build-info de ${fullyQualifiedName}`);
  }
  const [sourceName, contractName] = fullyQualifiedName.split(":");
  const compiled = buildInfo.output.contracts[sourceName][contractName];
  return JSON.parse(compiled.metadata);
}

async function publishAbi(hre, address, options = {}) {
  const fullyQualifiedName = options.fullyQualifiedName ?? COURSE_ATTENDANCE;
  const chainId = options.chainId ?? hre.network.config.chainId;
  const root = options.root ?? path.join(__dirname, "..");
  const metadata = await readMetadata(hre, fullyQualifiedName);
  const contractName = fullyQualifiedName.split(":")[1];
  const checksummed = hre.ethers.getAddress(address);
  const sourcifyPath = path.join(
    root,
    "sourcify",
    "contracts",
    "full_match",
    String(chainId),
    checksummed,
    "metadata.json",
  );
  writeJson(sourcifyPath, metadata);
  writeJson(path.join(root, "abi", `${contractName}.json`), metadata.output.abi);
  return { checksummed, sourcifyPath, abi: metadata.output.abi };
}

module.exports = { publishAbi };
