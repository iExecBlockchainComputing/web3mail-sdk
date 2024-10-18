import { expect, it } from '@jest/globals';
import { ValidationError } from 'yup';
import { sendEmail } from '../../src/web3mail/sendEmail.js';
import { getRandomAddress } from '../test-utils.js';

describe('sendEmail', () => {
  describe('Check validation for input parameters', () => {
    describe('When senderName is less than 3 characters (too short)', () => {
      it('should throw a yup ValidationError with the correct message', async () => {
        // --- GIVEN
        const sendEmailParams = {
          emailSubject: 'e2e mail object for test',
          emailContent: 'e2e mail content for test',
          protectedData: getRandomAddress(),
          senderName: 'AB', // <--
        };

        await expect(
          // --- WHEN
          sendEmail({
            // @ts-expect-error No need for graphQLClient here
            graphQLClient: {},
            // @ts-expect-error No need for iexec here
            iexec: {},
            ...sendEmailParams,
          })
          // --- THEN
        ).rejects.toThrow(
          new ValidationError('senderName must be at least 3 characters')
        );
      });
    });

    describe('When senderName is more than 20 characters (too long)', () => {
      it('should throw a yup ValidationError with the correct message', async () => {
        // --- GIVEN
        const sendEmailParams = {
          emailSubject: 'e2e mail object for test',
          emailContent: 'e2e mail content for test',
          protectedData: getRandomAddress(),
          senderName: 'A very long sender name', // <-- 23 characters
        };

        await expect(
          // --- WHEN
          sendEmail({
            // @ts-expect-error No need for graphQLClient here
            graphQLClient: {},
            // @ts-expect-error No need for iexec here
            iexec: {},
            ...sendEmailParams,
          })
          // --- THEN
        ).rejects.toThrow(
          new ValidationError('senderName must be at most 20 characters')
        );
      });
    });

    describe('When label is less than 3 characters (too short)', () => {
      it('should throw a yup ValidationError with the correct message', async () => {
        // --- GIVEN
        const sendEmailParams = {
          emailSubject: 'e2e mail object for test',
          emailContent: 'e2e mail content for test',
          protectedData: getRandomAddress(),
          label: 'ID', // <-- 23 characters
        };

        await expect(
          // --- WHEN
          sendEmail({
            // @ts-expect-error No need for graphQLClient here
            graphQLClient: {},
            // @ts-expect-error No need for iexec here
            iexec: {},
            ...sendEmailParams,
          })
          // --- THEN
        ).rejects.toThrow(
          new ValidationError('label must be at least 3 characters')
        );
      });
    });

    describe('When label is more than 10 characters (too long)', () => {
      it('should throw a yup ValidationError with the correct message', async () => {
        // --- GIVEN
        const sendEmailParams = {
          emailSubject: 'e2e mail object for test',
          emailContent: 'e2e mail content for test',
          protectedData: getRandomAddress(),
          label: 'ID123456789', // <-- 11 characters
        };

        await expect(
          // --- WHEN
          sendEmail({
            // @ts-expect-error No need for graphQLClient here
            graphQLClient: {},
            // @ts-expect-error No need for iexec here
            iexec: {},
            ...sendEmailParams,
          })
          // --- THEN
        ).rejects.toThrow(
          new ValidationError('label must be at most 10 characters')
        );
      });
    });

    describe('When emailContent is more than 512kb (too big)', () => {
      it('should throw a yup ValidationError with the correct message', async () => {
        // --- GIVEN
        const desiredSizeInBytes = 520000; // 520 kilo-bytes
        const characterToRepeat = 'A';
        const OVERSIZED_CONTENT = characterToRepeat.repeat(desiredSizeInBytes);
        const sendEmailParams = {
          emailSubject: 'e2e mail object for test',
          emailContent: OVERSIZED_CONTENT,
          protectedData: getRandomAddress(),
        };

        await expect(
          // --- WHEN
          sendEmail({
            // @ts-expect-error No need for graphQLClient here
            graphQLClient: {},
            // @ts-expect-error No need for iexec here
            iexec: {},
            ...sendEmailParams,
          })
          // --- THEN
        ).rejects.toThrow(
          new ValidationError('emailContent must be at most 512000 characters')
        );
      });
    });
  });
});
