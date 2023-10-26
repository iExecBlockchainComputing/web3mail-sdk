import { ENS, IExec } from 'iexec';

export const resolveName = async (
  iexec: IExec,
  name: ENS
): Promise<string | null> => {
  return iexec.ens.resolveName(name);
};