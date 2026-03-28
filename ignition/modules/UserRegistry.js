// ignition/modules/UserRegistry.js

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("UserRegistryModule", (m) => {
  const userRegistry = m.contract("UserRegistry", []);
  return { userRegistry };
});