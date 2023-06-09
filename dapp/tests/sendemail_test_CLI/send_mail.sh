#!/bin/bash

# Set the necessary environment variables
export IEXEC_APP_ADDRESS="web3mail.apps.iexec.eth"
export IEXEC_WORKERPOOL_ADDRESS="prod-v8-bellecour.main.pools.iexec.eth"
export IEXEC_TAG="tee,scone"

# Install iExec CLI if not already installed
if ! command -v iexec &> /dev/null; then
  echo "iExec CLI not found. Installing iExec CLI..."
  sudo npm install -g iexec
fi


cd datadeployer

# Check if .env file exists
if [ ! -f .env ]; then
  echo "Error: .env file not found."
  exit 1
fi

# Check if PRIVATE_KEY is defined in .env file
if ! grep -q "^PRIVATE_KEY=" .env; then
  echo "Error: PRIVATE_KEY is not defined in the .env file."
  exit 1
fi

source .env

cd ..


# Initialize the iExec environment
echo "**************************"
echo
echo "Importing your wallet to iexec cli from the .env File, please define your wallet password, please memorize the password you will use it later on"
echo
echo "**************************"
iexec wallet import $PRIVATE_KEY



# Initialize the iExec environment
echo "**************************"
echo
echo "Initializing iExec environment..." 
echo
echo "**************************"
sudo iexec init --skip-wallet

# Update the prod SMG
sms_prod='{"sms": { "scone": "https://sms.scone-prod.v8-bellecour.iex.ec" }'
echo "**************************"
echo
echo "Updating the prod SMG..."
echo
echo "**************************"

# Check if sms_prod exists in chain.json
if grep -qF "$sms_prod" chain.json; then
  echo "sms_prod already exists in chain.json. No changes needed."
else
  # Modify chain.json using sed
  chain_contents=$(cat chain.json)
  sed 's|"bellecour": {|"bellecour": '"$sms_prod"'|g' chain.json > tmp.json && mv tmp.json chain.json
  echo "sms_debug added to chain.json."
fi


# Deploy the email as a data to the Blockchain
echo "**************************"
echo
echo "Deploying email data to the Blockchain..." 
echo
echo "**************************"
cd "datadeployer"
echo "**************************"
echo
echo "installing data deployer dependencies"
echo
echo "**************************"
echo "npm version"
npm -v
echo "node version"
node -v
npm install

output=$(node index.js)

# Extract the address variable using grep and awk
IEXEC_DATA_ADDRESS=$(echo "$output" | grep -o "address:  [^,]*" | awk '{print $2}')

echo "$output"

cd ..

random_number=$((1 + RANDOM % 100))
export MAIL_OBJECT_NAME="emailObject$random_number"
export MAIL_CONTENT_NAME="emailContent$random_number"
export MAIL_OBJECT="1=emailObject$random_number"
export MAIL_CONTENT="2=emailContent$random_number"

# Push the mail object as a requester secret
echo "**************************"
echo
echo "Pushing mail object as a requester secret..." 
echo
echo "**************************"
iexec requester push-secret $MAIL_OBJECT_NAME
echo "Don't worry if this fails if you already pushed a secret with this name it will send the previously pushed mail object"

# Push the mail content as a requester secret
echo "**************************"
echo
echo "Pushing mail content as a requester secret..." 
echo
echo "**************************"
iexec requester push-secret $MAIL_CONTENT_NAME
echo "Don't worry if this fails if you already pushed a secret with this name it will send the previously pushed email Content"

# Initialize storage token
echo "**************************"
echo
echo "Initializing storage token..."
echo
echo "**************************"
iexec storage init

echo "Don't worry if this fails because of storage token already initialized"

# Run the dapp
echo "**************************"
echo
echo "Running the dapp..." 
echo
echo "**************************"
iexec app run "$IEXEC_APP_ADDRESS" \
    --watch \
    --tag "$IEXEC_TAG" \
    --dataset "$IEXEC_DATA_ADDRESS" \
    --secret "$MAIL_OBJECT" \
    --secret "$MAIL_CONTENT" \
    --workerpool "$IEXEC_WORKERPOOL_ADDRESS" \
    --skip-preflight-check
    
