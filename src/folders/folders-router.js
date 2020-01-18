const path = require('path');
const express = require('express');
const xss = require('xss');
const FoldersService = require('./notes-service');

const foldersRouter = express.Router();
const jsonParser = express.json();

const sanitizeResponse = folder => ({
    id: folder.id,
    name: xss(folder.name)
})

foldersRouter
    .route('/')
    .get((req, res, next) => {
        FoldersService.getAllFolders(
            req.app.get('db')
        )
            .then(folders => {
                res.json(folders.map(sanitizeResponse))
            })
            .catch(next)
    })
    .post(jsonParser, (req, res, next) => {
        const { name } = req.body;
        const newFolder = { name };

        if (newFolder.name == null) {
            return res.status(400).json({
                error: { message: `Missing 'name' in request body` }
            })
        }

        FoldersService.insertFolder(
            req.app.get('db'),
            newFolder
        )
            .then(folder => {
                res
                    .status(201)
                    .location(path.posix.join(req.originalUrl, `/${folder.id}`))
                    .json(sanitizeResponse(folder))
            })
            .catch(next)
    })

foldersRouter
    .route('/:folder_id')
    .all((req, res, next) => {
        FoldersService.getById(
            req.app.get('db'),
            req.params.folder_id
        )
            .then(folder => {
                if (!folder) {
                    return res.status(404).json({
                        error: { message: `Folder doesn't exist` }
                    })
                }
                res.folder = folder
                next()
            })
            .catch(next)
    })
    .get((req, res, next) => {
        res.json(sanitizeResponse(res.folder))
    })
    .delete((req, res, next) => {
        res.status(204).end()
        FoldersService.deleteFolder(
            req.app.get('db'),
            req.params.folder_id
        )
            .then(() => {
                res.status(204).end()
            })
            .catch(next)
    })
    .patch(jsonParser, (req, res, next) => {
        const { name } = req.body;
        
        if (!name) {
            return res.status(400).json({
                error: { message: `Request body must contain 'name'` }
            })
        }

        FoldersService.updateFolder(
            req.app.get('db'),
            req.params.folder_id,
            name
        )
            .then(numRowsAffected => {
                res.status(204).end()
            })
            .catch(next)
    })

module.exports = foldersRouter;