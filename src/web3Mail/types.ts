import { EnhancedWallet, IExec } from 'iexec';

export type Web3SignerProvider = EnhancedWallet;

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
  emailSubject: string;
  emailContent: string;
  protectedData: Address;
};

export type SendEmailResponse = {
  taskId: Address;
};
