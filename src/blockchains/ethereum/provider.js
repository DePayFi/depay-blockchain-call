import { ethers } from 'ethers'
import { getWallet } from 'depay-web3-wallets'

export default async function () {
  
  let account = await getWallet().account()

  if (account) {
    return await new ethers.providers.Web3Provider(window.ethereum)
  } else {
    return await new ethers.providers.JsonRpcProvider(
      ['https://mainnet.infu', 'ra.io/v3/9aa3d95b3bc440fa8', '8ea12eaa4456161'].join(''),
    )
  }

  return provider
}
