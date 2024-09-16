const express = require("express");
const app = express();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const port = process.env.PORT || 4000;

app.use(express.json());

// Configure CORS to accept requests only from your frontend URL
const corsOptions = {
  origin: 'https://fullstackfrontend-1.onrender.com', // Your frontend URL
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Database Connection With MongoDB
mongoose.connect("mongodb+srv://MajorProject:RuhabDolly@cluster0.ugsi8.mongodb.net/e-commerce", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Image Storage Engine
const storage = multer.diskStorage({
  destination: './upload/images',
  filename: (req, file, cb) => {
    return cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ storage: storage });

app.post("/upload", upload.single('product'), (req, res) => {
  res.json({
    success: 1,
    image_url: `/images/${req.file.filename}`
  });
});

// Route for Images folder
app.use('/images', express.static('upload/images'));

// Middleware to fetch user from token
const fetchuser = async (req, res, next) => {
  const token = req.header("auth-token");
  if (!token) {
    return res.status(401).send({ errors: "Please authenticate using a valid token" });
  }
  try {
    const data = jwt.verify(token, "secret_ecom");
    req.user = data.user;
    next();
  } catch (error) {
    return res.status(401).send({ errors: "Please authenticate using a valid token" });
  }
};

// Schema for creating user model
const Users = mongoose.model("Users", {
  name: { type: String },
  email: { type: String, unique: true },
  password: { type: String },
  cartData: { type: Object },
  date: { type: Date, default: Date.now() },
});

// Schema for creating Product
const Product = mongoose.model("Product", {
  id: { type: Number, required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String, required: true },
  category: { type: String, required: true },
  new_price: { type: Number },
  old_price: { type: Number },
  date: { type: Date, default: Date.now },
  available: { type: Boolean, default: true },
});

// ROOT API Route For Testing
app.get("/", (req, res) => {
  res.send("Root");
});

// Login Route
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  let user = await Users.findOne({ email });
  if (user && user.password === password) {
    const data = { user: { id: user._id } };
    const token = jwt.sign(data, 'secret_ecom');
    res.json({ success: true, token });
  } else {
    res.status(400).json({ success: false, errors: "Invalid email or password" });
  }
});

// Signup Route
app.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;
  if (await Users.findOne({ email })) {
    return res.status(400).json({ success: false, errors: "User already exists with this email" });
  }
  const cart = Array(300).fill(0);
  const user = new Users({ name: username, email, password, cartData: cart });
  await user.save();
  const token = jwt.sign({ user: { id: user._id } }, 'secret_ecom');
  res.json({ success: true, token });
});

// Get All Products
app.get("/allproducts", async (req, res) => {
  try {
    const products = await Product.find({});
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// Get New Collections
app.get("/newcollections", async (req, res) => {
  try {
    const products = await Product.find({});
    const newCollections = products.slice(-8);
    res.json(newCollections);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch new collections" });
  }
});

// Get Popular Women's Products
app.get("/popularinwomen", async (req, res) => {
  try {
    const products = await Product.find({ category: "women" });
    const popularProducts = products.slice(0, 4);
    res.json(popularProducts);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch popular women's products" });
  }
});

// Get Related Products
app.post("/relatedproducts", async (req, res) => {
  const { category } = req.body;
  try {
    const products = await Product.find({ category });
    const relatedProducts = products.slice(0, 4);
    res.json(relatedProducts);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch related products" });
  }
});

// Add to Cart
app.post('/addtocart', fetchuser, async (req, res) => {
  const { itemId } = req.body;
  try {
    const userData = await Users.findOne({ _id: req.user.id });
    userData.cartData[itemId] = (userData.cartData[itemId] || 0) + 1;
    await Users.findOneAndUpdate({ _id: req.user.id }, { cartData: userData.cartData });
    res.send("Added");
  } catch (err) {
    res.status(500).json({ error: "Failed to add item to cart" });
  }
});

// Remove from Cart
app.post('/removefromcart', fetchuser, async (req, res) => {
  const { itemId } = req.body;
  try {
    const userData = await Users.findOne({ _id: req.user.id });
    if (userData.cartData[itemId] > 0) {
      userData.cartData[itemId] -= 1;
      await Users.findOneAndUpdate({ _id: req.user.id }, { cartData: userData.cartData });
    }
    res.send("Removed");
  } catch (err) {
    res.status(500).json({ error: "Failed to remove item from cart" });
  }
});

// Get Cart Data
app.post('/getcart', fetchuser, async (req, res) => {
  try {
    const userData = await Users.findOne({ _id: req.user.id });
    res.json(userData.cartData);
  } catch (err) {
    res.status(500).json({ error: "Failed to get cart data" });
  }
});

// Add Product (Admin)
app.post("/addproduct", async (req, res) => {
  try {
    const products = await Product.find({});
    const id = products.length > 0 ? products[products.length - 1].id + 1 : 1;
    const product = new Product({
      id,
      name: req.body.name,
      description: req.body.description,
      image: req.body.image,
      category: req.body.category,
      new_price: req.body.new_price,
      old_price: req.body.old_price,
    });
    await product.save();
    res.json({ success: true, name: req.body.name });
  } catch (err) {
    res.status(500).json({ error: "Failed to add product" });
  }
});

// Remove Product (Admin)
app.post("/removeproduct", async (req, res) => {
  try {
    await Product.findOneAndDelete({ id: req.body.id });
    res.json({ success: true, name: req.body.name });
  } catch (err) {
    res.status(500).json({ error: "Failed to remove product" });
  }
});

// Start Express Server
app.listen(port, () => {
  console.log("Server Running on port " + port);
});
