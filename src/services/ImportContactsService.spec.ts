import { Readable } from 'stream';
import MongoMock from '@utils/tests/MongoMock';

import ImportContactsService from '@services/ImportContactsService';

import Tag from '@schemas/Tag';
import Contact from '@schemas/Contact';

describe('Import Contacts', () => {
  beforeAll(async () => {
    await MongoMock.connect();
  });

  afterAll(async () => {
    await MongoMock.disconnect();
  });

  beforeEach(async () => {
    await Tag.deleteMany({});
    await Contact.deleteMany({});
  });

  it('should be able to import new contacts', async () => {
    const contactsFileStream = Readable.from([
      'andrejnsimoes@gmail.com\n',
      'andrejnsimoes+2@gmail.com\n',
      'andrejnsimoes+1@gmail.com\n',
    ]);

    const importContacts = new ImportContactsService();

    await importContacts.run(contactsFileStream, ['Students', 'Class A']);

    const createdTags = await Tag.find({}).lean();

    expect(createdTags).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ title: 'Students' }),
        expect.objectContaining({ title: 'Class A' }),
      ]),
    );

    const createdTagsIds = createdTags.map(tag => tag._id);

    const createdContacts = await Contact.find({}).lean();

    expect(createdContacts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          email: 'andrejnsimoes@gmail.com',
          tags: createdTagsIds,
        }),
        expect.objectContaining({
          email: 'andrejnsimoes+2@gmail.com',
          tags: createdTagsIds,
        }),
        expect.objectContaining({
          email: 'andrejnsimoes+1@gmail.com',
          tags: createdTagsIds,
        }),
      ]),
    );
  });

  it('should not recreate tags that already exists', async () => {
    const contactsFileStream = Readable.from([
      'andrejnsimoes@gmail.com\n',
      'andrejnsimoes+2@gmail.com\n',
      'andrejnsimoes+1@gmail.com\n',
    ]);

    const importContacts = new ImportContactsService();

    await Tag.create({ title: 'Students' });

    await importContacts.run(contactsFileStream, ['Students', 'Class A']);

    const createdTags = await Tag.find({}).lean();

    expect(createdTags).toEqual([
      expect.objectContaining({ title: 'Students' }),
      expect.objectContaining({ title: 'Class A' }),
    ]);
  });

  it('should not recreate contacts that already exists', async () => {
    const contactsFileStream = Readable.from([
      'andrejnsimoes@gmail.com\n',
      'andrejnsimoes+2@gmail.com\n',
      'andrejnsimoes+1@gmail.com\n',
    ]);

    const importContacts = new ImportContactsService();

    const tag = await Tag.create({ title: 'Students' });
    await Contact.create({ email: 'andrejnsimoes@gmail.com', tags: [tag._id] });

    await importContacts.run(contactsFileStream, ['Class A']);

    const contacts = await Contact.find({
      email: 'andrejnsimoes@gmail.com',
    })
      .populate('tags')
      .lean();

    expect(contacts.length).toBe(1);
    expect(contacts[0].tags).toEqual([
      expect.objectContaining({ title: 'Students' }),
      expect.objectContaining({ title: 'Class A' }),
    ]);
  });
});
