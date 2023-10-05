# Set the name of the Docker image
IMG_NAME=web3mail:non-tee

# Build the regular non-TEE image
docker build . -t ${IMG_NAME}

# Create input/output directories if they do not exist
if [ ! -d "/tmp/iexec_in" ]; then
  mkdir -p /tmp/iexec_in
fi

if [ ! -d "/tmp/iexec_out" ]; then
  mkdir -p /tmp/iexec_out
fi

# Place your .zip file in the /tmp/iexec_in directory and replace DATA_FILENAME with the name of the file you just placed in the directory
# The .zip file should contain a file with the email content you want to protect
DATA_FILENAME="your_file_name.zip"


# Replace the values of the variables MJ_APIKEY_PUBLIC, MJ_APIKEY_PRIVATE, and MJ_SENDER with your own Mailjet API key and sender email address
MJ_APIKEY_PUBLIC="your_mail_jet_api_key_public"
MJ_APIKEY_PRIVATE="your_mail_jet_api_private"
MJ_SENDER="your_mail_jet_sender"


# Replace the following variables with your own values:
EMAIL_SUBJECT="the_email_subject_to_send"
EMAIL_CONTENT_MULTIADDR="the_encrypted_email_multiAddr"
EMAIL_CONTENT_ENCRYPTION_KEY="the_encryption_key"
SENDER_NAME="the_sender_name"
CONTENT_TYPE="text/plain"

IEXEC_REQUESTER_SECRET_1='{"emailSubject":"'${EMAIL_SUBJECT}'","emailContentEncryptionKey":"'${EMAIL_CONTENT_ENCRYPTION_KEY}'","emailContentMultiAddr":"'${EMAIL_CONTENT_MULTIADDR}'","senderName":"'${SENDER_NAME}'","contentType":"'${CONTENT_TYPE}'"}'
IEXEC_APP_DEVELOPER_SECRET='{"MJ_APIKEY_PUBLIC":"'$MJ_APIKEY_PUBLIC'","MJ_APIKEY_PRIVATE":"'$MJ_APIKEY_PRIVATE'","MJ_SENDER":"'$MJ_SENDER'"}'

docker run -it --rm \
            -v /tmp/iexec_in:/iexec_in \
            -v /tmp/iexec_out:/iexec_out \
            -e IEXEC_IN=/iexec_in \
            -e IEXEC_OUT=/iexec_out \
            -e IEXEC_DATASET_FILENAME=${DATA_FILENAME} \
            -e IEXEC_APP_DEVELOPER_SECRET=${IEXEC_APP_DEVELOPER_SECRET} \
            -e IEXEC_REQUESTER_SECRET_1=${IEXEC_REQUESTER_SECRET_1} \
            ${IMG_NAME}