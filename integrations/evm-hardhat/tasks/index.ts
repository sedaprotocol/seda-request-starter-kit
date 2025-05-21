import { scope } from 'hardhat/config';

/**
 * Defines the scope for pricefeed-related tasks.
 */
export const priceFeedScope = scope('pricefeed', 'Interact with the PriceFeed contract');

import './deploy';
import './latest';
import './transmit';
