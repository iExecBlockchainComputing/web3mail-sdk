import { ENS, IExec } from 'iexec';

export const configureEnsName = async (
  iexec: IExec,
  appAddress: string,
  name: ENS
): Promise<void> => {
  console.log(`Configuring ENS ${name} for app ${appAddress}`);
  const result = await iexec.ens.configureResolution(name, appAddress);
  console.log(`Configured:\n${JSON.stringify(result, undefined, 2)}`);
};
