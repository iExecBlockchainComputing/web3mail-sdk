IMG_NAME=web3mail:non-tee

# build the regular non-TEE image
docker build . -t ${IMG_NAME}

if [ ! -d "/tmp/iexec_in" ]; then
  mkdir -p /tmp/iexec_in
fi

if [ ! -d "/tmp/iexec_out" ]; then
  mkdir -p /tmp/iexec_out
fi

# placer votre fichier dans /tmp/iexec_in
# fill your file .zip
DATA_FILENAME="myProtectedData.zip"

MJ_APIKEY_PUBLIC="98155a42b045d5f9e7195819e24aba22"
MJ_APIKEY_PRIVATE="8251f8f44f54d98973a3d41a5f840d79"
MJ_SENDER="team-product@iex.ec"

MAIL_OBJECT="mail_object_to_send"
MAIL_CONTENT="mail_content_to_send"

IEXEC_APP_DEVELOPER_SECRET='{"MJ_APIKEY_PUBLIC":"'$MJ_APIKEY_PUBLIC'","MJ_APIKEY_PRIVATE":"'$MJ_APIKEY_PRIVATE'","MJ_SENDER":"'$MJ_SENDER'"}'

docker run -it --rm \
            -v /tmp/iexec_in:/iexec_in \
            -v /tmp/iexec_out:/iexec_out \
            -e IEXEC_IN=/iexec_in \
            -e IEXEC_OUT=/iexec_out \
            -e IEXEC_DATASET_FILENAME=${DATA_FILENAME} \
            -e IEXEC_APP_DEVELOPER_SECRET=${IEXEC_APP_DEVELOPER_SECRET} \
            -e IEXEC_REQUESTER_SECRET_1=${MAIL_OBJECT} \
            -e IEXEC_REQUESTER_SECRET_2=${MAIL_CONTENT} \
            ${IMG_NAME}

