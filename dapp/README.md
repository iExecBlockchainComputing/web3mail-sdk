# Email-Sender-Dapp

Email-Sender-Dapp is a decentralized application (DApp) that securely and decentralizes email sending using the IEXEC platform. The DApp reads a .zip file, extracts the recipient's email address, and sends an email to that address using Mailjet. The DApp is executed as a Docker container that runs on an IEXEC worker node, ensuring complete confidentiality by decrypting protected data to retrieve the email in an enclave.

## Running the Dapp locally

### Create .env file

Create a `.env` file in the root directory of the project based on the `.env.override` file

fill in the environment variables:

- **IEXEC_IN**: The path to the input directory on your local machine where the unencrypted data .zip file will be stored. This file contains the email address to which the email will be sent.
- **IEXEC_OUT**: The path on your local machine where the result of the Dapp execution will be written.
- **IEXEC_DATASET_FILENAME**: The name of the data file that you place in the **IEXEC_IN** directory.
- **IEXEC_APP_DEVELOPER_SECRET**: A JSON string with the following keys:
  - **MJ_APIKEY_PUBLIC**: Your [Mailjet public API key](https://app.mailjet.com/account/apikeys), which can be retrieved from your Mailjet account.
  - **MJ_APIKEY_PRIVATE**: Your [Mailjet private API key](https://app.mailjet.com/account/apikeys).
  - **MJ_SENDER**: The email address that will be used to send the emails.
- **IEXEC_REQUESTER_SECRET_1**: The subject of the email to be sent to the email address retrieved from the data.zip file.
- **IEXEC_REQUESTER_SECRET_2**: The content of the email to be sent to the email address retrieved from the data.zip file.
- Install dependencies by running `npm ci`.
- Start the app using `npm run start-local`.

The Dapp will send an email using the object and content specified in .env, and your Mailjet account credentials. The email will be sent to the address specified in data.zip in the IEXEC_IN directory.

## Running the Dapp locally using Docker

1. **Build the Docker image**: Navigate to the `/web3mail/dapp` directory of the project and run the following command to build the Docker image:

    ```sh
    docker build . --tag web3mail-dapp
    ```

2. **Create local directories**: In your terminal, execute the following commands to create two local directories on your machine:

    ```sh
    mkdir /tmp/iexec_in
    mkdir /tmp/iexec_out
    ```

3. **Prepare your data**: Place your `data.zip` file inside the `/tmp/iexec_in` directory you just created. This file contains the data you want to protect, which in this case is the email you want to send. Ensure that the email is saved as a `email.txt` file within the `data.zip` archive.

4. **Set up Mailjet credentials**: In the command provided in step 5, make sure to replace the placeholders:
   - `<your_mailjet_public_api_key>`: Your [Mailjet public API key](https://app.mailjet.com/account/apikeys).
   - `<your_mailjet_private_api_key>`:  Your [Mailjet private API key](https://app.mailjet.com/account/apikeys).
   - `<your_sender_email_address>`: Your sender email address.
   - `<email_object>`: The subject of the email you want to send.
   - `<email_content>`: The content of the email you want to send.

6. **Run the Docker container**: Execute the following command to run the 
Docker container and execute the Dapp:

    ```sh
    docker run --rm \
        -v /tmp/iexec_in:/iexec_in \
        -v /tmp/iexec_out:/iexec_out \
        -e IEXEC_IN=/iexec_in \
        -e IEXEC_OUT=/iexec_out \
        -e IEXEC_DATASET_FILENAME=data.zip \
        -e IEXEC_APP_DEVELOPER_SECRET='{"MJ_APIKEY_PUBLIC":"<your_mailjet_public_api_key>","MJ_APIKEY_PRIVATE":"<your_mailjet_private_api_key>","MJ_SENDER":"<your_sender_email_address>"}' \
        -e IEXEC_REQUESTER_SECRET_1="<email_object>" \
        -e IEXEC_REQUESTER_SECRET_2="<email_content>" \
        web3mail-dapp
    ```

After running the Docker container, you can find the result of the Dapp's execution in the `/tmp/iexec_out` directory on your machine.

### Run Tests

- Create a `.env` file at the root of the project and set the environment variables.
- Create a `data.zip` file in the `tests/_tests_inputs_` directory with an email file containing the email address to receive the email sent by the dapp, along with the mail object and content specified in `.env`, using your Mailjet account keys.
- To run the tests, use `npm run test`.
After running the tests, check the inbox of the email address specified in the email file in the `tests/_tests_inputs_` directory to receive the email sent by the dapp.
- To run the tests with code coverage, use `npm run ctest`.
