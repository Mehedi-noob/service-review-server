const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


//mongodb start

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.rh6ekch.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

// jwt start 
function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).send({ message: 'Authorization denied' });
    }
    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Access denied' });
        }
        req.decoded = decoded;
        next();
    })
}
// jwt end 


async function run() {
    try {
        // servers collection 
        const serviceCollection = client.db('SNservice').collection('services');

        // reviews collection 
        const reviewCollection = client.db('SNservice').collection('reviews');

        // jwt creation 
        app.post('/jwt', (req, res) =>{
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '7d'})
            res.send({token})
        }) 


        // services api
        app.get('/services', async (req, res) => {
            const query = {};
            const cursor = serviceCollection.find(query).sort({ _id: -1 });
            const services = await cursor.toArray();
            res.send(services);
        });

        app.get('/serviceDemo', async (req, res) => {
            const query = {};
            const cursor = serviceCollection.find(query).limit(3).sort({ _id: -1 });
            const services = await cursor.toArray();
            res.send(services);
        });

        app.post('/services', async (req, res) => {
            const review = req.body;
            const result = await serviceCollection.insertOne(review);
            res.send(result);
        });

        app.get('/services/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const service = await serviceCollection.findOne(query);
            res.send(service);
        });

        // reviews api
        app.get('/reviews', async (req, res) => {
            let query = {};
            if (req.query._id) {
                query = {
                    _id: ObjectId(req.query._id)
                }
            }
            const cursor = reviewCollection.find(query);
            const reviews = await cursor.toArray();
            res.send(reviews);
        });
        app.get('/myreviews',verifyJWT, async (req, res) => {
            const decoded = req.decoded;
            
            if(decoded.email !== req.query.email){
                res.status(403).send({message: 'unauthorized access'})
            }

            let query = {};
            if (req.query.email) {
                query = {
                    email: req.query.email
                }
            }
            const cursor = reviewCollection.find(query).sort({ date: -1 });
            const reviews = await cursor.toArray();
            res.send(reviews);
        });

        app.post('/reviews', async (req, res) => {
            const review = req.body;
            const result = await reviewCollection.insertOne(review);
            res.send(result);
        });

        app.get('/reviews/:id', async (req, res) => {
            const id = req.params.id;
            const query = { service: id };
            const review = await reviewCollection.find(query).sort({ date: -1 }).toArray();
            res.send(review);
        });

        app.patch('/reviews/:id', async (req, res) => {
            const id = req.params.id;
            const upReview = req.body.review;
            const query = { _id: ObjectId(id) };
            const updatedCol = {
                $set: {
                    review: upReview
                }
            }
            const result = await reviewCollection.updateOne(query, updatedCol);
            res.send(result);
        });

        app.delete('/reviews/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await reviewCollection.deleteOne(query);
            res.send(result);
        })

    }
    finally {

    }
}
run().catch(error => console.error(error));
// mongodb end

app.get('/', (req, res) => {
    res.send('the server is running');
})

app.listen(port, () => {
    console.log(`the server is running on ${port}`);
})