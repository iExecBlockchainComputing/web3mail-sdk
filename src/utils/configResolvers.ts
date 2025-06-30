import { IExec } from 'iexec';
import { GraphQLClient } from 'graphql-request';
import {
    EthersCompatibleProvider,
    Web3MailConfigOptions,
} from '../web3mail/types.js';

interface ConfigValues {
    dataProtectorSubgraph?: string;
    dappWhitelistAddress?: string;
    dappAddressOrENS?: string;
    ipfsGateway?: string;
    defaultWorkerpool?: string;
    ipfsNode?: string;
}

/**
 * Resolve configuration values from options and chain defaults
 */
export function resolveConfigValues(
    options: Web3MailConfigOptions,
    chainConfig: ConfigValues
): ConfigValues {
    return {
        dataProtectorSubgraph:
            options?.dataProtectorSubgraph || chainConfig?.dataProtectorSubgraph,
        dappWhitelistAddress:
            options?.dappWhitelistAddress || chainConfig?.dappWhitelistAddress,
        dappAddressOrENS:
            options?.dappAddressOrENS || chainConfig?.dappAddressOrENS,
        ipfsGateway: options?.ipfsGateway || chainConfig?.ipfsGateway,
        defaultWorkerpool: chainConfig?.defaultWorkerpool,
        ipfsNode: options?.ipfsNode || chainConfig?.ipfsNode,
    };
}

/**
 * Validate required configuration fields
 */
export function validateRequiredConfig(
    config: ConfigValues,
    chainId: number
): void {
    const missing = Object.entries(config)
        .filter(([, value]) => !value)
        .map(([key]) => key);

    if (missing.length) {
        throw new Error(
            `Missing required configuration for chainId ${chainId}: ${missing.join(
                ', '
            )}`
        );
    }
}

/**
 * Create and configure IExec instance
 */
export function createIExecInstance(
    ethProvider: EthersCompatibleProvider,
    ipfsGateway: string,
    options?: Web3MailConfigOptions
): IExec {
    try {
        return new IExec(
            { ethProvider },
            {
                ipfsGatewayURL: ipfsGateway,
                ...options?.iexecOptions,
            }
        );
    } catch (error: unknown) {
        if (error instanceof Error) {
            throw new Error(`Failed to create IExec instance: ${error.message}`);
        }
        throw new Error('Failed to create IExec instance: Unknown error');
    }
}

/**
 * Create GraphQL client for subgraph queries
 */
export function createSubgraphClient(subgraphUrl: string): GraphQLClient {
    try {
        return new GraphQLClient(subgraphUrl);
    } catch (error: unknown) {
        if (error instanceof Error) {
            throw new Error(`Failed to create GraphQL client: ${error.message}`);
        }
        throw new Error('Failed to create GraphQL client: Unknown error');
    }
}
