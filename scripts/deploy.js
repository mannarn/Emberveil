import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  // Access the injected HRE global
  const { ethers, network } = hre;
  
  console.log("Starting deployment...\n");
  
  // Get signer
  const [signer] = await ethers.getSigners();
  console.log("Deploying from address:", signer.address);
  console.log("Network:", network.name);
  
  // Deploy UserRegistry
  console.log("\nDeploying UserRegistry contract...");
  const UserRegistry = await ethers.getContractFactory("UserRegistry", signer);
  const userRegistry = await UserRegistry.deploy();
  await userRegistry.waitForDeployment();
  const contractAddress = await userRegistry.getAddress();
  
  console.log("✓ UserRegistry deployed to:", contractAddress);
  
  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    timestamp: new Date().toISOString(),
    deployer: signer.address,
    userRegistry: {
      address: contractAddress,
      name: "UserRegistry",
      version: "2.0.0"
    }
  };
  
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  const deploymentPath = path.join(deploymentsDir, "deployment.json");
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("\n✓ Deployment info saved to:", deploymentPath);
  
  console.log("\n========================================");
  console.log("Deployment Complete!");
  console.log("========================================");
  console.log(JSON.stringify(deploymentInfo, null, 2));
}

main().catch((error) => {
  console.error("Deployment Error:", error);
  process.exitCode = 1;
});