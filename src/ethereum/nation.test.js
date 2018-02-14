import nationsFactory from './nation';
import dbFactory from '../database/db';
import TxQueue, {TX_JOB_TYPE_NATION_CREATE} from '../queues/transaction';
import {NATION_CREATE} from '../events';
import type {NationType} from '../database/schemata';
const EventEmitter = require('eventemitter3');
const Web3 = require('web3');

const randomPath = () => 'database/'+Math.random();

describe('nation', () => {
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
    test('nations', (done) => {
        const txQueue = {
            addJob: () => new Promise((res, rej) => res()),
        };

        const ee = new EventEmitter();

        // Make sure to confirm nation creation
        ee.on(NATION_CREATE, function(eventData) {
            eventData.confirm();
        });

        const nationContractMock = {
            createNation: jest.fn(function(data, cb) {
                cb(null, 'I_AM_A_TRANSACTION_HASH');
            }),
        };

        const web3 = new Web3(new Web3.providers.HttpProvider('https://rinkeby.infura.io/d'));
        web3.eth.defaultAccount = '0x85c725a18b09907e874229fcaf36f4e16792214d';

        const nations = nationsFactory(dbFactory(randomPath()), txQueue, web3, ee, nationContractMock);

        nations
            .saveDraft(nationData)
            .then((result) => {
                // Check if id increment's
                expect(result.nation.id).toBe(1);
                return nations.saveDraft(nationData);
            })
            .then((result) => {
                // Check if id increment's
                expect(result.nation.id).toBe(2);
                return nations.saveDraft(nationData);
            })
            .then((_) => nations.all())
            .then((nations) => {
                expect(nations.length).toBe(3);

                done();
            })
            .catch(done.fail);
    });

    describe('joinNation', () => {
        test('success', (done) => {
            const nationContractMock = {
                joinNation: jest.fn(function(nationId, cb) {
                    expect(nationId).toEqual(4);
                    cb(null, '0x614d71dec834787a24ad0e2b1d465188a13efa189338216c7f56fef0f8053b2f');
                }),
            };

            const web3 = new Web3(new Web3.providers.HttpProvider('https://rinkeby.infura.io/d'));
            web3.eth.defaultAccount = '0x85c725a18b09907e874229fcaf36f4e16792214d';

            const db = dbFactory(randomPath());

            const txQueue = new TxQueue(db, new EventEmitter());

            const nations = nationsFactory(db, txQueue, null, null, nationContractMock);

            db
                .write((realm) => realm.create('Nation', Object.assign(nationData, {id: 1, idInSmartContract: 4, stateMutateAllowed: true, created: false})))
                .then((nation) => {
                    expect(nation.tx).toBeNull();
                    nations
                        .joinNation(nation)
                        .then((_) => {
                            expect(nation.tx.txHash).toBe('0x614d71dec834787a24ad0e2b1d465188a13efa189338216c7f56fef0f8053b2f');
                            expect(nation.tx.type).toBe('NATION_JOIN');
                            expect(nation.tx.status).toBe(200);
                            expect(nation.stateMutateAllowed).toBeFalsy();

                            return db.query((realm) => realm.objects('TransactionJob'));
                        })
                        .then((jobs) => {
                            expect(jobs[0].txHash).toBe('0x614d71dec834787a24ad0e2b1d465188a13efa189338216c7f56fef0f8053b2f');
                            expect(jobs[0].type).toBe('NATION_JOIN');
                            expect(jobs[0].status).toBe(200);

                            done();
                        })
                        .catch(done.fail);
                })
                .catch(done.fail);
        });
        test('state mutate not allowed', (done) => {
            const nations = nationsFactory();

            nations
                .joinNation({})
                .then(done.fail)
                .catch((e) => {
                    expect(e).toEqual({
                        transKey: 'nation.state_mutate_not_possible',
                    });
                    done();
                });
        });
        test('fail web3 error', (done) => {
            const nationContractMock = {
                joinNation: jest.fn(function(nationId, cb) {
                    cb('i_am_a_error');
                }),
            };

            const web3 = new Web3(new Web3.providers.HttpProvider('https://rinkeby.infura.io/d'));
            web3.eth.defaultAccount = '0x85c725a18b09907e874229fcaf36f4e16792214d';

            const nations = nationsFactory(null, null, null, null, nationContractMock);

            nations
                .joinNation({stateMutateAllowed: true})
                .then((_) => {
                    done.fail('should be rejected');
                })
                .catch((error) => {
                    expect(error).toBe('i_am_a_error');
                    done();
                });
        });
    });

    describe('leaveNation', () => {
        test('success', (done) => {
            const nationContractMock = {
                leaveNation: jest.fn(function(nationId, cb) {
                    expect(nationId).toEqual(4);
                    cb(null, '0x614d71dec834787a24ad0e2b1d465188a13efa189338216c7f56fef0f8053b2f');
                }),
            };

            const web3 = new Web3(new Web3.providers.HttpProvider('https://rinkeby.infura.io/d'));
            web3.eth.defaultAccount = '0x85c725a18b09907e874229fcaf36f4e16792214d';

            const db = dbFactory(randomPath());

            const txQueue = new TxQueue(db, new EventEmitter());

            const nations = nationsFactory(db, txQueue, null, null, nationContractMock);

            db
                .write((realm) => realm.create('Nation', Object.assign(nationData, {id: 1, idInSmartContract: 4, stateMutateAllowed: true, created: false})))
                .then((nation) => {
                    expect(nation.tx).toBeNull();
                    nations
                        .leaveNation(nation)
                        .then((_) => {
                            expect(nation.tx.txHash).toBe('0x614d71dec834787a24ad0e2b1d465188a13efa189338216c7f56fef0f8053b2f');
                            expect(nation.tx.type).toBe('NATION_LEAVE');
                            expect(nation.tx.status).toBe(200);
                            expect(nation.stateMutateAllowed).toBeFalsy();

                            return db.query((realm) => realm.objects('TransactionJob'));
                        })
                        .then((jobs) => {
                            expect(jobs[0].txHash).toBe('0x614d71dec834787a24ad0e2b1d465188a13efa189338216c7f56fef0f8053b2f');
                            expect(jobs[0].type).toBe('NATION_LEAVE');
                            expect(jobs[0].status).toBe(200);

                            done();
                        })
                        .catch(done.fail);
                })
                .catch(done.fail);
        });
        test('state mutate not allowed', (done) => {
            const nations = nationsFactory();

            nations
                .leaveNation({})
                .then(done.fail)
                .catch((e) => {
                    expect(e).toEqual({
                        transKey: 'nation.state_mutate_not_possible',
                    });
                    done();
                });
        });
        test('fail - web3 error', (done) => {
            const nationContractMock = {
                leaveNation: jest.fn(function(nationId, cb) {
                    cb('i_am_a_error');
                }),
            };

            const web3 = new Web3(new Web3.providers.HttpProvider('https://rinkeby.infura.io/d'));
            web3.eth.defaultAccount = '0x85c725a18b09907e874229fcaf36f4e16792214d';

            const nations = nationsFactory(null, null, null, null, nationContractMock);

            nations
                .leaveNation({stateMutateAllowed: true})
                .then((_) => {
                    done.fail('should be rejected');
                })
                .catch((error) => {
                    expect(error).toBe('i_am_a_error');
                    done();
                });
        });
    });

    describe('index', () => {
        test('NationCreated event filter', (done) => {
            const nationContract = {
                NationCreated: (filter, blockFilter) => {
                    expect(filter).toEqual({});

                    expect(blockFilter).toEqual({
                        fromBlock: 0,
                        toBlock: 'latest',
                    });


                    return {
                        get: () => {
                            done();
                        },
                    };
                },
            };

            const nations = nationsFactory(null, null, null, null, nationContract);

            nations
                .index()
                .then();
        });

        test('NationCreated event error handling', (done) => {
            const nationContract = {
                NationCreated: (filter, blockFilter) => {
                    expect(filter).toEqual({});

                    expect(blockFilter).toEqual({
                        fromBlock: 0,
                        toBlock: 'latest',
                    });

                    return {
                        get: (cb) => {
                            cb('i_am_an_error');
                        },
                    };
                },
            };

            const nations = nationsFactory(null, null, null, null, nationContract);

            nations
                .index()
                .then((_) => done.fail('should be rejected'))
                .catch((error) => {
                    expect(error).toBe('i_am_an_error');
                    done();
                });
        });
    });
    describe('saveDraft', () => {
        test('success', (done) => {
            const db = dbFactory(randomPath());

            const nations = nationsFactory(db, null, null, null, null);

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

            db
                .query((realm) => realm.objects('Nation').length)
                .then((nationsLength) => {
                    expect(nationsLength).toBe(0);
                    return nations.saveDraft(nationData);
                })
                .then((response) => {
                    expect(response.transKey).toBe('nation.draft.saved_successfully');

                    Object.keys(nationData).map((key) => expect(response.nation[key]).toBe(nationData[key]));

                    done();
                })

                .catch(done.fail);
        });

        test('fail', (done) => {
            const db = dbFactory(randomPath());

            const nations = nationsFactory(db, null, null, null, null);

            const nationData = {};

            db
                .query((realm) => realm.objects('Nation').length)
                .then((nationsLength) => {
                    expect(nationsLength).toBe(0);

                    return nations.saveDraft(nationData);
                })
                .then((response) => {
                    done.fail('The promise should be rejected since it this is a failure test');
                })

                .catch((response) => {
                    expect(response.nation).toBe(nationData);
                    expect(response.transKey).toBe('nation.draft.saved_failed');

                    done();
                });
        });
    });
    describe('updateDraft', () => {
        test('no nation found', (done) => {
            const db = dbFactory(randomPath());

            const nations = nationsFactory(db, null, null, null, null);

            nations
                .updateDraft(1, {})
                .catch((e) => {
                    expect(e).toBe('system_error.nation.does_not_exist');

                    done();
                });
        });

        test('updated successfully', (done) => {
            const db = dbFactory(randomPath());

            const nationService = nationsFactory(db, null, null, null, null);

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

            nationService
                // Persist nations
                .saveDraft(nationData)
                // Get all nations
                .then((_) => db.query((realm) => realm.objects('Nation')))
                .then((nations) => {
                    // Assert that nation exist with passed in data
                    // parse / stringify is done since the result is of class realm obj - I need a plain obj
                    expect(JSON.parse(JSON.stringify(nations[0]))).toEqual({
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
                        created: false,
                        citizens: 0,
                        id: 1,
                        idInSmartContract: -1,
                        joined: false,
                        tx: null,
                        resetStateMutateAllowed: false,
                        stateMutateAllowed: true,
                    });

                    nationData.nationName = 'updated nation name';

                    // Updated nation data again
                    return nationService.updateDraft(1, nationData);
                })
                // Assert updated transaction key
                .then((response) => {
                    expect(response.transKey).toBe('nation.draft.updated_successfully');

                    // Fetch all the nation's
                    return db.query((realm) => realm.objects('Nation'));
                })
                .then((nations) => {
                    // Since we only perform an update - the amount of nation's should be 1
                    expect(nations.length).toBe(1);
                    expect(nations[0].nationName).toEqual('updated nation name');
                    done();
                })
                .catch(done.fail);
        });
        test('nation update (db error)', (done) => {
            const db = dbFactory(randomPath());

            const nations = nationsFactory(db, null, null, null, null);

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

            nations
                // Create nation
                .saveDraft(nationData)
                .then((_) => nations.updateDraft(1, {
                    // Update nationName with wrong value type - which result's in rejection
                    nationName: 3,
                }))
                .catch((e) => {
                    expect(e).toBe('system_error.db_write_failed');

                    done();
                });
        });
    });
    describe('submitDraft', () => {
        test('success', (done) => {
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

            const db = dbFactory(randomPath());

            // Mock the smart contract method
            const nationContractMock = {
                createNation: jest.fn(function(data, cb) {
                    expect(JSON.parse(data)).toEqual(nationData);

                    cb(null, '0xbe26a83c5248034f6c37eefb175c88e2815f5920354e37798a657387fa3b4736');
                }),
            };

            const nationService = nationsFactory(db, new TxQueue(db), null, null, nationContractMock);

            nationService
                .saveDraft(nationData)
                .then((response: {transKey: string, nation:NationType}) => nationService.submitDraft(response.nation.id))
                .then((result) => {
                    expect(result.transKey).toBe('nation.submit_success');
                    expect(result.nation.tx.txHash).toBe('0xbe26a83c5248034f6c37eefb175c88e2815f5920354e37798a657387fa3b4736');
                    expect(result.nation.tx.status).toBe(200);
                    expect(result.nation.tx.type).toBe(TX_JOB_TYPE_NATION_CREATE);

                    expect(nationContractMock.createNation).toHaveBeenCalledTimes(1);

                    done();
                })
                .catch(done.fail);
        });
    });
    test('error on try to submit if stateMutateAllowed is false', (done) => {
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
            stateMutateAllowed: false,
            id: 1,
            created: false,
        };

        const db = dbFactory(randomPath());

        const nationService = nationsFactory(db, new TxQueue(db));

        db
            .write((realm) => realm.create('Nation', nationData))
            .then((_) => nationService.submitDraft(1))
            .then((_) => {
                done.fail('I expect saveDraft to reject since stateMutateAllowed = false');
            })
            .catch((e) => {
                expect(e).toEqual({
                    transKey: 'nation.state_mutate_not_possible',
                });
                done();
            });
    });
    describe('saveAndSubmit', () => {
        test('success', (done) => {
            const db = dbFactory(randomPath());

            const nationContractMock = {
                createNation: jest.fn((data, cb) => {
                    cb(null, '0xbe26a83c5248034f6c37eefb175c88e2815f5920354e37798a657387fa3b4736');
                }),
            };

            const nations = nationsFactory(db, new TxQueue(db, new EventEmitter()), null, null, nationContractMock);

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

            nations
                .saveAndSubmit(nationData)
                // The result should be the one returned form
                .then((response: {transKey: string, nation:NationType}) => {
                    expect(nationContractMock.createNation).toHaveBeenCalledTimes(1);
                    expect(response.transKey).toBe('nation.submit_success');

                    const n = response.nation;
                    expect(n.nationName).toBe('Bitnation');
                    expect(n.nationDescription).toBe('We <3 cryptography');
                    expect(n.exists).toBe(true);
                    expect(n.virtualNation).toBe(false);
                    expect(n.nationCode).toBe('Code civil');
                    expect(n.lawEnforcementMechanism).toBe('xyz');
                    expect(n.profit).toBe(true);
                    expect(n.nonCitizenUse).toBe(false);
                    expect(n.diplomaticRecognition).toBe(false);
                    expect(n.decisionMakingProcess).toBe('dictatorship');
                    expect(n.governanceService).toBe('Security');
                    expect(n.created).toBe(false);
                    expect(n.citizens).toBe(0);
                    expect(n.id).toBe(1);
                    expect(n.idInSmartContract).toBe(-1);
                    expect(n.joined).toBe(false);

                    expect(n.tx.txHash).toBe('0xbe26a83c5248034f6c37eefb175c88e2815f5920354e37798a657387fa3b4736');
                    expect(n.tx.type).toBe('NATION_CREATE');
                    expect(n.tx.status).toBe(200);

                    done();
                })
                .catch(console.log);
        });
    });
    describe('deleteDraft', () => {
        test('success', (done) => {
            const db = dbFactory(randomPath());

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

            const nationsService = nationsFactory(db, null, null, null, null);

            nationsService
                .saveDraft(nationData)
                .then((response:{transKey: string, nation: NationType}) => nationsService.deleteDraft(response.nation.id))
                .then((response:{transKey: string}) => {
                    expect(response.transKey).toBe('nation.draft.deleted');
                    return db.query((realm) => realm.objects('Nation'));
                })
                .then((nations) => {
                    expect(nations.length).toBe(0);
                    done();
                });
        });
    });
});
