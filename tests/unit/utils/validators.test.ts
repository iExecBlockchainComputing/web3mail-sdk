import { describe, it, expect } from '@jest/globals';
import { ValidationError } from '../../../dist/utils/errors';
import {
  addressOrEnsSchema,
  emailSubjectSchema,
  emailContentSchema,
  senderNameSchema,
} from '../../../dist/utils/validators';
import { getRandomAddress, getRequiredFieldMessage } from '../../test-utils';

const CANNOT_BE_NULL_ERROR = new ValidationError('this cannot be null');
const IS_REQUIRED_ERROR = new ValidationError(getRequiredFieldMessage());

describe('addressOrEnsSchema()', () => {
  describe('validateSync()', () => {
    const address = getRandomAddress();
    const EXPECTED_ERROR = new ValidationError(
      'this should be an ethereum address or a ENS name'
    );

    it('transforms to lowercase', () => {
      const res = addressOrEnsSchema().validateSync(address);
      expect(res).toBe(address.toLowerCase());
    });
    it('accepts undefined (is not required by default)', () => {
      const res = addressOrEnsSchema().validateSync(undefined);
      expect(res).toBeUndefined();
    });
    it('accepts case insensitive ethereum address', () => {
      expect(addressOrEnsSchema().validateSync(address)).toBeDefined();
      expect(
        addressOrEnsSchema().validateSync(address.toUpperCase())
      ).toBeDefined();
      expect(
        addressOrEnsSchema().validateSync(address.toLowerCase())
      ).toBeDefined();
    });
    it('accepts string ending with ".eth"', () => {
      expect(addressOrEnsSchema().validateSync('FOO.eth')).toBe('foo.eth');
    });
    it('does not accept null', () => {
      expect(() => addressOrEnsSchema().validateSync(null)).toThrow(
        CANNOT_BE_NULL_ERROR
      );
    });
    it('does not accept empty string', () => {
      expect(() => addressOrEnsSchema().validateSync('')).toThrow(
        EXPECTED_ERROR
      );
    });
    it('does not accept non address string', () => {
      expect(() => addressOrEnsSchema().validateSync('test')).toThrow(
        EXPECTED_ERROR
      );
    });
    it('does not accept ENS name with label < 3 char', () => {
      expect(() => addressOrEnsSchema().validateSync('ab.eth')).toThrow(
        EXPECTED_ERROR
      );
    });
  });
  describe('required()', () => {
    describe('validateSync()', () => {
      it('does not accept undefined', () => {
        expect(() =>
          addressOrEnsSchema().required().validateSync(undefined)
        ).toThrow(IS_REQUIRED_ERROR);
      });
    });
  });
});

describe('emailSubjectSchema()', () => {
  describe('validateSync()', () => {
    it('pass with standard subject', () => {
      const SUBJECT = 'Hello from web3mail! 🦄';
      const res = emailSubjectSchema().validateSync(SUBJECT);
      expect(res).toBe(SUBJECT);
    });
    it('blocks too long subject', () => {
      expect(() =>
        emailSubjectSchema().validateSync(
          '12345678901234567890123456789012345678901234567890123456789012345678901234567890'
        )
      ).toThrow('this must be at most 78 characters');
    });
  });
});

describe('emailContentSchema()', () => {
  const CONTENT = `Far far away, behind the word mountains, far from the countries Vokalia and Consonantia, there live the blind texts.
Separated they live in Bookmarksgrove right at the coast of the Semantics, a large language ocean.
A small river named Duden flows by their place and supplies it with the necessary regelialia.
It is a paradisematic country, in which roasted parts of sentences fly into your mouth.
Even the all-powerful Pointing has no control about the blind texts it is an almost unorthographic life One day however a small line of blind text by the name of Lorem Ipsum decided to leave for the far World of Grammar.
The Big Oxmox advised her not to do so, because there were thousands of bad Commas, wild Question Marks and devious Semikoli, but the Little Blind Text didn’t listen.
She packed her seven versalia, put her initial into the belt and made herself on the way.
When she reached the first hills of the Italic Mountains, she had a last view back on the skyline of her hometown Bookmarksgrove, the headline of Alphabet Village and the subline of her own road, the Line Lane.
Pityful a rethoric question ran over her cheek, then she continued her way.
On her way she met a copy.
The copy warned the Little Blind Text, that where it came from it would have been rewritten a thousand times and everything that was left from its origin would be the word "and" and the Little Blind Text should turn around and return to its own, safe country.
But nothing the copy said could convince her and so it didn’t take long until a few insidious Copy Writers ambushed her, made her drunk with Longe and Parole and dragged her into their agency, where they abused her for their projects again and again.
And if she hasn’t been rewritten, then they are still using her.
Far far away, behind the word mountains, far from the countries Vokalia and Consonantia, there live the blind texts.
Separated they live in Bookmarksgrove right at the coast of the Semantics, a large language ocean.
A small river named Duden flows by their place and supplies it with the necessary regelialia.
It is a paradisematic country, in which roasted parts of sentences fly into your mouth.
Even the all-powerful Pointing has no control about the blind texts it is an almost unorthographic life One day however a small line of blind text by the name of Lorem Ipsum decided to leave for the far World of Grammar.
The Big Oxmox advised her not to do so, because there were thousands of bad Commas, wild Question Marks and devious Semikoli, but the Little Blind Text didn’t listen.
She packed her seven versalia, put her initial into the belt and made herself on the way.
When she reached the first hills of the Italic Mountains, she had a last view back on the skyline of her hometown Bookmarksgrove, the headline of Alphabet Village and the subline of her own road, the Line Lane.
Pityful a rethoric question ran over her cheek, then she continued her way.
On her way she met a copy.
The copy warned the Little Blind Text, that where it came from it would have been rewritten a thousand times and everything that was left from its origin would be the word "and" and the Little Blind Text should turn around and return to its own, safe country.
But nothing the copy said could convince her and so it didn’t take long until a few insidious Copy Writers ambushed her, made her drunk with Longe and Parole and dragged her into their agency, where they abused her for their projects again and again.
And if she hasn’t been rewritten, then they are still using her.
Far far away, behind the word mountains, far from the countries Vokalia and Consonantia, there live the blind texts.
Separated they live in Bookmarksgrove right at the coast of the Semantics, a large language ocean.
A small river named Duden flows by their place and supplies it with the necessary regelialia.
It is a paradisematic country, in which roasted parts of sentences fly into your mouth.
Even the all-powerful Pointing has no control about the blind texts it is an almost unorthographic life One day however a small line of blind text by the name of Lore`;

  describe('validateSync()', () => {
    it('pass with standard content', () => {
      const res = emailContentSchema().validateSync(CONTENT);
      expect(res).toBe(CONTENT);
    });
    it('blocks too long content', () => {
      expect(() => emailContentSchema().validateSync(CONTENT + '.')).toThrow(
        'this must be at most 4096 characters'
      );
    });
  });
});

describe('senderNameSchema()', () => {
  describe('validateSync()', () => {
    it('pass with valid senderName', () => {
      const senderName = 'Product Team';
      const res = senderNameSchema().validateSync(senderName);
      expect(res).toBe(senderName);
    });
    it('blocks too short senderName', () => {
      expect(() =>
      senderNameSchema().validateSync(
          'AB'
        )
      ).toThrow('this must be at least 3 characters');
    });
    it('blocks empty characters as senderName', () => {
      expect(() =>
      senderNameSchema().validateSync(
          '   '
        )
      ).toThrow('this must be at least 3 characters');
    });
    it('blocks too long senderName', () => {
      expect(() =>
      senderNameSchema().validateSync(
          'A very long sender name'
        )
      ).toThrow('this must be at most 20 characters');
    });
  });
});
