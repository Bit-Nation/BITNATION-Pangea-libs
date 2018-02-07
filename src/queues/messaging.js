// @flow

import type {MessageJobType} from '../database/schemata';
import type {DBInterface} from '../database/db';
const EventEmitter = require('eventemitter3');
import {MESSAGING_QUEUE_JOB_ADDED} from './../events';

/**
 * @desc Message object for the messaging queue
 */
export class Msg {
    _msg: string;
    _params: {...mixed};
    _interpret: boolean;
    _heading: string | null;
    _display: boolean;

    /**
     * @param {string} msg
     * @param {string} params
     * @param {string} interpret
     */
    constructor(msg: string, params: {...mixed}, interpret: boolean) {
        this._msg = msg;
        this._params = params || {};
        this._interpret = true;
        if (interpret === false) {
            this._interpret = false;
        }
    }

    /**
     * @param {string} heading
     */
    display(heading: string): void {
        this._heading = heading;
        this._display = true;
    }

    /**
     *
     * @return {{msg: string|*, params: Array<mixed>|Array|*, interpret: boolean|*, display: boolean, heading: string|*|string}}
     */
    toObj(): {...mixed} {
        return {
            msg: this._msg,
            params: JSON.stringify(this._params),
            interpret: this._interpret,
            display: this._display || false,
            heading: this._heading || null,
        };
    }
}

/**
 * @typedef MessagingQueueInterface
 * @property {function(heading:string, text:string)} addJob Add's an job to the messaging queue
 * @property {function(id:number)} removeJob removes an job by it's id
 * @property {function()} messages fetch all message job's
 */
export interface MessagingQueueInterface {
    addJob(msg: Msg) : Promise<MessageJobType>,
    fetchMessages(count: number) : Promise<Array<MessageJobType>>
}

/**
 * @desc Factory for the messagingJob queue
 * @param {EventEmitter} eventEmitter
 * @param {DBInterface} db
 * @return {MessagingQueueInterface}
 */
export default function(eventEmitter: EventEmitter, db: DBInterface): MessagingQueueInterface {
    const impl:MessagingQueueInterface = {
        addJob: (msg: Msg): Promise<MessageJobType> => new Promise((res, rej) => {
            // Writes job to database
            const writeAction = (realm) => {
                const dataSet = msg.toObj();
                dataSet.id = realm.objects('MessageJob').length + 1;
                dataSet.created_at = new Date();
                dataSet.version = 1;

                return realm.create('MessageJob', dataSet);
            };

            db
                // Write to db
                .write(writeAction)
                .then((messageJob: MessageJobType) => {
                    eventEmitter.emit(MESSAGING_QUEUE_JOB_ADDED, messageJob);
                    res(messageJob);
                })
                .catch(rej);
        }),
        fetchMessages: (count: number): Promise<Array<MessageJobType>> => new Promise((res, rej) => {
            db
                .query((realm) => {
                    const messageJobs = realm.objects('MessageJob').length;
                    return realm.objects('MessageJob').filtered(`id > "${messageJobs - count}"`);
                })
                .then((messageJobs) => {
                    // @todo we are transforming realm object's to normal object's -
                    // this is not that cool - we should have a method like toObject
                    res(Object.keys(messageJobs).map((key) => JSON.parse(JSON.stringify(messageJobs[key]))));
                })
                .catch(rej);
        }),
    };

    return impl;
}
