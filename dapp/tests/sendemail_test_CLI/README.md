# Email Sender Script

This script allows you to send an email using iExec infrastructure. Before running the script, please follow the instructions below to configure your environment.

## Prerequisites

- Node.js and npm should be installed on your machine.
- Make sure you have a valid ethereum address.

## Configuration

1. Navigate to the `datadeployer` folder.

2. Locate the file named `.template.env`.

3. Rename the file from `.template.env` to `.env`.

4. Open the `.env` file using a text editor.

5. Update the following variables in the `.env` file:

   - `PRIVATE_KEY`: Add your private key here. It should be enclosed in quotes ("<private_key_here>").
   - `EMAIL_ADDRESS`: Add your email address here. It should be enclosed in quotes ("<your_email_here>").

6. Save the changes to the `.env` file.

## Execution

To execute the script and send the email, run the following command in the terminal:

```shell
./send_mail.sh
```

The script will read the configuration from the `.env` file and perform the necessary actions to send the email using iExec infrastructure.

Note: Make sure you have set the executable permission for the `send_mail.sh` script before running it. If not, you can set the permission using the command: `chmod +x send_mail.sh`.

Please make sure to keep your private key and email address confidential and do not share it with others.
