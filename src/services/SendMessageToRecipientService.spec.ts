import MailMock from '@utils/tests/MailMock';

import SendMessageToRecipientService from '@services/SendMessageToRecipientService';

describe('Send Message to Recipient', () => {
  it('should send message to the recipient', async () => {
    const SendMessageToRecipient = new SendMessageToRecipientService();

    SendMessageToRecipient.run('andrejnsimoes@gmail.com', {
      subject: 'Hello World',
      body: 'Just testing',
    });

    expect(MailMock.sendEmail).toHaveBeenCalled();
  });
});
