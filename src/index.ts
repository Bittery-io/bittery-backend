import express = require('express');
import routes from './routes';
import bodyParser from 'body-parser';
import { authorizeRequest } from './domain/services/auth/access-authorization-service';

// Create a new express app instance
const app: express.Application = express();
app.use(bodyParser.json());
app.use(async (req, resp, next) => {
    await authorizeRequest(req, resp, next);
});
app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.listen(3000,   () => {
    console.log('App is listening on port 3000!');
});

app.use('/', routes);
exports.express = app;
