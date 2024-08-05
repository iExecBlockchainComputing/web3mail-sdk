import { ENS, IExec } from 'iexec';

export const configureEnsName = async (
  iexec: IExec,
  appAddress: string,
  ens: ENS
): Promise<void> => {
  const ensName = await iexec.ens.lookupAddress(appAddress);
  if (ensName) {
    console.log(
      `ENS name already configured for address ${appAddress}: ${ensName}`
    );
    return;
  }
  const separatorIndex = ens.indexOf('.');
  const label = ens.substring(0, separatorIndex);
  const domain = ens.substring(separatorIndex + 1);
  const claimName = await iexec.ens.claimName(label, domain);
  console.log(
    `Registered ENS name '${ens}' on transaction ${claimName.registerTxHash}`
  );

  console.log(`Configuring ENS ${ens} for app ${appAddress}`);
  const result = await iexec.ens.configureResolution(ens, appAddress);
  console.log(`ENS configured:\n${JSON.stringify(result, undefined, 2)}`);
};
