import amqp from 'amqplib';

const QUEUE_EXPORT = 'export:playlists';

class ProducerService {
  static async sendExportPlaylist({ playlistId, targetEmail, queue = QUEUE_EXPORT }) {
    console.log(playlistId, targetEmail);
    console.log(process.env.RABBITMQ_SERVER);
    if (!process.env.RABBITMQ_SERVER) throw new Error('RABBITMQ_SERVER belum diset');
    if (!playlistId || !targetEmail)
      throw new Error('playlistId & targetEmail wajib diisi');

    const conn = await amqp.connect(process.env.RABBITMQ_SERVER);
    const ch = await conn.createChannel();

    try {
      await ch.assertQueue(queue, { durable: true });
      const msg = JSON.stringify({ playlistId, targetEmail });
      ch.sendToQueue(queue, Buffer.from(msg), {
        persistent: true,
        contentType: 'application/json',
      });
    } finally {
      try {
        await ch.close();
      } catch {
        /* empty */
      }
      try {
        await conn.close();
      } catch {
        /* empty */
      }
    }
  }
}

export default ProducerService;
