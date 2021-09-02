import { ethers } from 'ethers';
import { getWallet } from 'depay-web3-wallets';

function _optionalChain$1(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }let getWindow = () => {
  if (typeof global == 'object') return global
  return window
};

let getCacheStore = () => {
  if (getWindow()._cacheStore == undefined) {
    resetCache();
  }
  return getWindow()._cacheStore
};

let getPromiseStore = () => {
  if (getWindow()._promiseStore == undefined) {
    resetCache();
  }
  return getWindow()._promiseStore
};

let resetCache = () => {
  getWindow()._cacheStore = {};
  getWindow()._promiseStore = {};
};

let set = function ({ key, value, expires }) {
  getCacheStore()[key] = {
    expiresAt: Date.now() + expires,
    value,
  };
};

let get = function ({ key, expires }) {
  let cachedEntry = getCacheStore()[key];
  if (_optionalChain$1([cachedEntry, 'optionalAccess', _ => _.expiresAt]) > Date.now()) {
    return cachedEntry.value
  }
};

let getPromise = function({ key }) {
  return getPromiseStore()[key]
};

let setPromise = function({ key, promise }) {
  getPromiseStore()[key] = promise;
  return promise
};

let deletePromise = function({ key }) {
  getPromiseStore()[key] = undefined; 
};

let cache = function ({ call, key, expires = 0 }) {
  return new Promise((resolve, reject)=>{
    let value;
    key = JSON.stringify(key);
    
    // get existing promise (of a previous pending request asking for the exact same thing)
    let existingPromise = getPromise({ key });
    if(existingPromise) { 
      return existingPromise
        .then(resolve)
        .catch(reject)
    }

    setPromise({ key, promise: new Promise((resolveQueue, rejectQueue)=>{
      if (expires === 0) {
        return call()
          .then((value)=>{
            resolve(value);
            resolveQueue(value);
          })
          .catch((error)=>{
            reject(error);
            rejectQueue(error);
          })
      }
      
      // get cached value
      value = get({ key, expires });
      if (value) {
        resolve(value);
        resolveQueue(value);
        return value
      }

      // set new cache value
      call()
        .then((value)=>{
          if (value) {
            set({ key, value, expires });
          }
          resolve(value);
          resolveQueue(value);
        })
        .catch((error)=>{
          reject(error);
          rejectQueue(error);
        });
      })
    }).then(()=>{
      deletePromise({ key });
    }).catch(()=>{
      deletePromise({ key });
    });
  })
};

let provider$2;

async function ethereumProvider () {

  if(provider$2) { return provider$2 }

  provider$2 = await new ethers.providers.JsonRpcBatchProvider(
    ['https://mainnet.infu', 'ra.io/v3/9aa3d95b3bc440fa8', '8ea12eaa4456161'].join(''),
  );

  return provider$2
}

let paramsToContractArgs = ({ contract, method, params }) => {
  let fragment = contract.interface.fragments.find((fragment) => {
    return fragment.name == method
  });

  return fragment.inputs.map((input, index) => {
    if (Array.isArray(params)) {
      return params[index]
    } else {
      return params[input.name]
    }
  })
};

let contractCall = ({ address, api, method, params, provider }) => {
  let contract = new ethers.Contract(address, api, provider);
  let args = paramsToContractArgs({ contract, method, params });
  return contract[method](...args)
};

let balance = ({ address, provider }) => {
  return provider.getBalance(address)
};

var request$2 = async ({ provider, address, api, method, params }) => {
  if (api) {
    return contractCall({ address, api, method, params, provider })
  } else if (method === 'balance') {
    return balance({ address, provider })
  }
};

var requestEthereum = async ({ address, api, method, params }) => {
  let provider = await ethereumProvider();

  return request$2({
    provider,
    address,
    api,
    method,
    params
  })
};

let provider$1;

async function bscProvider () {

  if(provider$1) { return provider$1 }

  provider$1 = await new ethers.providers.JsonRpcBatchProvider(
    'https://bsc-dataseed.binance.org'
  );

  return provider$1
}

var requestBsc = async ({ address, api, method, params }) => {
  let provider = await bscProvider();

  return request$2({
    provider,
    address,
    api,
    method,
    params
  })
};

var parseUrl = (url) => {
  if (typeof url == 'object') {
    return url
  }
  let deconstructed = url.match(/(?<blockchain>\w+):\/\/(?<address>[\w\d]+)\/(?<method>[\w\d]+)/);
  return deconstructed.groups
};

let request$1 = async function (url, options) {
  let { blockchain, address, method } = parseUrl(url);
  let { api, params, cache: cache$1 } = options || {};
  if(!['ethereum', 'bsc'].includes(blockchain)) { throw 'Unknown blockchain: ' + blockchain }
  let result = await cache({
    expires: cache$1 || 0,
    key: [blockchain, address, method, params],
    call: async () => {
      switch (blockchain) {

        case 'ethereum':
          return requestEthereum({ address, api, method, params })

        case 'bsc':
          return requestBsc({ address, api, method, params })
          
      }
    },
  });
  return result
};

function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }
let estimate = async ({ externalProvider, address, method, api, params, value }) => {
  let account = await _optionalChain([getWallet, 'call', _ => _(), 'optionalAccess', _2 => _2.account, 'call', _3 => _3()]);
  if (!account) {
    throw 'No wallet connected!'
  }

  let provider = new ethers.providers.Web3Provider(externalProvider);
  let signer = provider.getSigner();

  let contract = new ethers.Contract(address, api, provider);
  let args = paramsToContractArgs({ contract, method, params });
  return contract.connect(signer).estimateGas[method](...args)
};

var estimateEthereum = async ({ address, method, api, params, value }) => {
  return estimate({
    externalProvider: window.ethereum,
    address,
    method,
    api,
    params,
    value
  })
};

var estimateBsc = async ({ address, method, api, params, value }) => {
  return estimate({
    externalProvider: window.ethereum,
    address,
    method,
    api,
    params,
    value
  })
};

let request = async function (url, options) {
  let { blockchain, address, method } = parseUrl(url);
  let { api, params, value } = options || {};
  switch (blockchain) {
    
    case 'ethereum':
      return estimateEthereum({ address, method, api, params, value })

    case 'bsc':
      return estimateBsc({ address, method, api, params, value })

    default:
      throw 'Unknown blockchain: ' + blockchain
  }
};

async function provider (blockchain) {
  switch (blockchain) {
    
    case 'ethereum':
      return await ethereumProvider()

    case 'bsc':
      return await bscProvider()
    
    default:
      throw 'Unknown blockchain: ' + blockchain
  }
}

export { request as estimate, provider, request$1 as request, resetCache };
