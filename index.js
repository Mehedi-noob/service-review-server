const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) =>{
    res.send('the server is running');
})

app.listen(port, () =>{
    console.log(`the server is running on ${port}`);
})