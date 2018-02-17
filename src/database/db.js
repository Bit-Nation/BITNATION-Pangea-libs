// @flow
const Realm = require('realm');
const schemata = require('./schemata');
const migrations = require('./migrations');

/**
 * @typedef {Object} DBInterface
 * @property {function} query query the realm database.
 * @property {function} write executes an write on the database
 */
export interface DBInterface {

    /**
     * Expect an query callback that will receive an instance of realm.
     * Should return the realm query result
     */
    query(queryAction: (realm: Realm) => Realm.Results) : Promise<Realm.Results>;

    /**
     * Expect an callback that that will receive an instance of realm.
     * The callback should return nothing.
     */
    write(writeAction: (realm: Realm) => void) : Promise<any>;

    close() : Promise<any>;

    getRealm() : any;
}

var schemav = 0;
/**
 * @module database/db.js
 * @param {string} path
 * @return {DBInterface}
 */
export default function dbFactory(path: string): DBInterface {
    const realm = Realm
        .open({
            path: path,
            schema: [
                schemata.ProfileSchema,
                schemata.AccountBalanceSchema,
                schemata.MessageJobSchema,
                schemata.TransactionJobSchema,
                schemata.NationSchema,
            ],
            schemaVersion: schemav++,// migrations.schemaVersion,
            migration: migrations.default
        });

    const dbImplementation : DBInterface = {

        query: (queryAction: (realm) => any): Promise<*> => new Promise((res, rej) => {
            realm
                .then((r) => res(queryAction(r)))
                .catch(rej);
        }),

        write: (writeAction: (realm: any) => void): Promise<*> => new Promise((res, rej) => {
            'use strict';

            realm
                .then((r) => r.write((_) => res(writeAction(r))))
                .catch(rej);
        }),

        close: (): Promise<*> => new Promise((res, rej) =>  {
            realm
                .then((r) => res(r.close()))
                .catch(rej);
        }),
        
        getRealm: () => { realm }
    };

    return dbImplementation;
}
