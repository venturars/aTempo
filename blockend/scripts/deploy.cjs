const hre = require("hardhat");

async function main() {
  const courseId = process.env.COURSE_ID;
  const accessToken = process.env.ACCESS_TOKEN;
  if (!courseId || !accessToken) {
    throw new Error(
      "pasa el UUID del curso y el token: ACCESS_TOKEN=<secreto> COURSE_ID=<uuid> pnpm run deploy"
    );
  }

  const tokenHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes(accessToken));
  const factory = await hre.ethers.getContractFactory("CourseAttendance");
  const contract = await factory.deploy(courseId, tokenHash);
  await contract.waitForDeployment();
  process.stdout.write(`${await contract.getAddress()}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
