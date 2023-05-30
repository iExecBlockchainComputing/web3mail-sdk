import { IExec } from "iexec";

export const pushSecret = async (
  iexec: IExec,
  appAddress: string,
  secret: string
): Promise<boolean> => {
  const isPushed = await iexec.app.pushAppSecret(appAddress, secret, {
    teeFramework: "scone",
  });
  return isPushed;
};