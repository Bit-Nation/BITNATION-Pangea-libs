//@Todo Replace this with the real wallet. This is just a dummy
const fakeWallet = {
    ethSend : (from, to, amount) => {
        "use strict";

    },
    ethBalance: (address) => {
        "use strict";

    },
    ethSync: (address) => {
        "use strict";

    },
    patSend: (from, to, amount) => {
        "use strict";

    },
    patBalance: (address) => {
        "use strict";
    },
    patSync: (address) => {
        "use strict";
    },
    syncCurrencies: (address) => {

    }
};

describe('wallet', () => {
    "use strict";

    describe('ethBalance', () => {

        test('never synced', () => {

            const address = '';

            //Will be empty object it was not synchronised before
            return expect(fakeWallet.ethBalance(address)).toEqual({});

        });

        test('synced some time ago', () => {

            const address = '0x687422eEA2cB73B5d3e242bA5456b782919AFc85';

            return expect(fakeWallet.ethBalance(address)).toEqual({
                synced_at : 1511185212,
                wei: '168179030063160961914893',
                address: '0x687422eEA2cB73B5d3e242bA5456b782919AFc85'
            })

        });

    });

    describe('ethSend', () => {

        test('send eth successfully', () => {

            const fromAddress = '';

            const toAddress = '';

            return expect(fakeWallet.sendEth(fromAddress, toAddress, '1'))
                .resolves
                .toBeUndefined();

        });

        test('failed to send eth', () => {

            class TestError extends Error{}

            const fromAddress = '';

            const toAddress = '';

            //The error will be from web3
            return expect(fakeWallet.sendEth(fromAddress, toAddress, '1'))
                .resolves
                .toBe(new TestError());

        })

    });

    describe('ethSync', () => {

        test('success', () => {

            const address = '';

            //Will be resolved as "void" if successfull synced
            return expect(fakeWallet.ethSync(address))
                .resolves
                .toBeUndefined();

        });

        test('error', () => {

            const address = '';

            class TestError extends Error{}

            //Will be resolved with error that was thrown by other code
            return expect(fakeWallet.ethSync(address))
                .resolves
                .toEqual(new TestError());

        });

    });

    describe('patSend', () => {

        test('success', () => {

            const fromAddress = '';

            const toAddress = '';

            return expect(fakeWallet.patSend(fromAddress, toAddress, '1'))
                .resolves
                .toBeUndefined();

        });

        test('fail', () => {

            const fromAddress = '';

            const toAddress = '';

            class TestError extends Error{}

            //The error will be from web3
            return expect(fakeWallet.patSend(fromAddress, toAddress))
                .resolves
                .toEqual(new TestError());

        });

    });

    describe('patBalance', () => {

        test('success', () => {

            const address = '';

            return expect(fakeWallet.patBalance(address))
                .resolves
                .toEqual({
                    address: address,
                    balance: 'todo figure this out, i guess we have 18 decimals',
                    synced_at: 1511185212
                })

        });

        test('never synced before', () => {

            const address = '';

            //When the wallet was not synced before, we just will return an empty object
            return expect(fakeWallet.patBalance(address))
                .resolves
                .toEqual({})

        })

    });

    describe('patSync', () => {

        test('success', () => {

            const address = '';

            return expect(fakeWallet.patSync(address))
                .resolves
                .toBeUndefined();

        });

        test('fail', () => {

            const address = '';

            class TestError extends Error{}

            return expect(fakeWallet.patSync(address))
                .resolves
                .toEqual(new TestError());

        });

    });

    test('syncCurrencies', () => {

        const address = '';

        //syncCurrencies sync's eth and pat. Expect to get back the
        //result of ethSync and patSync
        return expect(fakeWallet.syncCurrencies(address))
            .resolves
            .toEqual([
                undefined,
                undefined
            ])

    })

});