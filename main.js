'use strict'

const {db} = require('./server/db')
const app = require('./server')
const PORT = 8081

app.listen(PORT, () => console.log(`App is serving on port ${PORT}`))
