import { Contact } from '../web3mail/types.js';

export function isDuplicate(contact: Contact, myContacts: Contact[]): boolean {
  return myContacts.some(
    (existingContact) => existingContact.address === contact.address
  );
}
