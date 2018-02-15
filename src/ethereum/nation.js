// @flow

import type {NationType, TransactionJobType} from '../database/schemata';
import type {DBInterface} from '../database/db';
import type {TransactionQueueInterface} from '../queues/transaction';
import {
    TX_JOB_TYPE_NATION_CREATE,
    TX_JOB_TYPE_NATION_JOIN,
    TX_JOB_TYPE_NATION_LEAVE,
} from '../queues/transaction';
import {NATION_STATE_MUTATE_NOT_POSSIBLE} from '../transKeys';
const Web3 = require('web3');
const EventEmitter = require('eventemitter3');
const eachSeries = require('async/eachSeries');
const waterfall = require('async/waterfall');

/**
 * @typedef NationType
 * @property {boolean} created Created mean's if it is on the blockchain
 * @property {string} nationName
 * @property {string} nationDescription
 * @property {boolean} exists
 * @property {boolean} virtualNation
 * @property {string} nationCode
 * @property {string} lawEnforcementMechanism
 * @property {boolean} profit
 * @property {boolean} nonCitizenUse
 * @property {boolean} diplomaticRecognition
 * @property {string} decisionMakingProcess
 * @property {string} governanceService
 */
export type NationInputType = {
    nationName: string,
    nationDescription: string,
    exists: boolean,
    virtualNation: boolean,
    nationCode: string,
    lawEnforcementMechanism: string,
    profit: boolean,
    nonCitizenUse: boolean,
    diplomaticRecognition: boolean,
    decisionMakingProcess: string,
    governanceService: string
}

/**
 * @typedef NationInterface
 * @property {function(nationData:NationInputType)} create
 * @property {function()} all fetch all nations
 */
export interface NationInterface {
    all() : Promise<NationType>,
    index() : Promise<void>,
    joinNation(id: NationType) : Promise<void>,
    leaveNation(nation: NationType) : Promise<void>,
    saveDraft(nation: NationInputType) : Promise<{transKey: string, nation: NationType}>,
    updateDraft(nationId: number, nation: NationInputType) : Promise<{transKey: string, nation: NationType}>,
    submitDraft(nationId: number) : Promise<{transKey: string, nation: NationType}>,
    saveAndSubmit(nation: NationInputType) : Promise<{transKey: string, nation: NationType}>,
    deleteDraft(nationId: number) : Promise<{transKey: string}>
}

/**
 *
 * @param {DBInterface} db
 * @param {TransactionQueueInterface} txQueue
 * @param {Web3} web3
 * @param {EventEmitter} ee
 * @param {object} nationContract
 * @return {NationInterface}
 */
export default function(db: DBInterface, txQueue: TransactionQueueInterface, web3: Web3, ee: EventEmitter, nationContract: {...any}) {
    const impl:NationInterface = {
        updateDraft: (nationId: number, nation: NationInputType): Promise<{transKey: string, nation: NationType}> => new Promise((res, rej) => {
            db
                .query((realm) => realm.objects('Nation').filtered(`id = "${nationId}"`))
                .then((nations: Array<NationType>) => {
                    if (nations.length <= 0) {
                        return rej('system_error.nation.does_not_exist');
                    }

                    // it in smart contract is only >= 0 when the nation was written to the blockchain
                    // @todo we really really need to check for if the nation was already submitted. But we need to have the tx queue thing.
                    if (nations[0].idInSmartContract >= 0) {
                        return rej('system_error.nation.already_submitted');
                    }

                    db
                        .write((realm) => {
                            return realm.create('Nation', {
                                id: nationId,
                                created: false,
                                nationName: nation.nationName,
                                nationDescription: nation.nationDescription,
                                exists: nation.exists,
                                virtualNation: nation.virtualNation,
                                nationCode: nation.nationCode,
                                lawEnforcementMechanism: nation.lawEnforcementMechanism,
                                profit: nation.profit,
                                nonCitizenUse: nation.nonCitizenUse,
                                diplomaticRecognition: nation.diplomaticRecognition,
                                decisionMakingProcess: nation.decisionMakingProcess,
                                governanceService: nation.governanceService,
                            }, true);
                        })
                        .then((nation: NationType) => res({
                            transKey: 'nation.draft.updated_successfully',
                            nation: nation,
                        }))
                        .catch((error) => {
                            // @todo log error
                            rej('system_error.db_write_failed');
                        });
                });
        }),
        saveDraft: (nationData: NationInputType): Promise<{transKey: string, nation: NationType}> => new Promise((res, rej) => {
            db
                .write((realm) => {
                    return realm.create('Nation', {
                        id: realm.objects('Nation').length +1,
                        created: false,
                        nationName: nationData.nationName,
                        nationDescription: nationData.nationDescription,
                        exists: nationData.exists,
                        virtualNation: nationData.virtualNation,
                        nationCode: nationData.nationCode,
                        lawEnforcementMechanism: nationData.lawEnforcementMechanism,
                        profit: nationData.profit,
                        nonCitizenUse: nationData.nonCitizenUse,
                        diplomaticRecognition: nationData.diplomaticRecognition,
                        decisionMakingProcess: nationData.decisionMakingProcess,
                        governanceService: nationData.governanceService,
                    });
                })
                .then((nation: NationType) => {
                    res({
                        transKey: 'nation.draft.saved_successfully',
                        nation: nation,
                    });
                })
                .catch((_) => rej({
                    transKey: 'nation.draft.saved_failed',
                    nation: nationData,
                }));
        }),
        all: () => db.query((realm) => realm.objects('Nation')),
        index: () => new Promise((res, rej) => {
            const nationCreatedEvent = nationContract.NationCreated({}, {fromBlock: 0, toBlock: 'latest'}); // eslint-disable-line

            nationCreatedEvent.get(function(err, logs) {
                if (err) {
                    return rej(err);
                }

                const joinedNations = [];

                waterfall(
                    [
                        (cb) => {
                            nationContract.getJoinedNations(function(err, res) {
                                if (err) {
                                    return cb(err);
                                }

                                res.map((nationBigNumber) => joinedNations.push(nationBigNumber.toNumber()));

                                cb();
                            });
                        },
                        (cb) => {
                            eachSeries(logs, function(log, cb) {
                                const nationId = log.args.nationId.toNumber();

                                nationContract.getNumCitizens(nationId, function(err, citizens) {
                                    if (err) {
                                        return cb(err);
                                    }

                                    citizens = citizens.toNumber();

                                    db
                                    // We query for txHash since we get the tx hash when submitting the nation to the blockchain
                                        .query((realm) => realm.objects('Nation').filtered(`txHash = "${log.transactionHash}"`))
                                        .then((nations) => {
                                            const nation = nations[0];

                                            if (nation) {
                                                return db.write((realm) => {
                                                    nation.idInSmartContract = nationId;
                                                    nation.created = true;
                                                    nation.joined = joinedNations.includes(nationId);
                                                    nation.citizens = citizens;
                                                });
                                            }

                                            return new Promise((res, rej) => {
                                                nationContract.getNationMetaData(nationId, function(err, result) {
                                                    if (err) {
                                                        return rej(err);
                                                    }

                                                    try {
                                                        result = JSON.parse(result);
                                                    } catch (e) {
                                                        return rej(e);
                                                    }

                                                    db
                                                        .write((realm) => {
                                                            const nationCount = realm.objects('Nation').length;

                                                            realm.create('Nation', {
                                                                id: nationCount+1,
                                                                idInSmartContract: nationId,
                                                                txHash: log.transactionHash,
                                                                nationName: result.nationName,
                                                                nationDescription: result.nationDescription,
                                                                created: true,
                                                                exists: result.exists,
                                                                virtualNation: result.virtualNation,
                                                                nationCode: result.nationCode,
                                                                lawEnforcementMechanism: result.lawEnforcementMechanism,
                                                                profit: result.profit,
                                                                nonCitizenUse: result.nonCitizenUse,
                                                                diplomaticRecognition: result.diplomaticRecognition,
                                                                decisionMakingProcess: result.decisionMakingProcess,
                                                                governanceService: result.governanceService,
                                                                joined: joinedNations.includes(nationId),
                                                                citizens: citizens,
                                                            });
                                                        })
                                                        .then((_) => res())
                                                        .catch(rej);
                                                });
                                            });
                                        })
                                        .then((_) => setTimeout(cb, 200))
                                        .catch(cb);
                                });
                            }, function(err) {
                                if (err) {
                                    return rej(err);
                                }

                                cb();
                            });
                        },
                    ],
                    function(err) {
                        if (err) {
                            return rej(err);
                        }

                        res();
                    }
                );
            });
        }),
        /**
         * @param {NationType} nation The nation you would like to join
         * @return {Promise<void>}
         */
        joinNation: (nation: NationType): Promise<void> => new Promise((res, rej) => {
            if (!nation.stateMutateAllowed) {
                return rej({
                    transKey: NATION_STATE_MUTATE_NOT_POSSIBLE,
                });
            }

            nationContract.joinNation(nation.idInSmartContract, function(err, txHash) {
                if (err) {
                    return rej(err);
                }

                txQueue
                    .jobFactory(txHash, TX_JOB_TYPE_NATION_JOIN)
                    .then((job: TransactionJobType) => db.write((_) => {
                        nation.tx = job;
                        nation.stateMutateAllowed = false;
                        return job;
                    }))
                    .then((job: TransactionJobType) => txQueue.saveJob(job))
                    .then((_) => res())
                    .catch(rej);
            });
        }),
        leaveNation: (nation: NationType): Promise<void> => new Promise((res, rej) => {
            if (!nation.stateMutateAllowed) {
                return rej({
                    transKey: NATION_STATE_MUTATE_NOT_POSSIBLE,
                });
            }

            nationContract.leaveNation(nation.idInSmartContract, function(err, txHash) {
                if (err) {
                    return rej(err);
                }

                txQueue
                    .jobFactory(txHash, TX_JOB_TYPE_NATION_LEAVE)
                    .then((job: TransactionJobType) => db.write((_) => {
                        nation.tx = job;
                        nation.stateMutateAllowed = false;
                        return job;
                    }))
                    .then((job: TransactionJobType) => txQueue.saveJob(job))
                    .then((_) => res())
                    .catch(rej);
            });
        }),
        submitDraft: (nationId: number): Promise<{transKey: string, nation: NationType}> => new Promise((res, rej) => {
            db
                .query((realm) => realm.objects('Nation').filtered(`id = "${nationId}"`))
                .then((nations) => {
                    if (nations.length <= 0) {
                        return rej('system_error.nation.does_not_exist');
                    }

                    if (!nations[0].stateMutateAllowed) {
                        return rej({
                            transKey: NATION_STATE_MUTATE_NOT_POSSIBLE,
                        });
                    }

                    // it in smart contract is only >= 0 when the nation was written to the blockchain
                    // @todo we really really need to check for if the nation was already submitted. But we need to have the tx queue thing.
                    if (nations[0].idInSmartContract >= 0) {
                        return rej('system_error.nation.already_submitted');
                    }

                    const nation = nations[0];

                    const nationData:NationInputType = {
                        nationName: nation.nationName,
                        nationDescription: nation.nationDescription,
                        exists: nation.exists,
                        virtualNation: nation.virtualNation,
                        nationCode: nation.nationCode,
                        lawEnforcementMechanism: nation.lawEnforcementMechanism,
                        profit: nation.profit,
                        nonCitizenUse: nation.nonCitizenUse,
                        diplomaticRecognition: nation.diplomaticRecognition,
                        decisionMakingProcess: nation.decisionMakingProcess,
                        governanceService: nation.governanceService,
                    };

                    nationContract.createNation(
                        JSON.stringify(nationData),
                        function(err, txHash) {
                            if (err) {
                                // @todo log error
                                return rej({
                                    transKey: err,
                                });
                            }

                            // Attach transaction to nation
                            txQueue
                                .jobFactory(txHash, TX_JOB_TYPE_NATION_CREATE)
                                .then((txJob: TransactionJobType) => db.write((realm) => {
                                    nation.tx = txJob;
                                    nation.stateMutateAllowed = false;
                                }))
                                .then((_) => res({
                                    transKey: 'nation.submit_success',
                                    nation: nation,
                                }))
                                .catch((_) => rej({
                                    transKey: 'system_error.db_write_failed',
                                    nation: nation,
                                }));
                        }
                    );
                })
                .catch(rej);
        }),
        saveAndSubmit: (nationData: NationInputType): Promise<{transKey: string, nation: NationType}> => new Promise((res, rej) => {
            impl
                .saveDraft(nationData)
                .then((response: {transKey: string, nation: NationType}) => impl.submitDraft(response.nation.id))
                .then(res)
                .catch(rej);
        }),
        deleteDraft: (nationId: number): Promise<{transKey: string}> => new Promise((res, rej) => {
            db
                .query((realm) => realm.objects('Nation').filtered(`id = "${nationId}"`))
                .then((nations: Array<NationType>) => {
                    if (nations.length <= 0) {
                        return rej({transKey: 'system_error.nation.does_not_exist'});
                    }
                    const nation:NationType = nations[0];
                    if (nation.idInSmartContract >= 0) {
                        return rej({transKey: 'system_error.nation.already_submitted'});
                    }
                    return db.write((realm) => realm.delete(nation));
                })
                .then((_) => res({transKey: 'nation.draft.deleted'}))
                .catch((_) => res({transKey: 'system_error.db_write_failed'}));
        }),
    };

    return impl;
}
