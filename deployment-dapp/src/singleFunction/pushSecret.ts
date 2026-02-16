import { IExec } from 'iexec';

export const pushSecret = async (
  iexec: IExec,
  appAddress: string,
  secret: string
): Promise<boolean> => {
  // TODO: to be deleted after migration to TDX
  const sconifyVersion = process.env.SCONIFY_VERSION;
  let teeFramework = 'tdx';
  if (sconifyVersion) {
    console.log(
      `Using SCONE framework with SCONIFY version: ${sconifyVersion}`
    );
    teeFramework = 'scone';
  }
  console.log(
    `Pushing app secret for app ${appAddress} on SMS ${teeFramework}`
  );
  const isPushed = await iexec.app.pushAppSecret(appAddress, secret, {
    teeFramework,
  });
  console.log(`success: ${isPushed}`);
  return isPushed;
};
