require('dotenv').config();
const tf = require('@tensorflow/tfjs-node');
const fetch = require('node-fetch');
const admin = require('firebase-admin');
const cloudinary = require('cloudinary').v2;
const express = require("express")
const CloudinaryConfig= require("./cloudinaryConfig.json")
cloudinary.config(CloudinaryConfig);
const fs = require('fs');
const path = require('path');
const serviceAccount = require('./agriguard-97c2d-firebase-adminsdk-1foty-64214d77ae.json'); // Service account JSON for Firebase
const {
  esp32CamUrl,
  lowerRed,
  lowerYellow,
  upperRed,
  upperYellow,
  cropBottom,
  cropLeft,
  cropRight,
  cropTop,
  isCroppedImageToBeSaved,
  isesp32camImageToBeSaved,
} = require('./constants.cjs');

// Initialize Firebase Admin SDK
admin.initializeApp({
credential:admin.credential.cert(serviceAccount),
  apiKey: "AIzaSyAIAhWqOYzxDP84Rvzqj1PNmOHwznubSKk",
  authDomain: "agriguard-97c2d.firebaseapp.com",
  projectId: "agriguard-97c2d",
  storageBucket: "agriguard-97c2d.firebasestorage.app",
  messagingSenderId: "191933093962",
  appId: "1:191933093962:web:99b1f12ae65c8be461aeb3"
}
);

const db = admin.firestore(); // Access Firestore via admin.something
const cors=require("cors")

// Function to save cropped image as a .jpeg file
const saveCroppedImage = async (croppedTensor, filename) => {
  try {
    // Convert the tensor to a JPEG buffer
    const jpegBuffer = await tf.node.encodeJpeg(croppedTensor);

    // Define the file path
    const filepath = path.resolve(__dirname, filename);

    // Ensure the directory exists
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Save the JPEG buffer to the file system
    await fs.promises.writeFile(filepath, jpegBuffer);
    console.log(`Cropped image saved as ${filepath}`);
  } catch (error) {
    console.error('Error saving cropped image:', error);
  }
};


const activateSpray = async () => {
  try {
    const response = await fetch(`${esp32CamUrl}/spray`, { method: 'GET', headers: { Accept: 'text/plain' } });
    if (!response.ok) throw new Error(`Failed to activate spray: ${response.statusText}`);

    const body = await response.text();
    console.log(body); // "Spray activated!"

    // Update the Firestore database for last spray time and tank percentage
    await db.collection('devices').doc('device1').update({
      lastSpray: admin.firestore.FieldValue.serverTimestamp(), // Use server timestamp for consistency
      tankLevel: admin.firestore.FieldValue.increment(-.5), // Decrement the tank percentage
    });
  } catch (error) {
    console.error('Error activating spray:', error);
  }
};

const fetchImageFromESP32Cam = async () => {
  try {
    const response = await fetch(`${esp32CamUrl}/capture`, { method: 'GET', headers: { Accept: 'image/jpeg' } });
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);

    return await response.buffer();
  } catch (error) {
    console.error('Error fetching image from ESP32-CAM:', error);
    throw error;
  }
};

const uploadImageToCloudinary = async (imageBuffer) => {
  return new Promise((resolve, reject) => {
    // Upload the image to Cloudinary using the upload_stream method
    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: 'image' },
      (error, result) => {
        if (error) {
          console.error('Error uploading image to Cloudinary:', error);
          reject(error); // Reject the promise if there's an error
        } else {
          console.log('Uploaded image URL:', result.url); // URL to access the image
          resolve(result.url); // Resolve the promise with the image URL
        }
      }
    );

    // Pipe the image buffer to Cloudinary's stream
    uploadStream.end(imageBuffer); // End the stream with the image buffer
  });
};


const detectColor = async (imageBuffer) => {
  try {
      // Decode the image buffer to a tensor
      const imageTensor = tf.node.decodeImage(imageBuffer);

      // Check dimensions
      const [height, width, channels] = imageTensor.shape;
      if (channels !== 3) {
          throw new Error('Image must have 3 channels (RGB).');
      }

    
      // Calculate new dimensions
      const cropHeight = height - cropTop - cropBottom;
      const cropWidth = width - cropLeft - cropRight;

      if (cropHeight <= 0 || cropWidth <= 0) {
          throw new Error('Crop dimensions are invalid. Ensure the crop size is smaller than the image dimensions.');
      }

      // Crop the image
      const croppedImage = tf.slice(imageTensor, [cropTop, cropLeft, 0], [cropHeight, cropWidth, channels]);

      // Save the cropped image for debugging
      if(isCroppedImageToBeSaved)
       saveCroppedImage(croppedImage, 'cropped-image-debug.jpeg');

      // Normalize pixel values (optional)
      const normalizedImage = croppedImage.div(255);

      // Separate RGB channels
      const [red, green, blue] = tf.split(normalizedImage, 3, -1);

      // Create masks for yellow and red colors
      const yellowMask = tf.logicalAnd(
          tf.logicalAnd(
              tf.greaterEqual(red, tf.scalar(lowerYellow.r / 255)),
              tf.lessEqual(red, tf.scalar(upperYellow.r / 255))
          ),
          tf.logicalAnd(
              tf.logicalAnd(
                  tf.greaterEqual(green, tf.scalar(lowerYellow.g / 255)),
                  tf.lessEqual(green, tf.scalar(upperYellow.g / 255))
              ),
              tf.logicalAnd(
                  tf.greaterEqual(blue, tf.scalar(lowerYellow.b / 255)),
                  tf.lessEqual(blue, tf.scalar(upperYellow.b / 255))
              )
          )
      );
      
      const redMask = tf.logicalAnd(
          tf.logicalAnd(
              tf.greaterEqual(red, tf.scalar(lowerRed.r / 255)),
              tf.lessEqual(red, tf.scalar(upperRed.r / 255))
          ),
          tf.logicalAnd(
              tf.logicalAnd(
                  tf.greaterEqual(green, tf.scalar(lowerRed.g / 255)),
                  tf.lessEqual(green, tf.scalar(upperRed.g / 255))
              ),
              tf.logicalAnd(
                  tf.greaterEqual(blue, tf.scalar(lowerRed.b / 255)),
                  tf.lessEqual(blue, tf.scalar(upperRed.b / 255))
              )
          )
      );

      // Reduce masks to check if any pixel matches
      const yellowDetected = yellowMask.any().dataSync()[0];
      const redDetected = redMask.any().dataSync()[0];

     console.log(`Yellow : ${yellowDetected?"true":"false"} Red : ${redDetected?"true":"false"}`);

      // Trigger spray if needed
      if (yellowDetected || redDetected) {
          await activateSpray();
      }

      // Cleanup
      imageTensor.dispose();
      croppedImage.dispose();
      yellowMask.dispose();
      redMask.dispose();
      normalizedImage.dispose();
    return { yellowDetected, redDetected };

  } catch (error) {
      console.error('Error detecting colors:', error);
  }
};
const monitorESP32 = async () => {
  while (true) {
    try {
      const response = await fetch(`${esp32CamUrl}/`, { method: 'GET' });
      const online = response.ok;

      await db.collection('devices').doc('device1').update({
        online,
        lastChecked: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      await db.collection('devices').doc('device1').update({
        online:false,
      });
      console.error('Error checking ESP32-CAM status:', error);
    }
    await new Promise((resolve) => setTimeout(resolve, 5000)); // Ping every 5 seconds
  }
};
let scheduleInterval = 1000*30; //miliseconds


// Crop and detect pests function omitted for brevity (reuse existing functions)
const main = async () => {
  try {
    console.log("main called")
    return;
    const imageBuffer = await fetchImageFromESP32Cam();

    const { yellowDetected, redDetected } = await detectColor(imageBuffer);
    if (yellowDetected || redDetected) {
      const imageUrl = await uploadImageToCloudinary(imageBuffer);

      const timestamp = new Date().toISOString();

      const pestData = {
        location: 'some section',
        timestamp,
        imageUrl,
        comment: yellowDetected
          ? 'Yellow pests detected. Immediate action recommended.'
          : redDetected
          ? 'Red pests detected. Immediate action required.'
          : 'No pests detected.',
      };

      console.log(pestData);

      await db.collection('pest-detection-logs').add(pestData);
    }
  } catch (error) {
    console.error('Error in main cycle:', error);
  }
};

let shouldRun = true; // Control loop execution
let currentTimeout; // Holds the reference to the active timeout

const synchronizeSchedule = async () => {
  if (!scheduleInterval || scheduleInterval <= 0) {
    console.error('Invalid schedule interval. Exiting synchronization setup.');
    return;
  }

  const scheduleNextRun = () => {
    const now = new Date();
    const nextRun = new Date(Math.ceil(now.getTime() / scheduleInterval) * scheduleInterval);
    const delayMs = nextRun - now;

    console.log(`Next cycle scheduled at: ${nextRun}, current time: ${now}`);

    // Clear any existing timeout to avoid overlap
    if (currentTimeout) {
      clearTimeout(currentTimeout);
    }

    currentTimeout = setTimeout(async () => {
      try {
        console.log(`Executing main at: ${new Date()}`);
        await main(); // Call your main task
      } catch (error) {
        console.error('Error in main function:', error);
      } finally {
        // Schedule the next execution
        scheduleNextRun();
      }
    }, delayMs);
  };

  // Start scheduling
  scheduleNextRun();
};


// Function to stop the loop (for testing or manual interruption)
const stopSchedule = () => {
  if (currentTimeout) {
    clearTimeout(currentTimeout); // Stop the current timeout
    currentTimeout = null; // Reset the timeout reference
  }
  shouldRun = false; // Set flag to false
  console.log('Schedule synchronization stopped.');
};





// Express server setup
const app = express();
app.use(express.json());
app.use(cors({
  origin: '*', // Replace '*' with specific origin(s) if needed for security, e.g., 'http://your-frontend-domain.com'
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Allowed headers
}));
// Endpoint to trigger a manual cycle
app.post('/trigger-cycle', async (req, res) => {
  try {
    await main();
    res.status(200).send({ message: 'Manual cycle executed successfully.' });
  } catch (error) {
    console.error('Error in manual cycle:', error);
    res.status(500).send({ error: 'Failed to execute manual cycle.' });
  }
});


// Endpoint to stop the schedule
app.post('/stop-schedule', (req, res) => {
  try {
    stopSchedule(); // Call the function to stop the schedule
    res.status(200).send({ message: 'Schedule stopped successfully.' });
  } catch (error) {
    console.error('Error stopping schedule:', error);
    res.status(500).send({ error: 'Failed to stop the schedule.' });
  }
});

// Endpoint to update the schedule interval
app.post('/update-schedule', (req, res) => {
  try {
    const { interval } = req.body;
    if (!interval || typeof interval !== 'number' || interval <= 0) {
      return res.status(400).send({ error: 'Invalid interval value.' });
    }

    scheduleInterval = interval;
    console.log(`Schedule interval updated to ${interval} ms.`);

    // Reschedule immediately with the new interval
    if (currentTimeout) {
      clearTimeout(currentTimeout);
    }
    synchronizeSchedule();

    res.status(200).send({ message: 'Schedule interval updated successfully.' });
  } catch (error) {
    console.error('Error updating schedule:', error);
    res.status(500).send({ error: 'Failed to update schedule.' });
  }
});



// Start the HTTP server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  // Start the synchronized cycle
  synchronizeSchedule();
});


// Start monitoring ESP32 in a separate thread
monitorESP32();

