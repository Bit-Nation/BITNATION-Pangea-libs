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
} from '../database/schema/v1';

export const SampleDB : SampleDBInterface = {
    GetSchemaVersion: () => 1,
    Create: async (db : DBInterface) => {
        //Migration should happen in the migration script. No new items added since v0.
    }
}