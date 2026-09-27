const resumeParseController = require('../controller/resumeParse.controller')
const express = require('express')
const multer = require('multer');

const router = express.Router();

const uploadFile = multer({
    storage: multer.memoryStorage()
});

router.get('/Job-Description',resumeParseController.getJD)
router.post('/addJobDescription', resumeParseController.storeJD);

router.post(
  '/generateProfile',
  uploadFile.fields([
    { name: 'resume', maxCount: 1 },
    { name: 'photo', maxCount: 1 },
  ]),
  resumeParseController.generateProfile
);

module.exports = router;