import { log } from "console"
import { utilService } from "./util.service.js"
import fs from 'fs'

const bugs = utilService.readJsonFile('data/bug.json')

export const bugService = {
    query,
    getById,
    remove,
    save
}

const PAGE_SIZE = 3

function query(filterBy = {}) {
    return Promise.resolve(bugs)
        .then(bugs => {
            if (filterBy.title) {
                const regExp = new RegExp(filterBy.title, 'i')
                bugs = bugs.filter(bug => regExp.test(bug.title))
            }
            if (filterBy.severity) {
                bugs = bugs.filter(bug => bug.severity >= filterBy.severity)
            }
            if (filterBy.labels && filterBy.labels.length) {
                bugs = bugs.filter(bug =>
                    bug.labels.some((label) =>{ console.log('bug test',bug);
                        return filterBy.labels.includes(label)})
                    
                ) 
            }
            if (filterBy.sortBy) {
                const sortDir = filterBy.sortDir === 'desc' ? -1 : 1
                bugs = sortBugs(bugs, filterBy.sortBy, sortDir)
            }

            if (filterBy.pageIdx !== undefined) {
                const startIdx = filterBy.pageIdx * PAGE_SIZE
                bugs = bugs.slice(startIdx, startIdx + PAGE_SIZE)
            }

            return bugs
        })
}


function sortBugs(bugs, sortBy = 'title', sortDir = 1) {
    return bugs.sort((a, b) => {
        switch (sortBy) {
            case 'title':
                return sortDir * a.title.localeCompare(b.title)
            case 'severity':
                return sortDir * (a.severity - b.severity)
            case 'createdAt':
                return sortDir * (a.createdAt - b.createdAt)
            default:
                return 0
        }
    })
}

function getById(bugId) {
    const bug = bugs.find(bug => bug._id === bugId)
    if (!bug) return Promise.reject('Cannot find bug - ' + bugId)
    return Promise.resolve(bug)
}

function remove(bugId) {
    const bugIdx = bugs.findIndex(bug => bug._id === bugId)
    if (bugIdx < 0) return Promise.reject('Cannot find bug - ' + bugId)
    bugs.splice(bugIdx, 1)
    return _saveBugsToFile().then(() => `bug (${bugId}) removed!`)
}


function save(bugToSave) {
    if (bugToSave._id) {
        const bugIdx = bugs.findIndex(bug => bug._id === bugToSave._id)
        bugs[bugIdx] = bugToSave
    } else {
        bugToSave._id = utilService.makeId()
        bugs.unshift(bugToSave)
    }

    return _saveBugsToFile().then(() => bugToSave)
}


function _saveBugsToFile() {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(bugs, null, 4)
        fs.writeFile('data/bug.json', data, (err) => {
            if (err) {
                return reject(err)
            }
            resolve()
        })
    })
}