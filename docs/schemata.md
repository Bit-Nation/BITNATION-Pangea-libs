> The schemata can be found in `src/database/schemata.js`. Each schema defines an flow type that represent it's value so that it can be better consumed by flow.

## ProfileSchema

__Properties:__

- `id` (type: `int`) - used by realm
- `name` (type: `string`) - is the username of the profile. Later this will be searchable
- `location` (type: `string`) - location of the user (like Germany, or Colon)
- `latitude` (type: `string`)
- `longitude` (type: `string`)
- `description` (type: `string`) - short description of the user
- `image` (type: `string`) - base64 encoded image profile image of the user
- `version` (type: `string`) - specifies the version of the profile

## AccountBalanceSchema

__Properties:__

- `id` (type: `string`) - this is the ETH address + `_ETH` as a prefix. E.g: `0xaf137676a815a09302a348e339cf9d85d2c91706_ETH`
- `address` (type: `string`) - e.g. ethereum address
- `amount` (type: `string`) - amount in the smallest unit
- `synced_at`: (type: `Date`) - the last sync
- `currency`: (type: `string`) - e.g. `ether`

## MessageJobSchema

__Properties:__

- `id` (type: `int`) - internal id
- `heading` (type: `string`)
- `text` (type: `string`) - the main message
- `version` (type: `int`) - version of the type
- `version` (type: `Date`)

## TransactionJobSchema
> It's not sure if we will continue using the transaction job in the future. That's the reason why we will not document it here.

## NationSchema

__Properties:__

- `id` (type: `int`) - internal id for the application
- `idInSmartContract` (type: `int`) - id in nation smart contract
- `txHash` (type: `string`) - the transaction hash of the transaction where the nation was created
- `created` (type: `bool`) - When an nation is created by it's owner it's persisted immediately BUT this flag is set to false so that we can use this in the UI to determine if we should display it different etc.
- `nationName` (type: `string`)
- `nationDescription` (type: `string`)
- `exists` (type: `bool`) - if the nation does exist
- `virtualNation` (type: `bool`) - is virtual nation?
- `nationCode` (type: `bool`) - code of law
- `lawEnforcementMechanism` (type: `string`)
- `profit` (type: `bool`) - for profit use?
- `nonCitizenUse` (type: `bool`) - can non citizens use the services?
- `diplomaticRecognition` (type: `bool`)
- `decisionMakingProcess` (type: `string`)
- `governanceService` (type: `string`) - a list of services
- `citizens` (type: `int`) - the number of citizens
- `joined` (type: `bool`) - did I join?
