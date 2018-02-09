import TransactionQueue, {TX_JOB_TYPE_NATION_JOIN, Msg} from './transaction';
import type {TransactionJobType} from '../database/schemata';
import {TRANSACTION_QUEUE_JOB_ADDED, TRANSACTION_QUEUE_FINISHED_CYCLE} from '../events';
import dbFactory from '../database/db';
const EventEmitter = require('eventemitter3');
const dbPath = () => 'database/'+Math.random();

describe('transaction queue', () => {
    describe('factory', () => {
        test('invalid type', (done) => {
            const txQueueInstance = new TransactionQueue(dbFactory(dbPath()), null);

            txQueueInstance
                .jobFactory('0x8729514af0b8a5472ae4af1887cf07354032b085656d3cc62a97d6bc12b07194', 'I_AM_THE_WRONG_TYPE')
                .then(done.fail)
                .catch((error) => {
                    expect(error).toEqual({
                        transKey: 'system_error.tx_queue.invalid_type',
                        params: {type: 'I_AM_THE_WRONG_TYPE'},
                    });
                    done();
                });
        });

        test('invalid transaction hash', (done) => {
            const txQueueInstance = new TransactionQueue(dbFactory(dbPath()), null);

            txQueueInstance
                .jobFactory('0x8729514af0b8a5472ae_INVALID_TRANSACTION_HASH_4af1887cf07354032b085656d3cc62a97d6bc12b07194', TX_JOB_TYPE_NATION_JOIN)
                .then(done.fail)
                .catch((error) => {
                    expect(error).toEqual({
                        transKey: 'system_error.tx_hash_invalid',
                        params: {
                            txHash: '0x8729514af0b8a5472ae_INVALID_TRANSACTION_HASH_4af1887cf07354032b085656d3cc62a97d6bc12b07194',
                        },
                    });
                    done();
                });
        });

        test('success', (done) => {
            const txQueueInstance = new TransactionQueue(dbFactory(dbPath()), null);

            txQueueInstance
                .jobFactory('0x8729514af0b8a5472ae4af1887cf07354032b085656d3cc62a97d6bc12b07194', TX_JOB_TYPE_NATION_JOIN)
                .then((job) => {
                    expect(job).toEqual({
                        txHash: '0x8729514af0b8a5472ae4af1887cf07354032b085656d3cc62a97d6bc12b07194',
                        status: 200,
                        type: TX_JOB_TYPE_NATION_JOIN,
                    });

                    done();
                });
        });
    });
    describe('saveJob', () => {
        test('success', (done) => {
            const db = dbFactory(dbPath());

            const eventEmitterMock = {
                emit: jest.fn(function(eventName, job) {
                    expect(eventName).toBe(TRANSACTION_QUEUE_JOB_ADDED);
                    expect(job.txHash).toBe('0x8729514af0b8a5472ae4af1887cf07354032b085656d3cc62a97d6bc12b07194');
                    expect(job.status).toBe(200);
                    expect(job.type).toBe('NATION_JOIN');
                }),
            };

            const txQueueInstance = new TransactionQueue(db, eventEmitterMock);

            db
                .query((realm) => realm.objects('TransactionJob').length)
                .then((transactionJobs) => {
                    expect(transactionJobs).toBe(0);

                    return txQueueInstance.jobFactory('0x8729514af0b8a5472ae4af1887cf07354032b085656d3cc62a97d6bc12b07194', TX_JOB_TYPE_NATION_JOIN);
                })
                .then((txJob) => txQueueInstance.saveJob(txJob))
                .then((_) => db.query((realm) => realm.objects('TransactionJob')))
                .then((transactionJobs) => {
                    expect(transactionJobs[0].txHash).toBe('0x8729514af0b8a5472ae4af1887cf07354032b085656d3cc62a97d6bc12b07194');
                    expect(transactionJobs[0].status).toBe(200);
                    expect(transactionJobs[0].type).toBe('NATION_JOIN');
                    // Make sure the event was emitted
                    expect(eventEmitterMock.emit).toHaveBeenCalledTimes(1);
                    done();
                })
                .catch(done.fail);
        });
    });
    describe('transactionProcessor', () => {
        test('web3 error', (done) => {
            const db = dbFactory(dbPath());

            const error = {};

            const web3Mock = {
                eth: {
                    getTransactionReceipt: jest.fn((txHash, cb) => {
                        expect(txHash).toBe('abc');
                        cb(error);
                    }),
                },
            };

            const txQueueInstance = new TransactionQueue(db, new EventEmitter(), web3Mock);

            txQueueInstance
                .processTransaction({txHash: 'abc'}, () => {})
                .then(done.fail)
                .catch((e) => {
                    expect(e).toBe(error);
                    done();
                });
        });
        test('web3 not tx receipt', (done) => {
            const db = dbFactory(dbPath());

            const web3Mock = {
                eth: {
                    getTransactionReceipt: jest.fn((txHash, cb) => {
                        expect(txHash).toBe('abc');
                        cb(null, null);
                    }),
                },
            };

            const txQueueInstance = new TransactionQueue(db, new EventEmitter(), web3Mock);

            txQueueInstance
                .processTransaction({txHash: 'abc'}, () => {})
                .then((_) => {
                    expect(_).toBeUndefined();
                    done();
                })
                .catch(done.fail);
        });
        test('customProcessor null return value', (done) => {
            const db = dbFactory(dbPath());

            const web3Mock = {
                eth: {
                    getTransactionReceipt: jest.fn((txHash, cb) => {
                        expect(txHash).toBe('abc');
                        cb(null, {status: '0x1'});
                    }),
                },
            };

            const txQueueInstance = new TransactionQueue(db, new EventEmitter(), web3Mock);
            txQueueInstance
                .processTransaction({txHash: 'abc'}, (txSuccess, jobType) => {
                    expect(txSuccess).toBeTruthy();
                    expect(jobType).toEqual({txHash: 'abc'});
                    return new Promise((res, rej) => res());
                })
                .then((_) => {
                    expect(_).toBeUndefined();
                    done();
                })
                .catch(done.fail);
        });
        test('customProcessor save message', (done) => {
            const db = dbFactory(dbPath());

            const web3Mock = {
                eth: {
                    getTransactionReceipt: jest.fn((txHash, cb) => {
                        expect(txHash).toBe('abc');
                        cb(null, {status: '0x1'});
                    }),
                },
            };

            const dummyMessage = {};

            const msgQueueMock = {
                addJob: jest.fn((msg) => {
                    expect(msg).toBe(dummyMessage);
                    return new Promise((res, rej) => res());
                }),
            };

            const txQueueInstance = new TransactionQueue(db, new EventEmitter(), web3Mock, msgQueueMock);
            txQueueInstance
                .processTransaction({txHash: 'abc'}, (txSuccess, jobType) => {
                    expect(txSuccess).toBeTruthy();
                    expect(jobType).toEqual({txHash: 'abc'});
                    return new Promise((res, rej) => res(dummyMessage));
                })
                .then((_) => {
                    expect(msgQueueMock.addJob).toHaveBeenCalledTimes(1);
                    expect(_).toBeUndefined();
                    done();
                })
                .catch(done.fail);
        });
    });
    describe('startProcessing', () => {
        test('success', (done) => {
            const db = dbFactory(dbPath());
            const ee = new EventEmitter();

            let rounds = 0;

            ee.on(TRANSACTION_QUEUE_FINISHED_CYCLE, () => {
                if (rounds === 2) {
                    done();
                }

                rounds++;
            });

            const web3Mock = {
                eth: {
                    getTransactionReceipt: function(hash, cb) {
                        cb(null, {status: '0x1'});
                    },
                },
            };

            const msgQueueMock = {

            };

            const txQueue = new TransactionQueue(db, ee, web3Mock, msgQueueMock);
            // mock time for next processing cycle
            txQueue._processingTimeout = 1000;

            // Reset the processor since we need an custom for this testing
            txQueue._processors = {
                'NATION_JOIN': (txSuccess:boolean, job:TransactionJobType) => {
                    return new Msg('ok');
                },
            };

            txQueue
                .jobFactory('0x5983f5ba66fdf89385247c923feeee941d16d6969156109447f8916d8ef93fb9', TX_JOB_TYPE_NATION_JOIN)
                .then((job:TransactionJobType) => {
                    txQueue
                        .saveJob(job)
                        .then((_) => {
                            txQueue.startProcessing();
                        })
                        .catch(done.fail);
                })
                .catch(done.fail);
        });
    });
});
