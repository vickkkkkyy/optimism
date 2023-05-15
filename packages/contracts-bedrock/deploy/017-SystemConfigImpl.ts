import assert from 'assert'

import { DeployFunction } from 'hardhat-deploy/dist/types'
import '@eth-optimism/hardhat-deploy-config'
import { ethers } from 'ethers'

import { assertContractVariable, deploy } from '../src/deploy-utils'

const uint128Max = ethers.BigNumber.from('0xffffffffffffffffffffffffffffffff')

const defaultResourceConfig = {
  maxResourceLimit: 20_000_000,
  elasticityMultiplier: 10,
  baseFeeMaxChangeDenominator: 8,
  minimumBaseFee: ethers.utils.parseUnits('1', 'gwei'),
  systemTxMaxGas: 1_000_000,
  maximumBaseFee: uint128Max,
}

const deployFn: DeployFunction = async (hre) => {
  const batcherHash = hre.ethers.utils
    .hexZeroPad(hre.deployConfig.batchSenderAddress, 32)
    .toLowerCase()

  const l2GenesisBlockGasLimit = hre.deployConfig.l2GenesisBlockGasLimit
  const l2GasLimitLowerBound = defaultResourceConfig.systemTxMaxGas + defaultResourceConfig.maxResourceLimit
  if (l2GenesisBlockGasLimit.lt(l2GasLimitLowerBound)) {
    throw new Error(`L2 genesis block gas limit must be at least ${l2GasLimitLowerBound}`)
  }

  await deploy({
    hre,
    name: 'SystemConfig',
    args: [
      hre.deployConfig.finalSystemOwner,
      hre.deployConfig.gasPriceOracleOverhead,
      hre.deployConfig.gasPriceOracleScalar,
      batcherHash,
      l2GenesisBlockGasLimit,
      hre.deployConfig.p2pSequencerAddress,
      defaultResourceConfig
    ],
    postDeployAction: async (contract) => {
      await assertContractVariable(
        contract,
        'owner',
        hre.deployConfig.finalSystemOwner
      )
      await assertContractVariable(
        contract,
        'overhead',
        hre.deployConfig.gasPriceOracleOverhead
      )
      await assertContractVariable(
        contract,
        'scalar',
        hre.deployConfig.gasPriceOracleScalar
      )
      await assertContractVariable(contract, 'batcherHash', batcherHash)
      await assertContractVariable(
        contract,
        'unsafeBlockSigner',
        hre.deployConfig.p2pSequencerAddress
      )

      const config = await contract.resourceConfig()
      assert(config.maxResourceLimit === defaultResourceConfig.maxResourceLimit)
      assert(config.elasticityMultiplier === defaultResourceConfig.elasticityMultiplier)
      assert(config.baseFeeMaxChangeDenominator === defaultResourceConfig.baseFeeMaxChangeDenominator)
      assert(config.systemTxMaxGas === defaultResourceConfig.systemTxMaxGas)
      assert(config.minimumBaseFee.eq(defaultResourceConfig.minimumBaseFee))
      assert(config.maximumBaseFee.eq(defaultResourceConfig.maximumBaseFee))
    },
  })
}

deployFn.tags = ['SystemConfigImpl', 'setup', 'l1']

export default deployFn
