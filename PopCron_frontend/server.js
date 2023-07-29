const express = require('express');
const cronParser = require('cron-parser');
const { getNextCronExecutionTime } = require('./next_cron_execution.js');
const { getNextEventExecutionTime } = require('./next_event_execution.js');
const { Job } = require('./job_model.js');
const { Completed_Jobs } = require('./completed_job_model.js');
const { connectToDatabase } = require('./db.js');
const { Worker } = require('worker_threads');

const worker = new Worker('./thread.js');
worker.on('error', (error) => {
    console.error('Worker Error:', error);
});
worker.on('exit', (code) => {
    console.log(`Worker Thread Exited with Code: ${code}`);
});

const app = express();
const port = 3000;

app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');

app.get('/', (req, res, next) => {
    Promise.all([
        Job.find().exec(),
        Completed_Jobs.find().exec()
    ])
        .then(([jobs, completed_jobs]) => {
            res.render('create_task', { jobs, completed_jobs });
        })
        .catch(err => {
            console.error('Error fetching data:', err);
            res.status(500).send('Error fetching data');
        });
});
app.post('/', async (req, res) => {
    const { taskType, title, description, url, time, date, cron_exp } = req.body;
    const job = new Job({ taskType, title, description, url, time, date, cron_exp });

    job.status = 'Created';

    if (taskType === 'event') {
        const timePattern = /^(\d{1,2}):(\d{2})\s(AM|PM)$/i;
        if (!timePattern.test(time)) {
            res.send('<script>alert("Invalid time. Please use hh:mm AM/PM"); window.location.href="/";</script>');
            return;
        }
        const nextEventExecutionTime = getNextEventExecutionTime(time, date);
        job.schedule = nextEventExecutionTime;
    
    } else if (taskType === 'cron') {
        try {
            cronParser.parseExpression(cron_exp);
        } catch (error) {
            res.send('<script>alert("Invalid cron expression. Please provide a valid cron expression."); window.location.href="/";</script>');
            return;
        }
        const nextCronExecutionTime = getNextCronExecutionTime(cron_exp);
        job.schedule = nextCronExecutionTime;
    }

    try {
        await job.save();
        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.send('<script>alert("Error occurred while saving the job."); window.location.href="/";</script>');
    }
});

app.post('/delete', async (req, res) => {
    const { id } = req.body;
    await Job.findByIdAndDelete(id);
    res.redirect('/');
});

connectToDatabase()
    .then(() => {
        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    })
    .catch((err) => {
        console.error('Error starting the server:', err);
    });




