const { Job } = require('./job_model.js');
const { connectToDatabase } = require('./db.js');

const getCurrentTime = () => {
    const currentTimeUTC = Date.now();
    const currentTimeIST = new Date(currentTimeUTC + (5 * 60 + 30) * 60 * 1000);
    currentTimeIST.setSeconds(0);
    currentTimeIST.setMilliseconds(0);
    return currentTimeIST.toISOString();
};

const fetchJobs = async () => {
    try {
        const currentTime = getCurrentTime();
        console.log('current time:', currentTime);
        const query = { schedule: currentTime };
        const executable_jobs = await Job.find(query).exec();

        const updated_jobs = executable_jobs.map(job => {
            job.status = 'running';
            return job;
        });

        for (const job of updated_jobs) {
            await job.save();
        }

        console.log('executable jobs:');
        console.log(executable_jobs);
        return executable_jobs;
    } catch (error) {
        console.error('Error:', error);
    }
};
connectToDatabase();
module.exports = { fetchJobs };


