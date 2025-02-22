import express from 'express'
import { userService } from './services/user.service.js'
import { bugService } from './services/bug.service.js'
import cookieParser from 'cookie-parser'
import { loggerService } from './services/logger.service.js'
// import hgj from "../"

const app = express()

app.use(cookieParser())
app.use(express.static('../miss-bug-starter-react'))
app.use(express.json())


app.get('/api/bug', (req, res) => {
    const filterBy = {
        title: req.query.title || '',
        severity: +req.query.severity || 0,
        labels: req.query.labels || '',
        sortBy: req.query.sortBy || {},
        sortDir: req.query.sortDir === 'desc' ? -1 : 1,
        pageIdx: req.query.pageIdx || 0
    }
    console.log(filterBy)
    bugService.query(filterBy)
        .then(bugs => res.send(bugs))
        .catch(err => {
            loggerService.error('Cannot get bugs', err)
            res.status(500).send('Cannot get bugs')
        })
})

//post -new bug
app.post('/api/bug', (req, res) => {
    const loggedinUser = userService.validateToken(req.cookies.loginToken)
    if (!loggedinUser) return res.status(401).send('Cannot add bug')

    const bugToSave = {
        title: req.body.title || '',
        description: req.body.description || '',
        severity: +req.body.severity || 0,
        labels: req.body.labels || [],
        createdAt: req.body.createdAt ? +req.body.createdAt : Date.now()
    }
    bugService.save(bugToSave, loggedinUser)
        .then(bug => res.send(bug))
        .catch((err) => {
            loggerService.error('Cannot save bug', err)
            res.status(500).send('Cannot save bug', err)
        })
})


//put - update bug
app.put('/api/bug', (req, res) => {
    const loggedinUser = userService.validateToken(req.cookies.loginToken)
    if (!loggedinUser) return res.status(401).send('Cannot add bug')

    const bugToSave = {
        _id: req.body._id,
        title: req.body.title || '',
        description: req.body.description || '',
        severity: +req.body.severity || 0,
        labels: req.body.labels || [],
        createdAt: req.body.createdAt ? +req.body.createdAt : Date.now()
    }
    bugService.save(bugToSave, loggedinUser)
        .then(bug => res.send(bug))
        .catch((err) => {
            loggerService.error('Cannot save bug', err)
            res.status(500).send('Cannot save bug', err)
        })
})




const visitedBugs = {}
//find id
//write its without the :
app.get('/api/bug/:bugId', (req, res) => {
    const { bugId } = req.params

    if (!visitedBugs[bugId]) {
        visitedBugs[bugId] = 1
    } else {
        visitedBugs[bugId]++
    }
    console.log('Current visitedBugs state:', visitedBugs)

    if (visitedBugs[bugId] > 3) {
        return res.status(401).send('Wait for a bit')
    }

    let totalVisits = req.cookies.visitedCount || 0
    totalVisits++
    res.cookie('visitedCount', totalVisits, { maxAge: 3 * 1000 })

    bugService.getById(bugId)
        .then(bug => {
            res.send(bug)

        })
        .catch((err) => {
            loggerService.error('Cannot get bug', err)
            res.status(500).send('Cannot get bug')
        })
})


app.delete('/api/bug/:bugId', (req, res) => {
    const loggedinUser = userService.validateToken(req.cookies.loginToken)
    if (!loggedinUser) return res.status(401).send('Cannot add bug')

    const { bugId } = req.params
    bugService.remove(bugId, loggedinUser)
        .then(() => res.send(`Bug (${bugId}) removed!`))
        .catch((err) => {
            loggerService.error('Cannot remove bug', err)
            res.status(500).send('Cannot remove bug', err)
        })

})


app.get('/api/user', (req, res) => {
    userService.query()
        .then(users => res.send(users))
        .catch(err => {
            loggerService.error('Cannot load users', err)
            res.status(400).send('Cannot load users')
        })
})

app.get('/api/user/:userId', (req, res) => {
    const { userId } = req.params

    userService.getById(userId)
        .then(user => res.send(user))
        .catch(err => {
            loggerService.error('Cannot load user', err)
            res.status(400).send('Cannot load user')
        })
})

// Auth API
app.post('/api/auth/login', (req, res) => {
    const credentials = req.body

    userService.checkLogin(credentials)
        .then(user => {
            if (user) {
                const loginToken = userService.getLoginToken(user)
                res.cookie('loginToken', loginToken)
                res.send(user)
            } else {
                res.status(401).send('Invalid Credentials')
            }
        })
})

app.post('/api/auth/signup', (req, res) => {
    const credentials = req.body

    userService.save(credentials)
        .then(user => {
            if (user) {
                const loginToken = userService.getLoginToken(user)
                res.cookie('loginToken', loginToken)
                res.send(user)
            } else {
                res.status(400).send('Cannot signup')
            }
        })
})

app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('loginToken')
    res.send('logged-out!')
})


const PORT = process.env.PORT || 3030
app.listen(PORT, () =>
    loggerService.info(`Server listening on port http://127.0.0.1:${PORT}/`)
)
