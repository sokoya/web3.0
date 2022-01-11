// https://eth-ropsten.alchemyapi.io/v2/UW1-_JQv6keLYZtLipRZ-5JKed--og8t

require('@nomiclabs/hardhat-waffle');


module.exports = {
  solidity: '0.8.0',
  networks: {
    ropsten: {
      url: 'https://eth-ropsten.alchemyapi.io/v2/UW1-_JQv6keLYZtLipRZ-5JKed--og8t',
      accounts: ['344451bb5dbb02686e43c9ee38d6c104e48d4af5b19972656793a570a3a8e92b']
    }
  } 
}