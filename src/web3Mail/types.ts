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
  mailObject: string;
  mailContent: string;
  protectedData: Address;
};

export type SendEmailResponse = {
  taskId: Address;
};
