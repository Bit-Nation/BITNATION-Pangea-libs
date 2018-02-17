//This must be incremented with each migration.
export const schemaVersion = 1; 

/*
 * schemaVersion history. This is a list of each lib version when the corresponding schemaVersion took effect for the first time.
 * 
 * 0: v0.3.1
 * 1: v0.3.2
 * 
*/

export default function(oldRealm, newRealm) {
    // See https://realm.io/docs/javascript/latest/#migrations for more info on how this works.
    if (oldRealm.schemaVersion < 1) {
        
    }
}

