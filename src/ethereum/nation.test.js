import nationsFactory from './nation';
import dbFactory from '../database/db';
import {NATION_CREATE} from '../events';
import type {NationType} from '../database/schemata';
const EventEmitter = require('eventemitter3');
const Web3 = require('web3');

const randomPath = () => 'database/'+Math.random();

describe('nation', () => {
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
                    cb();
                }),
            };

            const web3 = new Web3(new Web3.providers.HttpProvider('https://rinkeby.infura.io/d'));
            web3.eth.defaultAccount = '0x85c725a18b09907e874229fcaf36f4e16792214d';

            const nations = nationsFactory(null, null, null, null, nationContractMock);

            nations
                .joinNation(4)
                .then((_) => {
                    expect(_).toBeUndefined();
                    done();
                })
                .catch(done.fail);
        });

        test('fail', (done) => {
            const nationContractMock = {
                joinNation: jest.fn(function(nationId, cb) {
                    expect(nationId).toEqual(4);
                    cb('i_am_a_error');
                    done();
                }),
            };

            const web3 = new Web3(new Web3.providers.HttpProvider('https://rinkeby.infura.io/d'));
            web3.eth.defaultAccount = '0x85c725a18b09907e874229fcaf36f4e16792214d';

            const nations = nationsFactory(null, null, null, null, nationContractMock);

            nations
                .joinNation(4)
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
                    cb();
                }),
            };

            const web3 = new Web3(new Web3.providers.HttpProvider('https://rinkeby.infura.io/d'));
            web3.eth.defaultAccount = '0x85c725a18b09907e874229fcaf36f4e16792214d';

            const nations = nationsFactory(null, null, null, null, nationContractMock);

            nations
                .leaveNation(4)
                .then((_) => {
                    expect(_).toBeUndefined();
                    done();
                })
                .catch(done.fail);
        });

        test('fail', (done) => {
            const nationContractMock = {
                leaveNation: jest.fn(function(nationId, cb) {
                    expect(nationId).toEqual(4);
                    cb('i_am_a_error');
                    done();
                }),
            };

            const web3 = new Web3(new Web3.providers.HttpProvider('https://rinkeby.infura.io/d'));
            web3.eth.defaultAccount = '0x85c725a18b09907e874229fcaf36f4e16792214d';

            const nations = nationsFactory(null, null, null, null, nationContractMock);

            nations
                .leaveNation(4)
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
                        txHash: null,
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
                createNation: jest.fn(function(data) {
                    expect(JSON.parse(data)).toBe(nationData);
                }),
            };

            const nationService = nationsFactory(db, null, null, null, nationContractMock);


            nationService
                .saveDraft(nationData)
                .then((nation:NationType) => nationService.submitDraft(nation.id))
                .then((result) => {
                    expect(result.transKey).toBe('bla');
                    expect(nationContractMock).toHaveBeenCalledTimes(1);

                    done();
                })
                .catch(done.fail);
        });
    });
});
