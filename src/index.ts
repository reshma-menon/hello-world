import * as express from 'express';
import * as bodyParser from 'body-parser';
import { db } from './connection';
const app = express();
app.use(bodyParser.json({ limit: '50mb', type: 'application/json' })); // support json encoded bodies

app.post('/member', async (request, response) => {
    const data = request.body;
    if (data && data.name) {
        try {
            const member = await db.one(`
            INSERT INTO family.member 
            (name, data) 
            VALUES ('${data.name}', $_str_$${JSON.stringify(data)}$_str_$) 
            RETURNING id
        `);
            response.json({ success: true, member });
        } catch (e) {
            console.log(e);
            response.json({ success: false, error: e.toString() });
        }
    } else {
        response.json({ success: false, error: 'Invalid data!' });
    }
});



const port = process.env.NODE_PORT || 3000;
app.listen(port, () => console.log(`Express app is running on port ${port}`));
