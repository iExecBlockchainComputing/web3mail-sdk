import { IExec } from 'iexec';

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
