const { courseId, accessToken } = require("./load-env.cjs");
const { publishAbi } = require("./publish-abi.cjs");
const hre = require("hardhat");

async function main() {
  if (!courseId || !accessToken) {
    throw new Error(
      "falta COURSE_ID o ACCESS_TOKEN: copia .env.example a .env o pásalos en el entorno"
    );
  }

  const tokenHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes(accessToken));
  const factory = await hre.ethers.getContractFactory("CourseAttendance");
  const contract = await factory.deploy(courseId, tokenHash);
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  await publishAbi(hre, address);
  process.stdout.write(`${address}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
