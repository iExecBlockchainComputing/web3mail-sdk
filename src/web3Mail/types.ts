import { EnhancedWallet, IExec } from 'iexec';

export type IExecConsumer = {
  iexec: IExec;
};

export type Address = string;

export type TimeStamp = string;

export type Contact = {
  address: Address;
  owner: Address;
  accessGrantTimestamp: TimeStamp;
};
export type SendEmailParams = {
  userAddress: Address;
  mailObject: string;
  mailContent: string;
  datasetAddress: Address;
};

export type SendEmailResponse = {
  taskId: Address;
};
