import { ENS, IExec } from 'iexec';

export const resolveName = async (
  iexec: IExec,
  name: ENS
): Promise<string | null> => {
  const appAddress = await iexec.ens.resolveName(name);
  return appAddress;
};