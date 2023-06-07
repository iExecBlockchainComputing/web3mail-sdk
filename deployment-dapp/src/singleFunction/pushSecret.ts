import { IExec } from 'iexec';

export const pushSecret = async (
  iexec: IExec,
  appAddress: string,
  secret: string
): Promise<boolean> => {
  const teeFramework = 'scone';
  console.log(
    `Pushing app secret for app ${appAddress} on SMS ${teeFramework}`
  );
  const isPushed = await iexec.app.pushAppSecret(appAddress, secret, {
    teeFramework,
  });
  console.log(`success: ${isPushed}`);
  return isPushed;
};
