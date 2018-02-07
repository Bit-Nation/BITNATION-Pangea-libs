import dbFactory from '../database/db';
import messagingQueueFactory, {Msg} from './messaging';
import {MESSAGING_QUEUE_JOB_ADDED} from '../events';
import type {MessageJobType} from '../database/schemata';
const EventEmitter = require('eventemitter3');

function createDbPath() {
    return 'database/'+Math.random();
}

describe('messaging', () => {
    describe('Msg - class', () => {
        test('default interpreted message', () => {
            const msg = new Msg('hi', ['A', 3]);

            expect(msg.toObj()).toEqual({
                msg: 'hi',
                params: JSON.stringify(['A', 3]),
                interpret: true,
                display: false,
                heading: null,
            });
        });

        test('msg that is not interpreted', () => {
            const msg = new Msg('hi', [], false);

            expect(msg.toObj()).toEqual({
                msg: 'hi',
                params: JSON.stringify([]),
                interpret: false,
                display: false,
                heading: null,
            });
        });

        test(`Set message that need's to be displayed`, () => {
            const msg = new Msg('hi', ['A', 3], false);

            msg.display('I am a heading');

            expect(msg.toObj()).toEqual({
                msg: 'hi',
                params: JSON.stringify(['A', 3]),
                interpret: false,
                display: true,
                heading: 'I am a heading',
            });
        });
    });

    describe('addJob', () => {
        test('emit event', (done) => {
            const db = {
                write: () => new Promise((res, rej) => res()),
            };

            const eventEmitter = new EventEmitter();

            eventEmitter.on(MESSAGING_QUEUE_JOB_ADDED, done);

            const queue = messagingQueueFactory(eventEmitter, db);

            queue
                .addJob('Nation', 'Your nation ABC was created successfully')
                .then()
                .catch(done.fail);
        });

        test('save to database', (done) => {
            const db = dbFactory(createDbPath());

            const queue = messagingQueueFactory(new EventEmitter(), db);

            const msg = new Msg('nation.created_body', {nationName: 'Bitnation'});
            msg.display('nation.created_heading');

            queue
                .addJob(msg)
                .then((msgJob: MessageJobType) => {
                    // Query the database for the job
                    expect(msgJob.id).toBe(1);
                    expect(msgJob.heading).toBe('nation.created_heading');
                    expect(msgJob.msg).toBe('nation.created_body');
                    expect(msgJob.params).toBe(JSON.stringify({nationName: 'Bitnation'}));
                    expect(msgJob.interpret).toBe(true);

                    done();
                })
                .catch(done.fail);
        });
    });
    describe('fetchMessages', () => {
        test('fetch limited amount messages', (done) => {
            const db = dbFactory(createDbPath());

            const queue = messagingQueueFactory(new EventEmitter(), db);

            const msg = new Msg('i am the body');

            queue
                .addJob(msg)
                .then((_) => queue.addJob(msg))
                .then((_) => queue.addJob(msg))
                .then((_) => queue.addJob(msg))
                .then((_) => queue.addJob(msg))
                .then((_) => queue.addJob(msg))
                .then((_) => queue.addJob(msg))
                .then((_) => queue.addJob(msg))
                .then((_) => queue.fetchMessages(2))
                .then((messages) => {
                    expect(messages[0].id).toBe(7);
                    expect(messages[1].id).toBe(8);

                    done();
                });
        });
    });
});
