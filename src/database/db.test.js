/* eslint-disable */

import database from './db';
const execSync = require('child_process').execSync;

const dbPath = () => 'database/'+Math.random();

describe('write', () => {
    'use strict';

    /**
     * A database write should be void and will always result in a void promise
     */
    test('successfully', () => {

        const db = database(dbPath());

        function writeAction(realm) {
            expect(realm).toBeDefined();

            return 'I wrote the profile';
        }

        return expect(db.write(writeAction))
            .resolves
            .toBe('I wrote the profile');
    });

    test('error', () => {

        class CustomError extends Error {}

        const db = database(dbPath());

        function writeAction(realm) {
            expect(realm).toBeDefined();

            throw new CustomError();
        }

        return expect(db.write(writeAction))
            .rejects
            .toEqual(new CustomError);
    });
});

describe('query', () => {
    'use strict';

    test('successfully', () => {

        const db = database(dbPath());

        function searchPets(realm) {
            expect(realm).toBeDefined();

            return [
                'dog',
                'cat',
            ];
        }

        return expect(db.query(searchPets))
            .resolves
            .toEqual(['dog', 'cat']);
    });

    test('error', () => {

        const db = database(dbPath());

        class CustomError extends Error {}

        function searchPets(realm) {
            expect(realm).toBeDefined();


            throw new CustomError();
        }

        return expect(db.query(searchPets))
            .rejects
            .toEqual(new CustomError());
    });
});


describe('migrate', () => {
    'use strict';

    test('migrationtest', async () => {

        var path = dbPath();

        function close(db) {
            db.close();
        }

        //Pass 1
        var db = database(path);
        await db
          .write(r => "foo")
          .then(() => db.close());
        
        //Pass 2
        db = database(path)
        await db
          .write((r) => "bar")
          .then(res => "");

    });
});
