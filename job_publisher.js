const amqp = require('amqplib/callback_api');

function publishJob(jobData) {
    amqp.connect('amqp://localhost', (error0, connection) => {
        if (error0) {
            throw error0;
        }
        connection.createChannel((error1, channel) => {
            if (error1) {
                throw error1;
            }
            const queue = 'job_queue';

            channel.assertQueue(queue, {
                durable: true
            });

            channel.sendToQueue(queue, Buffer.from(JSON.stringify(jobData)), {
                persistent: true
            });

            console.log('Job sent to queue:', jobData);
        });
    });
}

module.exports = { publishJob };
