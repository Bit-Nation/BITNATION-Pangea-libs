## src/database/db

> Creates an object of DBInterface

```js
import dbFactory from './src/database/db'

//Will be an object that satisfies the [DBInterface]()
const db = dbFactory('./path/to/my/db');

```

## src/ethereum/nation

> Creates an object of NationInterface

```js
import nationFactory from './src/ethereum/nation'

//Will be an object that satisfies the [NationInterface]()
const nation = nationFactory(db, txQueue, web3, eventEmitter, nationContract);

```

## src/ethereum/PangeaProvider

> Creates an web3 provider
> `getAccounts` will return an array of account addresses fetched from the local storage.
> `signTx` will emit an event (more in the events section) which the client need's to react to.

```js
import PangeaProvider from './src/ethereum/PangeaProvider'

//ethUtils should be an obj of the EthUtilsInterface
//rpcUrl is the ethereum json rpc endpoint
const web3 = new Web3(new PangeProvider(ethUtils, rpcUrl))

```

## src/ethereum/utils

> Creates an object of EthUtilsInterface

```js
import ethUtilsFactory from './src/ethereum/utils'

//secureStorage is an object of SecureStorageInterface
//eventEmitter is an instance of eventemitter3
//osDependencies is an object of OsDependenciesInterface
const ethUtils = ethUtilsFactory(secureStorage, eventEmitter, osDependencies);

```

## src/ethereum/wallet

> creates an object of WalletInterface

```js
import walletFactory from './src/ethereum/wallet'

//ethUtils an object of EthUtilsInterface
//web3 an Web3 instance
//db an object of DBInterface
const wallet = walletFactory(ethUtils, web3, db);

```

## src/ethereum/web3

> Creates and Web3 instance.

```js
//Return's an instance of Web3
import web3Factory from './src/ethereum/web3'

//ethNode is an instance of JsonRpcNodeInterface
//ethutils is an instance of EthUtilsInterface
//networkAccess is a bool. true if we have access to the www / false when not
const web3Instance = web3Factory(ethNode, ethUtils, networkAccess)

```

## src/profile/profile

> creates an object of the ProfileInterface.

```js
//
import profileFactory from './src/profile/profile'

//dbInstance is an object of DBInterface
//ethUtils is an object of EthUtilsInterface
const profile = profileFactory(dbInstance, ethUtils)

```
