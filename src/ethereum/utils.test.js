require('promise/lib/rejection-tracking').enable();
const utils = require('../../lib/ethereum/utils');
const ethereumjsUtil = require('ethereumjs-util');
const errors = require('../../lib/errors');

// Private key dummy
const PRIVATE_KEY = "6b270aa6bec685e1c1d55b8b1953a410ab8c650a9dca57c46dd7a0cace55fc22";

describe('createPrivateKey', () => {
    "use strict";

    /**
     * the createPrivateKey function uses crypto.randomBytes to generate a private ethereum key
     * if something goes wrong in the randomBytes function the promise returned promise should
     * be rejected with the node error.
     */
    test('test promise rejection if something in the randomBytes function goes wrong', () => {

        //Dummy error that will be passed from node js
        class NativeNodeError extends Error{}

        //Fake nodes crypto module
        const crypto = {
            randomBytes: jest.fn((size, cb) => {

                //cb is the callback function that is passed to the randomBytes method https://nodejs.org/docs/latest-v6.x/api/crypto.html#crypto_crypto_randombytes_size_callback
                cb(new NativeNodeError(), null);

            })
        };

        // promise that resolves with the private key as a string or an error
        const privateKeyPromise = utils.raw.createPrivateKey(crypto, ethereumjsUtil.isValidPrivate)();

        // expect to reject since we pass a error in the randomBytes mock
        return expect(privateKeyPromise).rejects.toBeInstanceOf(NativeNodeError);

    });

    /**
     * When the private key buffer is invalid the promise should be rejected
     */
    test('test that invalid privateKey reject promise', () => {

        //Fake nodes crypto module
        const crypto = {
            randomBytes: jest.fn((size, cb) => {

                cb(null, Buffer.from('invalid key'));

            })
        };

        // promise that resolves with the private key as a string or an error
        const privateKeyPromise = utils.raw.createPrivateKey(crypto, ethereumjsUtil.isValidPrivate)();

        // the promise should be rejected with an InvalidPrivateKeyError instance
        return expect(privateKeyPromise).rejects.toBeInstanceOf(errors.InvalidPrivateKeyError);

    });

    /**
     * if no errors occour the promise returned by createPrivateKey should resolve with the private key as a string
     * generated by the randomBytes method
     */
    test('test that valid private key resolve promise', () => {

        //Fake nodes crypto module
        const crypto = {
            randomBytes: jest.fn((size, cb) => {

                // Here we are fakeing the private key to make sure,
                // that the resolved private key is the one generated by randomBytes
                cb(null, Buffer.from(PRIVATE_KEY, 'hex'));

            })
        };

        // promise that resolves with the private key as a string or an error
        const privateKeyPromise = utils.raw.createPrivateKey(crypto, ethereumjsUtil.isValidPrivate)();

        // Expect the private key promise to resolve with the private key we used to have node's crypto.randomBytes method
        return expect(privateKeyPromise).resolves.toBe(PRIVATE_KEY);

    });

    /**
     * Here we test the "booted" createPrivateKey method.
     * As you can see this "createPrivateKey" don't take any argument's since they were already injected.
     */
    test('test create valid key with automatic dependency injection', () => {

        const promiseOfKey = utils.createPrivateKey();

        // This promise is only used to help with the assertion.
        // Since the privateKey can't be mocked in this test case
        // There is need for checking if he is at least valid.
        const assertionPromise = new Promise((res, rej) => {

            promiseOfKey
                .then(privateKey => {

                    if(ethereumjsUtil.isValidPrivate(Buffer.from(privateKey, 'hex'))){
                        res(true);
                        return;
                    }

                    res(new Error("Private key is invalid"));

                })
                .catch(err => rej(err))

        });

        return expect(assertionPromise).resolves.toBeTruthy();

    });

});
