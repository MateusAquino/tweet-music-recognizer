const router = require('express').Router();
const AuthMiddleware = require('./middleware/Auth');

const Administration = require('./controllers/Administration');

router.get('/', (req, res) => res.send('This application is online.'));
router.get('/adm', AuthMiddleware, Administration.userInterface);
router.post('/adm', AuthMiddleware, Administration.setConfigs);

module.exports = router;