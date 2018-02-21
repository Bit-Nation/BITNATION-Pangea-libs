// @flow

let common = require('./common');
import {SampleDBInterface} from './common';
import {DBInterface} from '../database/db';
import type {
    AccountBalanceType,
    MessageJobType,
    NationType,
    ProfileType,
    TransactionJobType
} from '../database/schema/v0';

export const SampleDB : SampleDBInterface = {
    GetSchemaVersion: () => 0,
    Create: async (db : DBInterface) => {
        db.write(realm => {
            let tx : TransactionJobType = { 
                data: "",
                failBody: "",
                failHeading: "",
                id: 1,
                processor: "",
                status: "DONE",
                successBody: "",
                successHeading: "",
                timeout: 1,
                version: 1
            };

            let nation : NationType =  {
                id: 1,
                idInSmartContract: 1,
                created: true,
                nationName: 'foo',
                nationDescription: 'foo',
                exists: false,
                virtualNation: false,
                nationCode: 'foo',
                lawEnforcementMechanism: 'foo',
                profit: true,
                nonCitizenUse: true,
                diplomaticRecognition: true,
                decisionMakingProcess: 'foo',
                governanceService: 'foo',
                citizens: 1,
                joined: true,
                txHash: 'foo'
            };
            realm.create("Nation", nation);
            
            let ab : AccountBalanceType = {
                address: "0",
                amount: "0",
                currency: "BTC",
                id: "0",
                synced_at: new Date()
            };
            realm.create("AccountBalance", ab);
            
            let msg : MessageJobType = {
                created_at: new Date(2018,1,1),
                heading: "",
                id: 0,
                text: "foo",
                version: 0
            };
            realm.create("MessageJob", msg);
        });
    }
}