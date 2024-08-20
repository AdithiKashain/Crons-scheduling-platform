const amqp = require('amqplib');
const { Job } = require('./job_model.js');
const { connectToDatabase } = require('./db.js');

const processJob = async (job) => {
    // Process the job
    console.log('Processing job:', job.title);

    // Simulate job processing
    setTimeout(async () => {
        // Mark job as completed
        try {
            await Job.findByIdAndUpdate(job._id, { status: 'completed' });
            console.log('Job completed:', job.title);
        } catch (error) {
            console.error('Error updating job status:', error);
        }
    }, 1000);
};

const startWorker = async () => {
    try {
        const connection = await amqp.connect('amqp://localhost'); // Use your RabbitMQ URL
        const channel = await connection.createChannel();
        await channel.assertQueue('jobQueue', { durable: true });

        channel.consume('jobQueue', async (msg) => {
            if (msg !== null) {
                const jobData = JSON.parse(msg.content.toString());
                await processJob(jobData);
                channel.ack(msg);
            }
        });
    } catch (error) {
        console.error('Error in worker:', error);
    }
};

connectToDatabase().then(startWorker).catch(console.error);
