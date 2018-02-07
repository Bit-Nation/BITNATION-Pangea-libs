> Almost all modules use an interface to describe the available functions. You can find the interface at the top of the module file. `src/ethereum/utils.js` e.g. exports an `EthUtilsInterface`.
> All interfaces are describe via JsDoc in the code. So it would be great if you have a look at the interfaces since we want to avoid redundancy of documentation.

## DBInterface (`src/database/db.js`)
> Use this to query and write the database.
> It's an abstraction layer for [realm](realm.io/docs/javascript/latest/)

**Available methods:**

- `query` query the database
- `write` write to the database.

## EthUtilsInterface(`src/ethereum/utils.js`)
> Contain's utils for address and private key normalization, transaction signing, private key creation, private key storage and so on.

**Available methods:**

- `createPrivateKey` Return's an Promise that resolves in an private ethereum key (32 bytes in hex encoded)
- `savePrivateKey` Save private key
- `allKeyPairs` Resolves in an list of ethereum keypairs map
- `getPrivateKey` Get an private key by it's address
- `deletePrivateKey`
- `decryptPrivateKey`
- `signTx` Sign an ethereum transaction
- `normalizeAddress` normalized an etheruem address (e.g. add the hex prefix and so on)
- `normalizePrivateKey` normalize an ethereum private key (will throw when the key is invalid)
- `privateKeyToMnemonic` convert's an ethereum private key to it's mnemonic phrase.
- `mnemonicToPrivateKey` opposite of `privateKeyToMnemonic`
- `mnemonicValid` check if the mnemonic is valid

## NationInterface(`src/ethereum/nation.js`)
> Use this to interact with everything nation related like creation, joining, leaving, indexing and so on.

**Available methods:**

- `all` returns all index nations
- `joinNation` join an nation
- `leaveNation` leave an nation
- `index` use this to index all nation's from the blockchain. Just call it once a while to fetch nation's created by other people.
- `saveDraft` Save a draft and return's an translation key + nation dataset
- `updateDraft` Update a draft and return's transactio key + nation dataset. This can only be called when the nation was not submitted to the blockchain.
- `submitDraft` Submit draft to the blockchain.
- `saveAndSubmit` Save and submit and nation dataset.
- `deleteDraft` Delete and draft.

## WalletInterface(`src/ethereum/wallet.js`)
> Use this to interact with your ethereum wallet.

**Available methods:**

- `ethSend` Will send ether from a to b
- `ethBalance` Fetch your eth balance
- `ethSync` Sync your ethereum accounts.

## ProfileInterface(`src/ethereum/profile.js`)
> Use this to interact with your profile.

**Available methods:**

- `hasProfile` Check if an profile is present
- `setProfile` Set / create an profile
- `getProfile` Fetch your profile
- `getPublicProfile` Fetch your public profile (it contain's some additional values)