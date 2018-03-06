// @flow

import dbFactory from '../database/db';
import {DBInterface} from '../database/db';

export interface SampleDBInterface {
    GetSchemaVersion() : number,
    Create(db : DBInterface) : Promise<*>
};



