const express = require('express');
const cors = require('cors');
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const port = process.env.PORT || 5000;
const app = express();


app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.jypts.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    const jobsCollection = client.db('job-solution').collection('jobs');
    const bidCollection = client.db('job-solution').collection('bid')

    app.post('/add-job', async (req, res) => {
      const query = req.body;
      const result = await jobsCollection.insertOne(query);
      res.send(result)
    });

    app.get('/jobs', async (req, res) => {
      const result = await jobsCollection.find().toArray();
      res.send(result)
    });

    app.get('/job/:email', async (req, res) => {
      const email = req.params.email;
      const query = { 'buyer.email': email };
      const result = await jobsCollection.find(query).toArray();
      res.send(result)
    });

    app.delete('/job/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await jobsCollection.deleteOne(query);
      res.send(result)
    })


    app.get('/jobs/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await jobsCollection.findOne(query);
      res.send(result)
    })

    app.put('/update-job/:id', async (req, res) => {
      const id = req.params.id;
      const jobData = req.body;
      const query = { _id: new ObjectId(id) };
      const updateData = {
        $set: jobData
      }
      const options = { upsert: true }
      const result = await jobsCollection.updateOne(query, updateData, options);
      res.send(result)
    })

    // for bid collection

    app.post('/add-bid', async (req, res) => {
      const bidData = req.body;
      // user and id deya check
      const query = { email: bidData.email, jobId: bidData.jobId }
      const alreadyExist = await bidCollection.findOne(query)
      if (alreadyExist) {
        return res.status(400).send('You Have Already Bid This Job')
      }
      // for update bid count
      const filter = { _id: new ObjectId(bidData.jobId) }
      const update = {
        $inc: { bid_count: 1 }
      }
      const updateData = await jobsCollection.updateOne(filter, update)
      const result = await bidCollection.insertOne(bidData);
      res.send(result)
    })

    app.get('/bids/:email', async (req, res) => {
      const email = req.params.email;
      // const isBuyer = req.query.buyer;
      // const query = {};
      // if(isBuyer){
      //   query.buyer = email
      // }else{
      //   query.email = email
      // }
      const query = { email }
      const result = await bidCollection.find(query).toArray();
      res.send(result)
    })

    app.get('/bidsRequest/:email', async (req, res) => {
      const email = req.params.email;
      const query = { buyer: email }
      const result = await bidCollection.find(query).toArray();
      res.send(result)
    })

    app.patch('/bidStatusUpdated/:id', async (req, res) => {
      const id = req.params.id;
      const { status } = req.body;
      const filter = { _id: new ObjectId(id) }
      const updated = {
        $set: { status }
      }
      const result = await bidCollection.updateOne(filter, updated)
      res.send(result)
    });

    app.get('/allJobs', async (req, res) => {
      const filter = req.query.filter;
      const search = req.query.search;
      const sort = req.query.sort;

      let options = {};
      if (sort) options = { sort: { date: sort === 'dsc' ? 1 : -1 } }

      let query = {
        title: {
          $regex: search, $options: 'i'
        }
      };

      if (filter) query.category = filter
      const result = await jobsCollection.find(query, options).toArray();
      res.send(result)
    })

    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
  res.send('This Job Solution is running')
})

app.listen(port, () => {
  console.log(`This sob solution port is running this port: ${port}`)
})