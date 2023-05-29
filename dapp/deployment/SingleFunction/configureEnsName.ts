import { ENS, IExec } from "iexec";

export const configureEnsName = async (
  iexec: IExec,
  appAddress: string,
  name: ENS
): Promise<void> => {
  await iexec.ens.configureResolution(name, appAddress);
};
