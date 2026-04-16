# 📸 Smart AI Image Gallery (Full-Stack Serverless)

An intelligent, event-driven image gallery that uses Computer Vision to automatically tag, resize, and organize photos uploaded via the browser.

---

## 🚀 The Architecture
This project follows a **Serverless Event-Driven** pattern:
1. **Frontend**: React (Vite) app allows users to upload images via **S3 Presigned URLs**.
2. **Storage**: Raw images land in an **Amazon S3** source bucket.
3. **Compute**: S3 triggers an **AWS Lambda** (Node.js) function.
4. **AI Analysis**: Lambda calls **Amazon Rekognition** to detect objects and labels.
5. **Processing**: **Sharp** library resizes the image for optimal web viewing.
6. **Database**: Metadata and labels are stored in **Amazon DynamoDB**.
7. **API**: A REST API via **API Gateway** serves the gallery data back to the frontend.

## 🛠️ Tech Stack
- **Frontend**: React, Axios, Lucide Icons, Vite
- **Cloud (AWS)**: S3, Lambda, Rekognition, DynamoDB, API Gateway
- **Backend Runtime**: Node.js 20.x

## 📸 Demo
![Project Screenshot](./screenshotvideo.mp4) 

## 🔑 Key Features
- **Secure Direct Uploads**: Uses Presigned URLs so the frontend never handles AWS credentials.
- **AI Labeling**: Automatically identifies images (e.g., "Corgi", "Laptop", "Car").
- **Responsive Gallery**: A clean, searchable UI with real-time filtering.

## ⚙️ Environment Variables
VITE_API_URL="https://v1j5xje9z2.execute-api.eu-north-1.amazonaws.com/images"
VITE_RESIZED_S3_URL="https://smart-gallery-resized.s3.eu-north-1.amazonaws.com/"
