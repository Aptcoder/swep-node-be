const express = require('express')
const mongoose = require('mongoose')
const { handleError } = require('./util/error_handler')
const { DATABASE_URL } = require('../src/config')
const userRouter = require('../src/components/user/user_router')
const doctorRouter = require('../src/components/admin/doctor_router')
const cors = require('cors')


// initialise express app
const app = express()
app.use(cors())
app.use(express.json())


mongoose.connect(DATABASE_URL, {
  useNewUrlParser: true
}).then(() => {
  console.log('Connected to mongo db')
}).catch((err) => {
  console.log('COuld not connect to mongo db', err)
})



app.set('port', 3000)

app.use('/users', userRouter)
app.use('/doctors', doctorRouter)

app.get('/', (req, res) => {
  return res.send('Hello world')
})


app.use('*', (req, res) => {
  const url = req.originalUrl;
  res.status(404).send({
    status: 'error',
    message: `Oops. ${req.method} ${url} not found on this website`
  });
});

app.use((err, req, res, next) => {
  handleError(res, err);
});

module.exports = app