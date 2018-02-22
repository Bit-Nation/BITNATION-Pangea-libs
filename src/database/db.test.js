/* eslint-disable */

const sampledbs = require('../sampledb/sampledb');
const schemata = require('./schemata');
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
    
    test('migrationtest', async () => {

        const path = dbPath();

        function close(db) {
            db.close();
        }

        //Pass 1
        let db = database(path);
        await db
          .write(r => "foo")
          .then(() => close(db));
        
        //Pass 2
        db = database(path);
        await db
          .write((r) => "bar")
          .then(res => "");

    });

    test('Max schema version in schemata.js should be consistent with schema file count.', () => {
        let fs = require('fs');
        
        const expectedCount = schemata.LatestSchemaVersion + 1;

        let schemaFiles = fs.readdirSync("./src/database/schema/").filter(name => name.endsWith('.js'));

        return expect(expectedCount).toEqual(schemaFiles.length);
    });

    test('Schema files must have migration function', () => {
        schemata.Schemas.forEach(schema => expect(typeof schema.migration).toBe('function'));
    });

    test('Schemas exist', () => {
        expect(Array.isArray(schemata.Schemas)).toBe(true);
        expect(schemata.Schemas.length).toEqual(schemata.LatestSchemaVersion + 1);
    });

    test('Schema files must have schemata', () => { 
        // Since schema files themselves can't be imported dynamically, 
        // We are testing that 'schema' exists within the schemata.Schemas elements
        // rather than testing the files directly
        let s = schemata.Schemas;
        schemata.Schemas.forEach(schema => { 
            expect(Array.isArray(schema.schema)).toBe(true);
            expect(schema.schema.length).toBeGreaterThan(0);
        });
    });

    test('With sampledb', async () => {
        await sampledbs.BuildSampleDBs();
    });
});
