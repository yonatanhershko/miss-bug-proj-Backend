import express from 'express'
import { bugService } from './services/bug.service.js'
import cookieParser from 'cookie-parser'
import { loggerService } from './services/logger.service.js'
// import hgj from "../"

const app = express()
app.use(cookieParser())
app.use(express.static('../miss-bug-starter-react'))



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


app.get('/api/bug/save', (req, res) => {
    const bugToSave = {
        _id: req.query._id,
        title: req.query.title || '',
        description: req.query.description || '',
        severity: +req.query.severity || 0,
        createdAt: req.query.createdAt ? +req.query.createdAt : Date.now()
    }
    bugService.save(bugToSave)
        .then(bug => res.send(bug))
        .catch((err) => {
            loggerService.error('Cannot save bug', err)
            res.status(500).send('Cannot save bug', err)
        })
})



const visitedBugs = {}

//write its without the :
app.get('/api/bug/:bugId', (req, res) => {
    const { bugId } = req.params
   
    if (!visitedBugs[bugId]) {
        visitedBugs[bugId] = 1
    } else {
        visitedBugs[bugId]++
    }
    console.log('Current visitedBugs state:',visitedBugs)
   
    if (visitedBugs[bugId] > 3) {
        return res.status(401).send('Wait for a bit')
    }

    let totalVisits = req.cookies.visitedCount || 0
    totalVisits++
    res.cookie('visitedCount', totalVisits, { maxAge: 3 * 1000 })

    // console.log('bugId:', bugId)
    bugService.getById(bugId)
        .then(bug => {
            res.send(bug)

        })
        .catch((err) => {
            loggerService.error('Cannot get bug', err)
            res.status(500).send('Cannot get bug')
        })
})

app.get('/api/bug/:bugId/remove', (req, res) => {
    const { bugId } = req.params
    bugService.remove(bugId)
        .then(() => res.send(`Bug (${bugId}) removed!`))
        .catch((err) => {
            loggerService.error('Cannot remove bug', err)
            res.status(500).send('Cannot remove bug', err)
        })

})


app.listen(3030, () => console.log('Server ready at port 3030!'))