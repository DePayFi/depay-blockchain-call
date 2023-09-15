import { ethers } from 'ethers'

const getContractArguments = ({ contract, method, params })=>{
  let fragment = contract.interface.fragments.find((fragment) => {
    return fragment.name == method
  })

  if(params instanceof Array) {
    return params
  } else if (params instanceof Object) {
    return fragment.inputs.map((input) => {
      return params[input.name]
    })
  }
}

export default ({ provider, from, to, value, method, api, params }) => {
  if(typeof api == "undefined"){
    return provider.estimateGas({ from, to, value })
  } else {
    let contract = new ethers.Contract(to, api, provider)
    let fragment = contract.interface.fragments.find((fragment) => {
      return fragment.name == method
    })
    if(contract[method] === undefined) {
      method = `${method}(${fragment.inputs.map((input)=>input.type).join(',')})`
    }
    let contractArguments = getContractArguments({ contract, method, params })
    let contractMethod = contract.estimateGas[method]
    if(contractArguments) {
      return contractMethod(...contractArguments, { from, value })
    } else {
      return contractMethod({ from, value })
    }
  }
}
