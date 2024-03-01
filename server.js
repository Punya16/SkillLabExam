import express from "express";
import mongoose from "mongoose";

const app = express();

app.use(express.json());

const port = 3000;

const mongoURI = "mongodb://0.0.0.0:27017/Food";

mongoose.connect(mongoURI);

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'mongoose connection error'));

db.once('open', () => {
    console.log('connected to mongodb');
});

// Define Schemas
const userSchema = new mongoose.Schema({
    email: String,
    name: String,
    role: { type: String, enum: ['admin', 'superuser', 'user'] }
});

const foodSchema = new mongoose.Schema({
    name: String,
    description: String,
    price: Number,
    image: String,
    category: { type: String, enum: ['veg', 'non-veg', 'dessert'] }
});

const orderSchema = new mongoose.Schema({
    foodId: { type: mongoose.Schema.Types.ObjectId, ref: 'Food' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    orderId: String,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    status: String,
    addressId: String,
    paymentMode: { type: String, enum: ['cash', 'card', 'UPI'] },
    feedback: {
        rating: { type: Number, min: 1, max: 5 },
        image: String,
        textFileData: String
    },
    invoiceId: String,
    paymentDetails: Object // Store payment gateway details
});

const User = mongoose.model('User', userSchema);
const Food = mongoose.model('Food', foodSchema);
const Order = mongoose.model('Order', orderSchema);

// Routes
// User registration endpoint 
app.post('/api/register', async (req, res) => {
    try {
        const { email, name, role } = req.body;
        const newUser = new User({ email, name, role });
        await newUser.save();
        res.json(newUser);
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Get list of food items
app.get('/api/food', async (req, res) => {
    try {
        const foods = await Food.find();
        res.json(foods);
    } catch (error) {
        console.error('Error fetching food items:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Filter food items by category
app.get('/api/food/category/:category', async (req, res) => {
    const { category } = req.params;
    try {
        const foods = await Food.find({ category });
        res.json(foods);
    } catch (error) {
        console.error('Error fetching food items by category:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Search food items by name
app.get('/api/food/search/:name', async (req, res) => {
    const { name } = req.params;
    try {
        const foods = await Food.find({ name: { $regex: name, $options: 'i' } });
        res.json(foods);
    } catch (error) {
        console.error('Error searching food items:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Place order
app.post('/api/order', async (req, res) => {
    try {
        const { foodId, userId, addressId, paymentMode } = req.body;
        const newOrder = new Order({ foodId, userId, addressId, paymentMode });
        await newOrder.save();
        res.json(newOrder);
    } catch (error) {
        console.error('Error placing order:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Provide feedback
app.put('/api/order/feedback/:orderId', async (req, res) => {
    const { orderId } = req.params;
    try {
        const { rating, image, textFileData } = req.body;
        const updatedOrder = await Order.findOneAndUpdate({ orderId }, { feedback: { rating, image, textFileData } }, { new: true });
        res.json(updatedOrder);
    } catch (error) {
        console.error('Error providing feedback:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Payment gateway integration (for test users)
app.post('/api/payment', async (req, res) => {
    try {
        // Integrate with payment gateway and get payment details
        const paymentDetails = req.body.paymentDetails; 
        const { orderId, userId } = req.body;
        const updatedOrder = await Order.findOneAndUpdate({ orderId, userId }, { paymentDetails }, { new: true });
        res.json(updatedOrder);
    } catch (error) {
        console.error('Error processing payment:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(port, () => {
    console.log('Server is running on port', port);
});
