# Email-Sender-Dapp
Email-Sender-Dapp is a decentralized application (DApp) that securely and decentralizes email sending using the IEXEC platform. The DApp reads a .zip file, extracts the recipient's email address, and sends an email to that address using Mailjet. The DApp is executed as a Docker container that runs on an IEXEC worker node, ensuring complete confidentiality by decrypting protected data to retrieve the email in an enclave.

## Running the Dapp locally

1. Create a `.env` file in the root directory of the project based on the `.env.override` file and fill in the environment variables:

- **IEXEC_IN**: The path to the input directory on your local machine where the unencrypted data .zip file will be stored. This file contains the email address to which the email will be sent.
- **IEXEC_OUT**: The path on your local machine where the result of the Dapp execution will be written.
- **IEXEC_DATASET_FILENAME**: The name of the data file that you place in the **IEXEC_IN** directory.
- **IEXEC_APP_DEVELOPER_SECRET**: A JSON string with the following keys:
  - **MJ_APIKEY_PUBLIC**: Your Mailjet public API key, which can be retrieved from your Mailjet account.
  - **MJ_APIKEY_PRIVATE**: Your Mailjet private API key.
  - **MJ_SENDER**: The email address that will be used to send the emails.
  - **IEXEC_REQUESTER_SECRET_1**: The subject of the email to be sent to the email address retrieved from the data.zip file.
- **IEXEC_REQUESTER_SECRET_2**: The content of the email to be sent to the email address retrieved from the data.zip file.
- Install dependencies by running `npm ci`.
- Add `require("dotenv").config();` at the beginning of `src/app.ts`.
- Start the app using `npm run start`.

## Running the Dapp locally using Docker

Build the Docker image by running the following command in the root directory of the project:
`docker build . --tag <your_image_name>:<your_image_version>`

Run the Docker container by executing the following command:

    docker run --rm \
    -v /tmp/iexec_in:/iexec_in \
    -v /tmp/iexec_out:/iexec_out \
    -e IEXEC_IN=/iexec_in \
    -e IEXEC_OUT=/iexec_out \
    -e IEXEC_DATASET_FILENAME=myProtectedData.zip \
    -e IEXEC_APP_DEVELOPER_SECRET='{"MJ_APIKEY_PUBLIC":"<your_mailjet_public_api_key>","MJ_APIKEY_PRIVATE":"<your_mailjet_private_api_key>","MJ_SENDER":"<your_sender_email_address>"}' \
    -e IEXEC_REQUESTER_SECRET_1=<email_object> \
    -e IEXEC_REQUESTER_SECRET_2=<email_content> \
    <your_image_name>:<your_image_version>

You can replace <your_image_name> and <your_image_version> with any name and version for your Docker image, respectively.