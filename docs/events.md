> In order to use event's you should import the exported constants.

## `APP_ONLINE`
> should be emitted by the CLIENT when it goes online.

## `APP_OFFLINE`
> should be emitted by the CLIENT when it goes offline.

## `AMOUNT_OF_ADDRESSES_CHANGED`
> is emitted by the lib's when addresses are added / removed

## `MESSAGING_QUEUE_JOB_ADDED`
> emitted when a new job was added to the msg queue

## `TRANSACTION_QUEUE_JOB_ADDED`
> emitted when a job was added to the tx queue

## `ETH_TX_SIGN`
> emitted by web3 when there is need for signing an transaction.
> **IMPORTANT! Don't forget to listen for this event. It is needed to sign an transaction.**
