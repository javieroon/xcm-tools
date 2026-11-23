import { isTLocation, type TChain } from '@paraspell/sdk-common'
import { isAddress } from 'viem'

import type { PolkadotApi } from '../../api'
import { InvalidAddressError } from '../../errors'
import type { TAddress } from '../../types'

const PUBLIC_KEY_REGEX = /^0x[0-9a-fA-F]{64}$/

export const validateAddress = <TApi, TRes, TSigner, TCustomChain extends string = never>(
  api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>,
  address: TAddress,
  chain: TChain | TCustomChain,
  isDestination = true
) => {
  if (isTLocation(address)) return

  const isEvm = api.isChainEvm(chain)
  const isEthereumAddress = isAddress(address)

  const isPublicKeyFormat =
    typeof address === 'string' && address.startsWith('0x') && !isEthereumAddress

  if (isEvm) {
    if (!isEthereumAddress) {
      throw new InvalidAddressError(
        `${isDestination ? 'Destination chain' : 'Chain'} is an EVM chain, but the address provided is not a valid Ethereum address.`
      )
    }
  } else {
    if (isEthereumAddress) {
      throw new InvalidAddressError(
        `EVM address provided but ${isDestination ? 'destination ' : ''}chain is not an EVM chain.`
      )
    }

    if (isPublicKeyFormat) {
      // The hex is used verbatim as the AccountId32, so anything other than exactly 32 bytes
      // would be truncated or shifted into a different account.
      if (!PUBLIC_KEY_REGEX.test(address)) {
        throw new InvalidAddressError(
          `Invalid public key: ${address}. Expected a 32-byte hex string (0x followed by 64 hex characters).`
        )
      }
      return
    }

    if (typeof address === 'string') {
      const isValid = api.validateSubstrateAddress(address)
      if (!isValid) {
        throw new InvalidAddressError(`Invalid address: ${address}`)
      }
    }
  }
}
