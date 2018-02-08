// @flow

import type {TransactionJobType} from '../database/schemata';
import type {DBInterface} from '../database/db';
import {TRANSACTION_QUEUE_JOB_ADDED} from './../events';
import {MessagingQueueInterface, Msg} from './messaging';
const EventEmitter = require('eventemitter3');
const Web3 = require('web3');
const eachSeries = require('async/eachSeries');
const waterfall = require('async/waterfall');

/**
 * @typedef TransactionQueueInterface
 * @property {function(job:TransactionJobInputType) : Promise<void>} addJob Add's an job to the queue and emit's the "transaction_queue:job:added" event
 */
export interface TransactionQueueInterface {
    jobFactory(txHash: string, type: string) : Promise<TransactionJobType>,
    saveJob(job: TransactionJobType) : Promise<void>
}

export const TX_JOB_TYPE_NATION_CREATE = 'NATION_CREATE';

export const TX_JOB_TYPE_NATION_JOIN = 'NATION_JOIN';

export const TX_JOB_TYPE_NATION_LEAVE = 'NATION_LEAVE';

export const TX_JOB_TYPE_ETH_SEND = 'ETH_SEND';

export const TX_JOB_STATUS_PENDING = 200;

export const TX_JOB_STATUS_SUCCESS = 300;

export const TX_JOB_STATUS_FAILED = 400;

export default class TransactionQueue implements TransactionQueueInterface {
    _db: DBInterface;
    _ee: EventEmitter;
    _web3: Web3;
    _msgQueue: MessagingQueueInterface;
    _jobStack: Array<TransactionJobType>;

    /**
     *
     * @param db
     * @param ee
     * @param web3
     * @param msgQueue
     */
    constructor(db: DBInterface, ee: EventEmitter, web3: Web3, msgQueue: MessagingQueueInterface) {
        this._db = db;
        this._ee = ee;
        this._web3 = web3;
        this._msgQueue = msgQueue;
        this._jobStack = [];
    }

    /**
     *
     * @param txHash
     * @param type
     * @return {Promise<any>}
     */
    jobFactory(txHash: string, type: string): Promise<TransactionJobType> {
        return new Promise((res, rej) => {
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
        });
    }

    /**
     *
     * @param job
     * @return {Promise<any>}
     */
    saveJob(job: TransactionJobType): Promise<void> {
        return new Promise((res, rej) => {
            this._db
                .write((realm) => realm.create('TransactionJob', job))
                .then((job: TransactionJobType) => {
                    this._ee.emit(TRANSACTION_QUEUE_JOB_ADDED, job);
                    this._jobStack.push(job);
                    res();
                })
                .catch(rej);
        });
    }
}
