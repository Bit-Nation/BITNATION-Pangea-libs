import transactionQueue, {TX_JOB_TYPE_NATION_JOIN} from './transaction';
import messagingQueue from './messaging';
import type {TransactionJobType} from '../database/schemata';
const EventEmitter = require('eventemitter3');
import {TRANSACTION_QUEUE_JOB_ADDED} from '../events';
import dbFactory from '../database/db';

const dbPath = () => 'database/'+Math.random();

describe('transaction queue', () => {
    describe('factory', () => {
        test('invalid type', (done) => {
            const txQueueInstance = transactionQueue(dbFactory(dbPath()), null);

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
            const txQueueInstance = transactionQueue(dbFactory(dbPath()), null);

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
            const txQueueInstance = transactionQueue(dbFactory(dbPath()), null);

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
});
