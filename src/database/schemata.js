// @flow

// /////////////////////////////////////////////////////////
// ATTENTION !!! Everyime you update the schema,         //
//               update the relating interfaces as well. //
// /////////////////////////////////////////////////////////

// A note on e.g. ProfileType (and all types exported from this file).
// In the project you will often see smth like this:

// (this is an example from the queries)
// findProfiles(realm) : Array<ProfileObject>

// The value returned by realm is NOT directly a instance of an object that implement this interface,
// BUT the signature is exactly the same.

// It's ok to do this, since after the compilation from flow -> js all interfaces
// and types are striped and they are all objects. So this interface is here to
// support the developers.

/**
 * @typedef ProfileType
 * @property {number} id
 * @property {string} pseudo
 * @property {string} description
 * @property {string} image
 * @property {string} version
 */
export type ProfileType = {
    id: number,
    name: string,
    location: string,
    latitude: string,
    longitude: string,
    description: string,
    image: string,
    version: string
}

export const ProfileSchema = {
    name: 'Profile',
    primaryKey: 'id',
    properties: {
        id: 'int',
        name: 'string',
        location: 'string',
        latitude: 'string',
        longitude: 'string',
        description: 'string',
        image: 'string',
        version: 'string',
    },
};

/**
 * @typedef AccountBalanceType
 * @property {string} id
 * @property {string} address
 * @property {string} amount
 * @property {number} synced_at
 * @property {string} currency
 */
export type AccountBalanceType = {
    id: string,
    address: string,
    // Amount is in wei
    amount: string,
    synced_at: number,
    currency: string
}

export const AccountBalanceSchema = {
    name: 'AccountBalance',
    primaryKey: 'id',
    properties: {
        id: 'string',
        address: 'string',
        amount: 'string',
        synced_at: 'date',
        currency: 'string',
    },
};

/**
 * @typedef MessageJobType
 * @property {number} id
 * @property {string} heading
 * @property {string} text
 * @property {number} version
 * @property {date} created_at
 */
export type MessageJobType = {
    id: number,
    heading: string,
    params: string,
    version: number,
    display: boolean,
    interpret: boolean,
    created_at: Date
}

export const MessageJobSchema = {
    name: 'MessageJob',
    primaryKey: 'id',
    properties: {
        id: 'int',
        heading: {
            type: 'string',
            optional: true,
        },
        interpret: 'bool',
        params: 'string',
        display: 'bool',
        msg: 'string',
        version: 'int',
        created_at: 'date',
    },
};

/**
 * @typedef TransactionJobType
 * @property {number} id
 * @property {string} txHash
 * @property {number} status
 * @property {string} type Can be something like NATION_JOIN, NATION_LEAVE, NATION_CREATE etc. Used to know what this transaction is about.
 */
export type TransactionJobType = {
    txHash: string,
    status: number,
    type: string
}

export const TransactionJobSchema = {
    name: 'TransactionJob',
    properties: {
        txHash: 'string',
        status: 'int',
        type: 'string',
    },
};

/**
 * @typedef NationType
 * @property {number} id
 * @property {number} idInSmartContract
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
 * @property {number} citizens
 * @property {boolean} joined
 * @property {TransactionJobType | null} tx
 */
export type NationType = {
    id: number,
    idInSmartContract: number,
    created: boolean,
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
    governanceService: string,
    citizens: number,
    joined: boolean,
    tx: TransactionJobType | null
}

export const NationSchema = {
    name: 'Nation',
    primaryKey: 'id',
    properties: {
        id: 'int',
        idInSmartContract: {
            default: -1,
            type: 'int',
        },
        tx: {
            type: 'TransactionJob',
            optional: true,
        },
        created: 'bool',
        nationName: 'string',
        nationDescription: 'string',
        exists: 'bool',
        virtualNation: 'bool',
        nationCode: 'string',
        lawEnforcementMechanism: 'string',
        profit: 'bool',
        nonCitizenUse: 'bool',
        diplomaticRecognition: 'bool',
        decisionMakingProcess: 'string',
        governanceService: 'string',
        citizens: {
            type: 'int',
            default: 0,
        },
        joined: {
            type: 'bool',
            default: false,
        },
    },
};
