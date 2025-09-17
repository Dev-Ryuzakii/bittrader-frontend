/**
 * @typedef {Object} Symbol
 * @property {string} symbol - Standard symbol name (e.g., EURUSD)
 * @property {string} [broker_symbol] - Broker-specific symbol (e.g., EURUSDm)
 * @property {string} [description] - Human-readable description
 * @property {string} [type] - Symbol type (forex, crypto, etc.)
 * @property {boolean} [popular] - Whether the symbol is popular
 * @property {string} [category] - Symbol category
 */

/**
 * @typedef {Object} Account
 * @property {string|number} account_id - Account ID from broker
 * @property {string} [broker_name] - Broker name
 * @property {string} [broker] - Broker identifier
 * @property {string} [platform] - Trading platform
 * @property {number} [balance] - Account balance
 * @property {number} [equity] - Account equity
 * @property {number} [free_margin] - Free margin
 * @property {boolean} [is_demo] - Whether it's a demo account
 */

/**
 * @typedef {Object} LivePrice
 * @property {number} bid - Bid price
 * @property {number} ask - Ask price
 * @property {number} price - Mid price
 * @property {number} spread - Current spread
 * @property {string} symbol - Symbol name
 * @property {string} [broker_symbol] - Broker-specific symbol
 * @property {string} [source] - Price source (e.g., 'ea_live')
 * @property {string} [timestamp] - Price timestamp
 */

export {};