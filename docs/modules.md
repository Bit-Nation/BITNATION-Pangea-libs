## src/database/db

> The database is an proxy between realm and the pangea libraries. It's responsible for the query / write actions and schema registration.

**Create an instance of database**
```js
//dbFactory returns an instance of DBInterface
import dbFactory from './src/database/db'

//Will be an object that satisfies the [DBInterface]()
const db = dbFactory('./path/to/my/db');

```

## src/ethereum/nation

> Used to interact with nations (create, join, leave etc)

```js
//nationFactory returns an instance of NationInterface
import nationFactory from './src/ethereum/nation'

//Will be an object that satisfies the [NationInterface]()
const nation = nationFactory(db, txQueue, web3, eventEmitter, nationContract);

```

## src/ethereum/PangeaProvider

> Customized web3 provider.
> `getAccounts` will return an array of account addresses fetched from the local storage.
> `signTx` will emit an event (more in the events section) which the client need's to react to.

```js
import PangeaProvider from './src/ethereum/PangeaProvider'

//ethUtils should be an obj of the EthUtilsInterface
//rpcUrl is the ethereum json rpc endpoint
const web3 = new Web3(new PangeProvider(ethUtils, rpcUrl))

```

## src/ethereum/utils

> A list of utils related to ethereum. Have a look at the EthUtilsInterface.

```js
//ethUtilsFactory returns and instance of EthUtilsInterface
import ethUtilsFactory from './src/ethereum/utils'

//secureStorage is an object of SecureStorageInterface
//eventEmitter is an instance of eventemitter3
//osDependencies is an object of OsDependenciesInterface
const ethUtils = ethUtilsFactory(secureStorage, eventEmitter, osDependencies);

```

## src/ethereum/wallet

> Interaction with the wallet.

```js
//walletFactory creates an instance of WalletInterface
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