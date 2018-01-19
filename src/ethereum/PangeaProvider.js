// @flow

import type {EthUtilsInterface} from './utils';
import type {PrivateKeyType} from '../specification/privateKey';
import type {TxData} from '../specification/tx';
const EthTx = require('ethereumjs-tx');

const ZeroProvider = require('web3-provider-engine/zero');

/**
 * @desc fetch all accounts
 * @param {object} ethUtils object that implements the EthUtilsInterface
 * @ignore
 * @return {function}
 */
export function getAccounts(ethUtils: EthUtilsInterface): (cb: (error: Error | null, addresses: Array<string> | null) => void) => void {
    return (cb: (error: Error | null, addresses: Array<string> | null) => void): void => {
        ethUtils
            .allKeyPairs()
            .then((keyPairsMap) => cb(null, Array.from(keyPairsMap.keys())))
            .catch((error) => cb(error, null));
    };
}

/**
 * @desc Responsible for tx signing
 * @ignore
 * @param {EthUtilsInterface} ethUtils
 * @return {function(TxData, *)}
 */
export function signTx(ethUtils: EthUtilsInterface): (txData: TxData, cb: (error: any, signedTx: any) => void) => void {
    return (txData: TxData, cb: (error: any, signedTx: any) => void): void => {
        ethUtils
            .signTx(txData)
            .then((signedTx: EthTx) => cb(null, '0x'+signedTx.serialize().toString('hex')))
            .catch(cb);
    };
}

/**
 * @desc Provider used by pangea to customize interactions with web3
 */
export default class PangeaProvider extends ZeroProvider {
    /**
     *
     * @param {object} ethUtils object that implements the EthUtilsInterface
     * @param {string} rpcUrl
     */
    constructor(ethUtils: EthUtilsInterface, rpcUrl: string) {
        super({
            getAccounts: getAccounts(ethUtils),
            signTransaction: signTx(ethUtils),
            rpcUrl: rpcUrl,
        });
    }
}
