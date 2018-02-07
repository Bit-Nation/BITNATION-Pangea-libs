import plf from './index';
import ssFactory from './test_implementations/nodeJsSecureStorage';
import osDepsImplementation from './test_implementations/nodeJsOsDependencies';
const EE = require('eventemitter3');

const container = plf(
    ssFactory(),
    './blablablasaldfasdf',
    {
        url: 'https://api.myetherapi.com/eth',
        start: () => new Promise((res, rej) => res()),
    },
    osDepsImplementation,
    new EE(),
    true,
    false
);

container.then((c) => {
    c
        .eth
        .nation
        .index()
        .then((_) => c.eth.nation.all())
        .catch(console.log);
});
