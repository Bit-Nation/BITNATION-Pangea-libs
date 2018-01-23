## Database
`src/database/db.js`

> The database is an proxy between realm and the pangea libraries. It's responsible for the query / write actions and schema registration.

**Create an instance of database**
```js
import dbFactory from 'src/database/db'

//Will be an object that satisfies the [DBInterface]()
const db = dbFactory('./path/to/my/db');

```

## Nation
`src/ethereum/nation.js`

> Used to interact with nations (create, join, leave etc)

```js
import nationFactory from 'src/ethereum/nation'

//Will be an object that satisfies the [NationInterface]()
const nation = nationFactory(db, txQueue, web3, eventEmitter, nationContract);

```