// @flow

import type {DBInterface} from '../database/db';
import dbFactory from '../database/db';
import {SampleDBInterface} from './common';
const common = require('./common');
let fs = require('fs');

const sampleDbs : SampleDBInterface[] = [
    require('./v0.js').SampleDB
];

export const BuildSampleDBs = async function() {

    function getSampleDb(path : string, schemaVersion : number) : DBInterface {
        let db = dbFactory(path, schemaVersion);
        return db;
    }
    
    for(let sample of sampleDbs) {
        let version = sample.GetSchemaVersion();
        let path = 'database/sample/v' + version;

        var db = getSampleDb(path, version);
        
        await sample.Create(db).then(_ => db.close());

        let nextPath = 'database/sample/v' + (version+1);
        fs.writeFileSync(nextPath, fs.readFileSync(path));
    }
}