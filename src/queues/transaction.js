// @flow

import type {TransactionJobType} from '../database/schemata';
import type {DBInterface} from '../database/db';
import {TRANSACTION_QUEUE_JOB_ADDED, TRANSACTION_QUEUE_FINISHED_CYCLE} from './../events';
import {MessagingQueueInterface, Msg} from './messaging';
const EventEmitter = require('eventemitter3');
const Web3 = require('web3');
const eachSeries = require('async/eachSeries');
const waterfall = require('async/waterfall');
import {
    NATION_CREATE_FAILED,
    NATION_CREATE_SUCCEED,
    NATION_ALERT_HEADING,
    NATION_JOIN_SUCCEED,
    NATION_JOIN_FAILED,
    NATION_LEAVE_FAILED,
    NATION_LEAVE_SUCCEED,
    TRANSACTION_FAILED,
    TRANSACTION_HEADING,
    TRANSACTION_SUCCEED,
} from '../transKeys';

/**
 *
 */
export interface TransactionQueueInterface {
    jobFactory(txHash: string, type: string) : Promise<TransactionJobType>,
    saveJob(job: TransactionJobType) : Promise<TransactionJobType>
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
    _jobStack: Array<TransactionJobType> = [];
    _processingTimeout = 60 * 1000;
    _startedWorker: boolean = false;
    _processors = {
        'NATION_CREATE': (txSuccess: boolean, job: TransactionJobType): Promise<Msg | null> => {
            return new Promise((res, rej) => {
                if (!job.nation) {
                    return rej(`There is no nation present on the job object`);
                }
                // $FlowFixMe WE check above if the nation exist. So no reason to complain.
                // The relation to nation is an realm result's object
                const nation = job.nation[0];
                const nationName = nation.nationName;

                if (typeof txSuccess === 'boolean') {
                    this
                        ._db
                        .write((realm) => {
                            // $FlowFixMe WE check above if the nation exist. So no reason to complain.
                            if (txSuccess === true) {
                                job.status = TX_JOB_STATUS_SUCCESS;
                            } else {
                                job.status = TX_JOB_STATUS_FAILED;
                            }
                        })
                        .then((_) => {
                            if (txSuccess === true) {
                                // $FlowFixMe WE check above if the nation exist. So no reason to complain.
                                let msg = new Msg(NATION_CREATE_SUCCEED, {nationName});
                                msg.display(NATION_ALERT_HEADING);
                                return res(msg);
                            }
                            // $FlowFixMe WE check above if the nation exist. So no reason to complain.
                            let msg = new Msg(NATION_CREATE_FAILED, {nationName});
                            msg.display(NATION_ALERT_HEADING);
                            res(msg);
                        })
                        .catch(rej);
                }
            });
        },
        'NATION_JOIN': (txSuccess: boolean, job: TransactionJobType): Promise<Msg | null> => {
            return new Promise((res, rej) => {
                if (!job.nation) {
                    return rej(`There is no nation present on the job object`);
                }
                // $FlowFixMe WE check above if the nation exist. So no reason to complain.
                // The relation to nation is an realm result's object
                const nationName = job.nation[0].nationName;

                if (typeof txSuccess === 'boolean') {
                    this
                        ._db
                        .write((realm) => {
                            if (txSuccess === true) {
                                job.status = TX_JOB_STATUS_SUCCESS;
                                return;
                            }

                            job.status = TX_JOB_STATUS_FAILED;
                        })
                        .then((_) => {
                            let msg = new Msg(NATION_JOIN_FAILED, {nationName: nationName}, true);

                            if (txSuccess === true) {
                                msg = new Msg(NATION_JOIN_SUCCEED, {nationName: nationName}, true);
                            };

                            msg.display(NATION_ALERT_HEADING);
                            res(msg);
                        })
                        .catch();
                }
            });
        },
        'NATION_LEAVE': (txSuccess: boolean, job: TransactionJobType): Promise<Msg | null> => {
            return new Promise((res, rej) => {
                if (!job.nation) {
                    return rej(`There is no nation present on the job object`);
                }
                // $FlowFixMe WE check above if the nation exist. So no reason to complain.
                // The relation to nation is an realm result's object
                const nationName = job.nation[0].nationName;

                if (typeof txSuccess === 'boolean') {
                    this
                        ._db
                        .write((realm) => {
                            if (txSuccess === true) {
                                job.status = TX_JOB_STATUS_SUCCESS;
                                return;
                            }

                            job.status = TX_JOB_STATUS_FAILED;
                        })
                        .then((_) => {
                            let msg = new Msg(NATION_LEAVE_FAILED, {nationName: nationName}, true);

                            if (txSuccess === true) {
                                msg = new Msg(NATION_LEAVE_SUCCEED, {nationName: nationName}, true);
                            }

                            msg.display(NATION_ALERT_HEADING);
                            res(msg);
                        })
                        .catch();
                }
            });
        },
        'ETH_SEND': (txSuccess: boolean, job: TransactionJobType): Promise<Msg | null> => {
            return new Promise((res, rej) => {
                this._web3.eth.getTransaction(job.txHash, (err, txData) => {
                    if (err) {
                        return rej(err);
                    }

                    const value = this._web3.fromWei(txData.value, 'ether').toString();

                    const params = {
                        from: txData.from,
                        to: txData.to,
                        value: value,
                        txHash: job.txHash,
                    };

                    let msg = new Msg(TRANSACTION_FAILED, params);

                    if (txSuccess === true) {
                        msg = new Msg(TRANSACTION_SUCCEED, params);
                    }

                    msg.display(TRANSACTION_HEADING);

                    res(msg);
                });
            });
        },
    };

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
    }

    /**
     *
     * @param txHash
     * @param type
     * @return {Promise<TransactionJobType>}
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
                nation: null,
            };

            res(job);
        });
    }

    startProcessing(): void {
        if (this._startedWorker) {
            return;
        }

        this._startedWorker = true;

        this
            ._db
            .query((realm) => realm.objects('TransactionJob').filtered('status = "200"'))
            .then((jobs: Array<TransactionJobType>) => {
                jobs.map((job: TransactionJobType) => this._jobStack.push(job));

                const processAction = () => {
                    eachSeries(this._jobStack, (job: TransactionJobType, done) => {
                        const p = this._processors[job.type];

                        if (typeof p !== 'function') {
                            return done(`Couldn't find a processor for type: ${job.type}`);
                        }

                        this
                            .processTransaction(job, p)
                            .then((_) => done())
                            .catch(done);
                    }, (err) => {
                        // @todo handle error (maybe log?)
                        this._ee.emit(TRANSACTION_QUEUE_FINISHED_CYCLE);
                        setTimeout(processAction, this._processingTimeout);
                    });
                };

                processAction();
            })
            .catch((e) => {
                // @todo log
                console.log(e);
            });
    }

    /**
     *
     * @param job
     * @return {Promise<TransactionJobType>}
     */
    saveJob(job: TransactionJobType): Promise<TransactionJobType> {
        return new Promise((res, rej) => {
            this._db
                .write((realm) => realm.create('TransactionJob', job))
                .then((job: TransactionJobType) => {
                    this._ee.emit(TRANSACTION_QUEUE_JOB_ADDED, job);
                    this._jobStack.push(job);
                    res(job);
                })
                .catch(rej);
        });
    }

    /**
     * @desc Higher order function for processing a transaction job
     * @param job
     * @param customProcessor
     * @return {Promise<any>}
     */
    processTransaction(job: TransactionJobType, customProcessor: (txSuccess: boolean, job: TransactionJobType) => Promise<Msg | null>): Promise<void> {
        return new Promise((res, rej) => {
            this._web3.eth.getTransactionReceipt(job.txHash, (err, receipt) => {
                if (err) {
                    return rej(err);
                }

                // When the transaction is pending there is no receipt - so we can resolve
                if (!receipt) {
                    return res();
                }

                customProcessor('0x1' === receipt.status, job)
                    .then((result: Msg | null) => {
                        if (!result) {
                            return res();
                        }

                        this
                            ._msgQueue
                            .addJob(result)
                            .then((_) => {
                                // @todo log
                                res();
                            })
                            .catch((_) => {
                                // @todo log
                                rej();
                            });
                    });
            });
        });
    }
}
