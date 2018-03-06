// @flow

import type {DBInterface} from '../database/db';
import dbFactory from '../database/db';
import {SampleDBInterface} from './common';
const common = require('./common');
let fs = require('fs');

const sampleDbs : SampleDBInterface[] = [
    require('./v0.js').SampleDB,
    require('./v1.js').SampleDB
];

export const BuildSampleDBs = async function() {

    function getSampleDb(path : string, schemaVersion : number) : DBInterface {
        let db = dbFactory(path, schemaVersion);
        return db;
    }

    function resetDb(path : string) { 
        try {
            fs.unlinkSync(path);
        } catch (_){ }
        
        try {
            fs.unlinkSync(path + ".lock");
        } catch (_){ }

        try {
            fs.rmdirSync(path + ".management");
        } catch(_){ }

        try {
            fs.unlinkSync(path + ".note");
        } catch(_){ }
    }
    
    let i = 0;
    for(let sample of sampleDbs) {
        let version = sample.GetSchemaVersion();
        let path = 'database/sample-v' + version;
        if (i == 0) {
            resetDb(path);
        }
        var db = getSampleDb(path, version);
        
        await sample.Create(db).then(_ => db.close());

        if (i < sampleDbs.length - 1) {
            let nextPath = 'database/sample-v' + (version+1);
            resetDb(nextPath);
            fs.writeFileSync(nextPath, fs.readFileSync(path));
        }
        i++;
    }
}