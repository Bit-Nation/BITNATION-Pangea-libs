require('promise/lib/rejection-tracking').enable();
const utils = require('../../lib/ethereum/utils');
const ethereumjsUtil = require('ethereumjs-util');
const errors = require('../../lib/errors');
const aes = require('crypto-js/aes');

// Private key dummy
const PRIVATE_KEY = "6b270aa6bec685e1c1d55b8b1953a410ab8c650a9dca57c46dd7a0cace55fc22";

const PRIVATE_KEY_ADDRESS = "0xb293D530769790b82c187f9CD1a4fA0acDcaAb82";

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

        const error = new NativeNodeError();

        //Fake nodes crypto module
        const crypto = {
            randomBytes: jest.fn((size, cb) => {

                //cb is the callback function that is passed to the randomBytes method https://nodejs.org/docs/latest-v6.x/api/crypto.html#crypto_crypto_randombytes_size_callback
                cb(error, null);

            })
        };

        // promise that resolves with the private key as a string or an error
        const privateKeyPromise = utils().raw.createPrivateKey(crypto, ethereumjsUtil.isValidPrivate)();
        
        // expect to reject since we pass a error in the randomBytes mock
        return expect(privateKeyPromise).rejects.toBe(error);

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
        const privateKeyPromise = utils().raw.createPrivateKey(crypto, ethereumjsUtil.isValidPrivate)();

        // the promise should be rejected with an InvalidPrivateKeyError instance
        return expect(privateKeyPromise).rejects.toEqual(new errors.InvalidPrivateKeyError());

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
        const privateKeyPromise = utils().raw.createPrivateKey(crypto, ethereumjsUtil.isValidPrivate)();

        // Expect the private key promise to resolve with the private key we used to have node's crypto.randomBytes method
        return expect(privateKeyPromise).resolves.toBe(PRIVATE_KEY);

    });

    /**
     * Here we test the "booted" createPrivateKey method.
     * As you can see this "createPrivateKey" don't take any argument's since they were already injected.
     */
    test('test create valid key with automatic dependency injection', () => {

        const promiseOfKey = utils().createPrivateKey();

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

    test('private key generation', () => {

        return expect(new Promise((res, rej) => {

            utils()
                .createPrivateKey()
                .then(key => {
                    res(ethereumjsUtil.isValidPrivate(Buffer.from(key, 'hex')));
                })
                .catch(err => rej(err));

        })).toBeTruthy();

    });

    //Save private key unencrypted
    test('save private key unencrypted', () => {

        //Mock the secure storage
        const secureStorageMock = {
            get(){},
            set: jest.fn(() => {
                return new Promise((res, rej) => { res() })
            }),
            remove(){},
            has(){},
            destroyStorage(){}
        };

        const testPromise = new Promise((res, rej) => {

            utils().raw.savePrivateKey(secureStorageMock, ethereumjsUtil, aes)(PRIVATE_KEY)
                .then(result => {

                    //The secure storage should have been called once
                    expect(secureStorageMock.set).toHaveBeenCalled();

                    //Expect that secure storage set is called with the prefix priv_eth_key and
                    //the related address of the private key as a "key" and with the private
                    //RAW key
                    expect(secureStorageMock.set).toBeCalledWith(
                        'PRIVATE_ETH_KEY#'+PRIVATE_KEY_ADDRESS,
                        '0x'+PRIVATE_KEY
                    );

                    //Expect that set function is called with key
                    res(result);

                })
                .catch(err => rej(err))

        });

        return expect(testPromise).resolves.toBeUndefined();

    });

    test('save the private key encrypted', () => {

        //Mock the secure storage
        const secureStorageMock = {
            get(){},
            set: jest.fn((key, value) => {
                return new Promise((res, rej) => {
                    res();
                })
            }),
            remove(){},
            has(){},
            destroyStorage(){}
        };

        const ENCRYPTED_PRIVATE_KEY = 'U2FsdGVkX19kYXZNtfZ2DhfNuao89++6weoGrSdWRA7JvlteIT0fqOfz4x+cTIw7JZy2IB3HbZUEwtlJQccT2+6bJ7aCbNSptaZ3/GHr5eFBGbc3TMpTrAGQOSztIWdq';

        const testPromise = new Promise((res, rej) => {

            const aes = {
                encrypt: jest.fn((value, password) => {

                    expect(value).toBe('0x'+PRIVATE_KEY);
                    expect(password).toBe('mypw');

                    //Mock encrypted private key
                    return 'U2FsdGVkX19kYXZNtfZ2DhfNuao89++6weoGrSdWRA7JvlteIT0fqOfz4x+cTIw7JZy2IB3HbZUEwtlJQccT2+6bJ7aCbNSptaZ3/GHr5eFBGbc3TMpTrAGQOSztIWdq';
                })
            };

            utils().raw.savePrivateKey(secureStorageMock, ethereumjsUtil, aes)(PRIVATE_KEY, 'mypw', 'mypw')
                .then(result => {

                    //The secure storage should have been called once
                    expect(secureStorageMock.set).toHaveBeenCalled();

                    //Expect that secure storage set is called with the prefix priv_eth_key and
                    //the related address of the private key as a "key" and with the encrypted private key
                    expect(secureStorageMock.set).toBeCalledWith(
                        'PRIVATE_ETH_KEY#'+PRIVATE_KEY_ADDRESS,
                        ENCRYPTED_PRIVATE_KEY
                    );

                    //Expect that set function is called with key
                    res(result);

                })
                .catch(err => rej(err))

        });

        return expect(testPromise).resolves.toBeUndefined();

    });

    test('save private key only one password', () => {

        return expect(utils().savePrivateKey(+PRIVATE_KEY, 'pw')).rejects.toEqual(new errors.PasswordMismatch());

    });

    test('save private key with special chars', () => {

        //Mock the secure storage
        const secureStorageMock = {
            get(){},
            set(){},
            remove(){},
            has(){},
            destroyStorage(){}
        };

        return expect(utils(secureStorageMock).savePrivateKey(PRIVATE_KEY, "pw \n", "pw \n")).rejects.toEqual(new errors.PasswordContainsSpecialChars());
    });

});
