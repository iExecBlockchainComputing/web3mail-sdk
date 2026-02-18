import { IExec } from 'iexec';

export const pushSecret = async (
  iexec: IExec,
  appAddress: string,
  secret: string
): Promise<boolean> => {
  console.log(`Pushing app secret for app ${appAddress}`);
  const isPushed = await iexec.app.pushAppSecret(appAddress, secret);
  console.log(`success: ${isPushed}`);
  return isPushed;
};
