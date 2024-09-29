const express = require('express')
const cors = require('cors')
require('dotenv').config()
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const port = process.env.PORT || 5000;
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { status } = require('express/lib/response')



app.use
  (cors({

    origin: [
      'https://dailyfish-f4d41.firebaseapp.com',
      'https://dailyfish-f4d41.web.app',
      'http://localhost:5173',
     
   
    ],
    credentials: true,


  }))

  app.use(express.json())
app.use(cookieParser())



const verifyToken = (req, res, next) => {
    const token = req.cookies?.token
    if (!token) return res.status(401).send({ message: 'unauthorized access' })
    if (token) {
      jwt.verify(token, process.env.TOKEN_SECRET, (err, decoded) => {
        if (err) {
          console.log(err)
          return res.status(401).send({ message: 'unauthorized access' })
        }
       
  
        req.user = decoded
        next()
      })
    }
  }
  







let uri =
  `mongodb+srv://${process.env.USER}:${process.env.PASSWORD}@cluster0.ngsjczb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });

async function run() {
  try {
    // await client.connect();


    const userCollection = client.db('dailyFish').collection('userInfo')
    const fishCollection = client.db('dailyFish').collection('fishInfo')
    const cartCollection = client.db('dailyFish').collection('cartInfo')
    const orderCollection = client.db('dailyFish').collection('orderInfo')
    const reviewCollection = client.db('dailyFish').collection('review')
    const settingCollection = client.db('dailyFish').collection('setting')
    const blogsCollection = client.db('dailyFish').collection('blogs')
    const contactCollection = client.db('dailyFish').collection('contactMessage')

    const verifyOwner= async (req, res, next) => {

      const user = req?.user?.userEmail
      const query = { userEmail: user }

      const result = await userCollection.findOne(query)

   

  
      if (!result || result?.userRole !== 'owner')
        return res.status(403).send({ message: 'Forbidden access!!' })
  
      next()
    }
    const verifyManager= async (req, res, next) => {

      const user = req?.user?.userEmail
      const query = { userEmail: user }

      const result = await userCollection.findOne(query)

   

  
      if (!result || result?.userRole !== 'manager')
        return res.status(403).send({ message: 'Forbidden access!!' })
  
      next()
    }
    const verifyEmployee= async (req, res, next) => {

      const user = req?.user?.userEmail
      const query = { userEmail: user }

      const result = await userCollection.findOne(query)

   

  
      if (!result || result?.userRole !== 'employee')
        return res.status(403).send({ message: 'Forbidden access!!' })
  
      next()
    }
    const verifyAll = async (req, res, next) => {
      const user = req?.user?.userEmail;
      const query = { userEmail: user };
    
      const result = await userCollection.findOne(query);
    
      if (!result || !['employee', 'manager', 'owner', 'developer'].includes(result?.userRole)) {
        return res.status(403).send({ message: 'Forbidden access!!' });
      }
    
      next();
    };
    const verifyAuthor = async (req, res, next) => {
      const user = req?.user?.userEmail;
      const query = { userEmail: user };
    
      const result = await userCollection.findOne(query);
    
      if (!result || !['developer', 'manager', 'owner'].includes(result?.userRole)) {
        return res.status(403).send({ message: 'Forbidden access!!' });
      }
    
      next();
    };
    const verifySpecial = async (req, res, next) => {
      const user = req?.user?.userEmail;
      const query = { userEmail: user };
    
      const result = await userCollection.findOne(query);
    
      if (!result || !['developer',  'owner'].includes(result?.userRole)) {
        return res.status(403).send({ message: 'Forbidden access!!' });
      }
    
      next();
    };
    

  

 
 

  
  
  




    app.post('/jwt', async (req, res) => {
      const email = req.body;
  
      const token = jwt.sign(email, process.env.TOKEN_SECRET, {
        expiresIn: '365d',
      })
      res
        .cookie('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production' ? true : false,
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        })
        .send({ success: true })
    })


    app.get('/logout', (req, res) => {
      res
        .clearCookie('token', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
          maxAge: 0,
        })
        .send({ success: true })
    })


// users related api start

// save user

app.post('/saveUser', async (req, res)=>{





const userInfo = req.body;
const userEmail = userInfo.userEmail;
const query = {userEmail: userEmail}
const isExist = await userCollection.findOne(query)
if(isExist){
  return res.send(isExist)
}

const result = await userCollection.insertOne(userInfo);
res.send(result)



})
// getUser
app.get('/getUser/:email', async (req, res) => {
  const userEmail = req.params.email;
  const query = { userEmail: userEmail };
  const result = await userCollection.findOne(query);

  res.send(result);
});



// users related api end


// cumpany dashboard related api start

// add fish


app.post('/addFish',verifyToken, verifyAuthor, async (req, res)=>{

const fishInfo = req.body;

const result = await fishCollection.insertOne(fishInfo);
res.send(result)


})


// Backend API endpoint for fetching paginated fish data
app.get('/getFishTwo', async (req, res) => {


  const { skip = 0, limit = 10, type, search = '' } = req.query;
  const skipNum = parseInt(skip);
  const limitNum = parseInt(limit);


  
  // Construct the query
  let query = {};
  if (type) {
    query.type = type;
  }

  // If there's a search term, use regex to search by productName
  if (search) {
    query.productName = { $regex: search, $options: 'i' }; // 'i' makes the search case-insensitive
  }

  try {
    // Fetch the fish data with search, filter, and pagination
    const result = await fishCollection.find(query).skip(skipNum).limit(limitNum).toArray();
    res.json({ data: result });
  } catch (error) {
    console.error("Error fetching fish data:", error);
    res.status(500).json({ message: 'Failed to fetch fish data', error });
  }
});

app.get('/fishDetails/:id', async(req, res)=>{

const id = req.params.id;

const query = {_id: new ObjectId(id)};
const result = await fishCollection.findOne(query);

res.send(result)

})

app.get('/truck/:email', verifyToken, async(req,res)=>{

const email = req.params.email;

const query = {
  email: email
}

const result = await orderCollection.find(query).toArray();
res.send(result)


})




app.get('/getFish',async(req,res)=>{

  
  const result = await fishCollection.find().toArray();

  res.send(result)

})


app.delete('/delete/:id',verifyToken, verifyAll, async(req, res)=>{

const id = req.params.id;
const query = {_id: new ObjectId(id)}
const result = await fishCollection.deleteOne(query)
res.send(result)

})

app.put('/update/:id',verifyToken, verifyAll, async(req, res)=>{

const id = req.params.id;
const query = {_id: new ObjectId(id)}
const updateData = req.body;
const update = {
  $set: {
    productPrice: updateData.productPrice,
    discount: updateData.discount,
    description: updateData.description,
    type: updateData.type,
    updatedBy: updateData.email,
    updatedAt: new Date(),
    stockStatus: updateData.stockStatus
  }
};
const result = await fishCollection.updateOne(query, update);
res.send(result)
})

app.post('/addCart', async (req, res) => {
  const cartInfo = req.body;
  const id = cartInfo.id;
 
  const userEmail = cartInfo?.email
  const query = {id: id,
    email: userEmail
  }
  try {

    const isExist = await cartCollection.findOne(query);
    if(isExist){
      res.send({message:"file already added to cart"})
      return
    }
      const result = await cartCollection.insertOne(cartInfo);
      res.send(result);
  } catch (error) {
      res.status(500).send({ message: 'Failed to add to cart', error });
  }
});
app.get('/fishCart/:email', async(req,res)=>{

const email = req.params.email;
const query = {email: email}
const result = await cartCollection.find(query).toArray()
res.send(result)


})

app.delete('/removeCart/:id', async(req, res)=>{

const id = req.params.id;
const email = req.query.email;

const query = {
  id: id,
  email:email


}
const result = await cartCollection.deleteOne(query)
res.send(result)

})

app.post('/fetchFishItems', async (req, res) => {
  const { cartItems } = req.body;
  const objectIds = cartItems.map(id => new ObjectId(id));
  const query = { _id: { $in: objectIds } };

  try {
    const fishItems = await fishCollection.find(query).toArray();
    res.json(fishItems);
  } catch (error) {
    console.error("Error fetching fish items:", error);
    res.status(500).json({ message: 'Failed to fetch fish items', error });
  }
});

app.get('/countFish', async (req, res) => {
  const { type, search = '' } = req.query;

  // Construct the query
  let query = {};
  if (type) {
    query.type = type;
  }

  // If there's a search term, use regex to search by productName
  if (search) {
    query.productName = { $regex: search, $options: 'i' }; // 'i' makes the search case-insensitive
  }

  try {
    // Count the number of fish documents that match the query
    const result = await fishCollection.countDocuments(query);
    res.json({ count: result });
  } catch (error) {
    console.error("Error counting fish documents:", error);
    res.status(500).json({ message: 'Failed to count fish documents', error });
  }
});



app.get('/pendingCount', verifyToken, verifyAll, async(req, res)=>{

  const query = {
    status: "pending"
  }
  const result = await orderCollection.countDocuments(query);
  res.send({count: result})
  
  })
app.get('/doneCount', verifyToken, verifyAll, async(req, res)=>{

  const query = {
    status: "done"
  }
  const result = await orderCollection.countDocuments(query);
  res.send({count: result})
  
  })
app.get('/courier', verifyToken, verifyAll, async(req, res)=>{

  const query = {
    status: "courier"
  }
  const result = await orderCollection.countDocuments(query);
  res.send({count: result})
  
  })
app.get('/confirmed', verifyToken, verifyAll, async(req, res)=>{

  const query = {
    status: "confirmed"
  }
  const result = await orderCollection.countDocuments(query);
  res.send({count: result})
  
  })

// save order info


app.post('/saveOrder', async (req, res) => {
  const orderInfo = req.body;
  
  // Convert productIds to ObjectId array
  const productIds = orderInfo.productIds.map(id => new ObjectId(id));

  const query = {
    email: orderInfo.email,
    _id: { $in: productIds }
  };
  

  
  const result = await orderCollection.insertOne(orderInfo);
  res.send(result);
  
  if (result.insertedId) {
    await cartCollection.deleteMany(query);
  }
});
app.get('/allUsers', async (req, res) => {
  const search = req.query.search || ''; // search value from query
  const skip = parseInt(req.query.skip) || 0; // skip value for pagination
  const limit = parseInt(req.query.limit) || 15; // limit value for pagination

  const query = {
    $or: [
      { userEmail: { $regex: search, $options: 'i' } },
      { userName: { $regex: search, $options: 'i' } },
    ],
  };

  const users = await userCollection.find(query).skip(skip).limit(limit).toArray();
  const total = await userCollection.countDocuments(query);

  res.send({ users, total });
});

app.get('/countUsers', async (req, res) => {
  const total = await userCollection.countDocuments();
  res.send({ count: total });
});
app.put('/updateUserRole/:id', async (req, res) => {
  const userId = req.params.id;
  const { role, mobileNumber } = req.body; // role sent from frontend
  
  const result = await userCollection.updateOne(
    { _id: new ObjectId(userId) }, // Find user by ID
    { $set: { userRole: role,
      mobileNumber: mobileNumber
     } } // Update the role
  );
  
  res.send(result);
});

app.get('/orderInfo',verifyToken, verifyAll, async (req,res)=>{
  const query = {
    status: "pending"}
  const result = await orderCollection.find(query).toArray()
  res.send(result)
})



app.get('/pendeingDelevery', verifyToken, verifyAll, async (req, res) => {
  const filterStatus = req.query.filter;
  const page = parseInt(req.query.page) || 1; // Get the current page, default to 1
  const limit = parseInt(req.query.limit) || 10; // Set a default limit of 10 items per page
  const skip = (page - 1) * limit; // Calculate how many items to skip
  
  let query;
  if (filterStatus === "all") {
    query = {};
  } else {
    query = { status: filterStatus };
  }

  // Get total count of documents for pagination
  const totalCount = await orderCollection.countDocuments(query);
  
  // Fetch only the required page of results
  const result = await orderCollection
    .find(query)
    .skip(skip)
    .limit(limit)
    .toArray();
  
  res.send({
    data: result,
    totalCount, // Send the total count of items to the frontend for pagination
  });
});



app.get('/totalPendingDelevery', async(req, res)=>{

  const query = {
    status: { $in: ["confirmed", "done", "courier"] }
  }
  const result = await orderCollection.countDocuments(query);
  res.send({count: result})
})








app.put('/updateStatus/:id', async (req, res) => {
  const status = req.query.status;
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const updateData = { $set: { status: status } }; // Use $set to update the field

  try {
    const result = await orderCollection.updateOne(query, updateData);
    res.send(result);
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).send('Error updating status');
  }
});

// user setting

app.get('/employeerSetting',verifyToken,verifySpecial, async (req, res) => {
  try {
    const query = {
      userRole: { $in: ["developer", "owner", "manager", "employee"] }
    };

    // Assuming userCollection is a properly initialized MongoDB collection
    const result = await userCollection.find(query).toArray();
    
    res.send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});


app.put('/updateRole', verifySpecial, async(req, res)=>{

  const userRole = req.params.userRole;
  const email = req.query.email;

  const query = {
    userEmail: email
  }
  const updatedDoc = {

    $set:{
      userRole: userRole
    }
  }

const result = await userCollection.updateOne(query, updatedDoc)

})

app.post('/review', verifyToken, async(req, res)=>{

const reviewDetails = req.body;
const result = await reviewCollection.insertOne(reviewDetails);
res.send(result)

})

app.get('/review', async (req, res) => {
  const { page = 1, limit = 5 } = req.query; // Default to page 1 and limit 5
  const skip = (page - 1) * limit;

  try {
    const result = await reviewCollection.find().skip(parseInt(skip)).limit(parseInt(limit)).toArray();
    const totalCount = await reviewCollection.countDocuments(); // Total number of reviews
    res.send({ result, totalCount });
  } catch (error) {
    res.status(500).send({ error: 'Failed to fetch reviews' });
  }
});

app.delete('/review/:id', verifyToken, verifyAll, async(req, res)=>{
const id = req.params.id;
const query = {_id : new ObjectId(id)};
const result = await reviewCollection.deleteOne(query);
res.send(result)

})

// blogs related api
app.get('/blogCount', async(req,res)=>{
  const result = await blogsCollection.countDocuments()
  res.send({count:result})
})

app.post('/blog', verifyToken, async(req, res)=>{

  const blog = req.body;
  const result = await blogsCollection.insertOne(blog);
  res.send(result)

})

app.get('/blog', async(req, res)=> {

  const skip = parseInt(req.query.skip);
  const limit = parseInt(req.query.limit)

  
const result =await blogsCollection.find().skip(skip).limit(limit).toArray();
res.send(result)


} )
app.delete('/blog/:id', verifyToken, async (req, res) => {
  try {
    const id = req.params.id;

    const query = { _id: new ObjectId(id) };  // Use _id instead of id
    const result = await blogsCollection.deleteOne(query);
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});




app.get('/blogDetails/:id', async(req, res)=>{
  try {
    const id = req.params.id;
    const query = {_id: new ObjectId(id)}
    const result = await blogsCollection.findOne(query);
    res.send(result)
  } catch (error) {
    res.status(500).send({error:error.message})
  }
})

app.post('/blogComment/:id', async(req, res)=>{
 try {
  const id = req.params.id;
  const query = {_id: new ObjectId(id)};
  const { userEmail, userName, userPhoto, commentText, commentDate } = req.body;
  const newComment = {
    _id : new ObjectId(),
    userEmail,
    userName,
    userPhoto,
    commentText,
    commentDate
  }
  const option = {$push:{comment: newComment}}
  const result = await blogsCollection.updateOne(query, option);
  res.send(result)
 } catch (error) {
  res.status(500).send({error:error.message})
 }
})

app.delete('/blogComment/:blogId/:commentId', verifyToken, async (req, res) => {
  const { blogId, commentId } = req.params;
  console.log(blogId, commentId, "hit");

  try {
    const filter = { _id: new ObjectId(blogId) };
    const update = { $pull: { comment: { _id: new ObjectId(commentId) } } }; // Remove comment by _id

    const result = await blogsCollection.updateOne(filter, update);

   res.send(result)
  } catch (error) {
    res.status(500).send({ message: 'Failed to delete the comment', error });
  }
});


// contact option

app.post('/contact', async(req,res)=>{
try {
  const contacntInfo = req.body;
  const result = await  contactCollection.insertOne(contacntInfo);
  res.send(result)
} catch (error) {
  return res.status(500).send({error: error.message})
}
})

// app.put('/setting', async (req, res) => {
//   const { bannerImg, font } = req.body;  // Using req.body to capture data
//   const settingId = "66f2ec3704bb22c39dbd3e0d";  // Your specific document _id

//   try {
//     const filter = { _id: new ObjectId(settingId) };
//     const updateFields = {};

//     if (font) {
//       updateFields.font = font; // Update the font field if it's provided
//     }

//     if (bannerImg) {
//       updateFields.bannerImg = bannerImg; // Update the bannerImg field if it's provided
//     }

//     // Check if there's anything to update
//     if (Object.keys(updateFields).length > 0) {
//       const updateDoc = {
//         $set: updateFields,
//       };

//       const result = await settingCollection.updateOne(filter, updateDoc);

//       if (result.matchedCount === 1) {
//         res.status(200).json({ message: 'Settings updated successfully', result });
//       } else {
//         res.status(404).json({ message: 'Settings not found' });
//       }
//     } else {
//       res.status(400).json({ message: 'No fields provided for update' });
//     }
//   } catch (error) {
//     console.error("Error updating settings:", error);
//     res.status(500).json({ message: 'Internal server error', error });
//   }
// })


// cumpany dashboard related api end

    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {

    res.send('daily fish server side done')
  })
  
  
  app.listen(port, () => {
  
    console.log(`this port is ${port}`);
  
  })