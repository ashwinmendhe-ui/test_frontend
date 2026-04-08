📌 Mission File Upload / Download – Notes
🧠 Current Implementation Summary
Flow
Frontend sends mission create request (without file content)
Backend returns:
uploadUrl (presigned PUT URL)
Frontend uploads file directly to S3 using uploadUrl
Backend returns downloadUrl in mission detail/list
Frontend uses downloadUrl for download
✅ What is Working
✅ Mission create API works
✅ Presigned upload URL is generated
✅ File upload works via Postman
✅ Mission list/detail API returns downloadUrl
❌ Current Issues Identified
1️⃣ S3 CORS Issue (Frontend Upload Blocked)
Problem
Browser upload fails
Error: Access-Control-Allow-Origin missing
Postman upload works
Root Cause

S3 bucket CORS not configured for frontend origin

Required Fix

S3 bucket CORS must allow:

[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedOrigins": ["http://localhost:5173"],
    "ExposeHeaders": ["ETag"]
  }
]
2️⃣ Upload Key vs Download Key Mismatch
Problem

Upload URL:

/test2.txt

Download URL:

missions/{missionId}/test2.txt
Result

S3 error:

<Code>NoSuchKey</Code>
Root Cause

Backend uses different object keys for:

upload
download
✅ Correct Expected Behavior

Backend should use same objectKey everywhere

Example
missions/{missionId}/test2.txt
Upload URL should be generated for:
missions/{missionId}/test2.txt
Download URL should also use:
missions/{missionId}/test2.txt
🔧 Required Backend Fix
During Create

Backend should:

Generate object key:
missions/{missionId}/{fileName}
Generate presigned PUT URL using that key
Store objectKey in DB
During Get (Detail/List)

Backend should:

Read stored objectKey
Generate presigned GET URL from same key
During Delete

Backend should:

Read objectKey
Delete file from S3
Delete DB record
🧪 Testing Notes
Upload Test (Postman)
Call:
POST /api/v1/missions
Get uploadUrl
Call:
PUT uploadUrl
Body: binary file
Download Test (Postman)
Call:
GET /api/v1/missions/{id}
Copy downloadUrl
Call:
GET downloadUrl
📊 Key Concepts
Term	Meaning
uploadUrl	Presigned URL for uploading file
downloadUrl	URL for downloading file
objectKey	File path in S3
bucket	S3 storage container
⚠️ Important Notes
Frontend does NOT upload file to backend
File goes directly to S3
Backend only provides temporary access (presigned URL)
Backend must manage file lifecycle (store/delete)
🚀 Current Status
Feature	Status
Mission CRUD	✅ Done
File Upload (Postman)	✅ Working
File Upload (Browser)	❌ Blocked (CORS)
File Download	❌ Broken (Key mismatch)
📌 Next Steps
Backend
Fix S3 CORS
Fix objectKey consistency
Frontend
No major change required
Already aligned with correct architecture