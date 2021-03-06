// @flow

/**
 * @typedef JsonRpcNodeInterface
 * @property {string} name
 * @property {string} url
 * @property {function} start
 * @property {function} stop
 */
export interface JsonRpcNodeInterface {

    /**
     * Name of the json node. Could be something like "mainnet"
     */
    name: string,

    /**
     * http endpoint (can be e.g. localhost:1234)
     */
    url: string,

    /**
     * Start node
     */
    start() : Promise<void>,

    /**
     * Stop node
     */
    stop() : Promise<void>,
}
