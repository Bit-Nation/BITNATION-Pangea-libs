// @flow

import type {TransactionJobType} from '../database/schemata';
import type {DBInterface} from '../database/db';
const EventEmitter = require('eventemitter3');

/**
 * @typedef TransactionQueueInterface
 * @property {function(job:TransactionJobInputType) : Promise<void>} addJob Add's an job to the queue and emit's the "transaction_queue:job:added" event
 */
export interface TransactionQueueInterface {
    jobFactory(txHash: string, type: string) : Promise<TransactionJobType>
}

/**
 * @typedef TransactionJobInputType
 * @property {number} timeout
 * @property {string} processor
 * @property {object} data
 * @property {string} successHeading
 * @property {string} successBody
 * @property {string} failHeading
 * @property {string} failBody
 */
export type TransactionJobInputType = {
    timeout: number,
    processor: string,
    data: {...mixed},
    successHeading: string,
    successBody: string,
    failHeading: string,
    failBody: string,
}

export const TX_JOB_TYPE_NATION_CREATE = 'NATION_CREATE';

export const TX_JOB_TYPE_NATION_JOIN = 'NATION_JOIN';

export const TX_JOB_TYPE_NATION_LEAVE = 'NATION_LEAVE';

export const TX_JOB_TYPE_ETH_SEND = 'ETH_SEND';

export const TX_JOB_STATUS_PENDING = 200;

export const TX_JOB_STATUS_SUCCESS = 300;

export const TX_JOB_STATUS_FAILED = 400;

/**
 *
 * @param {DBInterface} db
 * @param {EventEmitter} ee
 * @return {TransactionQueueInterface}
 */
export default function(db: DBInterface, ee: EventEmitter): TransactionQueueInterface {
    const impl = {
        jobFactory: (txHash: string, type: string) => new Promise((res, rej) => {
            const allowedTypes = [
                TX_JOB_TYPE_NATION_CREATE,
                TX_JOB_TYPE_NATION_JOIN,
                TX_JOB_TYPE_NATION_LEAVE,
                TX_JOB_TYPE_ETH_SEND,
            ];

            if (!allowedTypes.includes(type)) {
                return rej({
                    transKey: 'system_error.tx_queue.invalid_type',
                    params: {type: type},
                });
            }

            if (!/^0x([A-Fa-f0-9]{64})$/.exec(txHash)) {
                return rej({
                    transKey: 'system_error.tx_hash_invalid',
                    params: {txHash},
                });
            }

            const job:TransactionJobType = {
                txHash: txHash,
                status: 200,
                type: type,
            };

            res(job);
        }),
    };

    return impl;
}
