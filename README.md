# AgriGuard

AgriGuard is an intelligent pest management and pesticide tank monitoring system designed to simplify agricultural tasks. This system leverages IoT, automation, and real-time monitoring to enhance efficiency and reduce manual intervention.

---

## Features

### 1. **Real-Time Monitoring**
- Displays tank level percentage.
- Monitors device status (online/offline).
- Logs the last spray and last checked times.

### 2. **Manual and Scheduled Operations**
- Trigger manual pesticide cycles directly from the dashboard.
- Schedule pesticide spraying at specified intervals (e.g., every 6 hours).
- Stop or update schedules dynamically.

### 3. **Alerts and Notifications**
- Success and error modals for user feedback.
- Notifications for tank level and schedule updates.

### 4. **User-Friendly Interface**
- Responsive design with clear and intuitive controls.
- Uses Material Tailwind for enhanced UI/UX.

### 5. **Seamless Integration**
- Firebase integration for real-time database updates.
- REST API communication with devices.

---

## Technologies Used

### **Frontend**
- React.js
- Material Tailwind
- Headless UI

### **Backend**
- Firebase Firestore for data storage
- Axios for API requests

### **Hardware**
- IoT device (ESP32-CAM)
- Pesticide spraying mechanism

---

## Getting Started

### Prerequisites
- Node.js and npm installed on your machine.
- Firebase project setup with Firestore.
- Access to the IoT device's local REST API.

### Installation

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/your-repo/agriguard.git
   cd agriguard
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Set Up Firebase:**
   - Update `firebaseConfig` in the project with your Firebase credentials.
   
4. **Run the Project:**
   ```bash
   npm start
   ```

5. **Access the App:**
   Open your browser and navigate to `http://localhost:3000`.

---

## API Endpoints

### Trigger Manual Cycle
- **URL:** `POST http://<device-ip>:3000/trigger-cycle`
- **Description:** Starts a manual pesticide spraying cycle.

### Update Schedule
- **URL:** `POST http://<device-ip>:3000/update-schedule`
- **Body:** `{ "interval": <milliseconds> }`
- **Description:** Updates the spraying schedule.

### Stop Schedule
- **URL:** `POST http://<device-ip>:3000/stop-schedule`
- **Description:** Stops the current schedule.

---

## Usage

1. **Login:** Use your credentials to access the dashboard.
2. **Monitor Status:** Check tank levels, device status, and logs.
3. **Trigger Actions:**
   - Start a manual cycle by clicking "Start Manual Check."
   - Schedule a cycle using the "Schedule Device" button.
   - Stop schedules with "Stop Schedule."
4. **Alerts:** Receive success/error feedback for all actions.

---

## Project Structure
```
agriguard/
├── src/
│   ├── components/
│   │   ├── Home.jsx
│   │   ├── ScheduleModal.jsx
│   ├── hooks/
│   │   ├── useAuth.js
│   ├── firebase.js
├── public/
│   ├── index.html
├── package.json
├── README.md
```

---

## Contributing

We welcome contributions! Please fork the repository, make your changes, and submit a pull request.

### Steps to Contribute:
1. Fork the repository.
2. Create a new branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Commit your changes:
   ```bash
   git commit -m "Add your message here"
   ```
4. Push the branch:
   ```bash
   git push origin feature/your-feature-name
   ```
5. Submit a pull request.

---

## License

This project is licensed under the MIT License. See the LICENSE file for details.

---

## Acknowledgements

- Material Tailwind for UI components.
- Headless UI for accessible modals and transitions.
- Firebase for real-time database and authentication.
- ESP32-CAM for IoT hardware support.

---

## Contact


