> Almost all modules use an interface to describe the available functions. You can find the interface at the top of the module file. `src/ethereum/utils.js` e.g. exports an `EthUtilsInterface`.
> All interfaces are describe via JsDoc in the code. So it would be great if you have a look at the interfaces since we want to avoid redundancy of documentation.

## [DBInterface](../src/database/db.js)
> Use this to query and write the database.
> It's an abstraction layer for [realm](realm.io/docs/javascript/latest/)

## [EthUtilsInterface](../src/ethereum/utils.js)
> Contain's utils for address and private key normalization, transaction signing, private key creation, private key storage and so on.

## [NationInterface](../src/ethereum/nation.js)
> Use this to interact with everything nation related like creation, joining, leaving, indexing and so on.

## [WalletInterface](../src/ethereum/wallet.js)
> Use this to interact with your ethereum wallet.

## [ProfileInterface](../src/ethereum/profile.js)
> Use this to interact with your profile.