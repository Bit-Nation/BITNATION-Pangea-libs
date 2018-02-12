import TransactionQueue, {
    TX_JOB_TYPE_NATION_JOIN, Msg, TX_JOB_TYPE_NATION_CREATE,
    TX_JOB_STATUS_PENDING, TX_JOB_TYPE_NATION_LEAVE, TX_JOB_TYPE_ETH_SEND,
} from './transaction';
import type {TransactionJobType} from '../database/schemata';
import {TRANSACTION_QUEUE_JOB_ADDED, TRANSACTION_QUEUE_FINISHED_CYCLE} from '../events';
import dbFactory from '../database/db';
const EventEmitter = require('eventemitter3');
const dbPath = () => 'database/'+Math.random();

describe('transaction queue', () => {
    const nationData = {
        nationName: 'Bitnation',
        nationDescription: 'We <3 cryptography',
        exists: true,
        virtualNation: false,
        nationCode: 'Code civil',
        lawEnforcementMechanism: 'xyz',
        profit: true,
        nonCitizenUse: false,
        diplomaticRecognition: false,
        decisionMakingProcess: 'dictatorship',
        governanceService: 'Security',
    };
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
                        nation: null,
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
    describe('processors - NATION_CREATE', () => {
        test(`Try to process nation without a job`, (done) => {
            const db = dbFactory(dbPath());
            const ee = new EventEmitter();

            const txQueue = new TransactionQueue(db, ee, null, null);


            db
                .write((realm) => realm.create('Nation', Object.assign(nationData, {id: 1, created: false})))
                .then((nation) => txQueue._processors['NATION_CREATE'](true, nation))
                .then(done.fail)
                .catch((e) => {
                    expect(e).toBe('There is no nation present on the job object');
                    done();
                });
        });
        test('process nation created successfully job', (done) => {
            const db = dbFactory(dbPath());
            const ee = new EventEmitter();

            const txQueue = new TransactionQueue(db, ee, null, null);

            db
                .write((realm) => realm.create('Nation', Object.assign(nationData, {
                    id: 1,
                    created: false,
                    tx: {
                        txHash: '0x3b45d7e69eb85a18769ae79790879aa883b1732dd2fcd82ef5f561ad9db73fd9',
                        status: TX_JOB_STATUS_PENDING,
                        type: TX_JOB_TYPE_NATION_CREATE,
                    },
                })))
                .then((nation) => {
                    txQueue._processors['NATION_CREATE'](true, nation.tx)
                        .then((msg) => {
                            expect(msg._msg).toBe('nation.create.succeed');
                            expect(msg._params).toEqual({
                                nationName: 'Bitnation',
                            });
                            expect(msg._interpret).toBeTruthy();
                            expect(msg._heading).toBe('nation.heading');
                            expect(msg._display).toBeTruthy();

                            expect(nation.joined).toBeFalsy();

                            expect(nation.tx.txHash).toBe('0x3b45d7e69eb85a18769ae79790879aa883b1732dd2fcd82ef5f561ad9db73fd9');
                            expect(nation.tx.status).toBe(300);
                            expect(nation.tx.type).toBe('NATION_CREATE');

                            done();
                        })
                        .catch(done.fail);
                });
        });
        test('process nation created successfully job', (done) => {
            const db = dbFactory(dbPath());
            const ee = new EventEmitter();

            const txQueue = new TransactionQueue(db, ee, null, null);

            db
                .write((realm) => realm.create('Nation', Object.assign(nationData, {
                    id: 1,
                    created: false,
                    tx: {
                        txHash: '0x3b45d7e69eb85a18769ae79790879aa883b1732dd2fcd82ef5f561ad9db73fd9',
                        status: TX_JOB_STATUS_PENDING,
                        type: TX_JOB_TYPE_NATION_CREATE,
                    },
                })))
                .then((nation) => {
                    txQueue._processors['NATION_CREATE'](false, nation.tx)
                        .then((msg) => {
                            expect(msg._msg).toBe('nation.create.failed');
                            expect(msg._params).toEqual({
                                nationName: 'Bitnation',
                            });
                            expect(msg._interpret).toBeTruthy();
                            expect(msg._heading).toBe('nation.heading');
                            expect(msg._display).toBeTruthy();

                            expect(nation.joined).toBeFalsy();

                            expect(nation.tx.txHash).toBe('0x3b45d7e69eb85a18769ae79790879aa883b1732dd2fcd82ef5f561ad9db73fd9');
                            expect(nation.tx.status).toBe(400);
                            expect(nation.tx.type).toBe('NATION_CREATE');

                            done();
                        })
                        .catch(done.fail);
                });
        });
    });
    describe('processor - NATION_JOIN', () => {
        test('no nation present in job', (done) => {
            const db = dbFactory(dbPath());
            const ee = new EventEmitter();

            const txQueue = new TransactionQueue(db, ee, null, null);

            txQueue
                ._processors['NATION_JOIN'](true, {nation: null})
                .then((result) => {
                    done.fail(`Expected to be reject`);
                })
                .catch((e) => {
                    expect(e).toBe('There is no nation present on the job object');
                    done();
                });
        });
        test('join successfully', (done) => {
            const db = dbFactory(dbPath());
            const ee = new EventEmitter();

            const txQueue = new TransactionQueue(db, ee, null, null);

            db
                .write((realm) => realm.create('Nation', Object.assign(nationData, {
                    id: 1,
                    created: false,
                    tx: {
                        txHash: '0x3b45d7e69eb85a18769ae79790879aa883b1732dd2fcd82ef5f561ad9db73fd9',
                        status: TX_JOB_STATUS_PENDING,
                        type: TX_JOB_TYPE_NATION_JOIN,
                    },
                })))
                .then((nation) => {
                    txQueue
                        ._processors['NATION_JOIN'](true, nation.tx)
                        .then((msg:Msg) => {
                            expect(msg._heading).toBe('nation.heading');
                            expect(msg._params).toEqual({
                                nationName: 'Bitnation',
                            });
                            expect(msg._interpret).toBeTruthy();
                            expect(msg._msg).toBe('nation.join.succeed');
                            expect(msg._display).toBeTruthy();

                            expect(nation.tx.txHash).toBe('0x3b45d7e69eb85a18769ae79790879aa883b1732dd2fcd82ef5f561ad9db73fd9');
                            expect(nation.tx.status).toBe(300);
                            expect(nation.tx.type).toBe(TX_JOB_TYPE_NATION_JOIN);

                            done();
                        })
                        .catch(done.fail);
                })
                .catch(done.fail);
        });
        test('transaction fail', (done) => {
            const db = dbFactory(dbPath());
            const ee = new EventEmitter();

            const txQueue = new TransactionQueue(db, ee, null, null);

            db
                .write((realm) => realm.create('Nation', Object.assign(nationData, {
                    id: 1,
                    created: false,
                    tx: {
                        txHash: '0x934a702acbaeb30b29d8d4bc12bbef7530e9c904ba55ab050e608b96f077585f',
                        status: TX_JOB_STATUS_PENDING,
                        type: TX_JOB_TYPE_NATION_JOIN,
                    },
                })))
                .then((nation) => {
                    txQueue
                        ._processors['NATION_JOIN'](false, nation.tx)
                        .then((msg:Msg) => {
                            expect(msg._heading).toBe('nation.heading');
                            expect(msg._params).toEqual({
                                nationName: 'Bitnation',
                            });
                            expect(msg._interpret).toBeTruthy();
                            expect(msg._msg).toBe('nation.join.failed');
                            expect(msg._display).toBeTruthy();

                            expect(nation.tx.txHash).toBe('0x934a702acbaeb30b29d8d4bc12bbef7530e9c904ba55ab050e608b96f077585f');
                            expect(nation.tx.status).toBe(400);
                            expect(nation.tx.type).toBe(TX_JOB_TYPE_NATION_JOIN);

                            done();
                        })
                        .catch(done.fail);
                })
                .catch(done.fail);
        });
    });
    describe('processor - NATION_LEAVE', () => {
        test('no nation present in job', (done) => {
            const db = dbFactory(dbPath());
            const ee = new EventEmitter();

            const txQueue = new TransactionQueue(db, ee, null, null);

            txQueue
                ._processors['NATION_LEAVE'](true, {nation: null})
                .then((result) => {
                    done.fail(`Expected to be reject`);
                })
                .catch((e) => {
                    expect(e).toBe('There is no nation present on the job object');
                    done();
                });
        });
        test('leave success', (done) => {
            const db = dbFactory(dbPath());
            const ee = new EventEmitter();

            const txQueue = new TransactionQueue(db, ee, null, null);

            db
                .write((realm) => realm.create('Nation', Object.assign(nationData, {
                    id: 1,
                    created: false,
                    tx: {
                        txHash: '0x3b45d7e69eb85a18769ae79790879aa883b1732dd2fcd82ef5f561ad9db73fd9',
                        status: TX_JOB_STATUS_PENDING,
                        type: TX_JOB_TYPE_NATION_LEAVE,
                    },
                })))
                .then((nation) => {
                    txQueue
                        ._processors['NATION_LEAVE'](true, nation.tx)
                        .then((msg:Msg) => {
                            expect(msg._heading).toBe('nation.heading');
                            expect(msg._params).toEqual({
                                nationName: 'Bitnation',
                            });
                            expect(msg._interpret).toBeTruthy();
                            expect(msg._msg).toBe('nation.leave.succeed');
                            expect(msg._display).toBeTruthy();

                            expect(nation.tx.txHash).toBe('0x3b45d7e69eb85a18769ae79790879aa883b1732dd2fcd82ef5f561ad9db73fd9');
                            expect(nation.tx.status).toBe(300);
                            expect(nation.tx.type).toBe(TX_JOB_TYPE_NATION_LEAVE);

                            done();
                        })
                        .catch(done.fail);
                })
                .catch(done.fail);
        });
        test('leave failed', (done) => {
            const db = dbFactory(dbPath());
            const ee = new EventEmitter();

            const txQueue = new TransactionQueue(db, ee, null, null);

            db
                .write((realm) => realm.create('Nation', Object.assign(nationData, {
                    id: 1,
                    created: false,
                    tx: {
                        txHash: '0x934a702acbaeb30b29d8d4bc12bbef7530e9c904ba55ab050e608b96f077585f',
                        status: TX_JOB_STATUS_PENDING,
                        type: TX_JOB_TYPE_NATION_LEAVE,
                    },
                })))
                .then((nation) => {
                    txQueue
                        ._processors['NATION_LEAVE'](false, nation.tx)
                        .then((msg:Msg) => {
                            expect(msg._heading).toBe('nation.heading');
                            expect(msg._params).toEqual({
                                nationName: 'Bitnation',
                            });
                            expect(msg._interpret).toBeTruthy();
                            expect(msg._msg).toBe('nation.leave.failed');
                            expect(msg._display).toBeTruthy();

                            expect(nation.tx.txHash).toBe('0x934a702acbaeb30b29d8d4bc12bbef7530e9c904ba55ab050e608b96f077585f');
                            expect(nation.tx.status).toBe(400);
                            expect(nation.tx.type).toBe(TX_JOB_TYPE_NATION_LEAVE);

                            done();
                        })
                        .catch(done.fail);
                })
                .catch(done.fail);
        });
    });
    describe('processor - ETH_SEND', (done) => {
        test('tx success', () => {
            const db = dbFactory(dbPath());
            const ee = new EventEmitter();

            const txQueue = new TransactionQueue(db, ee, null, null);

            txQueue
                .saveJob(txQueue.jobFactory('0xb1f058b50c4f34cf6fd9ad87eaa4355901bbc82598bcd8520107ec47986877eb', TX_JOB_TYPE_ETH_SEND))
                .then((job) => {
                    txQueue._processors['ETH_SEND'](true, job)
                        .then((msg) => {
                            expect(msg._heading).toBe('transaction.heading');
                            expect(msg._params).toEqual({
                                nationName: 'Bitnation',
                            });
                            expect(msg._interpret).toBeTruthy();
                            expect(msg._msg).toBe('nation.transaction.succeed');
                            expect(msg._display).toBeTruthy();
                            done();
                        })
                        .catch(done.fail);
                })
                .catch();
        });
        test('tx failed', () => {
            const db = dbFactory(dbPath());
            const ee = new EventEmitter();

            const txQueue = new TransactionQueue(db, ee, null, null);

            txQueue
                .saveJob(txQueue.jobFactory('0xb1f058b50c4f34cf6fd9ad87eaa4355901bbc82598bcd8520107ec47986877eb', TX_JOB_TYPE_ETH_SEND))
                .then((job) => {
                    txQueue._processors['ETH_SEND'](false, job)
                        .then((msg) => {
                            expect(msg._heading).toBe('transaction.heading');
                            expect(msg._params).toEqual({
                                nationName: 'Bitnation',
                            });
                            expect(msg._interpret).toBeTruthy();
                            expect(msg._msg).toBe('nation.transaction.failed');
                            expect(msg._display).toBeTruthy();
                            done();
                        })
                        .catch(done.fail);
                })
                .catch();
        });
    });
});
