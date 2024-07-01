import express from 'express'
import { bugService } from './services/bug.service.js'
import { loggerService } from './services/logger.service.js'


const app = express()



app.get('/', (req, res) => {
    res.send('Hello There!')
})

app.get('/api/bug', (req, res) => {
    const filterBy = {
        title: req.query.title,
        severity: +req.query.severity
    }
    bugService.query(filterBy)
        .then(bugs => res.send(bugs))
        .catch(err => {
            loggerService.error('Cannot get bugs', err)
            res.status(500).send('Cannot get bugs')
        })
})




app.listen(3030, () => console.log('Server ready at port 3030!'))