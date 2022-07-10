import parseUrl from './parseUrl'
import requestBsc from './blockchains/bsc/request'
import requestEthereum from './blockchains/ethereum/request'
import requestPolygon from './blockchains/polygon/request'
import requestSolana from './blockchains/solana/request'
import { cache as cacheRequest } from './cache'
import { supported } from './blockchains'

let request = async function (url, options) {
  let { blockchain, address, method } = parseUrl(url)
  let { interface, params, cache, block } = options || {}
  if(!supported.includes(blockchain)) { throw 'Unknown blockchain: ' + blockchain }
  let result = await cacheRequest({
    expires: cache || 0,
    key: [blockchain, address, method, params, block],
    call: async () => {
      switch (blockchain) {

        case 'ethereum':
          return requestEthereum({ address, interface, method, params, block })
          break

        case 'bsc':
          return requestBsc({ address, interface, method, params, block })
          break

        case 'polygon':
          return requestPolygon({ address, interface, method, params, block })
          break

        case 'solana':
          return requestSolana({ address, interface, method, params, block })
          break
          
      }
    },
  })
  return result
}

export default request
