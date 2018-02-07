import dbFactory from '../database/db';
import messagingQueueFactory, {Msg} from './messaging';
import {MESSAGING_QUEUE_JOB_ADDED} from '../events';
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

            queue
                .addJob('Nation', 'Your nation ABC was created successfully')
                .then((_) => {
                    // Query the database for the job

                    db
                        .query(function(realm) {
                            return realm.objects('MessageJob');
                        })
                        .then((result) => {
                            expect(result.length).toBe(1);

                            expect(result[0].id).toBe(1);
                            expect(result[0].heading).toBe('Nation');
                            expect(result[0].text).toBe('Your nation ABC was created successfully');
                            expect(result[0].version).toBe(1);

                            done();
                        })
                        .catch(done.fail);
                })
                .catch(done.fail);
        });
    });

    test('removeJob', (done) => {
        const db = dbFactory(createDbPath());

        const queue = messagingQueueFactory(new EventEmitter(), db);

        db
            .write(function(realm) {
                realm.create('MessageJob', {
                    id: 1,
                    heading: 'Dummy',
                    text: 'Dummy',
                    version: 1,
                    created_at: new Date(),
                });
            })
            .then((_) => {
                db
                    .query((realm) => realm.objects('MessageJob'))
                    .then((jobs) => {
                        expect(jobs.length).toBe(1);
                        expect(jobs[0].id).toBe(1);

                        return queue.removeJob(1);
                    })
                    .then((result) => {
                        expect(result).toBeUndefined();

                        db
                            .query((realm) => realm.objects('MessageJob'))
                            .then((jobs) => {
                                expect(jobs.length).toBe(0);
                                done();
                            });
                    }).catch(done.fail);
            })
            .catch(done.fail);
    });

    test('messages', (done) => {
        const db = dbFactory(createDbPath());

        const queue = messagingQueueFactory(new EventEmitter(), db);

        db
            .write(function(realm) {
                realm.create('MessageJob', {
                    id: 1,
                    heading: 'Dummy',
                    text: 'Dummy',
                    version: 1,
                    created_at: new Date(),
                });

                realm.create('MessageJob', {
                    id: 2,
                    heading: 'Dummy2',
                    text: 'Dummy2',
                    version: 1,
                    created_at: new Date(),
                });
            })
            .then((_) => queue.messages())
            .then((jobs) => {
                expect(jobs.length).toBe(2);

                done();
            })
            .catch(done.fail);
    });
});
